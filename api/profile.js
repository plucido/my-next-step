// Vercel Serverless Function: Profile CRUD
// Server-side Firebase access with user validation
import { db, getUserId, handleCors, cors } from "./middleware.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  cors(res);

  const uid = getUserId(req);
  if (!uid) {
    return res.status(401).json({ error: "Missing user ID" });
  }

  try {
    if (req.method === "GET") {
      // Load user data
      const key = req.query.key || "appdata";
      const doc = await db.collection("users").doc(uid).collection("data").doc(key).get();
      if (!doc.exists) return res.status(200).json({ value: null });
      return res.status(200).json({ value: doc.data().value });
    }

    if (req.method === "POST") {
      // Save user data
      const { key, data } = req.body;
      if (!key || !data) return res.status(400).json({ error: "Key and data required" });
      await db.collection("users").doc(uid).collection("data").doc(key).set({
        value: typeof data === "string" ? data : JSON.stringify(data),
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const key = req.query.key || req.body?.key;
      if (!key) return res.status(400).json({ error: "Key required" });
      await db.collection("users").doc(uid).collection("data").doc(key).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
