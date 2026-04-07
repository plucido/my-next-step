// POST /api/billing/portal -- Create a Stripe Billing Portal session
// Security: Requires authenticated user with an existing Stripe customer ID
import { authenticate, db, handleCors, cors } from "../middleware.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  cors(res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate user
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    return res.status(500).json({ error: "Billing not configured" });
  }

  // Look up the user's Stripe customer ID from Firestore
  let stripeCustomerId;
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    stripeCustomerId = userDoc.exists ? userDoc.data()?.stripeCustomerId : null;
  } catch (e) {
    console.error("Failed to read user doc:", e.message);
    return res.status(500).json({ error: "Failed to look up billing info" });
  }

  if (!stripeCustomerId) {
    return res.status(400).json({ error: "No active subscription found" });
  }

  const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;

  try {
    // Create Stripe Billing Portal session via REST API
    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "customer": stripeCustomerId,
        "return_url": `${appUrl}?billing=portal_return`,
      }).toString(),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Stripe portal error:", response.status, JSON.stringify(errData));
      return res.status(502).json({ error: "Failed to create portal session" });
    }

    const session = await response.json();
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
