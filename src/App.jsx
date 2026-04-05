import { useState, useEffect, useRef } from "react";

const font = `@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Manrope:wght@300;400;500;600;700&display=swap');`;
const S = { fontFamily: "'Newsreader', serif" };
const F = { fontFamily: "'Manrope', sans-serif" };
const C = {
  bg: "#FFFAF7", card: "#FFFFFF", s1: "rgba(0,0,0,0.03)", s2: "rgba(0,0,0,0.05)",
  b1: "rgba(0,0,0,0.06)", b2: "rgba(0,0,0,0.1)",
  t1: "#1A1A1A", t2: "#666666", t3: "#999999",
  acc: "#FF6B54", acc2: "#FF8F7A", accDim: "rgba(255,107,84,0.08)", accBorder: "rgba(255,107,84,0.15)",
  accGrad: "linear-gradient(135deg, #FF6B54, #FF8F7A)",
  teal: "#2EC4A0", tealDim: "rgba(46,196,160,0.08)",
};

// ─── AFFILIATE SYSTEM ───
const AFFILIATE_PARTNERS = {
  "classpass.com": { tag: "mnstep-20", commission: 2.50, name: "ClassPass" },
  "eventbrite.com": { tag: "mnstep", commission: 1.50, name: "Eventbrite" },
  "udemy.com": { tag: "mnstep", commission: 1.80, name: "Udemy" },
  "skillshare.com": { tag: "mnstep", commission: 2.00, name: "Skillshare" },
  "mindbody.io": { tag: "mnstep-20", commission: 2.00, name: "Mindbody" },
  "meetup.com": { tag: "mnstep", commission: 0.75, name: "Meetup" },
  "amazon.com": { tag: "mnstep-20", commission: 0.50, name: "Amazon" },
  "linkedin.com/learning": { tag: "mnstep", commission: 2.20, name: "LinkedIn Learning" },
  "airbnb.com": { tag: "mnstep", commission: 3.00, name: "Airbnb" },
  "kayak.com": { tag: "mnstep", commission: 0.80, name: "Kayak" },
  "booking.com": { tag: "aid=mnstep", commission: 2.50, name: "Booking.com" },
  "vrbo.com": { tag: "mnstep", commission: 2.00, name: "VRBO" },
};

function wrapAffiliateLink(url, actionId) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "mynextstep");
    u.searchParams.set("utm_medium", "app");
    u.searchParams.set("utm_campaign", `action_${actionId || "unknown"}`);
    const host = u.hostname.replace("www.", "");
    for (const [domain, partner] of Object.entries(AFFILIATE_PARTNERS)) {
      if (host.includes(domain.split("/")[0]) && url.includes(domain.split("/").slice(1).join("/") || host)) {
        u.searchParams.set("ref", partner.tag);
        break;
      }
    }
    return u.toString();
  } catch { return url; }
}

function getPartnerForUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace("www.", "");
    for (const [domain, partner] of Object.entries(AFFILIATE_PARTNERS)) {
      if (host.includes(domain.split("/")[0])) return partner;
    }
  } catch {}
  return { commission: 0.10, name: "Other" };
}

function trackClick(actionId, url, category, title) {
  try {
    const clicks = JSON.parse(localStorage.getItem("mns_clicks") || "[]");
    const partner = getPartnerForUrl(url);
    clicks.push({
      id: actionId || Date.now().toString(),
      url, category: category || "other", title: title || "Unknown",
      timestamp: new Date().toISOString(),
      estimatedCommission: partner?.commission || 0.10,
      partner: partner?.name || "Other",
    });
    localStorage.setItem("mns_clicks", JSON.stringify(clicks));
  } catch (e) { console.error("Track error:", e); }
}

function getClickStats() {
  try {
    const clicks = JSON.parse(localStorage.getItem("mns_clicks") || "[]");
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = clicks.filter(c => c.timestamp >= todayStart);
    const week = clicks.filter(c => c.timestamp >= weekStart);
    const month = clicks.filter(c => c.timestamp >= monthStart);
    const sum = arr => arr.reduce((s, c) => s + (c.estimatedCommission || 0), 0);
    const categories = {};
    clicks.forEach(c => { categories[c.category || "other"] = (categories[c.category || "other"] || 0) + (c.estimatedCommission || 0); });
    return { today: { clicks: today.length, commission: sum(today) }, week: { clicks: week.length, commission: sum(week) }, month: { clicks: month.length, commission: sum(month) }, lifetime: { clicks: clicks.length, commission: sum(clicks) }, categories, recent: clicks.slice(-10).reverse() };
  } catch { return { today: { clicks: 0, commission: 0 }, week: { clicks: 0, commission: 0 }, month: { clicks: 0, commission: 0 }, lifetime: { clicks: 0, commission: 0 }, categories: {}, recent: [] }; }
}

// Tracked link component
function TrackedLink({ href, actionId, category, title, children, style: sx }) {
  const wrapped = wrapAffiliateLink(href, actionId);
  const handleClick = (e) => {
    trackClick(actionId, href, category, title);
  };
  return <a href={wrapped} target="_blank" rel="noopener noreferrer" onClick={handleClick} style={sx}>{children}</a>;
}

