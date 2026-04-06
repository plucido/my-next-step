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

export default async function handler(req, res) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers["authorization"];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const usersSnapshot = await db.collection("users").get();
    const results = { synced: 0, errors: 0, details: [] };

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const connectionsSnapshot = await db
        .collection("users")
        .doc(uid)
        .collection("connections")
        .get();

      for (const connDoc of connectionsSnapshot.docs) {
        const provider = connDoc.id;
        const syncFn = SYNC_FUNCTIONS[provider];

        if (!syncFn) continue;

        try {
          await syncFn(uid, connDoc.data());
          results.synced++;
          results.details.push({ uid, provider, status: "ok" });
        } catch (error) {
          console.error(`Sync error for ${uid}/${provider}:`, error.message);
          results.errors++;
          results.details.push({ uid, provider, status: "error", message: error.message });
        }
      }
    }

    // Trigger profile build for each synced user
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
        console.error(`Profile build trigger failed for ${uid}:`, error.message);
      }
    }

    res.status(200).json({ success: true, ...results });
  } catch (error) {
    console.error("Sync run error:", error);
    res.status(500).json({ error: "Sync run failed" });
  }
}
