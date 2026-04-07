// Shared middleware for Vercel serverless functions
// Security: Firebase Admin SDK for JWT verification + Firestore access
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = getFirestore();

/**
 * Authenticate a request using Firebase ID tokens.
 *
 * Priority:
 *   1. Authorization: Bearer <Firebase ID token> (preferred, secure)
 *   2. x-user-id header (backwards compatibility during migration -- remove after migration)
 *
 * Returns: { uid, email, tier } on success
 * Throws: Error with message suitable for client on failure
 */
export async function authenticate(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  // Primary path: verify Firebase ID token from Authorization header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.slice(7);
    try {
      const decoded = await getAuth().verifyIdToken(idToken);

      // Fetch user tier from Firestore (defaults to "free")
      let tier = "free";
      try {
        const userDoc = await db.collection("users").doc(decoded.uid).get();
        if (userDoc.exists) {
          tier = userDoc.data()?.tier || "free";
        }
      } catch (e) {
        // If Firestore read fails, default to free tier -- don't block auth
        console.warn("Failed to read user tier:", e.message);
      }

      return {
        uid: decoded.uid,
        email: decoded.email || null,
        tier,
      };
    } catch (err) {
      throw new Error("Invalid or expired authentication token");
    }
  }

  // Fallback: x-user-id header for backwards compatibility
  // MIGRATION NOTE: Remove this fallback once all clients send Firebase ID tokens
  const legacyUid = req.headers["x-user-id"] || req.body?.uid;
  if (legacyUid && typeof legacyUid === "string" && legacyUid.length <= 200) {
    const sanitized = legacyUid.replace(/[^a-zA-Z0-9_]/g, "_");
    return {
      uid: sanitized,
      email: null,
      tier: "free", // Legacy users default to free
    };
  }

  throw new Error("Authentication required");
}

// TODO: Replace in-memory rate limiting with Redis (e.g., Upstash) for
// production use. In-memory state is lost on cold starts and not shared
// across serverless instances.
const rateLimits = new Map();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000;

export function rateLimit(uid) {
  const now = Date.now();
  const entry = rateLimits.get(uid);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimits.set(uid, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return false;
  return true;
}

// CORS headers -- allow Authorization header for JWT auth
export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-user-id"
  );
  res.setHeader("Access-Control-Expose-Headers", "X-Remaining-Quota, X-Model-Used");
  return res;
}

// Handle OPTIONS preflight
export function handleCors(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}
