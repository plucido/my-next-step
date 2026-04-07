import { db } from "../middleware.js";
import { syncGoogle } from "./google.js";
import { syncSpotify } from "./spotify.js";
import { syncFacebook } from "./facebook.js";
import { syncInstagram } from "./instagram.js";
import { syncStrava } from "./strava.js";

const SYNC_FUNCTIONS = {
  google: syncGoogle,
  spotify: syncSpotify,
  facebook: syncFacebook,
  instagram: syncInstagram,
  strava: syncStrava,
};

const BATCH_SIZE = 100;
const SKIP_IF_SYNCED_WITHIN_MS = 4 * 60 * 60 * 1000; // 4 hours
const SYNC_STATE_DOC = "system/syncState";

function log(level, message, data = {}) {
  const entry = { timestamp: new Date().toISOString(), level, message, ...data };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers["authorization"];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Load cursor from system/syncState
    const stateRef = db.doc(SYNC_STATE_DOC);
    const stateSnap = await stateRef.get();
    const lastSyncedUserId = stateSnap.exists ? stateSnap.data().lastSyncedUserId : null;

    log("info", "Sync batch starting", { lastSyncedUserId, batchSize: BATCH_SIZE });

    // Build paginated query
    let query = db.collection("users").orderBy("__name__").limit(BATCH_SIZE);
    if (lastSyncedUserId) {
      query = query.startAfter(lastSyncedUserId);
    }

    const usersSnapshot = await query.get();
    const results = { synced: 0, skipped: 0, errors: 0, details: [] };
    const now = Date.now();

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      // Skip users synced within the cooldown window
      if (userData.lastSyncedAt) {
        const lastSynced = userData.lastSyncedAt.toMillis ? userData.lastSyncedAt.toMillis() : userData.lastSyncedAt;
        if (now - lastSynced < SKIP_IF_SYNCED_WITHIN_MS) {
          results.skipped++;
          log("info", "Skipping recently synced user", { uid });
          continue;
        }
      }

      const connectionsSnapshot = await db
        .collection("users")
        .doc(uid)
        .collection("connections")
        .get();

      let userSynced = false;
      for (const connDoc of connectionsSnapshot.docs) {
        const provider = connDoc.id;
        const syncFn = SYNC_FUNCTIONS[provider];

        if (!syncFn) continue;

        try {
          await syncFn(uid, connDoc.data());
          results.synced++;
          results.details.push({ uid, provider, status: "ok" });
          userSynced = true;
        } catch (error) {
          log("error", "Sync failed for provider", { uid, provider, error: error.message });
          results.errors++;
          results.details.push({ uid, provider, status: "error", message: error.message });
        }
      }

      // Mark user as synced
      if (userSynced) {
        await db.collection("users").doc(uid).update({ lastSyncedAt: new Date() });
      }
    }

    // Trigger profile build for each successfully synced user
    const syncedUids = [...new Set(results.details.filter((d) => d.status === "ok").map((d) => d.uid))];
    for (const uid of syncedUids) {
      try {
        const buildUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL}/api/profile/build`;
        await fetch(buildUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
      } catch (error) {
        log("error", "Profile build trigger failed", { uid, error: error.message });
      }
    }

    const hasMore = usersSnapshot.docs.length === BATCH_SIZE;
    const newCursor = usersSnapshot.docs.length > 0
      ? usersSnapshot.docs[usersSnapshot.docs.length - 1].id
      : null;

    // Update or reset cursor
    if (hasMore && newCursor) {
      await stateRef.set({ lastSyncedUserId: newCursor, updatedAt: new Date() });
    } else {
      // Finished all users — reset cursor for next full cycle
      await stateRef.set({ lastSyncedUserId: null, updatedAt: new Date(), lastFullCycleAt: new Date() });
    }

    // If more users remain, queue next batch by calling self
    if (hasMore) {
      try {
        const selfUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL}/api/sync/run`;
        await fetch(selfUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        });
        log("info", "Queued next batch", { nextCursor: newCursor });
      } catch (error) {
        log("error", "Failed to queue next batch", { error: error.message });
      }
    }

    const duration = Date.now() - startTime;
    log("info", "Sync batch complete", {
      duration,
      ...results,
      hasMore,
      cursor: newCursor,
    });

    res.status(200).json({ success: true, ...results, hasMore, duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    log("error", "Sync run failed", { error: error.message, stack: error.stack, duration });
    res.status(500).json({ error: "Sync run failed" });
  }
}
