// Firebase client -- Auth only, all data access goes through API
// Security: No direct Firestore access from client; all reads/writes proxied through authenticated API
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const fbApp = initializeApp(firebaseConfig);
export const auth = getAuth(fbApp);

/**
 * Get the current user's Firebase ID token for authenticated API calls.
 * Returns null if no user is signed in.
 */
export async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) return null;
  // forceRefresh: false -- uses cached token unless expired
  return user.getIdToken(false);
}

/**
 * Convert a profile to a user ID (email-based, for backwards compatibility).
 * Used as a key for localStorage and legacy x-user-id header.
 */
export function getUserId(p) {
  return p?.email ? p.email.replace(/[^a-zA-Z0-9]/g, "_") : null;
}

/**
 * Authenticated API call helper.
 * Adds Firebase ID token to requests. Falls back to x-user-id header
 * for backwards compatibility during migration.
 *
 * @param {string} path - API path (e.g., "/api/profile")
 * @param {string} method - HTTP method
 * @param {object} [body] - Request body (will be JSON-stringified)
 * @param {string} [legacyUid] - Fallback user ID for legacy auth
 * @returns {Promise<Response>}
 */
export async function apiCall(path, method = "GET", body = null, legacyUid = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Try Firebase ID token first, fall back to legacy header
  const token = await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (legacyUid) {
    // MIGRATION: Remove this fallback once all users have Firebase Auth
    headers["x-user-id"] = legacyUid;
  }

  const opts = { method, headers, signal: AbortSignal.timeout(5000) };
  if (body && method !== "GET") {
    opts.body = JSON.stringify(body);
  }

  return fetch(path, opts);
}

/**
 * Save data to Firestore via API proxy.
 * Replaces direct Firestore setDoc calls.
 */
export async function saveFB(uid, key, data) {
  if (!uid) return;
  try {
    const res = await apiCall("/api/profile", "POST", { uid, key, data }, uid);
    if (!res.ok) console.error("FB save failed:", res.status);
  } catch (e) {
    console.error("FB save:", e.name === "TimeoutError" ? "Request timed out" : e);
  }
}

/**
 * Load data from Firestore via API proxy.
 * Replaces direct Firestore getDoc calls.
 */
export async function loadFB(uid, key) {
  if (!uid) return null;
  try {
    const res = await apiCall(`/api/profile?uid=${encodeURIComponent(uid)}&key=${encodeURIComponent(key)}`, "GET", null, uid);
    if (!res.ok) {
      console.error("FB load failed:", res.status, "for key:", key);
      return null;
    }
    const result = await res.json();
    return result.data ?? null;
  } catch (e) {
    console.error("FB load:", e.name === "TimeoutError" ? "Request timed out for key: " + key : e);
    return null;
  }
}

/**
 * Delete data from Firestore via API proxy.
 * Replaces direct Firestore deleteDoc calls.
 */
export async function deleteFB(uid, key) {
  if (!uid) return;
  try {
    const res = await apiCall("/api/profile", "DELETE", { uid, key }, uid);
    if (!res.ok) console.error("FB delete failed:", res.status, "for key:", key);
  } catch (e) {
    console.error("FB delete:", e.name === "TimeoutError" ? "Request timed out for key: " + key : e);
  }
}
