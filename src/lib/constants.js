// ─── DESIGN SYSTEM ───
export const font = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap');`;
export const H = { fontFamily: "'Fraunces', serif" };
export const F = { fontFamily: "'DM Sans', sans-serif" };
export const lightC = {
  bg: "#FAF6F1", card: "#FFFFFF", warm: "#FFF5EE", cream: "#F5EDE4",
  b1: "rgba(28,25,23,0.06)", b2: "rgba(28,25,23,0.1)",
  t1: "#1C1917", t2: "#6B6560", t3: "#A39E99",
  acc: "#D4522A", acc2: "#E8764E", accSoft: "#FDE8E0", accBorder: "rgba(212,82,42,0.12)",
  accGrad: "linear-gradient(135deg, #D4522A 0%, #E8764E 100%)",
  teal: "#0F766E", tealSoft: "#E6F7F5", tealBorder: "rgba(15,118,110,0.1)",
  gold: "#B45309", goldSoft: "#FEF3C7",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03)",
  shadowLg: "0 4px 12px rgba(0,0,0,0.05), 0 16px 40px rgba(0,0,0,0.06)",
  shadowHover: "0 2px 8px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.05)",
};
export const darkC = {
  bg: "#1A1714", card: "#262220", warm: "#2A2420", cream: "#332D28",
  b1: "rgba(255,245,238,0.06)", b2: "rgba(255,245,238,0.1)",
  t1: "#FAF6F1", t2: "#B8B0A8", t3: "#7A736C",
  acc: "#D4522A", acc2: "#E8764E", accSoft: "rgba(212,82,42,0.15)", accBorder: "rgba(212,82,42,0.2)",
  accGrad: "linear-gradient(135deg, #D4522A 0%, #E8764E 100%)",
  teal: "#0F766E", tealSoft: "rgba(15,118,110,0.15)", tealBorder: "rgba(15,118,110,0.2)",
  gold: "#B45309", goldSoft: "rgba(180,83,9,0.15)",
  shadow: "0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.15)",
  shadowLg: "0 4px 12px rgba(0,0,0,0.2), 0 16px 40px rgba(0,0,0,0.2)",
  shadowHover: "0 2px 8px rgba(0,0,0,0.25), 0 8px 28px rgba(0,0,0,0.2)",
};
export const getColors = (dark) => dark ? darkC : lightC;
export const C = lightC;

// ─── SEGMENTS ───
export const SEGMENTS = {
  career: { label: "Career", color: "#6D28D9", soft: "#EDE9FE", desc: "Work, professional growth, side hustles, networking, courses" },
  wellness: { label: "Wellness", color: "#0F766E", soft: "#E6F7F5", desc: "Fitness, nutrition, self-care, doctor search, mental health" },
  adventure: { label: "Adventure", color: "#D97706", soft: "#FEF3C7", desc: "Trips, travel, friends, events, dining, going out, hobbies, fun" },
};
export const SEG_KEYS = ["career", "wellness", "adventure"];

// ─── SYSTEM PROMPT ───
export const SYSTEM_PROMPT=`You are "My Next Step" \u2014 a warm AI life guide. 3 segments: Career, Wellness, Adventure. Text like a friend. No markdown ever. 2-3 short sentences max in chat \u2014 put details in cards.

RULES:
- Create steps/journeys IMMEDIATELY when intent is clear. Never 3+ exchanges without creating something.
- Every recommendation needs: specific name, price range ($-$$$$), and DIRECT booking link (OpenTable, Google Flights, Booking.com \u2014 never generic google.com/search).
- Use web search for real options. Search "[thing] near [user's city]".
- If vague, ask ONE question then create. For expensive items, ask budget AND create preliminary card.
- Update existing items by using the SAME title. Delete old ones when conversation shifts.
- When user dislikes suggestions, ask WHY (price? distance? vibe?) then replace ALL active steps with fresh ones using delete_step.
- Never re-suggest disliked items or similar. Loved items = recommend more like them.
- Check current time context. After 8pm suggest tomorrow. Be seasonal. Check calendar for conflicts.
- Respect allergies/dietary needs for ALL food recommendations. Mention accommodations.
- For doctors: use insurance info, HMO needs PCP referral first. Search Zocdoc. Never diagnose.
- For fitness: match their level, respect injuries, be specific (exercises, sets, reps). Use Strava data.
- Routines: ask preferred days+time, check calendar for openings, include "time" field.
- Pets: factor into recommendations (pet-friendly venues, pet care for travel).
- Enhance vague ideas into specific actionable steps with real places and prices.

OUTPUT: Chat text, then ---DATA--- on its own line, then JSON array. Types: step, plan, routine, delete_step, delete_plan, delete_routine, preference.
Step: {"type":"step","title":"...","why":"...","link":"...","linkText":"...","category":"...","time":"..."}
Plan: {"type":"plan","title":"...","date":"...","tasks":[{"title":"...","links":[{"label":"...","url":"..."}]}]}
Routine: {"type":"routine","title":"...","description":"...","schedule":"weekly","days":["monday"],"time":"7am","category":"...","generateBefore":1}
Categories: career, learning, fitness, wellness, social, events, travel, products. Trip=travel(Adventure). Dinner with friends=social(Adventure). Workout=fitness(Wellness).`;

