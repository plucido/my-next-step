// POST /api/billing/checkout -- Create a Stripe Checkout Session for Pro upgrade
// Security: Requires authenticated user; uses Stripe API directly (no SDK)
import { authenticate, handleCors, cors } from "../middleware.js";

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

  const { tier } = req.body || {};
  if (tier !== "pro") {
    return res.status(400).json({ error: 'Invalid tier. Only "pro" is supported.' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!stripeKey || !priceId) {
    console.error("Missing Stripe config: STRIPE_SECRET_KEY or STRIPE_PRO_PRICE_ID");
    return res.status(500).json({ error: "Billing not configured" });
  }

  const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;

  try {
    // Create Stripe Checkout Session via REST API (no SDK needed)
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "subscription",
        "payment_method_types[0]": "card",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        // Attach Firebase UID so webhook can update the right user
        "client_reference_id": user.uid,
        "customer_email": user.email || "",
        "success_url": `${appUrl}?billing=success`,
        "cancel_url": `${appUrl}?billing=cancelled`,
        // Store uid in metadata for webhook processing
        "metadata[firebase_uid]": user.uid,
      }).toString(),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Stripe checkout error:", response.status, JSON.stringify(errData));
      return res.status(502).json({ error: "Failed to create checkout session" });
    }

    const session = await response.json();
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