// ─── EARNINGS DASHBOARD ───
function EarningsDashboard({ onClose }) {
  const [stats, setStats] = useState(getClickStats());
  useEffect(() => { setStats(getClickStats()); }, []);
  const maxCat = Math.max(...Object.values(stats.categories), 1);
  return (
    <div style={{ ...F, minHeight: "100vh", padding: 20, background: C.bg }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ ...S, fontSize: 24, color: C.t1, margin: 0 }}>Earnings</h2>
          <button onClick={onClose} style={{ ...F, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 18 }}>{"\u00D7"}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ label: "Today", data: stats.today }, { label: "This week", data: stats.week }, { label: "This month", data: stats.month }, { label: "Lifetime", data: stats.lifetime }].map(p => (
            <div key={p.label} style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
              <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{p.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.t1 }}>${p.data.commission.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{p.data.clicks} click{p.data.clicks !== 1 ? "s" : ""}</div>
            </div>
          ))}
        </div>
        {Object.keys(stats.categories).length > 0 && (
          <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}`, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>By category</div>
            {Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.t1, textTransform: "capitalize" }}>{cat}</span>
                  <span style={{ fontSize: 13, color: C.acc, fontWeight: 600 }}>${val.toFixed(2)}</span>
                </div>
                <div style={{ height: 4, background: C.s1, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(val / maxCat) * 100}%`, background: C.accGrad, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {stats.recent.length > 0 && (
          <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
            <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Recent clicks</div>
            {stats.recent.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < stats.recent.length - 1 ? `1px solid ${C.b1}` : "none" }}>
                <div>
                  <div style={{ fontSize: 13, color: C.t1, fontWeight: 500 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: C.t3 }}>{c.partner} {"\u2022"} {new Date(c.timestamp).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>${c.estimatedCommission.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FTC DISCLOSURE BANNER ───
function FtcBanner() {
  const [show, setShow] = useState(true);
  useEffect(() => { try { if (localStorage.getItem("mns_show_ftc") === "false") setShow(false); } catch {} }, []);
  const dismiss = () => { setShow(false); try { localStorage.setItem("mns_show_ftc", "false"); } catch {} };
  if (!show) return null;
  return (
    <div style={{ ...F, padding: "10px 16px", background: "rgba(255,107,84,0.04)", borderBottom: `1px solid ${C.accBorder}`, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.t2, flexShrink: 0 }}>
      <span style={{ flex: 1, lineHeight: 1.4 }}>Some links may earn us a small commission at no extra cost to you. This helps keep My Next Step free.</span>
      <button onClick={dismiss} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>{"\u00D7"}</button>
    </div>
  );
}

// ─── EXISTING CONSTANTS ───
const SOCIALS = [
  { id: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2", real: false },
  { id: "instagram", label: "Instagram", icon: "\u{1F4F7}", color: "#E4405F", real: false },
  { id: "spotify", label: "Spotify", icon: "\u{1F3B5}", color: "#1DB954", real: false },
  { id: "strava", label: "Strava", icon: "\u{1F3C3}", color: "#FC4C02", real: true },
  { id: "calendar", label: "Google Calendar", icon: "\u{1F4C5}", color: "#4285F4", real: false },
];

const PROFILE_SECTIONS = [
  { id: "basics", label: "The basics", icon: "\u{1F464}", questions: ["What's your current job or role?", "What does your typical day look like?", "What's your living situation?"] },
  { id: "personality", label: "Your personality", icon: "\u{1F31F}", questions: ["Are you more introverted or extroverted?", "What motivates you most?", "How do you handle stress?"] },
  { id: "lifestyle", label: "Lifestyle & habits", icon: "\u{1F3E0}", questions: ["What does a typical weekend look like?", "Do you exercise regularly?", "Do you cook or eat out?"] },
  { id: "dreams", label: "Dreams & goals", icon: "\u2728", questions: ["Where do you see yourself in 5 years?", "What have you always wanted to try?", "What's holding you back?"] },
  { id: "challenges", label: "Current challenges", icon: "\u{1F525}", questions: ["What's your biggest challenge right now?", "What area of life feels most stuck?"] },
];

const SYSTEM_PROMPT = `You are the AI engine behind "My Next Step" \u2014 a life coach app.

CRITICAL RULES:
1. DO NOT generate steps or plans until you deeply understand what the person wants. Ask 2-3 clarifying questions first.
2. When conversation shifts, output DELETE actions to remove irrelevant steps/plans.
3. EVERY recommendation must have PRE-FILLED links with search parameters.
4. PREFER affiliate-friendly platforms when relevant: ClassPass, Eventbrite, Udemy, Skillshare, Mindbody, Meetup, Amazon, LinkedIn Learning, Airbnb, Kayak, Booking.com, VRBO. Use these when they genuinely fit the user's needs.
5. Tag every step with a category field: fitness, events, learning, career, wellness, social, products, or travel.
6. After feedback, ADAPT and store preferences.
7. Be concise. 1-3 sentences. Cards do the work.

PRE-FILLED LINK EXAMPLES:
- "https://www.classpass.com/search?lat=29.76&lng=-95.36&query=yoga"
- "https://www.eventbrite.com/d/tx--houston/networking-events/"
- "https://www.udemy.com/courses/search/?q=python+for+beginners"
- "https://www.skillshare.com/search?query=photography"
- "https://www.kayak.com/flights/HOU-AUS/2026-05-15/2026-05-18"
- "https://www.airbnb.com/s/Fredericksburg--TX/homes?checkin=2026-05-15&checkout=2026-05-18&adults=2"
- "https://www.amazon.com/s?k=beginner+yoga+mat"
- "https://www.linkedin.com/learning/search?keywords=product+management"

OUTPUT FORMAT (after "---DATA---"):
Steps: [{"type":"step","title":"...","why":"...","link":"https://...","linkText":"...","category":"fitness","time":"..."}]
Plans: [{"type":"plan","title":"...","date":"...","tasks":[{"title":"...","links":[{"label":"...","url":"https://..."}]}]}]
Preferences: [{"type":"preference","key":"...","value":"..."}]
Delete: [{"type":"delete_step","title":"..."},{"type":"delete_plan","title":"..."}]

Only output ---DATA--- when you have SPECIFIC, well-understood recommendations. When in doubt, ASK MORE.`;

// ─── GOOGLE & STRAVA AUTH ───
function loadGoogleScript() { return new Promise((resolve) => { if (document.getElementById("gsi-script")) return resolve(); const s = document.createElement("script"); s.id = "gsi-script"; s.src = "https://accounts.google.com/gsi/client"; s.onload = resolve; document.head.appendChild(s); }); }
function decodeJwt(t) { try { return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))); } catch { return null; } }
function connectStrava() { const cid = import.meta.env.VITE_STRAVA_CLIENT_ID; if (!cid) return; window.location.href = `https://www.strava.com/oauth/authorize?client_id=${cid}&response_type=code&redirect_uri=${window.location.origin}&scope=read,activity:read&approval_prompt=auto`; }
async function exchangeStravaCode(code) { try { const r = await fetch("https://www.strava.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: import.meta.env.VITE_STRAVA_CLIENT_ID, client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET, code, grant_type: "authorization_code" }) }); return await r.json(); } catch { return null; } }
async function fetchStravaProfile(token) {
  try {
    const [aRes, actRes] = await Promise.all([ fetch("https://www.strava.com/api/v3/athlete", { headers: { Authorization: `Bearer ${token}` } }), fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10", { headers: { Authorization: `Bearer ${token}` } }) ]);
    const athlete = await aRes.json(); const activities = await actRes.json();
    let stats = null; if (athlete.id) { try { const s = await fetch(`https://www.strava.com/api/v3/athletes/${athlete.id}/stats`, { headers: { Authorization: `Bearer ${token}` } }); stats = await s.json(); } catch {} }
    const recent = Array.isArray(activities) ? activities.slice(0,10).map(a => ({ type: a.type, name: a.name, distance: (a.distance/1000).toFixed(1)+" km", duration: Math.round(a.moving_time/60)+" min", date: new Date(a.start_date_local).toLocaleDateString(), pace: a.type==="Run" ? (a.moving_time/60/(a.distance/1000)).toFixed(1)+" min/km" : null })) : [];
    return { name: `${athlete.firstname||""} ${athlete.lastname||""}`.trim(), city: athlete.city||"", recentActivities: recent, allTimeRuns: stats?.all_run_totals?.count||0, allTimeRunDistance: stats?.all_run_totals?.distance ? (stats.all_run_totals.distance/1000).toFixed(0)+" km":"0 km", allTimeRides: stats?.all_ride_totals?.count||0, allTimeRideDistance: stats?.all_ride_totals?.distance ? (stats.all_ride_totals.distance/1000).toFixed(0)+" km":"0 km", recentRunCount: stats?.recent_run_totals?.count||0, recentRideCount: stats?.recent_ride_totals?.count||0 };
  } catch { return null; }
}

// ─── AUTH SCREEN ───
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("landing"); const [email, setEmail] = useState(""); const [name, setName] = useState(""); const gRef = useRef(null);
  useEffect(() => { const cid = import.meta.env.VITE_GOOGLE_CLIENT_ID; if (!cid || mode !== "landing") return; loadGoogleScript().then(() => { if (!window.google?.accounts?.id) return; window.google.accounts.id.initialize({ client_id: cid, callback: (r) => { const u = decodeJwt(r.credential); if (u) onAuth({ name: u.given_name||u.name||"User", email: u.email, method: "google" }); } }); if (gRef.current) window.google.accounts.id.renderButton(gRef.current, { type: "standard", theme: "outline", size: "large", width: 380, text: "continue_with", shape: "pill" }); }); }, [mode]);
  if (mode === "email") return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: C.bg }}><div style={{ width: "100%", maxWidth: 400 }}>
      <button onClick={() => setMode("landing")} style={{ ...F, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14, marginBottom: 24 }}>{"\u2190"} Back</button>
      <h2 style={{ ...S, fontSize: 30, color: C.t1, marginBottom: 24 }}>Create your account</h2>
      <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>Your name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 15, borderRadius: 12, border: `1.5px solid ${C.b2}`, background: "#fff", color: C.t1, outline: "none", marginBottom: 14, boxSizing: "border-box" }} />
      <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 15, borderRadius: 12, border: `1.5px solid ${C.b2}`, background: "#fff", color: C.t1, outline: "none", marginBottom: 20, boxSizing: "border-box" }} />
      <button onClick={() => name.trim() && email.includes("@") && onAuth({ name: name.trim(), email, method: "email" })} disabled={!name.trim() || !email.includes("@")} style={{ ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: name.trim() && email.includes("@") ? "pointer" : "default", background: name.trim() && email.includes("@") ? C.accGrad : C.s1, color: name.trim() && email.includes("@") ? "#fff" : C.t3 }}>Create account {"\u2192"}</button>
    </div></div>
  );
  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: C.bg }}><div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 18px", background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff" }}>{"\u{1F463}"}</div>
      <h1 style={{ ...S, fontSize: 42, color: C.t1, lineHeight: 1.1, marginBottom: 10 }}>My Next Step</h1>
      <p style={{ ...F, fontSize: 15, color: C.t2, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 36px" }}>Your AI coach that creates clear, actionable steps and makes them easy to do.</p>
      <div ref={gRef} style={{ display: "flex", justifyContent: "center", marginBottom: 10 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "18px 0" }}><div style={{ flex: 1, height: 1, background: C.b1 }} /><span style={{ fontSize: 12, color: C.t3 }}>or</span><div style={{ flex: 1, height: 1, background: C.b1 }} /></div>
      <button onClick={() => setMode("email")} style={{ ...F, width: "100%", padding: "13px", borderRadius: 14, fontSize: 15, fontWeight: 500, background: "#fff", color: C.t2, border: `1.5px solid ${C.b2}`, cursor: "pointer" }}>Sign up with email</button>
    </div></div>
  );
}

