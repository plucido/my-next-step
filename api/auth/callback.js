import { db } from "../middleware.js";

const PROVIDERS = {
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  spotify: {
    tokenUrl: "https://accounts.spotify.com/api/token",
    clientIdEnv: "SPOTIFY_CLIENT_ID",
    clientSecretEnv: "SPOTIFY_CLIENT_SECRET",
  },
  facebook: {
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
  },
  instagram: {
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    clientIdEnv: "INSTAGRAM_APP_ID",
    clientSecretEnv: "INSTAGRAM_APP_SECRET",
  },
  strava: {
    tokenUrl: "https://www.strava.com/oauth/token",
    clientIdEnv: "STRAVA_CLIENT_ID",
    clientSecretEnv: "STRAVA_CLIENT_SECRET",
  },
};

export default async function handler(req, res) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error("OAuth error from provider:", oauthError);
      return res.redirect(302, `${getAppUrl()}?error=oauth_denied`);
    }

    if (!code || !state) {
      return res.redirect(302, `${getAppUrl()}?error=missing_params`);
    }

    // State format: "uid:provider"
    const [uid, provider] = state.split(":");
    if (!uid || !provider) {
      return res.redirect(302, `${getAppUrl()}?error=invalid_state`);
    }

    const config = PROVIDERS[provider];
    if (!config) {
      return res.redirect(302, `${getAppUrl()}?error=unsupported_provider`);
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    if (!clientId || !clientSecret) {
      console.error(`Missing env vars for ${provider}`);
      return res.redirect(302, `${getAppUrl()}?error=server_config`);
    }

    const redirectUri = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL}/api/auth/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCode(provider, config, {
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    // Store tokens in Firestore
    await db
      .collection("users")
      .doc(uid)
      .collection("connections")
      .doc(provider)
      .set(
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          expiresIn: tokens.expires_in || null,
          tokenType: tokens.token_type || "Bearer",
          connectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    res.redirect(302, `${getAppUrl()}?connected=${provider}`);
  } catch (error) {
    console.error("Callback error:", error);
    res.redirect(302, `${getAppUrl()}?error=token_exchange`);
  }
}

function getAppUrl() {
  return process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
}

async function exchangeCode(provider, config, { code, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  // Instagram uses form-encoded POST without grant_type in the same way
  if (provider === "instagram") {
    body.delete("grant_type");
  }

  // Spotify requires Basic auth header
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (provider === "spotify") {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basicAuth}`;
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed for ${provider}: ${response.status} ${errorText}`);
  }

  return response.json();
}
