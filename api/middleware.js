// Shared middleware for Vercel serverless functions
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

// Validate user ID from request
export function getUserId(req) {
  // Accept user ID from header or body
  const uid = req.headers["x-user-id"] || req.body?.uid;
  if (!uid || typeof uid !== "string" || uid.length > 200) return null;
  return uid.replace(/[^a-zA-Z0-9_]/g, "_");
}

// Simple rate limiting (in-memory, resets on cold start)
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

// CORS headers
export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id");
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