// ─── SOCIAL, SETUP, DEEP PROFILE (unchanged) ───
function SocialLinkScreen({ onContinue, stravaConnected, stravaProfile }) {
  const [linked, setLinked] = useState(stravaConnected ? ["strava"] : []);
  const handleClick = (s) => { if (s.id === "strava" && !linked.includes("strava")) { connectStrava(); return; } if (s.real || linked.includes(s.id)) setLinked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id]); };
  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: C.bg }}><div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}><h2 style={{ ...S, fontSize: 28, color: C.t1, marginBottom: 8 }}>Connect your accounts</h2><p style={{ color: C.t2, fontSize: 14 }}>We read your data to personalize {"\u2014"} never post on your behalf.</p></div>
      {stravaConnected && stravaProfile && <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(252,76,2,0.04)", border: "1px solid rgba(252,76,2,0.12)", marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#FC4C02", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Strava connected</div><div style={{ fontSize: 14, color: C.t1, fontWeight: 500 }}>{stravaProfile.name}</div><div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{stravaProfile.allTimeRuns} runs ({stravaProfile.allTimeRunDistance}) {"\u2022"} {stravaProfile.allTimeRides} rides ({stravaProfile.allTimeRideDistance})</div></div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>{SOCIALS.map(s => { const on = linked.includes(s.id); return (<button key={s.id} onClick={() => handleClick(s)} style={{ ...F, padding: "14px 16px", borderRadius: 14, cursor: s.real ? "pointer" : "default", display: "flex", alignItems: "center", gap: 12, background: on ? `${s.color}08` : "#fff", border: `1.5px solid ${on ? s.color : C.b1}`, textAlign: "left", opacity: s.real ? 1 : 0.55 }}><span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{s.icon}</span><span style={{ flex: 1, color: C.t1, fontSize: 14, fontWeight: 500 }}>{s.label}{s.real && !on && <span style={{ fontSize: 10, color: C.acc, marginLeft: 8, fontWeight: 600 }}>LIVE</span>}{!s.real && <span style={{ fontSize: 10, color: C.t3, marginLeft: 8 }}>Soon</span>}</span>{on && <span style={{ color: s.color, fontWeight: 700 }}>{"\u2713"}</span>}</button>); })}</div>
      <button onClick={() => onContinue(linked)} style={{ ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", background: C.accGrad, color: "#fff" }}>Continue {"\u2192"}</button>
      {linked.length === 0 && <button onClick={() => onContinue([])} style={{ ...F, display: "block", margin: "10px auto 0", background: "none", border: "none", color: C.t3, fontSize: 13, cursor: "pointer" }}>Skip for now</button>}
    </div></div>
  );
}

function SetupScreen({ profile, onComplete }) {
  const [location, setLocation] = useState(""); const [goals, setGoals] = useState("");
  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: C.bg }}><div style={{ width: "100%", maxWidth: 420 }}>
      <h2 style={{ ...S, fontSize: 28, color: C.t1, marginBottom: 6 }}>Almost there, {profile.name}</h2>
      <p style={{ color: C.t2, fontSize: 14, marginBottom: 28 }}>So your coach can find real things near you.</p>
      <label style={{ fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>Where are you based?</label>
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State" style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 15, borderRadius: 12, border: `1.5px solid ${C.b2}`, background: "#fff", color: C.t1, outline: "none", marginBottom: 18, boxSizing: "border-box" }} />
      <label style={{ fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>What are you focused on?</label>
      <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} placeholder="A trip, career goal, getting healthier..." style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.b2}`, background: "#fff", color: C.t1, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", marginBottom: 20 }} />
      <button onClick={() => location.trim() && goals.trim() && onComplete({ location: location.trim(), goals: goals.trim() })} disabled={!location.trim() || !goals.trim()} style={{ ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: location.trim() && goals.trim() ? "pointer" : "default", background: location.trim() && goals.trim() ? C.accGrad : C.s1, color: location.trim() && goals.trim() ? "#fff" : C.t3 }}>Continue {"\u2192"}</button>
    </div></div>
  );
}

function DeepProfileChat({ profile, onFinish, existingInsights }) {
  const [msgs, setMsgs] = useState([]); const [inp, setInp] = useState(""); const [busy, setBusy] = useState(false);
  const [insights, setInsights] = useState(existingInsights || []); const [section, setSection] = useState(null);
  const endRef = useRef(null); const inpRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  const completed = PROFILE_SECTIONS.filter(s => insights.some(i => i.section === s.id));
  const startSection = (sec) => { setSection(sec); setMsgs([{ role: "assistant", content: `Let's talk about ${sec.label.toLowerCase()}.\n\n${sec.questions[0]}` }]); setTimeout(() => inpRef.current?.focus(), 100); };
  const send = async () => {
    if (!inp.trim() || busy) return; const updated = [...msgs, { role: "user", content: inp.trim() }]; setMsgs(updated); setInp(""); setBusy(true);
    try { const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: `You're onboarding a user for "My Next Step". Be warm and curious.\nUser: ${profile.name} | ${profile.setup?.location||""} | Goals: ${profile.setup?.goals||""}\nSection: ${section.label}\nQuestions: ${section.questions.join(" | ")}\nRULES: ONE question at a time. After 3-5 exchanges, summarize with "INSIGHTS:" then "- " bullets.`, messages: updated.map(m => ({ role: m.role, content: m.content })) }) });
      const data = await res.json(); const text = data.content?.map(c => c.text||"").filter(Boolean).join("\n") || "Tell me more?";
      if (text.includes("INSIGHTS:")) { const parts = text.split("INSIGHTS:"); const lines = parts[1].split("\n").filter(l => l.trim().startsWith("- ")).map(l => l.trim().slice(2)); setInsights(prev => [...prev.filter(i => i.section !== section.id), ...lines.map(t => ({ section: section.id, text: t }))]); setMsgs(prev => [...prev, { role: "assistant", content: parts[0].trim() }]); }
      else setMsgs(prev => [...prev, { role: "assistant", content: text }]);
    } catch { setMsgs(prev => [...prev, { role: "assistant", content: "Hiccup \u2014 say that again?" }]); } setBusy(false);
  };
  if (!section) return (
    <div style={{ ...F, minHeight: "100vh", padding: 20, background: C.bg }}><div style={{ maxWidth: 460, margin: "0 auto", paddingTop: 36 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}><div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px", background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff" }}>{"\u{1F4AC}"}</div><h2 style={{ ...S, fontSize: 26, color: C.t1, marginBottom: 6 }}>Let's get to know you</h2><p style={{ color: C.t2, fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>~2 min each. Makes your recommendations way better.</p></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>{PROFILE_SECTIONS.map(sec => { const done = insights.some(i => i.section === sec.id); return (<div key={sec.id} onClick={() => startSection(sec)} style={{ ...F, padding: "14px 16px", borderRadius: 14, cursor: "pointer", background: done ? C.tealDim : "#fff", border: `1.5px solid ${done ? C.teal : C.b1}`, display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: done ? C.tealDim : C.s1 }}>{done ? "\u2713" : sec.icon}</div><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>{sec.label}</div><div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{done ? "Done" : "~2 min"}</div></div><span style={{ color: C.t3 }}>{"\u203A"}</span></div>); })}</div>
      <button onClick={() => onFinish(insights)} style={{ ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", background: C.accGrad, color: "#fff" }}>{completed.length === 0 ? "Skip for now \u2192" : "Continue \u2192"}</button>
    </div></div>
  );
  return (
    <div style={{ ...F, display: "flex", flexDirection: "column", height: "100vh", maxWidth: 480, margin: "0 auto", background: C.bg }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.b1}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}><button onClick={() => setSection(null)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16, padding: 0 }}>{"\u2190"}</button><div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>{section.label}</div></div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
        {msgs.map((msg, i) => (<div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>{msg.role !== "user" && <div style={{ width: 24, height: 24, borderRadius: 8, background: C.accGrad, flexShrink: 0, marginRight: 8, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{"\u{1F463}"}</div>}<div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "'Manrope', sans-serif", ...(msg.role === "user" ? { background: C.accGrad, color: "#fff", borderBottomRightRadius: 4 } : { background: "#fff", color: C.t1, borderBottomLeftRadius: 4, border: `1px solid ${C.b1}` }) }}>{msg.content}</div></div>))}
        {busy && <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><div style={{ width: 24, height: 24, borderRadius: 8, background: C.accGrad, flexShrink: 0 }} /><div style={{ padding: "10px 16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}`, display: "flex", gap: 4 }}>{[0,1,2].map(i=><div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.t3, animation: `dpb 1.2s ease-in-out ${i*0.15}s infinite` }} />)}</div></div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "8px 20px 16px", borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}><div style={{ display: "flex", gap: 8 }}><input ref={inpRef} value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type your answer..." style={{ flex: 1, padding: "11px 14px", fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.b2}`, background: "#fff", color: C.t1, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} /><button onClick={send} disabled={!inp.trim() || busy} style={{ width: 42, height: 42, borderRadius: 12, border: "none", flexShrink: 0, cursor: inp.trim() && !busy ? "pointer" : "default", background: inp.trim() && !busy ? C.accGrad : C.s1, color: inp.trim() && !busy ? "#fff" : C.t3, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2191"}</button></div></div>
      <style>{`@keyframes dpb { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-5px) } }`}</style>
    </div>
  );
}

// ─── SETTINGS / ACCOUNT PANEL ───
function SettingsPanel({ profile, stravaData, preferences, onUpdateProfile, onConnectStrava, onDisconnectStrava, onDeepProfile, onSignOut, onClose }) {
  const [editMode, setEditMode] = useState(null); // null, "name", "location", "goals"
  const [editValue, setEditValue] = useState("");
  const [section, setSection] = useState("account"); // account, connections, preferences, about

  const startEdit = (field, current) => { setEditMode(field); setEditValue(current || ""); };
  const saveEdit = () => {
    if (!editValue.trim()) return;
    if (editMode === "name") onUpdateProfile({ ...profile, name: editValue.trim() });
    else if (editMode === "location") onUpdateProfile({ ...profile, setup: { ...profile.setup, location: editValue.trim() } });
    else if (editMode === "goals") onUpdateProfile({ ...profile, setup: { ...profile.setup, goals: editValue.trim() } });
    setEditMode(null);
  };

  const tabs = [
    { id: "account", label: "Account" },
    { id: "connections", label: "Connections" },
    { id: "preferences", label: "AI insights" },
    { id: "about", label: "About" },
  ];

  return (
    <div style={{ ...F, minHeight: "100vh", background: C.bg, padding: 20 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ ...S, fontSize: 24, color: C.t1, margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{ ...F, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 18 }}>{"\u00D7"}</button>
        </div>

        {/* Profile header card */}
        <div style={{ padding: "18px", borderRadius: 16, background: "#fff", border: `1px solid ${C.b1}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
            {profile.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.t1 }}>{profile.name}</div>
            <div style={{ fontSize: 13, color: C.t3 }}>{profile.email}</div>
            {profile.method && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Signed in via {profile.method}</div>}
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.b1}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setSection(t.id)} style={{
              ...F, flex: 1, padding: "10px 4px", background: "none", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: section === t.id ? 600 : 400, color: section === t.id ? C.acc : C.t3,
              borderBottom: section === t.id ? `2px solid ${C.acc}` : "2px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ACCOUNT SECTION */}
        {section === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Editable fields */}
            {[
              { key: "name", label: "Name", value: profile.name, icon: "\u{1F464}" },
              { key: "location", label: "Location", value: profile.setup?.location, icon: "\u{1F4CD}" },
              { key: "goals", label: "Current focus", value: profile.setup?.goals, icon: "\u{1F3AF}" },
            ].map(field => (
              <div key={field.key} style={{ padding: "14px 16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
                {editMode === field.key ? (
                  <div>
                    <label style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{field.label}</label>
                    {field.key === "goals" ? (
                      <textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows={3} style={{ ...F, width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${C.acc}`, background: C.bg, color: C.t1, outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
                    ) : (
                      <input value={editValue} onChange={e => setEditValue(e.target.value)} style={{ ...F, width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${C.acc}`, background: C.bg, color: C.t1, outline: "none", boxSizing: "border-box" }} />
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={() => setEditMode(null)} style={{ ...F, flex: 1, padding: "8px", borderRadius: 10, border: `1px solid ${C.b1}`, background: "#fff", color: C.t2, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveEdit} style={{ ...F, flex: 1, padding: "8px", borderRadius: 10, border: "none", background: C.accGrad, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 16, marginTop: 1 }}>{field.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{field.label}</div>
                      <div style={{ fontSize: 14, color: C.t1, lineHeight: 1.4 }}>{field.value || "Not set"}</div>
                    </div>
                    <button onClick={() => startEdit(field.key, field.value)} style={{ ...F, fontSize: 12, color: C.acc, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Edit</button>
                  </div>
                )}
              </div>
            ))}

            {/* Deep profile */}
            <button onClick={onDeepProfile} style={{
              ...F, padding: "14px 16px", borderRadius: 14, background: C.accDim, border: `1px solid ${C.accBorder}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%",
            }}>
              <span style={{ fontSize: 16 }}>{"\u{1F4AC}"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.acc }}>Go deeper with your coach</div>
                <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{profile.insights?.length || 0} insights gathered</div>
              </div>
              <span style={{ color: C.acc }}>{"\u203A"}</span>
            </button>

            {/* Sign out */}
            <button onClick={onSignOut} style={{
              ...F, width: "100%", padding: "14px", borderRadius: 14, marginTop: 10,
              background: "rgba(220,60,60,0.04)", border: "1px solid rgba(220,60,60,0.12)",
              color: "#DC3C3C", fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}>Sign out</button>
          </div>
        )}

        {/* CONNECTIONS SECTION */}
        {section === "connections" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Strava - real */}
            <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: stravaData ? 10 : 0 }}>
                <span style={{ fontSize: 20 }}>{"\u{1F3C3}"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>Strava</div>
                  <div style={{ fontSize: 12, color: stravaData ? "#FC4C02" : C.t3 }}>{stravaData ? "Connected" : "Not connected"}</div>
                </div>
                {stravaData ? (
                  <button onClick={onDisconnectStrava} style={{ ...F, fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "rgba(220,60,60,0.06)", border: "1px solid rgba(220,60,60,0.12)", color: "#DC3C3C", cursor: "pointer" }}>Disconnect</button>
                ) : (
                  <button onClick={onConnectStrava} style={{ ...F, fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: C.accDim, border: `1px solid ${C.accBorder}`, color: C.acc, cursor: "pointer" }}>Connect</button>
                )}
              </div>
              {stravaData?.profile && (
                <div style={{ padding: "10px 12px", borderRadius: 10, background: C.s1, fontSize: 12, color: C.t2, lineHeight: 1.5 }}>
                  {stravaData.profile.name} {"\u2022"} {stravaData.profile.allTimeRuns} runs ({stravaData.profile.allTimeRunDistance}) {"\u2022"} {stravaData.profile.allTimeRides} rides ({stravaData.profile.allTimeRideDistance})
                </div>
              )}
            </div>

            {/* Other socials - coming soon */}
            {SOCIALS.filter(s => !s.real).map(s => (
              <div key={s.id} style={{ padding: "14px 16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}`, display: "flex", alignItems: "center", gap: 12, opacity: 0.55 }}>
                <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: C.t3 }}>Coming soon</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI INSIGHTS / PREFERENCES SECTION */}
        {section === "preferences" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {profile.insights?.length > 0 && (
              <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
                <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Profile insights ({profile.insights.length})</div>
                {profile.insights.map((ins, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, padding: "6px 0", borderBottom: i < profile.insights.length - 1 ? `1px solid ${C.b1}` : "none" }}>
                    {"\u2022"} {ins.text}
                  </div>
                ))}
              </div>
            )}

            {preferences.length > 0 && (
              <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
                <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Learned preferences ({preferences.length})</div>
                {preferences.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, padding: "6px 0", borderBottom: i < preferences.length - 1 ? `1px solid ${C.b1}` : "none" }}>
                    <span style={{ fontWeight: 600, color: C.t1, textTransform: "capitalize" }}>{p.key?.replace(/_/g, " ")}:</span> {p.value}
                  </div>
                ))}
              </div>
            )}

            {(!profile.insights?.length && !preferences.length) && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{"\u{1F9E0}"}</div>
                <div style={{ fontSize: 14, color: C.t2, marginBottom: 6 }}>No insights yet</div>
                <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.5, maxWidth: 260, margin: "0 auto" }}>Chat with your coach and complete the deep profile to build insights.</div>
              </div>
            )}
          </div>
        )}

        {/* ABOUT SECTION */}
        {section === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>{"\u{1F463}"}</div>
                <div><div style={{ fontSize: 16, fontWeight: 600, color: C.t1 }}>My Next Step</div><div style={{ fontSize: 12, color: C.t3 }}>v1.0 Beta</div></div>
              </div>
              <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6 }}>
                Your AI coach that creates clear, actionable steps and makes them easy to do. Built with love in Houston, TX.
              </div>
            </div>
            <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
              <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Legal</div>
              <div style={{ fontSize: 13, color: C.acc, cursor: "pointer", marginBottom: 6 }}>Terms of Service</div>
              <div style={{ fontSize: 13, color: C.acc, cursor: "pointer", marginBottom: 6 }}>Privacy Policy</div>
              <div style={{ fontSize: 13, color: C.acc, cursor: "pointer" }}>Affiliate Disclosure</div>
            </div>
            <div style={{ padding: "16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}` }}>
              <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Support</div>
              <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6 }}>Questions or feedback? Reach out at <span style={{ color: C.acc }}>hello@mynextstep.app</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("steps");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [plans, setPlans] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [feedbackStep, setFeedbackStep] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [stravaData, setStravaData] = useState(null);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const chatEnd = useRef(null); const inputRef = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { const params = new URLSearchParams(window.location.search); const code = params.get("code"); if (code && params.get("scope")?.includes("read")) { window.history.replaceState({}, "", window.location.pathname); exchangeStravaCode(code).then(async d => { if (d?.access_token) { const p = await fetchStravaProfile(d.access_token); const full = { ...d, profile: p }; setStravaData(full); window.storage.set("mns-strava", JSON.stringify(full)).catch(() => {}); } }); } }, []);
  useEffect(() => { (async () => { try { const s = await window.storage.get("mns-v9"); if (s) { const d = JSON.parse(s.value); if (d.profile?.setup) { setProfile(d.profile); setSteps(d.steps||[]); setPlans(d.plans||[]); setMessages(d.messages||[]); setPreferences(d.preferences||[]); setScreen("main"); } } } catch {} try { const sv = await window.storage.get("mns-strava"); if (sv) setStravaData(JSON.parse(sv.value)); } catch {} })(); }, []);

  const persist = (p, s, pl, m, pr) => { window.storage.set("mns-v9", JSON.stringify({ profile: p||profile, steps: s||steps, plans: pl||plans, messages: m||messages, preferences: pr||preferences })).catch(() => {}); };

  const handleAuth = (auth) => { setProfile({ name: auth.name, email: auth.email, method: auth.method }); setScreen("socials"); };
  const handleSocials = (socials) => { setProfile(p => ({ ...p, socials })); setScreen("setup"); };
  const handleSetup = (setup) => { setProfile(p => ({ ...p, setup })); setScreen("deepprofile"); };
  const handleDeepProfileFinish = (insights) => {
    const full = { ...profile, insights }; setProfile(full);
    if (messages.length === 0) { const w = [{ role: "assistant", content: `Hey ${full.name}! I'm your Next Step coach.\n\nYou're in ${full.setup?.location} and interested in: "${full.setup?.goals}"\n\nBefore I suggest anything, tell me more \u2014 what's the most important thing you'd like to focus on first? And what have you already tried?` }]; setMessages(w); setMode("chat"); persist(full, [], [], w, []); }
    else persist(full, steps, plans, messages, preferences);
    setScreen("main"); setTimeout(() => inputRef.current?.focus(), 200);
  };

  const talkAbout = (text) => { setMode("chat"); setInput(""); setTimeout(() => { inputRef.current?.focus(); sendMessage(text); }, 100); };

  const sendMessage = async (text) => {
    const msg = text || input.trim(); if (!msg || loading) return;
    const userMsg = { role: "user", content: msg }; const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true);
    const prefText = preferences.length > 0 ? "\n\nPREFERENCES:\n" + preferences.map(p => `- ${p.key}: ${p.value}`).join("\n") : "";
    const sp = stravaData?.profile;
    const stravaText = sp ? `\n\nSTRAVA: ${sp.name}, ${sp.city} | ${sp.allTimeRuns} runs (${sp.allTimeRunDistance}), ${sp.allTimeRides} rides (${sp.allTimeRideDistance}) | Recent: ${sp.recentActivities?.slice(0,3).map(a => `${a.type} ${a.distance}`).join(", ")||"none"}` : "";
    const stepsCtx = steps.filter(s=>s.status==="active").length > 0 ? "\n\nACTIVE STEPS: "+steps.filter(s=>s.status==="active").map(s=>`"${s.title}"`).join(", ") : "";
    const plansCtx = plans.length > 0 ? "\n\nPLANS: "+plans.map(p=>`"${p.title}"`).join(", ") : "";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: SYSTEM_PROMPT + `\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}\nGoals: ${profile?.setup?.goals||""}${prefText}${stravaText}${stepsCtx}${plansCtx}`,
          messages: updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(c => c.text||"").filter(Boolean).join("\n") || "Tell me more?";
      let displayText = raw, newSteps = [...steps], newPlans = [...plans], newPrefs = [...preferences];
      if (raw.includes("---DATA---")) {
        const parts = raw.split("---DATA---"); displayText = parts[0].trim();
        try {
          for (const item of JSON.parse(parts[1].trim())) {
            if (item.type === "step") newSteps = [{ ...item, status: "active", id: Date.now() + Math.random() }, ...newSteps];
            else if (item.type === "plan") newPlans = [{ ...item, tasks: (item.tasks||[]).map(t => ({ ...t, done: false })) }, ...newPlans.filter(p => p.title !== item.title)];
            else if (item.type === "preference") newPrefs = [...newPrefs.filter(p => p.key !== item.key), item];
            else if (item.type === "delete_step") newSteps = newSteps.filter(s => !s.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 20)));
            else if (item.type === "delete_plan") newPlans = newPlans.filter(p => !p.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 20)));
          }
          setSteps(newSteps); setPlans(newPlans); setPreferences(newPrefs);
        } catch (e) { console.error("Parse:", e); }
      }
      const newMsgs = [...updated, { role: "assistant", content: displayText }]; setMessages(newMsgs);
      persist(profile, newSteps, newPlans, newMsgs, newPrefs);
      if (newSteps.length > steps.length) setTimeout(() => setMode("steps"), 600);
      else if (newPlans.length > plans.length) setTimeout(() => setMode("plans"), 600);
    } catch (err) { console.error(err); setMessages(prev => [...prev, { role: "assistant", content: "Quick hiccup \u2014 say that again?" }]); }
    setLoading(false);
  };

  const deleteStep = (id) => { const u = steps.filter(s => s.id !== id); setSteps(u); persist(profile, u, plans, messages, preferences); };
  const markStep = (id, status) => { if (status === "done") setFeedbackStep(steps.find(s => s.id === id)); const u = steps.map(s => s.id === id ? { ...s, status } : s); setSteps(u); persist(profile, u, plans, messages, preferences); };
  const submitFeedback = () => { if (!feedbackText.trim() || !feedbackStep) return; sendMessage(`Completed "${feedbackStep.title}": ${feedbackText.trim()}`); setFeedbackStep(null); setFeedbackText(""); setMode("chat"); };
  const deletePlan = (idx) => { const u = plans.filter((_, i) => i !== idx); setPlans(u); setExpandedPlan(null); persist(profile, steps, u, messages, preferences); };
  const togglePlanTask = (pi, ti) => { const u = plans.map((p, i) => i === pi ? { ...p, tasks: p.tasks.map((t, j) => j === ti ? { ...t, done: !t.done } : t) } : p); setPlans(u); persist(profile, steps, u, messages, preferences); };
  const resetAll = async () => { try { await window.storage.delete("mns-v9"); await window.storage.delete("mns-strava"); } catch {} setProfile(null); setMessages([]); setSteps([]); setPlans([]); setPreferences([]); setStravaData(null); setScreen("auth"); setShowSettings(false); };

  const updateProfile = (updated) => { setProfile(updated); persist(updated, steps, plans, messages, preferences); };
  const disconnectStrava = async () => { try { await window.storage.delete("mns-strava"); } catch {} setStravaData(null); };

  const activeSteps = steps.filter(s => s.status === "active");
  const doneSteps = steps.filter(s => s.status === "done");

  if (screen === "auth") return (<div style={{ background: C.bg, minHeight: "100vh" }}><style>{font}</style><AuthScreen onAuth={handleAuth} /></div>);
  if (screen === "socials") return (<div style={{ background: C.bg, minHeight: "100vh" }}><style>{font}</style><SocialLinkScreen onContinue={handleSocials} stravaConnected={!!stravaData} stravaProfile={stravaData?.profile} /></div>);
  if (screen === "setup") return (<div style={{ background: C.bg, minHeight: "100vh" }}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup} /></div>);
  if (screen === "deepprofile") return (<div style={{ background: C.bg, minHeight: "100vh" }}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepProfileFinish} existingInsights={profile?.insights||[]} /></div>);
  if (showEarnings) return (<div style={{ background: C.bg, minHeight: "100vh" }}><style>{font}</style><EarningsDashboard onClose={() => setShowEarnings(false)} /></div>);
  if (showSettings) return (<div style={{ background: C.bg, minHeight: "100vh" }}><style>{font}</style><SettingsPanel profile={profile} stravaData={stravaData} preferences={preferences} onUpdateProfile={updateProfile} onConnectStrava={connectStrava} onDisconnectStrava={disconnectStrava} onDeepProfile={() => { setShowSettings(false); setScreen("deepprofile"); }} onSignOut={resetAll} onClose={() => setShowSettings(false)} /></div>);

  return (
    <div style={{ ...F, height: "100vh", color: C.t1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg }}>
      <style>{font}</style>
      <FtcBanner />
      {feedbackStep && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: 24, border: `1px solid ${C.b2}`, boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 12, color: C.acc, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>How did it go?</div>
            <div style={{ ...S, fontSize: 18, color: C.t1, marginBottom: 14 }}>{feedbackStep.title}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>{["Loved it!", "It was okay", "Not for me", "Too expensive", "Too far", "More like this"].map(q => (<button key={q} onClick={() => setFeedbackText(q)} style={{ ...F, padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: feedbackText === q ? C.accDim : C.s1, border: `1px solid ${feedbackText === q ? C.accBorder : C.b1}`, color: feedbackText === q ? C.acc : C.t2 }}>{q}</button>))}</div>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={2} placeholder="Or type..." style={{ ...F, width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${C.b2}`, background: C.bg, color: C.t1, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}><button onClick={() => { setFeedbackStep(null); setFeedbackText(""); }} style={{ ...F, flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.b1}`, background: "#fff", color: C.t2, fontSize: 14, cursor: "pointer" }}>Skip</button><button onClick={submitFeedback} disabled={!feedbackText.trim()} style={{ ...F, flex: 1, padding: 11, borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: feedbackText.trim() ? "pointer" : "default", background: feedbackText.trim() ? C.accGrad : C.s1, color: feedbackText.trim() ? "#fff" : C.t3 }}>Submit</button></div>
          </div>
        </div>
      )}
      {/* Tabs + Earnings button */}
      <div style={{ display: "flex", padding: "8px 16px 0", gap: 4, flexShrink: 0, borderBottom: `1px solid ${C.b1}`, alignItems: "center" }}>
        {[{ id: "steps", label: "Steps", count: activeSteps.length }, { id: "plans", label: "Plans", count: plans.length }, { id: "chat", label: "Coach" }].map(t => (
          <button key={t.id} onClick={() => { setMode(t.id); if (t.id === "chat") setTimeout(() => inputRef.current?.focus(), 100); }} style={{ ...F, flex: 1, padding: "10px 0 12px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: mode === t.id ? 600 : 400, color: mode === t.id ? C.acc : C.t3, borderBottom: mode === t.id ? `2.5px solid ${C.acc}` : "2.5px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {t.label}{t.count > 0 && <span style={{ fontSize: 10, background: mode === t.id ? C.accDim : C.s1, color: mode === t.id ? C.acc : C.t3, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
        <button onClick={() => setShowEarnings(true)} style={{ ...F, padding: "8px", background: "none", border: "none", cursor: "pointer", fontSize: 16, flexShrink: 0 }} title="Earnings">{"\u{1F4B0}"}</button>
        <button onClick={() => setShowSettings(true)} style={{ ...F, padding: "8px", background: "none", border: "none", cursor: "pointer", fontSize: 16, flexShrink: 0 }} title="Settings">{"\u2699\uFE0F"}</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* STEPS */}
        {mode === "steps" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 80px" }}>
            {activeSteps.length === 0 && doneSteps.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}><div style={{ fontSize: 36, marginBottom: 10 }}>{"\u{1F463}"}</div><div style={{ fontSize: 15, fontWeight: 500, color: C.t2, marginBottom: 8 }}>No steps yet</div><div style={{ fontSize: 13, color: C.t3, lineHeight: 1.6, maxWidth: 260, margin: "0 auto 18px" }}>Chat with your coach first. Steps appear when the AI understands what you need.</div><button onClick={() => { setMode("chat"); setTimeout(() => inputRef.current?.focus(), 100); }} style={{ ...F, padding: "11px 22px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: C.accGrad, color: "#fff" }}>Talk to coach {"\u2192"}</button></div>
            ) : (<>
              {activeSteps.length > 0 && <div style={{ marginBottom: 24 }}><div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 10 }}>To do ({activeSteps.length})</div>
                {activeSteps.map(step => (
                  <div key={step.id} style={{ padding: "14px 16px", borderRadius: 14, marginBottom: 8, background: "#fff", border: `1px solid ${C.b1}`, position: "relative" }}>
                    <button onClick={() => deleteStep(step.id)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>{"\u00D7"}</button>
                    {step.category && <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>{step.category}</div>}
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, lineHeight: 1.4, marginBottom: 3, paddingRight: 24 }}>{step.title}</div>
                    {step.time && <div style={{ fontSize: 12, color: C.t3, marginBottom: 5 }}>{step.time}</div>}
                    {step.why && <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, marginBottom: 10 }}>{step.why}</div>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {step.link && <TrackedLink href={step.link} actionId={step.id} category={step.category} title={step.title} style={{ ...F, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 10, background: C.accGrad, color: "#fff", textDecoration: "none", display: "inline-block" }}>{step.linkText||"Do it"} {"\u2197"}</TrackedLink>}
                      <button onClick={() => markStep(step.id, "done")} style={{ ...F, fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 10, background: C.tealDim, border: `1px solid ${C.teal}20`, color: C.teal, cursor: "pointer" }}>Done {"\u2713"}</button>
                      <button onClick={() => talkAbout(`Let's talk about: "${step.title}"`)} style={{ ...F, fontSize: 12, padding: "8px 12px", borderRadius: 10, background: C.s1, border: `1px solid ${C.b1}`, color: C.t3, cursor: "pointer" }}>Discuss</button>
                    </div>
                  </div>
                ))}</div>}
              {doneSteps.length > 0 && <div><div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 10 }}>Done ({doneSteps.length})</div>{doneSteps.slice(0,5).map(s => (<div key={s.id} style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 5, background: C.tealDim, border: `1px solid ${C.teal}15`, display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}><span style={{ color: C.teal }}>{"\u2713"}</span><span style={{ fontSize: 13, textDecoration: "line-through", color: C.t2, flex: 1 }}>{s.title}</span><button onClick={() => deleteStep(s.id)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14 }}>{"\u00D7"}</button></div>))}</div>}
            </>)}
          </div>
        )}
        {/* PLANS */}
        {mode === "plans" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 80px" }}>
            {plans.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}><div style={{ fontSize: 36, marginBottom: 10 }}>{"\u{1F4CB}"}</div><div style={{ fontSize: 15, fontWeight: 500, color: C.t2, marginBottom: 8 }}>No plans yet</div><div style={{ fontSize: 13, color: C.t3, lineHeight: 1.6, maxWidth: 260, margin: "0 auto 18px" }}>Tell your coach about a trip, goal, or project.</div><button onClick={() => { setMode("chat"); setTimeout(() => inputRef.current?.focus(), 100); }} style={{ ...F, padding: "11px 22px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: C.accGrad, color: "#fff" }}>Talk to coach {"\u2192"}</button></div>
            ) : (<><div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 10 }}>Your plans ({plans.length})</div>
              {plans.map((plan, pi) => { const open = expandedPlan === pi, done = plan.tasks?.filter(t => t.done).length||0, total = plan.tasks?.length||0; return (<div key={pi} style={{ marginBottom: 10 }}>
                <div style={{ padding: "14px 16px", borderRadius: open ? "14px 14px 0 0" : 14, cursor: "pointer", background: "#fff", border: `1px solid ${C.b1}`, borderBottom: open ? "none" : `1px solid ${C.b1}`, position: "relative" }}>
                  <button onClick={e => { e.stopPropagation(); deletePlan(pi); }} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>{"\u00D7"}</button>
                  <div onClick={() => setExpandedPlan(open ? null : pi)}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.t1, paddingRight: 24 }}>{plan.title}</div>
                    {plan.date && <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>{plan.date}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}><div style={{ flex: 1, height: 3, background: C.s1, borderRadius: 2 }}><div style={{ height: "100%", width: total ? (done/total*100)+"%" : "0%", background: C.accGrad, borderRadius: 2 }} /></div><span style={{ fontSize: 11, fontWeight: 600, color: C.acc }}>{done}/{total}</span></div>
                  </div>
                  <button onClick={() => talkAbout(`Let's discuss my plan: "${plan.title}"`)} style={{ ...F, fontSize: 11, padding: "5px 10px", borderRadius: 8, background: C.s1, border: `1px solid ${C.b1}`, color: C.t3, cursor: "pointer", marginTop: 8 }}>Discuss this plan</button>
                </div>
                {open && <div style={{ padding: "6px 16px 14px", background: "#fff", border: `1px solid ${C.b1}`, borderTop: "none", borderRadius: "0 0 14px 14px" }}>
                  {plan.tasks?.map((task, ti) => (<div key={ti} style={{ padding: "10px 0", borderBottom: ti < plan.tasks.length-1 ? `1px solid ${C.b1}` : "none" }}><div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <button onClick={() => togglePlanTask(pi, ti)} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, cursor: "pointer", background: task.done ? C.teal : "transparent", border: `2px solid ${task.done ? C.teal : C.b2}`, display: "flex", alignItems: "center", justifyContent: "center", color: task.done ? "#fff" : "transparent", fontSize: 11 }}>{task.done ? "\u2713" : ""}</button>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: C.t1, textDecoration: task.done ? "line-through" : "none", opacity: task.done ? 0.5 : 1 }}>{task.title}</div>
                      {task.links?.length > 0 && !task.done && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>{task.links.map((l, li) => <TrackedLink key={li} href={l.url} actionId={`plan-${pi}-${ti}-${li}`} category="travel" title={task.title} style={{ ...F, fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 7, background: C.accDim, color: C.acc, textDecoration: "none", display: "inline-block", border: `1px solid ${C.accBorder}` }}>{l.label} {"\u2197"}</TrackedLink>)}</div>}
                    </div></div></div>))}
                </div>}
              </div>); })}</>)}
          </div>
        )}
        {/* CHAT */}
        {mode === "chat" && (<>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                {msg.role !== "user" && <div style={{ width: 24, height: 24, borderRadius: 8, background: C.accGrad, flexShrink: 0, marginRight: 8, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{"\u{1F463}"}</div>}
                <div style={{ ...F, maxWidth: "82%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  ...(msg.role === "user" ? { background: C.accGrad, color: "#fff", borderBottomRightRadius: 4 } : { background: "#fff", color: C.t1, borderBottomLeftRadius: 4, border: `1px solid ${C.b1}` }),
                }}>{msg.content}</div>
              </div>
            ))}
            {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ width: 24, height: 24, borderRadius: 8, background: C.accGrad, flexShrink: 0 }} /><div style={{ padding: "10px 16px", borderRadius: 14, background: "#fff", border: `1px solid ${C.b1}`, display: "flex", gap: 4 }}>{[0,1,2].map(i=><div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.t3, animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />)}</div></div>}
            <div ref={chatEnd} />
          </div>
          <div style={{ padding: "8px 20px 16px", borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}><div style={{ display: "flex", gap: 8 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} placeholder="What do you want to do?" style={{ ...F, flex: 1, padding: "11px 14px", fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.b2}`, background: "#fff", color: C.t1, outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ width: 42, height: 42, borderRadius: 12, border: "none", flexShrink: 0, cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? C.accGrad : C.s1, color: input.trim() && !loading ? "#fff" : C.t3, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2191"}</button>
          </div></div>
        </>)}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-5px) } }`}</style>
    </div>
  );
}
