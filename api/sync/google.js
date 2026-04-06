import { db } from "../middleware.js";

export async function syncGoogle(uid, connection) {
  const { accessToken } = connection;

  // Fetch calendar events (next 30 days)
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const calendarParams = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: thirtyDaysLater.toISOString(),
    maxResults: "100",
    singleEvents: "true",
    orderBy: "startTime",
  });

  const [calendarRes, gmailRes] = await Promise.all([
    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch("https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=30", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  if (!calendarRes.ok && calendarRes.status === 401) {
    throw new Error("Google access token expired");
  }

  const calendarData = calendarRes.ok ? await calendarRes.json() : { items: [] };
  const events = (calendarData.items || []).map((event) => ({
    summary: event.summary || "",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location || "",
  }));

  // Fetch email subjects
  let emailSubjects = [];
  if (gmailRes.ok) {
    const gmailData = await gmailRes.json();
    const messageIds = (gmailData.messages || []).slice(0, 30);

    const emailDetails = await Promise.all(
      messageIds.map(async (msg) => {
        try {
          const detailRes = await fetch(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();
          const subjectHeader = (detail.payload?.headers || []).find(
            (h) => h.name === "Subject"
          );
          return subjectHeader?.value || "(no subject)";
        } catch {
          return null;
        }
      })
    );
    emailSubjects = emailDetails.filter(Boolean);
  }

  await db
    .collection("users")
    .doc(uid)
    .collection("socialData")
    .doc("google")
    .set(
      {
        calendarEvents: events,
        emailSubjects,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}
