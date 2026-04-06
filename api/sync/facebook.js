import { db } from "../middleware.js";

export async function syncFacebook(uid, connection) {
  const { accessToken } = connection;

  const [eventsRes, likesRes] = await Promise.all([
    fetch(
      `https://graph.facebook.com/v19.0/me/events?fields=name,start_time,end_time,place,rsvp_status&limit=50&access_token=${accessToken}`
    ),
    fetch(
      `https://graph.facebook.com/v19.0/me/likes?fields=name,category&limit=100&access_token=${accessToken}`
    ),
  ]);

  if (!eventsRes.ok && eventsRes.status === 401) {
    throw new Error("Facebook access token expired");
  }

  const eventsData = eventsRes.ok ? await eventsRes.json() : { data: [] };
  const likesData = likesRes.ok ? await likesRes.json() : { data: [] };

  const events = (eventsData.data || []).map((event) => ({
    name: event.name || "",
    startTime: event.start_time || "",
    endTime: event.end_time || "",
    place: event.place?.name || "",
    rsvpStatus: event.rsvp_status || "",
  }));

  const likes = (likesData.data || []).map((like) => ({
    name: like.name || "",
    category: like.category || "",
  }));

  await db
    .collection("users")
    .doc(uid)
    .collection("socialData")
    .doc("facebook")
    .set(
      {
        events,
        likes,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}