export const PROFILE_SECTIONS=[{id:"basics",label:"The basics",icon:null,questions:["What's your current job or role?","What does your typical day look like?","What's your living situation?"]},{id:"personality",label:"Your personality",icon:null,questions:["Are you more introverted or extroverted?","What motivates you most?","How do you handle stress?"]},{id:"lifestyle",label:"Lifestyle & habits",icon:null,questions:["What does a typical weekend look like?","Do you exercise regularly?","Do you cook or eat out?"]},{id:"dreams",label:"Dreams & goals",icon:"\u2728",questions:["Where do you see yourself in 5 years?","What have you always wanted to try?","What's holding you back?"]},{id:"challenges",label:"Current challenges",icon:null,questions:["What's your biggest challenge right now?","What area of life feels most stuck?"]}];

// ─── PROFILE OPTIONS ───
export const INTEREST_OPTIONS = ["Travel","Cooking","Fitness","Outdoors","Music","Art","Reading","Gaming","Photography","Nightlife","Sports","Yoga","Meditation","Fashion","Tech","Volunteering","Pets","Wine & Dining","Dance","Theater"];
export const BUDGET_OPTIONS = ["Under $100","$100-300","$300-500","$500-1000","$1000+"];
export const DIET_OPTIONS = ["Vegetarian","Vegan","Pescatarian","Keto","Paleo","Halal","Kosher","Low sodium","Low sugar","Lactose-free"];
export const ALLERGY_OPTIONS = ["Gluten-free / Celiac","Dairy","Eggs","Peanuts","Tree nuts","Soy","Fish","Crustaceans (shrimp, crab, lobster)","Wheat","Sesame","Legumes","Mustard","Sulfites","Corn","Nightshades"];
export const FITNESS_OPTIONS = [{label:"Just starting",desc:"New to working out or getting back into it"},{label:"Active",desc:"Work out a few times a week"},{label:"Very active",desc:"Daily workouts, training for goals"},{label:"Not my thing",desc:"Prefer other activities"}];
export const RELATIONSHIP_OPTIONS = ["Just me","Me + partner","Family with kids","It's complicated"];
export const WORK_OPTIONS = ["Student","Employed (office)","Remote / hybrid","Self-employed","Between jobs","Retired"];

// ─── AFFILIATE (compact) ───
export const AFF = { "classpass.com":{tag:"mnstep-20",c:2.5},"eventbrite.com":{tag:"mnstep",c:1.5},"udemy.com":{tag:"mnstep",c:1.8},"skillshare.com":{tag:"mnstep",c:2},"mindbody.io":{tag:"mnstep-20",c:2},"meetup.com":{tag:"mnstep",c:.75},"amazon.com":{tag:"mnstep-20",c:.5},"linkedin.com/learning":{tag:"mnstep",c:2.2},"airbnb.com":{tag:"mnstep",c:3},"kayak.com":{tag:"mnstep",c:.8},"booking.com":{tag:"aid=mnstep",c:2.5},"vrbo.com":{tag:"mnstep",c:2} };
