import { db, getUserId, handleCors, cors } from "../middleware.js";

const ANALYSIS_PROMPT = `You are a personal profile analyst. Analyze the following social media and app data for a user and produce a structured JSON profile.

Based on the data provided, derive insights about the person. Only include fields where you have supporting evidence from the data. Be specific and cite patterns you observe.

Output ONLY valid JSON with this structure:
{
  "cuisinePreferences": {
    "favorites": ["list of cuisines/food types they seem to enjoy"],
    "evidence": "brief explanation of how you determined this"
  },
  "spendingPatterns": {
    "categories": { "category": "estimated monthly average or frequency" },
    "evidence": "brief explanation"
  },
  "fitnessHabits": {
    "activities": ["list of fitness activities"],
    "frequency": "how often they exercise",
    "level": "beginner/intermediate/advanced",
    "evidence": "brief explanation"
  },
  "musicTaste": {
    "topGenres": ["genres"],
    "topArtists": ["artists"],
    "listeningStyle": "description of their music preferences",
    "evidence": "brief explanation"
  },
  "travelStyle": {
    "type": "adventurous/luxury/budget/cultural/etc",
    "recentDestinations": ["places"],
    "evidence": "brief explanation"
  },
  "socialStyle": {
    "type": "introvert/extrovert/ambivert",
    "eventFrequency": "how often they attend events",
    "groupPreference": "small/medium/large groups",
    "evidence": "brief explanation"
  },
  "recentInterests": ["list of topics/activities they've been engaged with recently"],
  "upcomingEvents": ["list of upcoming events or plans"],
  "personalityTraits": {
    "introvertExtrovert": "introvert/extrovert/ambivert with confidence",
    "plannerSpontaneous": "planner/spontaneous/mixed",
    "activeRelaxed": "active/relaxed/balanced",
    "socialSolitary": "social/solitary/balanced",
    "evidence": "brief explanation of personality assessment"
  }
}

If there is insufficient data for a field, set it to null rather than guessing. Be data-driven.`;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  cors(res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(400).json({ error: "Missing or invalid user ID" });
    }

    // Load all social data for the user
    const socialDataSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("socialData")
      .get();

    if (socialDataSnapshot.empty) {
      return res.status(404).json({ error: "No social data found. Connect accounts and sync first." });
    }

    const socialData = {};
    socialDataSnapshot.forEach((doc) => {
      socialData[doc.id] = doc.data();
    });

    // Send to Claude for analysis
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `${ANALYSIS_PROMPT}\n\nHere is the user's data from connected platforms:\n\n${JSON.stringify(socialData, null, 2)}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      console.error("Anthropic API error:", errorText);
      return res.status(502).json({ error: "Failed to analyze profile data" });
    }

    const anthropicData = await anthropicRes.json();
    const responseText = anthropicData.content?.[0]?.text || "";

    // Parse the JSON from Claude's response
    let derivedProfile;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      derivedProfile = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError.message);
      return res.status(502).json({ error: "Failed to parse profile analysis" });
    }

    // Store the derived profile
    await db
      .collection("users")
      .doc(uid)
      .collection("data")
      .doc("derivedProfile")
      .set({
        ...derivedProfile,
        builtAt: new Date().toISOString(),
        sourcePlatforms: Object.keys(socialData),
      });

    res.status(200).json({
      success: true,
      profile: derivedProfile,
      sourcePlatforms: Object.keys(socialData),
    });
  } catch (error) {
    console.error("Profile build error:", error);
    res.status(500).json({ error: "Failed to build profile" });
  }
}
