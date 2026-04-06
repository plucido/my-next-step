import { db } from "../middleware.js";

export async function syncSpotify(uid, connection) {
  const { accessToken } = connection;
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [topTracksRes, topArtistsRes, recentRes] = await Promise.all([
    fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term", { headers }),
    fetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term", { headers }),
    fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", { headers }),
  ]);

  if (!topTracksRes.ok && topTracksRes.status === 401) {
    throw new Error("Spotify access token expired");
  }

  const topTracksData = topTracksRes.ok ? await topTracksRes.json() : { items: [] };
  const topArtistsData = topArtistsRes.ok ? await topArtistsRes.json() : { items: [] };
  const recentData = recentRes.ok ? await recentRes.json() : { items: [] };

  const topTracks = (topTracksData.items || []).map((track) => ({
    name: track.name,
    artist: track.artists?.[0]?.name || "",
    album: track.album?.name || "",
    popularity: track.popularity || 0,
  }));

  const topArtists = (topArtistsData.items || []).map((artist) => ({
    name: artist.name,
    genres: artist.genres || [],
    popularity: artist.popularity || 0,
  }));

  const recentlyPlayed = (recentData.items || []).map((item) => ({
    track: item.track?.name || "",
    artist: item.track?.artists?.[0]?.name || "",
    playedAt: item.played_at || "",
  }));

  await db
    .collection("users")
    .doc(uid)
    .collection("socialData")
    .doc("spotify")
    .set(
      {
        topTracks,
        topArtists,
        recentlyPlayed,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}
