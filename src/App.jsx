import { useState, useEffect, useRef } from "react";

const font = `@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Manrope:wght@300;400;500;600;700&display=swap');`;
const S = { fontFamily: "'Newsreader', serif" };
const F = { fontFamily: "'Manrope', sans-serif" };
const C = {
  bg: "#08080C", s1: "rgba(255,255,255,0.04)", s2: "rgba(255,255,255,0.07)",
  b1: "rgba(255,255,255,0.06)", b2: "rgba(255,255,255,0.12)",
  t1: "#EDEAE3", t2: "rgba(237,234,227,0.55)", t3: "rgba(237,234,227,0.28)",
  acc: "#56D4A5", acc2: "#3BB8E8", accDim: "rgba(86,212,165,0.1)",
  red: "rgba(255,90,90,0.8)", redDim: "rgba(255,90,90,0.08)", redBorder: "rgba(255,90,90,0.15)",
};

const SOCIALS = [
  { id: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2" },
  { id: "instagram", label: "Instagram", icon: "\u{1F4F7}", color: "#E4405F" },
  { id: "spotify", label: "Spotify", icon: "\u{1F3B5}", color: "#1DB954" },
  { id: "strava", label: "Strava", icon: "\u{1F3C3}", color: "#FC4C02" },
  { id: "calendar", label: "Google Calendar", icon: "\u{1F4C5}", color: "#4285F4" },
];

const SYSTEM_PROMPT = `You are the AI engine behind "My Next Step" — a life coach app that creates SPECIFIC, ACTIONABLE recommendations with direct links.

CORE RULES:
1. LISTEN before recommending. Ask smart questions first. It's better to ask than recommend something irrelevant — that's how we lose users.
2. EVERY recommendation must have a CLEAR ACTION with a PRE-FILLED link (not just a homepage).
3. Two output types:
   - STEPS: Things to do now/today/this week. One action, one pre-filled link.
   - PLANS: Multi-step goals. Each task has pre-filled search links.
4. PRE-FILLED LINKS ARE CRITICAL. Never link to just "kayak.com" or "airbnb.com". Always include search parameters:
   - Flights: "https://www.kayak.com/flights/HOU-AUS/2026-05-15/2026-05-18?sort=bestflight_a"
   - Hotels: "https://www.airbnb.com/s/Fredericksburg--TX/homes?checkin=2026-05-15&checkout=2026-05-18&adults=2"
   - Google Maps: "https://www.google.com/maps/search/yoga+studios+near+Houston+TX"
   - Restaurants: "https://www.google.com/maps/search/quiet+restaurants+near+downtown+Houston"
   - Classes: "https://www.google.com/search?q=beginner+cycling+class+Houston+TX+this+week"
   - Events: "https://www.eventbrite.com/d/tx--houston/networking-events/"
   Use the user's location, dates, preferences to fill in the search parameters.
5. After feedback, ADAPT. Add preference insights.
6. Be concise. 1-3 sentences in chat. Cards do the heavy lifting.

OUTPUT FORMAT:
Include structured data after "---DATA---" at the end. User won't see this separator.

For steps:
---DATA---
[{"type":"step","title":"Try Hot Yoga at CorePower Midtown","why":"10 min from you, beginner-friendly 7pm class tonight.","link":"https://www.google.com/maps/search/CorePower+Yoga+Midtown+Houston","linkText":"View studio","category":"wellness","time":"Tonight 7pm"}]

For plans (with pre-filled links):
---DATA---
[{"type":"plan","title":"Hill Country Cycling Trip","date":"May 15-18, 2026","tasks":[{"title":"Book flights Houston to Austin","links":[{"label":"Kayak","url":"https://www.kayak.com/flights/HOU-AUS/2026-05-15/2026-05-18"},{"label":"Google Flights","url":"https://www.google.com/travel/flights?q=flights+from+houston+to+austin+may+15-18+2026"}]},{"title":"Book cabin in Fredericksburg","links":[{"label":"Airbnb","url":"https://www.airbnb.com/s/Fredericksburg--TX/homes?checkin=2026-05-15&checkout=2026-05-18&adults=2"},{"label":"VRBO","url":"https://www.vrbo.com/search?destination=Fredericksburg+TX&startDate=2026-05-15&endDate=2026-05-18"}]}]}]

For preferences:
---DATA---
[{"type":"preference","key":"yoga_style","value":"Prefers hot yoga, intense workouts"}]

Only output ---DATA--- when you have SPECIFIC, RELEVANT recommendations with pre-filled links.`;

// ─── AUTH SCREEN ───
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("landing");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  if (mode === "email") return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <button onClick={() => setMode("landing")} style={{ ...F, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14, marginBottom: 24 }}>{"\u2190"} Back</button>
        <h2 style={{ ...S, fontSize: 30, color: C.t1, marginBottom: 8 }}>Create your account</h2>
        <p style={{ ...F, color: C.t2, fontSize: 14, marginBottom: 28 }}>Get started with personalized recommendations.</p>
        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 15, borderRadius: 12, border: `1px solid ${C.b2}`, background: C.s1, color: C.t1, outline: "none", marginBottom: 14, boxSizing: "border-box" }} />
        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 15, borderRadius: 12, border: `1px solid ${C.b2}`, background: C.s1, color: C.t1, outline: "none", marginBottom: 20, boxSizing: "border-box" }} />
        <button onClick={() => name.trim() && email.includes("@") && onAuth({ name: name.trim(), email, method: "email" })} disabled={!name.trim() || !email.includes("@")} style={{
          ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none",
          cursor: name.trim() && email.includes("@") ? "pointer" : "default",
          background: name.trim() && email.includes("@") ? `linear-gradient(135deg, ${C.acc}, ${C.acc2})` : C.s1,
          color: name.trim() && email.includes("@") ? C.bg : C.t3,
        }}>Create account {"\u2192"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 18px", background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.bg, fontWeight: 700 }}>{"\u2192"}</div>
        <h1 style={{ ...S, fontSize: 42, color: C.t1, lineHeight: 1.1, marginBottom: 10 }}>My Next Step</h1>
        <p style={{ ...F, fontSize: 15, color: C.t2, lineHeight: 1.6, marginBottom: 36, maxWidth: 320, margin: "0 auto 36px" }}>
          Your AI coach that creates clear, actionable steps and makes them easy to do.
        </p>
        <button onClick={() => onAuth({ name: "User", email: "user@google.com", method: "google" })} style={{
          ...F, width: "100%", padding: "13px 20px", borderRadius: 14, fontSize: 15, fontWeight: 500,
          background: C.s2, color: C.t1, border: `1px solid ${C.b2}`, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10,
        }}>
          <span style={{ fontWeight: 700 }}>G</span> Continue with Google
        </button>
        <button onClick={() => onAuth({ name: "User", email: "user@apple.com", method: "apple" })} style={{
          ...F, width: "100%", padding: "13px 20px", borderRadius: 14, fontSize: 15, fontWeight: 500,
          background: "rgba(255,255,255,0.88)", color: "#000", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10,
        }}>
          <span style={{ fontSize: 18 }}>{"\u{1F34E}"}</span> Continue with Apple
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.b1 }} />
          <span style={{ fontSize: 12, color: C.t3 }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.b1 }} />
        </div>
        <button onClick={() => setMode("email")} style={{
          ...F, width: "100%", padding: "13px", borderRadius: 14, fontSize: 15, fontWeight: 500,
          background: "transparent", color: C.t2, border: `1px solid ${C.b1}`, cursor: "pointer",
        }}>Sign up with email</button>
        <p style={{ ...F, fontSize: 13, color: C.t3, marginTop: 20 }}>Already have an account? <span style={{ color: C.acc, cursor: "pointer" }}>Log in</span></p>
      </div>
    </div>
  );
}

