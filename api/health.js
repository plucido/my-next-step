// GET /api/health -- Health check endpoint
// Tests service connectivity and returns status
import { db, handleCors, cors } from "./middleware.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  cors(res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const services = {
    firestore: false,
  };

  try {
    // Test Firestore connectivity by reading a lightweight document
    await db.collection("_health").doc("ping").get();
    services.firestore = true;
  } catch (err) {
    console.error("Health check - Firestore failed:", err.message);
  }

  const allHealthy = Object.values(services).every(Boolean);

  const body = {
    ok: allHealthy,
    timestamp: new Date().toISOString(),
    services,
  };

  return res.status(allHealthy ? 200 : 503).json(body);
}
