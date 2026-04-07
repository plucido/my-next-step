// Vercel Serverless Function: Claude API Proxy
// Supports both streaming and non-streaming, with smart model routing
import { getUserId, rateLimit, handleCors, cors } from "./middleware.js";

// Determine which model to use based on query complexity
function pickModel(messages, system, tools) {
  const lastMsg = messages[messages.length - 1]?.content || "";
  const msg = typeof lastMsg === "string" ? lastMsg.toLowerCase() : "";

  // Use Sonnet (expensive, smart) for:
  // - Web search queries (need to process search results)
  // - Trip/journey planning (complex multi-step)
  // - Medical/health advice (needs accuracy)
  // - Long messages (complex requests)
  const needsSonnet =
    (tools && tools.some(t => t.type === "web_search_20250305")) ||
    msg.length > 200 ||
    /plan|trip|journey|itinerary|schedule|budget|book|reserve|find me|search|doctor|medical|health insurance/i.test(msg) ||
    /how much|where should|what should|recommend|suggest|best/i.test(msg);

  if (needsSonnet) return "claude-sonnet-4-20250514";

  // Use Haiku (fast, cheap) for:
  // - Simple follow-ups ("yes", "sounds good", "more like that")
  // - Feedback responses
  // - Quick clarifications
  // - Short messages under 50 chars
  return "claude-haiku-3-20240307";
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

  const uid = getUserId(req);
  if (!uid) {
    return res.status(401).json({ error: "Missing user ID" });
  }

  if (!rateLimit(uid)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { model, max_tokens, system, messages, tools, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array required" });
    }

    // Smart model selection (can be overridden by client)
    const selectedModel = model === "auto" ? pickModel(messages, system, tools) : (model || "claude-sonnet-4-20250514");

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

    if (tools && tools.some(t => t.type === "web_search_20250305")) {
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

    // Streaming mode: pipe SSE events directly to client
    if (stream && response.body) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Model-Used", selectedModel);

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
    // Include which model was used so client knows
    data._model = selectedModel;
    return res.status(200).json(data);
  } catch (err) {
    console.error("Chat proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