// ─── SOCIAL LINK SCREEN ───
function SocialLinkScreen({ onContinue }) {
  const [linked, setLinked] = useState([]);
  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ ...S, fontSize: 28, color: C.t1, marginBottom: 8 }}>Connect your accounts</h2>
          <p style={{ color: C.t2, fontSize: 14, lineHeight: 1.6 }}>We read your data to personalize \u2014 never post on your behalf.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {SOCIALS.map(s => {
            const on = linked.includes(s.id);
            return (
              <button key={s.id} onClick={() => setLinked(p => on ? p.filter(x => x !== s.id) : [...p, s.id])} style={{
                ...F, padding: "14px 16px", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                background: on ? `${s.color}12` : C.s1, border: `1.5px solid ${on ? s.color : C.b1}`, transition: "all 0.2s", textAlign: "left",
              }}>
                <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{s.icon}</span>
                <span style={{ flex: 1, color: C.t1, fontSize: 14, fontWeight: 500 }}>{s.label}</span>
                {on && <span style={{ color: s.color, fontWeight: 700 }}>{"\u2713"}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => onContinue(linked)} style={{
          ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg,
        }}>{linked.length > 0 ? `Continue with ${linked.length} account${linked.length > 1 ? "s" : ""} \u2192` : "Continue \u2192"}</button>
        {linked.length === 0 && <button onClick={() => onContinue([])} style={{ ...F, display: "block", margin: "10px auto 0", background: "none", border: "none", color: C.t3, fontSize: 13, cursor: "pointer" }}>Skip for now</button>}
      </div>
    </div>
  );
}

// ─── SETUP SCREEN (location + goals) ───
function SetupScreen({ profile, onComplete }) {
  const [location, setLocation] = useState("");
  const [goals, setGoals] = useState("");
  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h2 style={{ ...S, fontSize: 28, color: C.t1, marginBottom: 6 }}>Almost there, {profile.name}</h2>
        <p style={{ color: C.t2, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Two quick things so your coach can find real stuff near you.</p>
        <label style={{ fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>Where are you based?</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State (e.g. Houston, TX)" style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 15, borderRadius: 12, border: `1px solid ${C.b2}`, background: C.s1, color: C.t1, outline: "none", marginBottom: 18, boxSizing: "border-box" }} />
        <label style={{ fontSize: 12, color: C.t3, display: "block", marginBottom: 6 }}>What are you focused on right now?</label>
        <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} placeholder="A trip, a career goal, getting healthier, meeting new people..."
          style={{ ...F, width: "100%", padding: "13px 16px", fontSize: 14, borderRadius: 12, border: `1px solid ${C.b2}`, background: C.s1, color: C.t1, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", marginBottom: 20 }} />
        <button onClick={() => location.trim() && goals.trim() && onComplete({ location: location.trim(), goals: goals.trim() })} disabled={!location.trim() || !goals.trim()} style={{
          ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none",
          cursor: location.trim() && goals.trim() ? "pointer" : "default",
          background: location.trim() && goals.trim() ? `linear-gradient(135deg, ${C.acc}, ${C.acc2})` : C.s1,
          color: location.trim() && goals.trim() ? C.bg : C.t3,
        }}>Start my journey {"\u2192"}</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [screen, setScreen] = useState("auth"); // auth, socials, setup, main
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
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get("mns-v6");
        if (saved) {
          const d = JSON.parse(saved.value);
          if (d.profile?.setup) { setProfile(d.profile); setSteps(d.steps || []); setPlans(d.plans || []); setMessages(d.messages || []); setPreferences(d.preferences || []); setScreen("main"); }
        }
      } catch (e) {}
    })();
  }, []);

  const persist = (p, s, pl, m, pr) => {
    window.storage.set("mns-v6", JSON.stringify({ profile: p || profile, steps: s || steps, plans: pl || plans, messages: m || messages, preferences: pr || preferences })).catch(() => {});
  };

  // ─── AUTH FLOW ───
  const handleAuth = (auth) => { setProfile({ name: auth.name, email: auth.email, method: auth.method }); setScreen("socials"); };
  const handleSocials = (socials) => { setProfile(p => ({ ...p, socials })); setScreen("setup"); };
  const handleSetup = (setup) => {
    const full = { ...profile, setup };
    setProfile(full);
    const welcome = [{ role: "assistant", content: `Hey ${full.name}! I'm your Next Step coach.\n\nI see you're in ${setup.location} and focused on: "${setup.goals}"\n\nLet me dig into that. What's the most important thing you'd like to tackle first?` }];
    setMessages(welcome); setScreen("main"); setMode("chat");
    persist(full, [], [], welcome, []);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  // ─── CHAT ───
  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    const userMsg = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true);

    const prefText = preferences.length > 0 ? "\n\nUSER PREFERENCES:\n" + preferences.map(p => `- ${p.key}: ${p.value}`).join("\n") : "";
    const stepsText = steps.filter(s => s.status === "active").length > 0 ? "\n\nACTIVE STEPS:\n" + steps.filter(s => s.status === "active").map(s => `- ${s.title}`).join("\n") : "";
    const plansText = plans.length > 0 ? "\n\nPLANS:\n" + plans.map(p => `- "${p.title}" (${p.tasks?.filter(t => t.done).length || 0}/${p.tasks?.length || 0} done)`).join("\n") : "";

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: SYSTEM_PROMPT + `\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location || ""}\nGoals: ${profile?.setup?.goals || ""}${prefText}${stepsText}${plansText}`,
          messages: updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(c => c.text || "").filter(Boolean).join("\n") || "Could you tell me more about that?";

      let displayText = raw;
      let newSteps = steps, newPlans = plans, newPrefs = preferences;

      if (raw.includes("---DATA---")) {
        const parts = raw.split("---DATA---");
        displayText = parts[0].trim();
        try {
          const items = JSON.parse(parts[1].trim());
          for (const item of items) {
            if (item.type === "step") newSteps = [{ ...item, status: "active", id: Date.now() + Math.random() }, ...newSteps];
            else if (item.type === "plan") newPlans = [{ ...item, tasks: (item.tasks || []).map(t => ({ ...t, done: false })) }, ...newPlans.filter(p => p.title !== item.title)];
            else if (item.type === "preference") newPrefs = [...newPrefs.filter(p => p.key !== item.key), item];
          }
          setSteps(newSteps); setPlans(newPlans); setPreferences(newPrefs);
        } catch (e) { console.error("Parse:", e); }
      }

      const newMsgs = [...updated, { role: "assistant", content: displayText }];
      setMessages(newMsgs);
      persist(profile, newSteps, newPlans, newMsgs, newPrefs);
      if (newSteps.length > steps.length) setTimeout(() => setMode("steps"), 600);
      else if (newPlans.length > plans.length) setTimeout(() => setMode("plans"), 600);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Quick hiccup \u2014 say that again?" }]);
    }
    setLoading(false);
  };

  const deleteStep = (id) => { const u = steps.filter(s => s.id !== id); setSteps(u); persist(profile, u, plans, messages, preferences); };
  const markStep = (id, status) => {
    if (status === "done") setFeedbackStep(steps.find(s => s.id === id));
    const u = steps.map(s => s.id === id ? { ...s, status } : s);
    setSteps(u); persist(profile, u, plans, messages, preferences);
  };
  const submitFeedback = () => {
    if (!feedbackText.trim() || !feedbackStep) return;
    sendMessage(`I just completed "${feedbackStep.title}". Here's how it went: ${feedbackText.trim()}`);
    setFeedbackStep(null); setFeedbackText(""); setMode("chat");
  };
  const deletePlan = (idx) => { const u = plans.filter((_, i) => i !== idx); setPlans(u); setExpandedPlan(null); persist(profile, steps, u, messages, preferences); };
  const togglePlanTask = (pi, ti) => {
    const u = plans.map((p, i) => i === pi ? { ...p, tasks: p.tasks.map((t, j) => j === ti ? { ...t, done: !t.done } : t) } : p);
    setPlans(u); persist(profile, steps, u, messages, preferences);
  };
  const resetAll = async () => {
    try { await window.storage.delete("mns-v6"); } catch (e) {}
    setProfile(null); setMessages([]); setSteps([]); setPlans([]); setPreferences([]); setScreen("auth"); setMode("steps");
  };

  const activeSteps = steps.filter(s => s.status === "active");
  const doneSteps = steps.filter(s => s.status === "done");

  // ─── SCREENS ───
  const bg = <div style={{ position: "fixed", inset: 0, zIndex: 0, background: `linear-gradient(160deg, ${C.bg}, #0D0D18 40%, #0A1420)` }} />;

  if (screen === "auth") return (<div><style>{font}</style>{bg}<div style={{ position: "relative", zIndex: 1 }}><AuthScreen onAuth={handleAuth} /></div></div>);
  if (screen === "socials") return (<div><style>{font}</style>{bg}<div style={{ position: "relative", zIndex: 1 }}><SocialLinkScreen onContinue={handleSocials} /></div></div>);
  if (screen === "setup") return (<div><style>{font}</style>{bg}<div style={{ position: "relative", zIndex: 1 }}><SetupScreen profile={profile} onComplete={handleSetup} /></div></div>);

  // ─── MAIN APP ───
  return (
    <div style={{ ...F, height: "100vh", color: C.t1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{font}</style>
      {bg}

      {/* Feedback modal */}
      {feedbackStep && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#14141E", borderRadius: 20, padding: 24, border: `1px solid ${C.b2}` }}>
            <div style={{ fontSize: 12, color: C.acc, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>How did it go?</div>
            <div style={{ ...S, fontSize: 18, color: C.t1, marginBottom: 14 }}>{feedbackStep.title}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {["Loved it!", "It was okay", "Not for me", "Too expensive", "Too far", "More like this"].map(q => (
                <button key={q} onClick={() => setFeedbackText(q)} style={{
                  ...F, padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  background: feedbackText === q ? C.accDim : C.s1, border: `1px solid ${feedbackText === q ? "rgba(86,212,165,0.2)" : C.b1}`,
                  color: feedbackText === q ? C.acc : C.t2,
                }}>{q}</button>
              ))}
            </div>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={2} placeholder="Or type your thoughts..."
              style={{ ...F, width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 10, border: `1px solid ${C.b1}`, background: C.s1, color: C.t1, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setFeedbackStep(null); setFeedbackText(""); }} style={{ ...F, flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.b1}`, background: "transparent", color: C.t2, fontSize: 14, cursor: "pointer" }}>Skip</button>
              <button onClick={submitFeedback} disabled={!feedbackText.trim()} style={{
                ...F, flex: 1, padding: 11, borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: feedbackText.trim() ? "pointer" : "default",
                background: feedbackText.trim() ? `linear-gradient(135deg, ${C.acc}, ${C.acc2})` : C.s1, color: feedbackText.trim() ? C.bg : C.t3,
              }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", padding: "8px 16px 0", gap: 4, flexShrink: 0 }}>
        {[{ id: "steps", label: "Steps", count: activeSteps.length }, { id: "plans", label: "Plans", count: plans.length }, { id: "chat", label: "Coach" }].map(t => (
          <button key={t.id} onClick={() => { setMode(t.id); if (t.id === "chat") setTimeout(() => inputRef.current?.focus(), 100); }} style={{
            ...F, flex: 1, padding: "10px 0", background: mode === t.id ? C.s2 : "transparent",
            border: "none", borderRadius: "12px 12px 0 0", cursor: "pointer",
            fontSize: 13, fontWeight: mode === t.id ? 600 : 400, color: mode === t.id ? C.t1 : C.t3,
            borderBottom: mode === t.id ? `2px solid ${C.acc}` : "2px solid transparent",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 10, background: mode === t.id ? C.accDim : C.s1, color: mode === t.id ? C.acc : C.t3, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* STEPS */}
        {mode === "steps" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 80px" }}>
            {activeSteps.length === 0 && doneSteps.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{"\u2728"}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: C.t2, marginBottom: 8 }}>No steps yet</div>
                <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.6, maxWidth: 260, margin: "0 auto 18px" }}>Chat with your coach to get actionable recommendations.</div>
                <button onClick={() => { setMode("chat"); setTimeout(() => inputRef.current?.focus(), 100); }} style={{ ...F, padding: "11px 22px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg }}>Talk to coach {"\u2192"}</button>
              </div>
            ) : (
              <>
                {activeSteps.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 10 }}>To do ({activeSteps.length})</div>
                    {activeSteps.map(step => (
                      <div key={step.id} style={{ padding: "14px 16px", borderRadius: 14, marginBottom: 8, background: C.s1, border: `1px solid ${C.b1}`, position: "relative" }}>
                        {/* Delete button */}
                        <button onClick={() => deleteStep(step.id)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1 }}>{"\u00D7"}</button>
                        {step.category && <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>{step.category}</div>}
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, lineHeight: 1.4, marginBottom: 3, paddingRight: 24 }}>{step.title}</div>
                        {step.time && <div style={{ fontSize: 12, color: C.t3, marginBottom: 5 }}>{step.time}</div>}
                        {step.why && <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, marginBottom: 10 }}>{step.why}</div>}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {step.link && (
                            <a href={step.link} target="_blank" rel="noopener noreferrer" style={{
                              ...F, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 10,
                              background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg, textDecoration: "none",
                            }}>{step.linkText || "Do it"} {"\u2197"}</a>
                          )}
                          <button onClick={() => markStep(step.id, "done")} style={{ ...F, fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 10, background: C.accDim, border: `1px solid rgba(86,212,165,0.15)`, color: C.acc, cursor: "pointer" }}>Done {"\u2713"}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {doneSteps.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 10 }}>Done ({doneSteps.length})</div>
                    {doneSteps.slice(0, 5).map(step => (
                      <div key={step.id} style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 5, background: "rgba(86,212,165,0.04)", border: `1px solid rgba(86,212,165,0.08)`, display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
                        <span style={{ color: C.acc, fontSize: 13 }}>{"\u2713"}</span>
                        <span style={{ fontSize: 13, textDecoration: "line-through", color: C.t2, flex: 1 }}>{step.title}</span>
                        <button onClick={() => deleteStep(step.id)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14, padding: "0 4px" }}>{"\u00D7"}</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PLANS */}
        {mode === "plans" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 80px" }}>
            {plans.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{"\u{1F4CB}"}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: C.t2, marginBottom: 8 }}>No plans yet</div>
                <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.6, maxWidth: 260, margin: "0 auto 18px" }}>Tell your coach about a trip, goal, or project.</div>
                <button onClick={() => { setMode("chat"); setTimeout(() => inputRef.current?.focus(), 100); }} style={{ ...F, padding: "11px 22px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg }}>Talk to coach {"\u2192"}</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 10 }}>Your plans ({plans.length})</div>
                {plans.map((plan, pi) => {
                  const open = expandedPlan === pi;
                  const done = plan.tasks?.filter(t => t.done).length || 0;
                  const total = plan.tasks?.length || 0;
                  return (
                    <div key={pi} style={{ marginBottom: 10 }}>
                      <div style={{
                        padding: "14px 16px", borderRadius: open ? "14px 14px 0 0" : 14, cursor: "pointer",
                        background: C.s1, border: `1px solid ${C.b1}`, borderBottom: open ? "none" : `1px solid ${C.b1}`, position: "relative",
                      }}>
                        {/* Delete plan */}
                        <button onClick={(e) => { e.stopPropagation(); deletePlan(pi); }} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>{"\u00D7"}</button>
                        <div onClick={() => setExpandedPlan(open ? null : pi)}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: C.t1, paddingRight: 24 }}>{plan.title}</div>
                          {plan.date && <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>{plan.date}</div>}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                              <div style={{ height: "100%", width: total ? (done / total * 100) + "%" : "0%", background: `linear-gradient(90deg, ${C.acc}, ${C.acc2})`, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.acc }}>{done}/{total}</span>
                          </div>
                        </div>
                      </div>
                      {open && (
                        <div style={{ padding: "6px 16px 14px", background: C.s1, border: `1px solid ${C.b1}`, borderTop: "none", borderRadius: "0 0 14px 14px" }}>
                          {plan.tasks?.map((task, ti) => (
                            <div key={ti} style={{ padding: "10px 0", borderBottom: ti < plan.tasks.length - 1 ? `1px solid ${C.b1}` : "none" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <button onClick={() => togglePlanTask(pi, ti)} style={{
                                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, cursor: "pointer",
                                  background: task.done ? C.acc : "transparent", border: `2px solid ${task.done ? C.acc : C.b2}`,
                                  display: "flex", alignItems: "center", justifyContent: "center", color: task.done ? C.bg : "transparent", fontSize: 11,
                                }}>{task.done ? "\u2713" : ""}</button>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: C.t1, textDecoration: task.done ? "line-through" : "none", opacity: task.done ? 0.5 : 1 }}>{task.title}</div>
                                  {task.links?.length > 0 && !task.done && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                                      {task.links.map((link, li) => (
                                        <a key={li} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                          ...F, fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 7,
                                          background: C.accDim, color: C.acc, textDecoration: "none", border: `1px solid rgba(86,212,165,0.1)`,
                                        }}>{link.label} {"\u2197"}</a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* CHAT */}
        {mode === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  {msg.role !== "user" && <div style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, flexShrink: 0, marginRight: 8, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.bg, fontWeight: 700 }}>{"\u2192"}</div>}
                  <div style={{
                    ...F, maxWidth: "82%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                    ...(msg.role === "user" ? { background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg, borderBottomRightRadius: 4 }
                      : { background: C.s1, color: "rgba(255,255,255,0.8)", borderBottomLeftRadius: 4, border: `1px solid ${C.b1}` }),
                  }}>{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.bg, fontWeight: 700 }}>{"\u2192"}</div>
                  <div style={{ padding: "10px 16px", borderRadius: 14, borderBottomLeftRadius: 4, background: C.s1, border: `1px solid ${C.b1}`, display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.25)", animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <div style={{ padding: "8px 20px 16px", borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="What do you want to do?"
                  style={{ ...F, flex: 1, padding: "11px 14px", fontSize: 14, borderRadius: 12, border: `1px solid ${C.b1}`, background: C.s1, color: C.t1, outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                  width: 42, height: 42, borderRadius: 12, border: "none", flexShrink: 0,
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  background: input.trim() && !loading ? `linear-gradient(135deg, ${C.acc}, ${C.acc2})` : C.s1,
                  color: input.trim() && !loading ? C.bg : C.t3, fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{"\u2191"}</button>
              </div>
            </div>
          </>
        )}
      </div>

      {mode !== "chat" && (
        <div style={{ position: "relative", zIndex: 2, padding: "0 20px 12px", textAlign: "center" }}>
          <button onClick={resetAll} style={{ ...F, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 11 }}>Reset everything</button>
        </div>
      )}

      <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-5px) } }`}</style>
    </div>
  );
}
