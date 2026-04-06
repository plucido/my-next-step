import { db } from "../middleware.js";

export async function syncInstagram(uid, connection) {
  const { accessToken } = connection;

  const mediaRes = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,timestamp,permalink&limit=50&access_token=${accessToken}`
  );

  if (!mediaRes.ok && mediaRes.status === 401) {
    throw new Error("Instagram access token expired");
  }

  const mediaData = mediaRes.ok ? await mediaRes.json() : { data: [] };

  const recentMedia = (mediaData.data || []).map((item) => ({
    caption: item.caption || "",
    mediaType: item.media_type || "",
    timestamp: item.timestamp || "",
    permalink: item.permalink || "",
  }));

  await db
    .collection("users")
    .doc(uid)
    .collection("socialData")
    .doc("instagram")
    .set(
      {
        recentMedia,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}
