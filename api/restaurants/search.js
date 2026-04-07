// Search restaurants across OpenTable and Resy
// Returns unified results with availability and booking links
import { authenticate, handleCors, cors } from "../middleware.js";

export const config = { maxDuration: 15 };

// OpenTable search via their API
async function searchOpenTable(query, location, date, time, partySize) {
  const apiKey = process.env.OPENTABLE_API_KEY;
  if (!apiKey) return [];

  try {
    // OpenTable's availability endpoint
    const dateStr = date || new Date().toISOString().split("T")[0];
    const timeStr = time || "19:00";
    const covers = partySize || 2;

    const url = `https://platform.opentable.com/availability?` +
      `query=${encodeURIComponent(query)}` +
      `&location=${encodeURIComponent(location)}` +
      `&date=${dateStr}` +
      `&time=${timeStr}` +
      `&covers=${covers}`;

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    return (data.restaurants || []).map(r => ({
      source: "opentable",
      name: r.name,
      cuisine: r.cuisine || r.primary_cuisine,
      priceRange: r.price_range || r.price,
      rating: r.rating,
      reviewCount: r.review_count,
      address: r.address,
      neighborhood: r.neighborhood,
      imageUrl: r.profile_photo,
      availableSlots: (r.timeslots || []).map(s => s.time),
      bookingUrl: `https://www.opentable.com/restref/client/?rid=${r.id}&covers=${covers}&datetime=${dateStr}T${timeStr}`,
      restaurantId: r.id,
      canBookDirect: true,
    }));
  } catch (e) {
    console.error("OpenTable search error:", e.message);
    return [];
  }
}

// Resy search via their API
async function searchResy(query, location, date, time, partySize) {
  const apiKey = process.env.RESY_API_KEY;
  if (!apiKey) return [];

  try {
    const dateStr = date || new Date().toISOString().split("T")[0];
    const covers = partySize || 2;

    // Resy venue search
    const searchRes = await fetch(`https://api.resy.com/3/venuesearch/search`, {
      method: "POST",
      headers: {
        "Authorization": `ResyAPI api_key="${apiKey}"`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        geo: { latitude: null, longitude: null, location: location },
        per_page: 10,
        types: ["venue"],
      }),
    });

    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const venues = searchData.search?.hits || [];

    // For top 5 results, check availability
    const results = [];
    for (const venue of venues.slice(0, 5)) {
      try {
        const availRes = await fetch(
          `https://api.resy.com/4/find?lat=0&long=0&day=${dateStr}&party_size=${covers}&venue_id=${venue.id.resy}`,
          {
            headers: { "Authorization": `ResyAPI api_key="${apiKey}"` },
          }
        );
        const availData = await availRes.json();
        const slots = (availData.results?.venues?.[0]?.slots || []).map(s => s.date?.start);

        results.push({
          source: "resy",
          name: venue.name,
          cuisine: venue.cuisine?.[0] || "",
          priceRange: venue.price_range_id === 1 ? "$" : venue.price_range_id === 2 ? "$$" : venue.price_range_id === 3 ? "$$$" : "$$$$",
          rating: venue.rating,
          reviewCount: venue.num_ratings,
          address: venue.location?.address_1,
          neighborhood: venue.location?.neighborhood,
          imageUrl: venue.images?.[0],
          availableSlots: slots.filter(Boolean).slice(0, 6),
          bookingUrl: `https://resy.com/cities/${venue.location?.code}/${venue.url_slug}`,
          restaurantId: venue.id.resy,
          canBookDirect: true,
        });
      } catch (e) {
        // Skip venues with availability errors
      }
    }
    return results;
  } catch (e) {
    console.error("Resy search error:", e.message);
    return [];
  }
}

// Google Places fallback when OpenTable/Resy aren't available
async function searchGoogle(query, location) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " restaurant " + location)}&key=${apiKey}`
    );
    const data = await res.json();

    return (data.results || []).slice(0, 5).map(r => ({
      source: "google",
      name: r.name,
      cuisine: "",
      priceRange: r.price_level === 1 ? "$" : r.price_level === 2 ? "$$" : r.price_level === 3 ? "$$$" : r.price_level === 4 ? "$$$$" : "$$",
      rating: r.rating,
      reviewCount: r.user_ratings_total,
      address: r.formatted_address,
      neighborhood: "",
      imageUrl: r.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${r.photos[0].photo_reference}&key=${apiKey}` : null,
      availableSlots: [],
      bookingUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + r.formatted_address)}`,
      restaurantId: r.place_id,
      canBookDirect: false,
    }));
  } catch (e) {
    console.error("Google Places error:", e.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  cors(res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await authenticate(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  const { query, location, date, time, partySize, dietary } = req.body;

  if (!query || !location) {
    return res.status(400).json({ error: "Query and location required" });
  }

  // Search all sources in parallel
  const searchQuery = dietary ? `${query} ${dietary}` : query;
  const [otResults, resyResults, googleResults] = await Promise.all([
    searchOpenTable(searchQuery, location, date, time, partySize),
    searchResy(searchQuery, location, date, time, partySize),
    searchGoogle(searchQuery, location),
  ]);

  // Merge and deduplicate by name similarity
  const all = [...otResults, ...resyResults];
  const seen = new Set();
  const deduped = [];
  for (const r of all) {
    const key = r.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 15);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  // If no bookable results, add Google fallback
  if (deduped.length < 3) {
    for (const r of googleResults) {
      const key = r.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 15);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }
  }

  // Sort: bookable first, then by rating
  deduped.sort((a, b) => {
    if (a.canBookDirect && !b.canBookDirect) return -1;
    if (!a.canBookDirect && b.canBookDirect) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  return res.status(200).json({
    results: deduped.slice(0, 8),
    sources: {
      opentable: otResults.length,
      resy: resyResults.length,
      google: googleResults.length,
    },
  });
}
