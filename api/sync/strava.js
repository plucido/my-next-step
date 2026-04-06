import { db } from "../middleware.js";

export async function syncStrava(uid, connection) {
  const { accessToken } = connection;
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch recent activities and athlete stats in parallel
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

  const [activitiesRes, athleteRes] = await Promise.all([
    fetch(`https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgo}&per_page=50`, {
      headers,
    }),
    fetch("https://www.strava.com/api/v3/athlete", { headers }),
  ]);

  if (!activitiesRes.ok && activitiesRes.status === 401) {
    throw new Error("Strava access token expired");
  }

  const activitiesData = activitiesRes.ok ? await activitiesRes.json() : [];
  const athleteData = athleteRes.ok ? await athleteRes.json() : {};

  const activities = (Array.isArray(activitiesData) ? activitiesData : []).map((activity) => ({
    name: activity.name || "",
    type: activity.type || "",
    distance: activity.distance || 0,
    movingTime: activity.moving_time || 0,
    elapsedTime: activity.elapsed_time || 0,
    totalElevationGain: activity.total_elevation_gain || 0,
    startDate: activity.start_date || "",
    averageSpeed: activity.average_speed || 0,
    maxSpeed: activity.max_speed || 0,
    averageHeartrate: activity.average_heartrate || null,
    calories: activity.calories || 0,
  }));

  // Fetch athlete stats if we have the athlete ID
  let stats = null;
  if (athleteData.id) {
    try {
      const statsRes = await fetch(
        `https://www.strava.com/api/v3/athletes/${athleteData.id}/stats`,
        { headers }
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        stats = {
          recentRunTotals: statsData.recent_run_totals || {},
          recentRideTotals: statsData.recent_ride_totals || {},
          recentSwimTotals: statsData.recent_swim_totals || {},
          allRunTotals: statsData.all_run_totals || {},
          allRideTotals: statsData.all_ride_totals || {},
        };
      }
    } catch {
      // Stats fetch is optional
    }
  }

  await db
    .collection("users")
    .doc(uid)
    .collection("socialData")
    .doc("strava")
    .set(
      {
        activities,
        stats,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}
