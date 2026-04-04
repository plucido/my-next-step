import { useState, useEffect, useRef } from "react";

const font = `@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Manrope:wght@300;400;500;600;700&display=swap');`;
const S = { fontFamily: "'Newsreader', serif" };
const F = { fontFamily: "'Manrope', sans-serif" };
const C = {
  bg: "#08080C", s1: "rgba(255,255,255,0.04)", s2: "rgba(255,255,255,0.07)",
  b1: "rgba(255,255,255,0.06)", b2: "rgba(255,255,255,0.12)",
  t1: "#EDEAE3", t2: "rgba(237,234,227,0.55)", t3: "rgba(237,234,227,0.28)",
  acc: "#56D4A5", acc2: "#3BB8E8", accDim: "rgba(86,212,165,0.1)",
  done: "rgba(86,212,165,0.06)", doneBorder: "rgba(86,212,165,0.12)",
};

const SYSTEM_PROMPT = `You are the AI engine behind "My Next Step" — a life coach app that creates SPECIFIC, ACTIONABLE recommendations with direct links.

CORE PHILOSOPHY:
1. LISTEN before recommending. If the user hasn't given enough context, ask smart questions first. It's better to ask than to recommend something irrelevant.
2. EVERY recommendation must have a CLEAR ACTION and a way to DO IT (a link, a specific place, a specific person to contact).
3. Two types of output:
   - QUICK STEPS: Things to do now/today/this week. One action, one link.
   - PLANS: Multi-step goals (trips, career moves, projects). Each step has sub-tasks with links.
4. After the user completes something and gives feedback, ADAPT. If they loved hot yoga, recommend more of that. If a restaurant was too loud, note the preference.
5. Be concise in chat. 1-3 sentences. The chat is for understanding — the UI cards are for action.

OUTPUT FORMAT:
When you have something actionable, include structured data after "---DATA---" at the end of your message. The user won't see this.

For quick step(s):
---DATA---
[{"type":"step","title":"Try the 7pm Hot Yoga at CorePower","why":"You said you want more intense workouts. This studio is 10 min from you.","link":"https://www.corepoweryoga.com","linkText":"Book class","category":"wellness","time":"Tonight 7pm"}]

For a plan:
---DATA---
[{"type":"plan","title":"Cycling trip to Hill Country","date":"May 2026","tasks":[{"title":"Book cabin in Fredericksburg","links":[{"label":"Airbnb","url":"https://airbnb.com/s/fredericksburg-tx"},{"label":"VRBO","url":"https://vrbo.com"}]},{"title":"Rent bikes","links":[{"label":"Hill Country Bicycle Works","url":"https://www.google.com/search?q=bike+rental+fredericksburg+tx"}]},{"title":"Plan route","links":[{"label":"Komoot","url":"https://www.komoot.com"},{"label":"Strava Routes","url":"https://www.strava.com/routes"}]}]}]

You can output multiple items in one array. Only output ---DATA--- when you have SPECIFIC, RELEVANT recommendations. If you're still learning about the user, just chat. No data block.

When the user gives feedback on a completed step (e.g., "the yoga class was amazing" or "that restaurant was too crowded"), acknowledge it briefly and note what you learned. Add a preference insight:
---DATA---
[{"type":"preference","key":"yoga_style","value":"Prefers hot yoga, intense workouts"},{"type":"step","title":"...next recommendation based on feedback..."}]`;

