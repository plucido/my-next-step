// Vercel Serverless Function: Claude API Proxy
// Supports streaming and non-streaming, with tier-based model routing and usage metering
import { authenticate, db, rateLimit, handleCors, cors } from "./middleware.js";

// Free tier: unlimited messages (ad-supported), Haiku model
// Pro tier: unlimited messages (ad-free), Sonnet for complex queries
// Rate limit still applies to prevent abuse (30/min free, 60/min pro)
const TIER_RATE_LIMITS = {
  free: 30,
  pro: 60,
};

// Model access per tier
const TIER_MODELS = {
  free: "claude-haiku-3-20240307",
  pro: "claude-sonnet-4-20250514",
};

/**
 * Get current month usage count for a user.
 * Returns { count, monthKey } where monthKey is "YYYY-MM".
 */
async function getUsage(uid) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (!db) return { count: 0, monthKey };
  try {
    const usageDoc = await db.collection("users").doc(uid).collection("usage").doc(monthKey).get();
    if (usageDoc.exists) {
      return { count: usageDoc.data().count || 0, monthKey };
    }
  } catch (e) {
    console.warn("Failed to read usage:", e.message);
  }
  return { count: 0, monthKey };
}

/**
 * Increment usage counter for the current month.
 */
async function incrementUsage(uid, monthKey) {
  if (!db) return;
  try {
    const ref = db.collection("users").doc(uid).collection("usage").doc(monthKey);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update({ count: (doc.data().count || 0) + 1, lastUsedAt: new Date().toISOString() });
    } else {
      await ref.set({ count: 1, lastUsedAt: new Date().toISOString() });
    }
  } catch (e) {
    // Don't fail the request if usage tracking fails
    console.error("Failed to increment usage:", e.message);
  }
}

/**
 * Pick model based on user tier.
 * Free users always get Haiku. Pro users get Sonnet for complex queries, Haiku for simple ones.
 */
function pickModel(tier, messages) {
  if (tier === "free") {
    return TIER_MODELS.free;
  }

  // Pro users: smart routing based on message complexity
  const lastMsg = messages[messages.length - 1]?.content || "";
  const msg = typeof lastMsg === "string" ? lastMsg.toLowerCase() : "";

  // Haiku for very short/simple messages (fast, cheap)
  if (msg.length < 30 && /^(yes|no|ok|sure|sounds good|thanks|love it|not for me|more|next|skip|done)/i.test(msg)) {
    return TIER_MODELS.free;
  }

  // Sonnet for complex tasks
  if (
    msg.length > 300 ||
    /plan.*(trip|journey|itinerary)|book.*(flight|hotel|restaurant)|doctor|medical|insurance|workout plan|meal plan/i.test(msg) ||
    /compare|analyze|research|detailed|specific options/i.test(msg)
  ) {
    return TIER_MODELS.pro;
  }

  // Default: Haiku for pro users on medium messages (cost optimization)
  return TIER_MODELS.free;
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  cors(res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate user via Firebase ID token or legacy header
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  if (!rateLimit(user.uid)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  // Track usage for analytics (no quota blocking — free tier is unlimited with ads)
  const { count: usageCount, monthKey } = await getUsage(user.uid);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { model, max_tokens, system, messages, tools, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array required" });
    }

    // Tier-based model selection: free users always get Haiku
    const selectedModel =
      model === "auto" || !model
        ? pickModel(user.tier, messages)
        : user.tier === "free"
          ? TIER_MODELS.free // Free users cannot override to a better model
          : model;

    const anthropicBody = {
      model: selectedModel,
      max_tokens: Math.min(max_tokens || 2000, 4000),
      messages: messages,
    };

    if (system) anthropicBody.system = system;
    if (tools) anthropicBody.tools = tools;
    if (stream) anthropicBody.stream = true;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };

    if (tools && tools.some((t) => t.type === "web_search_20250305")) {
      headers["anthropic-beta"] = "web-search-2025-03-05";
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(anthropicBody),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Anthropic API error:", response.status, JSON.stringify(errData));
      return res.status(response.status).json(errData);
    }

    // Increment usage after successful API call
    await incrementUsage(user.uid, monthKey);
    // Usage tracked for analytics

    // Streaming mode: pipe SSE events directly to client
    if (stream && response.body) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Model-Used", selectedModel);
      res.setHeader("X-Remaining-Quota", String(user.tier === "pro" ? "unlimited" : usageCount));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch (e) {
        console.error("Stream error:", e);
      }
      res.end();
      return;
    }

    // Non-streaming mode
    const data = await response.json();
    data._model = selectedModel;
    res.setHeader("X-Remaining-Quota", String(user.tier === "pro" ? "unlimited" : usageCount));
    return res.status(200).json(data);
  } catch (err) {
    console.error("Chat proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
