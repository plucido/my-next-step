import { handleCors, cors } from "../middleware.js";

const PROVIDERS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    scopes: "email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly",
  },
  spotify: {
    authUrl: "https://accounts.spotify.com/authorize",
    clientIdEnv: "SPOTIFY_CLIENT_ID",
    scopes: "user-read-recently-played user-top-read user-read-private",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    clientIdEnv: "FACEBOOK_APP_ID",
    scopes: "email,public_profile,user_events,user_likes",
  },
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    clientIdEnv: "INSTAGRAM_APP_ID",
    scopes: "user_profile,user_media",
  },
  strava: {
    authUrl: "https://www.strava.com/oauth/authorize",
    clientIdEnv: "STRAVA_CLIENT_ID",
    scopes: "read,activity:read",
  },
};

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  cors(res);

  try {
    const { provider, uid } = req.query;

    if (!provider || !uid) {
      return res.status(400).json({ error: "Missing provider or uid" });
    }

    const config = PROVIDERS[provider];
    if (!config) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const clientId = process.env[config.clientIdEnv];
    if (!clientId) {
      return res.status(500).json({ error: `Missing ${config.clientIdEnv} env var` });
    }

    const redirectUri = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL}/api/auth/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state: uid,
    });

    // Provider-specific param names
    if (provider === "facebook" || provider === "instagram") {
      params.set("scope", config.scopes);
    } else if (provider === "spotify") {
      params.set("scope", config.scopes);
    } else if (provider === "strava") {
      params.set("scope", config.scopes);
      params.set("approval_prompt", "auto");
    } else if (provider === "google") {
      params.set("scope", config.scopes);
      params.set("access_type", "offline");
      params.set("prompt", "consent");
    }

    // Add provider to state so callback knows which provider
    params.set("state", `${uid}:${provider}`);

    const authorizationUrl = `${config.authUrl}?${params.toString()}`;
    res.redirect(302, authorizationUrl);
  } catch (error) {
    console.error("Connect error:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
}