// ─── MAIN APP ───
export default function App() {
  const [profile, setProfile] = useState(null);
  const [screen, setScreen] = useState("welcome"); // welcome, main
  const [mode, setMode] = useState("steps"); // steps, plans, chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [plans, setPlans] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [feedbackStep, setFeedbackStep] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [nameInput, setNameInput] = useState("");
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get("mns-v5");
        if (saved) {
          const d = JSON.parse(saved.value);
          if (d.profile) { setProfile(d.profile); setSteps(d.steps || []); setPlans(d.plans || []); setMessages(d.messages || []); setPreferences(d.preferences || []); setScreen("main"); }
        }
      } catch (e) {}
    })();
  }, []);

  const persist = (p, s, pl, m, pr) => {
    window.storage.set("mns-v5", JSON.stringify({ profile: p || profile, steps: s || steps, plans: pl || plans, messages: m || messages, preferences: pr || preferences })).catch(() => {});
  };

  const start = (name) => {
    const p = { name };
    const welcome = [{ role: "assistant", content: `Hey ${name}! I'm your Next Step coach.\n\nI help you figure out what to do next and make it easy to actually do it. Tell me \u2014 what are you focused on right now? Could be a trip you're planning, a habit you want to build, a career move, anything.` }];
    setProfile(p); setMessages(welcome); setScreen("main"); setMode("chat");
    persist(p, [], [], welcome, []);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    const userMsg = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true);

    const prefText = preferences.length > 0 ? "\n\nUSER PREFERENCES (learned from feedback):\n" + preferences.map(p => `- ${p.key}: ${p.value}`).join("\n") : "";
    const stepsText = steps.length > 0 ? "\n\nCURRENT STEPS:\n" + steps.map(s => `- [${s.status}] ${s.title}`).join("\n") : "";
    const plansText = plans.length > 0 ? "\n\nCURRENT PLANS:\n" + plans.map(p => `- "${p.title}" (${p.tasks?.filter(t => t.done).length || 0}/${p.tasks?.length || 0} done)`).join("\n") : "";

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: SYSTEM_PROMPT + `\n\nUser: ${profile?.name}${prefText}${stepsText}${plansText}`,
          messages: updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(c => c.text || "").filter(Boolean).join("\n") || "Could you tell me more about that?";

      let displayText = raw;
      let newSteps = steps;
      let newPlans = plans;
      let newPrefs = preferences;

      if (raw.includes("---DATA---")) {
        const parts = raw.split("---DATA---");
        displayText = parts[0].trim();
        try {
          const items = JSON.parse(parts[1].trim());
          for (const item of items) {
            if (item.type === "step") {
              newSteps = [{ ...item, status: "active", id: Date.now() + Math.random() }, ...newSteps];
            } else if (item.type === "plan") {
              const plan = { ...item, tasks: (item.tasks || []).map(t => ({ ...t, done: false })) };
              newPlans = [plan, ...newPlans.filter(p => p.title !== plan.title)];
            } else if (item.type === "preference") {
              newPrefs = [...newPrefs.filter(p => p.key !== item.key), { key: item.key, value: item.value }];
            }
          }
          setSteps(newSteps); setPlans(newPlans); setPreferences(newPrefs);
        } catch (e) { console.error("Parse:", e); }
      }

      const newMsgs = [...updated, { role: "assistant", content: displayText }];
      setMessages(newMsgs);
      persist(profile, newSteps, newPlans, newMsgs, newPrefs);

      // Auto-switch to relevant tab if new items were added
      if (newSteps.length > steps.length) setTimeout(() => setMode("steps"), 600);
      else if (newPlans.length > plans.length) setTimeout(() => setMode("plans"), 600);

    } catch (err) {
      console.error(err);
      const newMsgs = [...updated, { role: "assistant", content: "Quick hiccup \u2014 say that again?" }];
      setMessages(newMsgs);
    }
    setLoading(false);
  };

  const markStep = (id, status) => {
    if (status === "done") {
      setFeedbackStep(steps.find(s => s.id === id));
    }
    const updated = steps.map(s => s.id === id ? { ...s, status } : s);
    setSteps(updated);
    persist(profile, updated, plans, messages, preferences);
  };

  const submitFeedback = () => {
    if (!feedbackText.trim() || !feedbackStep) return;
    const msg = `I just completed "${feedbackStep.title}". Here's how it went: ${feedbackText.trim()}`;
    setFeedbackStep(null); setFeedbackText("");
    setMode("chat");
    sendMessage(msg);
  };

  const togglePlanTask = (planIdx, taskIdx) => {
    const updated = plans.map((p, i) => i === planIdx ? { ...p, tasks: p.tasks.map((t, j) => j === taskIdx ? { ...t, done: !t.done } : t) } : p);
    setPlans(updated);
    persist(profile, steps, updated, messages, preferences);
  };

  const resetAll = async () => {
    try { await window.storage.delete("mns-v5"); } catch (e) {}
    setProfile(null); setMessages([]); setSteps([]); setPlans([]); setPreferences([]); setScreen("welcome"); setMode("steps");
  };

  // ─── WELCOME ───
  if (screen === "welcome") {
    return (
      <div style={{ ...F, minHeight: "100vh", color: C.t1 }}>
        <style>{font}</style>
        <div style={{ position: "fixed", inset: 0, background: `linear-gradient(160deg, ${C.bg}, #0D0D18 40%, #0A1420)` }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 18px", background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.bg, fontWeight: 700 }}>{"\u2192"}</div>
            <h1 style={{ ...S, fontSize: 40, color: C.t1, lineHeight: 1.1, marginBottom: 10 }}>My Next Step</h1>
            <p style={{ ...F, fontSize: 15, color: C.t2, lineHeight: 1.6, marginBottom: 36, maxWidth: 320, margin: "0 auto 36px" }}>
              Your AI coach that creates clear, actionable steps and makes them easy to do.
            </p>
            <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Your first name"
              onKeyDown={e => e.key === "Enter" && nameInput.trim() && start(nameInput.trim())}
              style={{ ...F, width: "100%", padding: "14px 18px", fontSize: 16, borderRadius: 14, border: `1px solid ${C.b2}`, background: C.s1, color: C.t1, outline: "none", boxSizing: "border-box", textAlign: "center" }} />
            <button onClick={() => nameInput.trim() && start(nameInput.trim())} disabled={!nameInput.trim()} style={{
              ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 600, marginTop: 12, border: "none",
              cursor: nameInput.trim() ? "pointer" : "default",
              background: nameInput.trim() ? `linear-gradient(135deg, ${C.acc}, ${C.acc2})` : "rgba(255,255,255,0.05)",
              color: nameInput.trim() ? C.bg : C.t3,
            }}>Start {"\u2192"}</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN UI ───
  const activeSteps = steps.filter(s => s.status === "active");
  const doneSteps = steps.filter(s => s.status === "done");

  return (
    <div style={{ ...F, height: "100vh", color: C.t1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{font}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: `linear-gradient(160deg, ${C.bg}, #0D0D18 40%, #0A1420)` }} />

      {/* Feedback modal */}
      {feedbackStep && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#14141E", borderRadius: 20, padding: 24, border: `1px solid ${C.b2}` }}>
            <div style={{ fontSize: 13, color: C.acc, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>How did it go?</div>
            <div style={{ ...S, fontSize: 20, color: C.t1, marginBottom: 4 }}>{feedbackStep.title}</div>
            <p style={{ fontSize: 13, color: C.t3, marginBottom: 16, lineHeight: 1.5 }}>Your feedback helps me give you better recommendations next time.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {["Loved it!", "It was okay", "Not for me", "Too expensive", "Too far away", "Want more like this"].map(q => (
                <button key={q} onClick={() => setFeedbackText(q)} style={{
                  ...F, padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: feedbackText === q ? C.accDim : C.s1,
                  border: `1px solid ${feedbackText === q ? "rgba(86,212,165,0.25)" : C.b1}`,
                  color: feedbackText === q ? C.acc : C.t2,
                }}>{q}</button>
              ))}
            </div>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={2} placeholder="Or type your own thoughts..."
              style={{ ...F, width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 12, border: `1px solid ${C.b1}`, background: C.s1, color: C.t1, outline: "none", resize: "none", lineHeight: 1.5, boxSizing: "border-box", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setFeedbackStep(null); setFeedbackText(""); }} style={{ ...F, flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${C.b1}`, background: "transparent", color: C.t2, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Skip</button>
              <button onClick={submitFeedback} disabled={!feedbackText.trim()} style={{
                ...F, flex: 1, padding: 12, borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: feedbackText.trim() ? "pointer" : "default",
                background: feedbackText.trim() ? `linear-gradient(135deg, ${C.acc}, ${C.acc2})` : C.s1,
                color: feedbackText.trim() ? C.bg : C.t3,
              }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar - TOP */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", padding: "10px 16px 0", gap: 4, flexShrink: 0 }}>
        {[
          { id: "steps", label: "Steps", count: activeSteps.length },
          { id: "plans", label: "Plans", count: plans.length },
          { id: "chat", label: "Coach" },
        ].map(t => (
          <button key={t.id} onClick={() => { setMode(t.id); if (t.id === "chat") setTimeout(() => inputRef.current?.focus(), 100); }} style={{
            ...F, flex: 1, padding: "11px 0", background: mode === t.id ? C.s2 : "transparent",
            border: "none", borderRadius: "12px 12px 0 0", cursor: "pointer",
            fontSize: 13, fontWeight: mode === t.id ? 600 : 400,
            color: mode === t.id ? C.t1 : C.t3,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            borderBottom: mode === t.id ? `2px solid ${C.acc}` : `2px solid transparent`,
          }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 10, background: mode === t.id ? C.accDim : C.s1, color: mode === t.id ? C.acc : C.t3, padding: "2px 7px", borderRadius: 6, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ─── STEPS TAB ─── */}
        {mode === "steps" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 100px" }}>
            {activeSteps.length === 0 && doneSteps.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px", background: C.s1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{"\u2728"}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: C.t2, marginBottom: 8 }}>No steps yet</div>
                <div style={{ fontSize: 14, color: C.t3, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px" }}>
                  Tell your coach what you're working on and I'll create actionable steps for you.
                </div>
                <button onClick={() => { setMode("chat"); setTimeout(() => inputRef.current?.focus(), 100); }} style={{
                  ...F, padding: "12px 24px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg,
                }}>Talk to your coach {"\u2192"}</button>
              </div>
            ) : (
              <>
                {activeSteps.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 12 }}>To do ({activeSteps.length})</div>
                    {activeSteps.map(step => (
                      <div key={step.id} style={{ padding: "16px", borderRadius: 16, marginBottom: 10, background: C.s1, border: `1px solid ${C.b1}` }}>
                        {step.category && <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{step.category}</div>}
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.t1, lineHeight: 1.4, marginBottom: 4 }}>{step.title}</div>
                        {step.time && <div style={{ fontSize: 12, color: C.t3, marginBottom: 6 }}>{step.time}</div>}
                        {step.why && <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, marginBottom: 10 }}>{step.why}</div>}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {step.link && (
                            <a href={step.link} target="_blank" rel="noopener noreferrer" style={{
                              ...F, fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 10,
                              background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg,
                              textDecoration: "none", display: "inline-block",
                            }}>{step.linkText || "Do it"} {"\u2197"}</a>
                          )}
                          <button onClick={() => markStep(step.id, "done")} style={{
                            ...F, fontSize: 13, fontWeight: 500, padding: "9px 16px", borderRadius: 10,
                            background: C.accDim, border: `1px solid rgba(86,212,165,0.15)`, color: C.acc, cursor: "pointer",
                          }}>Done {"\u2713"}</button>
                          <button onClick={() => markStep(step.id, "skipped")} style={{
                            ...F, fontSize: 13, padding: "9px 14px", borderRadius: 10,
                            background: "transparent", border: `1px solid ${C.b1}`, color: C.t3, cursor: "pointer",
                          }}>Skip</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {doneSteps.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 12 }}>Completed ({doneSteps.length})</div>
                    {doneSteps.slice(0, 5).map(step => (
                      <div key={step.id} style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 6, background: C.done, border: `1px solid ${C.doneBorder}`, display: "flex", alignItems: "center", gap: 10, opacity: 0.6 }}>
                        <span style={{ color: C.acc, fontSize: 14 }}>{"\u2713"}</span>
                        <span style={{ fontSize: 13, textDecoration: "line-through", color: C.t2 }}>{step.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── PLANS TAB ─── */}
        {mode === "plans" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 100px" }}>
            {plans.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px", background: C.s1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{"\u{1F4CB}"}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: C.t2, marginBottom: 8 }}>No plans yet</div>
                <div style={{ fontSize: 14, color: C.t3, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px" }}>
                  Tell your coach about a trip, goal, or project and I'll break it into steps with links.
                </div>
                <button onClick={() => { setMode("chat"); setTimeout(() => inputRef.current?.focus(), 100); }} style={{
                  ...F, padding: "12px 24px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg,
                }}>Talk to your coach {"\u2192"}</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 14 }}>Your plans ({plans.length})</div>
                {plans.map((plan, pi) => {
                  const open = expandedPlan === pi;
                  const done = plan.tasks?.filter(t => t.done).length || 0;
                  const total = plan.tasks?.length || 0;
                  return (
                    <div key={pi} style={{ marginBottom: 12 }}>
                      <div onClick={() => setExpandedPlan(open ? null : pi)} style={{
                        padding: "16px 18px", borderRadius: open ? "16px 16px 0 0" : 16, cursor: "pointer",
                        background: C.s1, border: `1px solid ${C.b1}`, borderBottom: open ? "none" : `1px solid ${C.b1}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>{plan.title}</div>
                            {plan.date && <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>{plan.date}</div>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.acc }}>{done}/{total}</span>
                            <span style={{ color: C.t3, fontSize: 14, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>{"\u25BE"}</span>
                          </div>
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 10 }}>
                          <div style={{ height: "100%", width: total ? (done / total * 100) + "%" : "0%", background: `linear-gradient(90deg, ${C.acc}, ${C.acc2})`, borderRadius: 2, transition: "width 0.3s" }} />
                        </div>
                      </div>
                      {open && (
                        <div style={{ padding: "4px 18px 18px", background: C.s1, border: `1px solid ${C.b1}`, borderTop: "none", borderRadius: "0 0 16px 16px" }}>
                          {plan.tasks?.map((task, ti) => (
                            <div key={ti} style={{ padding: "12px 0", borderBottom: ti < plan.tasks.length - 1 ? `1px solid ${C.b1}` : "none" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <button onClick={() => togglePlanTask(pi, ti)} style={{
                                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, cursor: "pointer",
                                  background: task.done ? C.acc : "transparent",
                                  border: `2px solid ${task.done ? C.acc : C.b2}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  color: task.done ? C.bg : "transparent", fontSize: 11, fontWeight: 700,
                                }}>{task.done ? "\u2713" : ""}</button>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: C.t1, textDecoration: task.done ? "line-through" : "none", opacity: task.done ? 0.5 : 1 }}>{task.title}</div>
                                  {task.links && task.links.length > 0 && !task.done && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                      {task.links.map((link, li) => (
                                        <a key={li} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                          ...F, fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 8,
                                          background: C.accDim, color: C.acc, textDecoration: "none",
                                          border: `1px solid rgba(86,212,165,0.12)`,
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

        {/* ─── CHAT TAB ─── */}
        {mode === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  {msg.role !== "user" && <div style={{ width: 26, height: 26, borderRadius: 9, background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, flexShrink: 0, marginRight: 8, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.bg, fontWeight: 700 }}>{"\u2192"}</div>}
                  <div style={{
                    ...F, maxWidth: "82%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                    ...(msg.role === "user"
                      ? { background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, color: C.bg, borderBottomRightRadius: 4 }
                      : { background: C.s1, color: "rgba(255,255,255,0.8)", borderBottomLeftRadius: 4, border: `1px solid ${C.b1}` }),
                  }}>{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 9, background: `linear-gradient(135deg, ${C.acc}, ${C.acc2})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.bg, fontWeight: 700 }}>{"\u2192"}</div>
                  <div style={{ padding: "10px 16px", borderRadius: 14, borderBottomLeftRadius: 4, background: C.s1, border: `1px solid ${C.b1}`, display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.25)", animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <div style={{ padding: "10px 20px 18px", borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="What do you want to do?"
                  style={{ ...F, flex: 1, padding: "12px 14px", fontSize: 14, borderRadius: 12, border: `1px solid ${C.b1}`, background: C.s1, color: C.t1, outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                  width: 44, height: 44, borderRadius: 12, border: "none", flexShrink: 0,
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

      {/* Reset */}
      {mode !== "chat" && (
        <div style={{ position: "relative", zIndex: 2, padding: "0 20px 16px", textAlign: "center" }}>
          <button onClick={resetAll} style={{ ...F, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 11 }}>Reset everything</button>
        </div>
      )}

      <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-5px) } }`}</style>
    </div>
  );
}
