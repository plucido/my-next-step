// POST /api/billing/webhook -- Stripe webhook handler
// Security: Verifies Stripe signature before processing events
// Note: This endpoint must receive the raw body for signature verification.
// In vercel.json, ensure bodyParser is disabled for this route:
//   { "api/billing/webhook.js": { "bodyParser": false } }
import crypto from "crypto";
import { db } from "../middleware.js";

// Vercel config: disable body parsing so we can access raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Read the raw request body as a Buffer.
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Verify Stripe webhook signature.
 * Implements the same algorithm as stripe.webhooks.constructEvent().
 */
function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader) {
    throw new Error("Missing Stripe signature header");
  }

  // Parse the signature header
  const elements = sigHeader.split(",");
  const sigMap = {};
  for (const element of elements) {
    const [key, value] = element.split("=");
    sigMap[key] = value;
  }

  const timestamp = sigMap["t"];
  const signature = sigMap["v1"];

  if (!timestamp || !signature) {
    throw new Error("Invalid Stripe signature format");
  }

  // Verify timestamp is within tolerance (5 minutes)
  const tolerance = 300; // seconds
  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(timestamp) > tolerance) {
    throw new Error("Stripe webhook timestamp too old");
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    throw new Error("Stripe signature verification failed");
  }

  return JSON.parse(payload);
}

export default async function handler(req, res) {
  // No CORS needed -- Stripe calls this directly
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    const sigHeader = req.headers["stripe-signature"];
    event = verifyStripeSignature(rawBody.toString("utf8"), sigHeader, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // User completed checkout -- upgrade to pro
        const session = event.data.object;
        const uid = session.client_reference_id || session.metadata?.firebase_uid;
        if (uid) {
          await db.collection("users").doc(uid).set(
            {
              tier: "pro",
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              upgradedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          console.log(`User ${uid} upgraded to pro`);
        } else {
          console.warn("checkout.session.completed: no firebase_uid found in session");
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription cancelled -- downgrade to free
        const subscription = event.data.object;
        const uid = await findUidByCustomer(subscription.customer);
        if (uid) {
          await db.collection("users").doc(uid).set(
            {
              tier: "free",
              downgradedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          console.log(`User ${uid} downgraded to free`);
        }
        break;
      }

      case "customer.subscription.updated": {
        // Subscription changed -- update tier based on current plan status
        const subscription = event.data.object;
        const uid = await findUidByCustomer(subscription.customer);
        if (uid) {
          // If subscription is active or trialing, user is pro; otherwise free
          const isActive = ["active", "trialing"].includes(subscription.status);
          await db.collection("users").doc(uid).set(
            {
              tier: isActive ? "pro" : "free",
              subscriptionStatus: subscription.status,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          console.log(`User ${uid} subscription updated: ${subscription.status}`);
        }
        break;
      }

      default:
        // Unhandled event type -- acknowledge but ignore
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt (Stripe retries on non-2xx)
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Look up Firebase UID by Stripe customer ID.
 * Searches the users collection for matching stripeCustomerId.
 */
async function findUidByCustomer(customerId) {
  if (!customerId) return null;
  try {
    const snapshot = await db
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
  } catch (e) {
    console.error("Failed to find user by Stripe customer ID:", e.message);
  }
  return null;
}
