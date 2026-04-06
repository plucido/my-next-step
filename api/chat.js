// Vercel Serverless Function: Claude API Proxy
// Keeps the Anthropic API key server-side, never exposed to browser
import { getUserId, rateLimit, handleCors, cors } from "./middleware.js";

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
    const { model, max_tokens, system, messages, tools } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array required" });
    }

    // Build the request to Anthropic
    const anthropicBody = {
      model: model || "claude-sonnet-4-20250514",
      max_tokens: Math.min(max_tokens || 2000, 4000), // Cap at 4000
      messages: messages,
    };

    if (system) anthropicBody.system = system;
    if (tools) anthropicBody.tools = tools;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };

    // Add beta header if web search tool is used
    if (tools && tools.some(t => t.type === "web_search_20250305")) {
      headers["anthropic-beta"] = "web-search-2025-03-05";
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Chat proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
