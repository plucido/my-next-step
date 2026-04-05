import { useState, useEffect, useRef } from "react";

const font = `@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Manrope:wght@300;400;500;600;700&display=swap');`;
const S = { fontFamily: "'Newsreader', serif" };
const F = { fontFamily: "'Manrope', sans-serif" };
const C = {
  bg: "#FBF7F4", card: "#FFFFFF", warm: "#FFF8F5",
  b1: "rgba(0,0,0,0.05)", b2: "rgba(0,0,0,0.09)",
  t1: "#1C1917", t2: "#78716C", t3: "#A8A29E",
  acc: "#E8553D", acc2: "#F0826E", accSoft: "#FDEAE6", accBorder: "rgba(232,85,61,0.12)",
  accGrad: "linear-gradient(135deg, #E8553D, #F0826E)",
  teal: "#0D9488", tealSoft: "#ECFDF5", tealBorder: "rgba(13,148,136,0.12)",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
  shadowHover: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)",
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
  try { const u = new URL(url); u.searchParams.set("utm_source","mynextstep"); u.searchParams.set("utm_medium","app"); u.searchParams.set("utm_campaign",`action_${actionId||"u"}`); const h = u.hostname.replace("www.",""); for (const [d,p] of Object.entries(AFFILIATE_PARTNERS)) { if (h.includes(d.split("/")[0])) { u.searchParams.set("ref",p.tag); break; } } return u.toString(); } catch { return url; }
}
function getPartnerForUrl(url) { if (!url) return { commission: 0.10, name: "Other" }; try { const h = new URL(url).hostname.replace("www.",""); for (const [d,p] of Object.entries(AFFILIATE_PARTNERS)) { if (h.includes(d.split("/")[0])) return p; } } catch {} return { commission: 0.10, name: "Other" }; }
function trackClick(actionId, url, category, title) { try { const c = JSON.parse(localStorage.getItem("mns_clicks")||"[]"); const p = getPartnerForUrl(url); c.push({ id: actionId||Date.now().toString(), url, category: category||"other", title: title||"Unknown", timestamp: new Date().toISOString(), estimatedCommission: p?.commission||0.10, partner: p?.name||"Other" }); localStorage.setItem("mns_clicks", JSON.stringify(c)); } catch {} }
function getClickStats() { try { const c = JSON.parse(localStorage.getItem("mns_clicks")||"[]"); const now = new Date(); const ts = new Date(now.getFullYear(),now.getMonth(),now.getDate()).toISOString(); const ws = new Date(now-7*864e5).toISOString(); const ms = new Date(now.getFullYear(),now.getMonth(),1).toISOString(); const f = (a,d) => a.filter(x=>x.timestamp>=d); const s = a => a.reduce((t,x)=>t+(x.estimatedCommission||0),0); const cats = {}; c.forEach(x => { cats[x.category||"other"] = (cats[x.category||"other"]||0) + (x.estimatedCommission||0); }); return { today:{clicks:f(c,ts).length,commission:s(f(c,ts))}, week:{clicks:f(c,ws).length,commission:s(f(c,ws))}, month:{clicks:f(c,ms).length,commission:s(f(c,ms))}, lifetime:{clicks:c.length,commission:s(c)}, categories:cats, recent:c.slice(-10).reverse() }; } catch { return { today:{clicks:0,commission:0}, week:{clicks:0,commission:0}, month:{clicks:0,commission:0}, lifetime:{clicks:0,commission:0}, categories:{}, recent:[] }; } }
function TrackedLink({ href, actionId, category, title, children, style: sx }) { const w = wrapAffiliateLink(href,actionId); return <a href={w} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(actionId,href,category,title)} style={sx}>{children}</a>; }

// ─── EARNINGS DASHBOARD ───
function EarningsDashboard({ onClose }) {
  const stats = getClickStats(); const mx = Math.max(...Object.values(stats.categories),1);
  return (
    <div style={{ ...F, minHeight: "100vh", padding: "20px 20px 40px", background: C.bg }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><h2 style={{ ...S, fontSize: 26, color: C.t1, margin: 0 }}>Earnings</h2><button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 20 }}>{"\u00D7"}</button></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[{l:"Today",d:stats.today},{l:"This week",d:stats.week},{l:"This month",d:stats.month},{l:"Lifetime",d:stats.lifetime}].map(p => (
            <div key={p.l} style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
              <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{p.l}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.t1 }}>${p.d.commission.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>{p.d.clicks} click{p.d.clicks!==1?"s":""}</div>
            </div>
          ))}
        </div>
        {Object.keys(stats.categories).length > 0 && <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>By category</div>
          {Object.entries(stats.categories).sort((a,b)=>b[1]-a[1]).map(([cat,val]) => (<div key={cat} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 13, fontWeight: 500, color: C.t1, textTransform: "capitalize" }}>{cat}</span><span style={{ fontSize: 13, color: C.acc, fontWeight: 600 }}>${val.toFixed(2)}</span></div><div style={{ height: 4, background: C.accSoft, borderRadius: 2 }}><div style={{ height: "100%", width: `${(val/mx)*100}%`, background: C.accGrad, borderRadius: 2 }} /></div></div>))}
        </div>}
        {stats.recent.length > 0 && <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
          <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Recent clicks</div>
          {stats.recent.map((c,i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i<stats.recent.length-1 ? `1px solid ${C.b1}` : "none" }}><div><div style={{ fontSize: 13, color: C.t1, fontWeight: 500 }}>{c.title}</div><div style={{ fontSize: 11, color: C.t3 }}>{c.partner} {"\u00B7"} {new Date(c.timestamp).toLocaleDateString()}</div></div><div style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>${c.estimatedCommission.toFixed(2)}</div></div>))}
        </div>}
      </div>
    </div>
  );
}

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
4. PREFER affiliate-friendly platforms when relevant: ClassPass, Eventbrite, Udemy, Skillshare, Mindbody, Meetup, Amazon, LinkedIn Learning, Airbnb, Kayak, Booking.com, VRBO.
5. Tag every step with a category: fitness, events, learning, career, wellness, social, products, travel.
6. After feedback, ADAPT. Be concise. 1-3 sentences.

OUTPUT FORMAT (after "---DATA---"):
Steps: [{"type":"step","title":"...","why":"...","link":"https://...","linkText":"...","category":"...","time":"..."}]
Plans: [{"type":"plan","title":"...","date":"...","tasks":[{"title":"...","links":[{"label":"...","url":"https://..."}]}]}]
Preferences: [{"type":"preference","key":"...","value":"..."}]
Delete: [{"type":"delete_step","title":"..."},{"type":"delete_plan","title":"..."}]
Only output ---DATA--- when you have SPECIFIC recommendations.`;

// ─── AUTH HELPERS ───
function loadGoogleScript() { return new Promise(r => { if (document.getElementById("gsi")) return r(); const s = document.createElement("script"); s.id = "gsi"; s.src = "https://accounts.google.com/gsi/client"; s.onload = r; document.head.appendChild(s); }); }
function decodeJwt(t) { try { return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))); } catch { return null; } }
function connectStrava() { const c = import.meta.env.VITE_STRAVA_CLIENT_ID; if (!c) return; window.location.href = `https://www.strava.com/oauth/authorize?client_id=${c}&response_type=code&redirect_uri=${window.location.origin}&scope=read,activity:read&approval_prompt=auto`; }
async function exchangeStravaCode(code) { try { const r = await fetch("https://www.strava.com/oauth/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:import.meta.env.VITE_STRAVA_CLIENT_ID,client_secret:import.meta.env.VITE_STRAVA_CLIENT_SECRET,code,grant_type:"authorization_code"})}); return await r.json(); } catch { return null; } }
async function fetchStravaProfile(token) { try { const [a,b] = await Promise.all([fetch("https://www.strava.com/api/v3/athlete",{headers:{Authorization:`Bearer ${token}`}}),fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10",{headers:{Authorization:`Bearer ${token}`}})]); const at = await a.json(); const ac = await b.json(); let st = null; if (at.id) { try { st = await (await fetch(`https://www.strava.com/api/v3/athletes/${at.id}/stats`,{headers:{Authorization:`Bearer ${token}`}})).json(); } catch {} } const rc = Array.isArray(ac) ? ac.slice(0,10).map(a=>({type:a.type,name:a.name,distance:(a.distance/1000).toFixed(1)+" km",duration:Math.round(a.moving_time/60)+" min",date:new Date(a.start_date_local).toLocaleDateString(),pace:a.type==="Run"?(a.moving_time/60/(a.distance/1000)).toFixed(1)+" min/km":null})) : []; return {name:`${at.firstname||""} ${at.lastname||""}`.trim(),city:at.city||"",recentActivities:rc,allTimeRuns:st?.all_run_totals?.count||0,allTimeRunDistance:st?.all_run_totals?.distance?(st.all_run_totals.distance/1000).toFixed(0)+" km":"0 km",allTimeRides:st?.all_ride_totals?.count||0,allTimeRideDistance:st?.all_ride_totals?.distance?(st.all_ride_totals.distance/1000).toFixed(0)+" km":"0 km",recentRunCount:st?.recent_run_totals?.count||0,recentRideCount:st?.recent_ride_totals?.count||0}; } catch { return null; } }

// ─── AUTH SCREEN ───
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("landing"); const [email, setEmail] = useState(""); const [name, setName] = useState(""); const gRef = useRef(null);
  useEffect(() => { const c = import.meta.env.VITE_GOOGLE_CLIENT_ID; if (!c||mode!=="landing") return; loadGoogleScript().then(()=>{ if (!window.google?.accounts?.id) return; window.google.accounts.id.initialize({client_id:c,callback:r=>{const u=decodeJwt(r.credential);if(u)onAuth({name:u.given_name||u.name||"User",email:u.email,method:"google"});}}); if(gRef.current) window.google.accounts.id.renderButton(gRef.current,{type:"standard",theme:"outline",size:"large",width:380,text:"continue_with",shape:"pill"}); }); },[mode]);

  const inputStyle = { ...F, width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 14, border: `1.5px solid ${C.b2}`, background: C.card, color: C.t1, outline: "none", boxSizing: "border-box" };

  if (mode === "email") return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <button onClick={() => setMode("landing")} style={{ ...F, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14, marginBottom: 28 }}>{"\u2190"} Back</button>
        <h2 style={{ ...S, fontSize: 32, color: C.t1, marginBottom: 8 }}>Create your account</h2>
        <p style={{ ...F, color: C.t2, fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>Start getting personalized recommendations.</p>
        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 8 }}>Your name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="First name" style={{ ...inputStyle, marginBottom: 16 }} />
        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 8 }}>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" type="email" style={{ ...inputStyle, marginBottom: 24 }} />
        <button onClick={()=>name.trim()&&email.includes("@")&&onAuth({name:name.trim(),email,method:"email"})} disabled={!name.trim()||!email.includes("@")} style={{ ...F, width: "100%", padding: "15px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: name.trim()&&email.includes("@") ? "pointer" : "default", background: name.trim()&&email.includes("@") ? C.accGrad : "rgba(0,0,0,0.04)", color: name.trim()&&email.includes("@") ? "#fff" : C.t3 }}>Create account {"\u2192"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, margin: "0 auto 20px", background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#fff", boxShadow: "0 6px 20px rgba(232,85,61,0.25)" }}>{"\u{1F463}"}</div>
        <h1 style={{ ...S, fontSize: 44, color: C.t1, lineHeight: 1.08, marginBottom: 12 }}>My Next Step</h1>
        <p style={{ ...F, fontSize: 16, color: C.t2, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 40px" }}>Your AI coach that turns goals into clear, actionable steps.</p>
        <div ref={gRef} style={{ display: "flex", justifyContent: "center", marginBottom: 12 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0" }}><div style={{ flex: 1, height: 1, background: C.b1 }} /><span style={{ ...F, fontSize: 12, color: C.t3 }}>or</span><div style={{ flex: 1, height: 1, background: C.b1 }} /></div>
        <button onClick={()=>setMode("email")} style={{ ...F, width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 500, background: C.card, color: C.t2, border: `1.5px solid ${C.b2}`, cursor: "pointer", boxShadow: C.shadow }}>Sign up with email</button>
      </div>
    </div>
  );
}

// ─── SOCIAL LINK ───
function SocialLinkScreen({ onContinue, stravaConnected, stravaProfile }) {
  const [linked, setLinked] = useState(stravaConnected ? ["strava"] : []);
  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}><h2 style={{ ...S, fontSize: 28, color: C.t1, marginBottom: 10 }}>Connect your accounts</h2><p style={{ color: C.t2, fontSize: 15, lineHeight: 1.5 }}>We read your data to personalize. Never post on your behalf.</p></div>
        {stravaConnected && stravaProfile && <div style={{ padding: 16, borderRadius: 16, background: C.card, boxShadow: C.shadow, marginBottom: 16, borderLeft: "4px solid #FC4C02" }}><div style={{ fontSize: 12, fontWeight: 600, color: "#FC4C02", marginBottom: 4 }}>Strava connected</div><div style={{ fontSize: 14, color: C.t1 }}>{stravaProfile.name} {"\u00B7"} {stravaProfile.allTimeRuns} runs, {stravaProfile.allTimeRides} rides</div></div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {SOCIALS.map(s => { const on = linked.includes(s.id); return (
            <button key={s.id} onClick={()=>{ if(s.id==="strava"&&!on){connectStrava();return;} if(s.real||on) setLinked(p=>on?p.filter(x=>x!==s.id):[...p,s.id]); }} style={{ ...F, padding: "15px 16px", borderRadius: 14, cursor: s.real ? "pointer" : "default", display: "flex", alignItems: "center", gap: 14, background: on ? C.card : C.card, border: `1.5px solid ${on ? s.color : C.b1}`, boxShadow: on ? C.shadowHover : C.shadow, opacity: s.real ? 1 : 0.5, textAlign: "left", transition: "all 0.2s" }}>
              <span style={{ fontSize: 22, width: 30, textAlign: "center" }}>{s.icon}</span>
              <span style={{ flex: 1, color: C.t1, fontSize: 15, fontWeight: 500 }}>{s.label}{s.real && !on && <span style={{ fontSize: 10, color: C.acc, marginLeft: 8, fontWeight: 700 }}>LIVE</span>}{!s.real && <span style={{ fontSize: 10, color: C.t3, marginLeft: 8 }}>Soon</span>}</span>
              {on && <span style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{"\u2713"}</span>}
            </button>
          ); })}
        </div>
        <button onClick={()=>onContinue(linked)} style={{ ...F, width: "100%", padding: "15px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", background: C.accGrad, color: "#fff", boxShadow: "0 4px 16px rgba(232,85,61,0.2)" }}>Continue {"\u2192"}</button>
        {linked.length === 0 && <button onClick={()=>onContinue([])} style={{ ...F, display: "block", margin: "12px auto 0", background: "none", border: "none", color: C.t3, fontSize: 13, cursor: "pointer" }}>Skip for now</button>}
      </div>
    </div>
  );
}

// ─── SETUP ───
function SetupScreen({ profile, onComplete }) {
  const [location, setLocation] = useState(""); const [goals, setGoals] = useState("");
  const [age, setAge] = useState(""); const [gender, setGender] = useState(""); const [genderOther, setGenderOther] = useState("");
  const inputStyle = { ...F, width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 14, border: `1.5px solid ${C.b2}`, background: C.card, color: C.t1, outline: "none", boxSizing: "border-box" };
  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const finalGender = gender === "Other" ? genderOther : gender;

  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h2 style={{ ...S, fontSize: 28, color: C.t1, marginBottom: 8 }}>A bit about you, {profile.name}</h2>
        <p style={{ color: C.t2, fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>This helps your coach give you relevant recommendations.</p>

        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 8 }}>Age</label>
        <input value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 28" type="number" style={{ ...inputStyle, marginBottom: 18 }} />

        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 8 }}>Gender</label>
        <div style={{ display: "flex", gap: 8, marginBottom: gender === "Other" ? 10 : 18, flexWrap: "wrap" }}>
          {genderOptions.map(g => (
            <button key={g} onClick={()=>setGender(g)} style={{ ...F, padding: "10px 16px", borderRadius: 12, fontSize: 14, cursor: "pointer", background: gender === g ? C.accSoft : C.card, border: `1.5px solid ${gender === g ? C.acc : C.b2}`, color: gender === g ? C.acc : C.t2, fontWeight: gender === g ? 600 : 400, transition: "all 0.15s" }}>{g}</button>
          ))}
        </div>
        {gender === "Other" && <input value={genderOther} onChange={e=>setGenderOther(e.target.value)} placeholder="How do you identify?" style={{ ...inputStyle, marginBottom: 18 }} />}

        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 8 }}>Where are you based?</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, State" style={{ ...inputStyle, marginBottom: 18 }} />

        <label style={{ ...F, fontSize: 12, color: C.t3, display: "block", marginBottom: 8 }}>What are you focused on right now?</label>
        <textarea value={goals} onChange={e=>setGoals(e.target.value)} rows={3} placeholder="A trip, career goal, getting healthier..." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, marginBottom: 24 }} />

        <button onClick={()=>location.trim()&&goals.trim()&&onComplete({location:location.trim(),goals:goals.trim(),age:age.trim(),gender:finalGender})} disabled={!location.trim()||!goals.trim()} style={{ ...F, width: "100%", padding: "15px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: location.trim()&&goals.trim() ? "pointer" : "default", background: location.trim()&&goals.trim() ? C.accGrad : "rgba(0,0,0,0.04)", color: location.trim()&&goals.trim() ? "#fff" : C.t3, boxShadow: location.trim()&&goals.trim() ? "0 4px 16px rgba(232,85,61,0.2)" : "none" }}>Continue {"\u2192"}</button>
      </div>
    </div>
  );
}

// ─── DEEP PROFILE CHAT ───
function DeepProfileChat({ profile, onFinish, existingInsights }) {
  const [msgs, setMsgs] = useState([]); const [inp, setInp] = useState(""); const [busy, setBusy] = useState(false);
  const [insights, setInsights] = useState(existingInsights||[]); const [section, setSection] = useState(null);
  const endRef = useRef(null); const inpRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,busy]);
  const completed = PROFILE_SECTIONS.filter(s=>insights.some(i=>i.section===s.id));
  const startSection = sec => { setSection(sec); setMsgs([{role:"assistant",content:`Let's talk about ${sec.label.toLowerCase()}.\n\n${sec.questions[0]}`}]); setTimeout(()=>inpRef.current?.focus(),100); };
  const send = async () => {
    if (!inp.trim()||busy) return; const updated = [...msgs,{role:"user",content:inp.trim()}]; setMsgs(updated); setInp(""); setBusy(true);
    try { const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:`You're onboarding for "My Next Step". Be warm.\nUser: ${profile.name} | ${profile.setup?.location||""}\nSection: ${section.label}\nQuestions: ${section.questions.join(" | ")}\nONE question at a time. After 3-5 exchanges, "INSIGHTS:" then "- " bullets.`,messages:updated.map(m=>({role:m.role,content:m.content}))})}); const data = await res.json(); const text = data.content?.map(c=>c.text||"").filter(Boolean).join("\n")||"Tell me more?";
      if (text.includes("INSIGHTS:")) { const p = text.split("INSIGHTS:"); setInsights(prev=>[...prev.filter(i=>i.section!==section.id),...p[1].split("\n").filter(l=>l.trim().startsWith("- ")).map(l=>({section:section.id,text:l.trim().slice(2)}))]); setMsgs(prev=>[...prev,{role:"assistant",content:p[0].trim()}]); }
      else setMsgs(prev=>[...prev,{role:"assistant",content:text}]);
    } catch { setMsgs(prev=>[...prev,{role:"assistant",content:"Hiccup \u2014 say that again?"}]); } setBusy(false);
  };

  const bubbleStyle = (isUser) => ({ ...F, maxWidth: "82%", padding: "12px 16px", borderRadius: 18, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", ...(isUser ? { background: C.accGrad, color: "#fff", borderBottomRightRadius: 4 } : { background: C.card, color: C.t1, borderBottomLeftRadius: 4, boxShadow: C.shadow }) });

  if (!section) return (
    <div style={{ ...F, minHeight: "100vh", padding: 24, background: C.bg }}>
      <div style={{ maxWidth: 460, margin: "0 auto", paddingTop: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px", background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", boxShadow: "0 4px 16px rgba(232,85,61,0.2)" }}>{"\u{1F4AC}"}</div>
          <h2 style={{ ...S, fontSize: 28, color: C.t1, marginBottom: 8 }}>Let's get to know you</h2>
          <p style={{ color: C.t2, fontSize: 15, lineHeight: 1.5, maxWidth: 320, margin: "0 auto" }}>~2 min each. Makes your recommendations way better.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {PROFILE_SECTIONS.map(sec => { const done = insights.some(i=>i.section===sec.id); return (
            <div key={sec.id} onClick={()=>startSection(sec)} style={{ padding: "16px 18px", borderRadius: 16, cursor: "pointer", background: C.card, boxShadow: done ? "none" : C.shadow, border: done ? `1.5px solid ${C.teal}` : "1.5px solid transparent", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: done ? C.tealSoft : "rgba(0,0,0,0.03)" }}>{done ? "\u2713" : sec.icon}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>{sec.label}</div><div style={{ fontSize: 13, color: done ? C.teal : C.t3, marginTop: 2 }}>{done ? "Completed" : "~2 min"}</div></div>
              <span style={{ color: C.t3, fontSize: 16 }}>{"\u203A"}</span>
            </div>
          ); })}
        </div>
        <button onClick={()=>onFinish(insights)} style={{ ...F, width: "100%", padding: "15px", borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", background: C.accGrad, color: "#fff", boxShadow: "0 4px 16px rgba(232,85,61,0.2)" }}>{completed.length === 0 ? "Skip for now \u2192" : "Continue \u2192"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ ...F, display: "flex", flexDirection: "column", height: "100vh", maxWidth: 480, margin: "0 auto", background: C.bg }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.b1}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}><button onClick={()=>setSection(null)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 18, padding: 0 }}>{"\u2190"}</button><div style={{ ...F, fontSize: 15, fontWeight: 600, color: C.t1 }}>{section.label}</div></div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {msgs.map((m,i) => (<div key={i} style={{ display: "flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start", marginBottom: 10 }}>{m.role!=="user" && <div style={{ width: 26, height: 26, borderRadius: 9, background: C.accGrad, flexShrink: 0, marginRight: 10, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{"\u{1F463}"}</div>}<div style={bubbleStyle(m.role==="user")}>{m.content}</div></div>))}
        {busy && <div style={{ display: "flex", gap: 10, marginBottom: 10 }}><div style={{ width: 26, height: 26, borderRadius: 9, background: C.accGrad, flexShrink: 0 }} /><div style={{ padding: "12px 18px", borderRadius: 18, background: C.card, boxShadow: C.shadow, display: "flex", gap: 5 }}>{[0,1,2].map(i=><div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.t3, animation: `dpb 1.2s ease-in-out ${i*0.15}s infinite` }} />)}</div></div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 20px 20px", borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}><div style={{ display: "flex", gap: 10 }}><input ref={inpRef} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type your answer..." style={{ ...F, flex: 1, padding: "12px 16px", fontSize: 15, borderRadius: 14, border: `1.5px solid ${C.b2}`, background: C.card, color: C.t1, outline: "none", boxSizing: "border-box" }} /><button onClick={send} disabled={!inp.trim()||busy} style={{ width: 44, height: 44, borderRadius: 14, border: "none", flexShrink: 0, cursor: inp.trim()&&!busy ? "pointer" : "default", background: inp.trim()&&!busy ? C.accGrad : "rgba(0,0,0,0.04)", color: inp.trim()&&!busy ? "#fff" : C.t3, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2191"}</button></div></div>
      <style>{`@keyframes dpb { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-6px) } }`}</style>
    </div>
  );
}

// ─── SETTINGS PANEL ───
function SettingsPanel({ profile, stravaData, preferences, onUpdateProfile, onConnectStrava, onDisconnectStrava, onDeepProfile, onSignOut, onClose }) {
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [section, setSection] = useState("account");
  const [genderEdit, setGenderEdit] = useState(profile.setup?.gender || "");
  const [genderOther, setGenderOther] = useState("");

  const startEdit = (f, v) => { setEditMode(f); setEditValue(v || ""); };
  const saveEdit = () => {
    if (!editValue.trim() && editMode !== "gender") return;
    const p = { ...profile };
    if (editMode === "name") p.name = editValue.trim();
    else if (editMode === "age") p.setup = { ...p.setup, age: editValue.trim() };
    else if (editMode === "gender") p.setup = { ...p.setup, gender: genderEdit === "Other" ? genderOther : genderEdit };
    else if (editMode === "location") p.setup = { ...p.setup, location: editValue.trim() };
    else if (editMode === "goals") p.setup = { ...p.setup, goals: editValue.trim() };
    onUpdateProfile(p); setEditMode(null);
  };

  const fieldRow = (key, label, icon, value) => (
    <div style={{ padding: "16px 18px", borderRadius: 16, background: C.card, boxShadow: C.shadow, marginBottom: 10 }}>
      {editMode === key ? (
        <div>
          <label style={{ ...F, fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>{label}</label>
          {key === "goals" ? <textarea value={editValue} onChange={e=>setEditValue(e.target.value)} rows={3} style={{ ...F, width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.acc}`, background: C.bg, color: C.t1, outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
          : key === "gender" ? (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: genderEdit === "Other" ? 10 : 0 }}>
                {["Male","Female","Other","Prefer not to say"].map(g => <button key={g} onClick={()=>setGenderEdit(g)} style={{ ...F, padding: "8px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer", background: genderEdit===g ? C.accSoft : C.bg, border: `1.5px solid ${genderEdit===g ? C.acc : C.b2}`, color: genderEdit===g ? C.acc : C.t2 }}>{g}</button>)}
              </div>
              {genderEdit === "Other" && <input value={genderOther} onChange={e=>setGenderOther(e.target.value)} placeholder="How do you identify?" style={{ ...F, width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${C.acc}`, background: C.bg, color: C.t1, outline: "none", boxSizing: "border-box", marginTop: 8 }} />}
            </div>
          ) : <input value={editValue} onChange={e=>setEditValue(e.target.value)} style={{ ...F, width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.acc}`, background: C.bg, color: C.t1, outline: "none", boxSizing: "border-box" }} />}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={()=>setEditMode(null)} style={{ ...F, flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${C.b1}`, background: C.card, color: C.t2, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={saveEdit} style={{ ...F, flex: 1, padding: 10, borderRadius: 12, border: "none", background: C.accGrad, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, color: C.t1, lineHeight: 1.4 }}>{value || "Not set"}</div>
          </div>
          <button onClick={()=>{ if(key==="gender") { setGenderEdit(value||""); } startEdit(key,value); }} style={{ ...F, fontSize: 13, color: C.acc, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Edit</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ ...F, minHeight: "100vh", background: C.bg, padding: "20px 20px 40px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><h2 style={{ ...S, fontSize: 26, color: C.t1, margin: 0 }}>Settings</h2><button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 20 }}>{"\u00D7"}</button></div>

        {/* Profile card */}
        <div style={{ padding: 20, borderRadius: 18, background: C.card, boxShadow: C.shadow, marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{profile.name?.charAt(0)?.toUpperCase()||"?"}</div>
          <div><div style={{ fontSize: 17, fontWeight: 600, color: C.t1 }}>{profile.name}</div><div style={{ fontSize: 13, color: C.t3, marginTop: 2 }}>{profile.email}</div>{profile.method && <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>via {profile.method}</div>}</div>
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[{id:"account",l:"Profile"},{id:"connections",l:"Connected"},{id:"preferences",l:"AI insights"},{id:"about",l:"About"}].map(t => (
            <button key={t.id} onClick={()=>setSection(t.id)} style={{ ...F, flex: 1, padding: "10px 6px", background: section===t.id ? C.card : "transparent", border: section===t.id ? `1.5px solid ${C.b2}` : "1.5px solid transparent", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: section===t.id ? 600 : 400, color: section===t.id ? C.t1 : C.t3, boxShadow: section===t.id ? C.shadow : "none", transition: "all 0.15s" }}>{t.l}</button>
          ))}
        </div>

        {section === "account" && <div>
          {fieldRow("name","Name","\u{1F464}",profile.name)}
          {fieldRow("age","Age","\u{1F382}",profile.setup?.age)}
          {fieldRow("gender","Gender","\u2728",profile.setup?.gender)}
          {fieldRow("location","Location","\u{1F4CD}",profile.setup?.location)}
          {fieldRow("goals","Current focus","\u{1F3AF}",profile.setup?.goals)}
          <button onClick={onDeepProfile} style={{ ...F, width: "100%", padding: "16px 18px", borderRadius: 16, background: C.accSoft, border: `1px solid ${C.accBorder}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", marginTop: 6 }}>
            <span style={{ fontSize: 18 }}>{"\u{1F4AC}"}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.acc }}>Go deeper with coach</div><div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{profile.insights?.length||0} insights</div></div>
            <span style={{ color: C.acc }}>{"\u203A"}</span>
          </button>
          <button onClick={onSignOut} style={{ ...F, width: "100%", padding: "15px", borderRadius: 14, marginTop: 20, background: "rgba(220,60,60,0.04)", border: "1px solid rgba(220,60,60,0.1)", color: "#DC3C3C", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Sign out</button>
        </div>}

        {section === "connections" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22 }}>{"\u{1F3C3}"}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>Strava</div><div style={{ fontSize: 13, color: stravaData ? "#FC4C02" : C.t3 }}>{stravaData ? "Connected" : "Not connected"}</div></div>
              {stravaData ? <button onClick={onDisconnectStrava} style={{ ...F, fontSize: 12, padding: "8px 14px", borderRadius: 10, background: "rgba(220,60,60,0.04)", border: "1px solid rgba(220,60,60,0.1)", color: "#DC3C3C", cursor: "pointer" }}>Disconnect</button>
              : <button onClick={onConnectStrava} style={{ ...F, fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 10, background: C.accSoft, border: `1px solid ${C.accBorder}`, color: C.acc, cursor: "pointer" }}>Connect</button>}
            </div>
            {stravaData?.profile && <div style={{ padding: "10px 14px", borderRadius: 12, background: C.bg, fontSize: 13, color: C.t2, marginTop: 12, lineHeight: 1.5 }}>{stravaData.profile.name} {"\u00B7"} {stravaData.profile.allTimeRuns} runs ({stravaData.profile.allTimeRunDistance}) {"\u00B7"} {stravaData.profile.allTimeRides} rides ({stravaData.profile.allTimeRideDistance})</div>}
          </div>
          {SOCIALS.filter(s=>!s.real).map(s => (<div key={s.id} style={{ padding: "16px 18px", borderRadius: 16, background: C.card, boxShadow: C.shadow, display: "flex", alignItems: "center", gap: 14, opacity: 0.5 }}><span style={{ fontSize: 22, width: 30, textAlign: "center" }}>{s.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 500, color: C.t1 }}>{s.label}</div><div style={{ fontSize: 12, color: C.t3 }}>Coming soon</div></div></div>))}
        </div>}

        {section === "preferences" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {profile.insights?.length > 0 && <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}><div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Profile insights ({profile.insights.length})</div>{profile.insights.map((ins,i)=>(<div key={i} style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, padding: "8px 0", borderBottom: i<profile.insights.length-1?`1px solid ${C.b1}`:"none" }}>{"\u2022"} {ins.text}</div>))}</div>}
          {preferences.length > 0 && <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}><div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Learned preferences</div>{preferences.map((p,i)=>(<div key={i} style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, padding: "8px 0", borderBottom: i<preferences.length-1?`1px solid ${C.b1}`:"none" }}><span style={{ fontWeight: 600, color: C.t1, textTransform: "capitalize" }}>{p.key?.replace(/_/g," ")}:</span> {p.value}</div>))}</div>}
          {!profile.insights?.length && !preferences.length && <div style={{ textAlign: "center", padding: "48px 20px" }}><div style={{ fontSize: 32, marginBottom: 10 }}>{"\u{1F9E0}"}</div><div style={{ fontSize: 15, color: C.t2 }}>No insights yet</div><div style={{ fontSize: 13, color: C.t3, marginTop: 6, lineHeight: 1.5 }}>Chat with your coach to build insights.</div></div>}
        </div>}

        {section === "about" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: C.accGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff" }}>{"\u{1F463}"}</div><div><div style={{ fontSize: 16, fontWeight: 600, color: C.t1 }}>My Next Step</div><div style={{ fontSize: 12, color: C.t3 }}>v1.0 Beta</div></div></div>
            <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>Your AI coach that turns goals into clear, actionable steps.</div>
          </div>
          <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
            <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Legal</div>
            <div style={{ fontSize: 14, color: C.acc, cursor: "pointer", padding: "6px 0" }}>Terms of Service</div>
            <div style={{ fontSize: 14, color: C.acc, cursor: "pointer", padding: "6px 0" }}>Privacy Policy</div>
            <div style={{ fontSize: 14, color: C.acc, cursor: "pointer", padding: "6px 0" }}>Affiliate Disclosure</div>
            <div style={{ fontSize: 13, color: C.t3, marginTop: 8, lineHeight: 1.5, padding: "10px 14px", background: C.bg, borderRadius: 10 }}>Some links may earn us a small commission at no extra cost to you. This helps keep My Next Step free.</div>
          </div>
          <div style={{ padding: 18, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
            <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Support</div>
            <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>Questions? <span style={{ color: C.acc }}>hello@mynextstep.app</span></div>
          </div>
        </div>}
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

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);
  useEffect(()=>{ const p = new URLSearchParams(window.location.search); const code = p.get("code"); if (code && p.get("scope")?.includes("read")) { window.history.replaceState({},"",window.location.pathname); exchangeStravaCode(code).then(async d => { if (d?.access_token) { const pr = await fetchStravaProfile(d.access_token); const full = {...d,profile:pr}; setStravaData(full); window.storage.set("mns-strava",JSON.stringify(full)).catch(()=>{}); } }); } },[]);
  useEffect(()=>{ (async()=>{ try { const s = await window.storage.get("mns-v10"); if (s) { const d = JSON.parse(s.value); if (d.profile?.setup) { setProfile(d.profile); setSteps(d.steps||[]); setPlans(d.plans||[]); setMessages(d.messages||[]); setPreferences(d.preferences||[]); setScreen("main"); } } } catch {} try { const sv = await window.storage.get("mns-strava"); if (sv) setStravaData(JSON.parse(sv.value)); } catch {} })(); },[]);

  const persist = (p,s,pl,m,pr) => { window.storage.set("mns-v10",JSON.stringify({profile:p||profile,steps:s||steps,plans:pl||plans,messages:m||messages,preferences:pr||preferences})).catch(()=>{}); };

  const handleAuth = auth => { setProfile({name:auth.name,email:auth.email,method:auth.method}); setScreen("socials"); };
  const handleSocials = socials => { setProfile(p=>({...p,socials})); setScreen("setup"); };
  const handleSetup = setup => { setProfile(p=>({...p,setup})); setScreen("deepprofile"); };
  const handleDeepProfileFinish = insights => {
    const full = {...profile,insights}; setProfile(full);
    if (messages.length===0) { const w = [{role:"assistant",content:`Hey ${full.name}! I'm your Next Step coach.\n\nYou're in ${full.setup?.location} and interested in: "${full.setup?.goals}"\n\nBefore I suggest anything \u2014 what's the most important thing you'd like to focus on first?`}]; setMessages(w); setMode("chat"); persist(full,[],[],w,[]); }
    else persist(full,steps,plans,messages,preferences);
    setScreen("main"); setTimeout(()=>inputRef.current?.focus(),200);
  };
  const talkAbout = text => { setMode("chat"); setTimeout(()=>{ inputRef.current?.focus(); sendMessage(text); },100); };

  const sendMessage = async text => {
    const msg = text||input.trim(); if (!msg||loading) return;
    const userMsg = {role:"user",content:msg}; const updated = [...messages,userMsg]; setMessages(updated); setInput(""); setLoading(true);
    const prefText = preferences.length>0 ? "\n\nPREFERENCES:\n"+preferences.map(p=>`- ${p.key}: ${p.value}`).join("\n") : "";
    const sp = stravaData?.profile;
    const stravaText = sp ? `\n\nSTRAVA: ${sp.name}, ${sp.city} | ${sp.allTimeRuns} runs (${sp.allTimeRunDistance}), ${sp.allTimeRides} rides (${sp.allTimeRideDistance})` : "";
    const stepsCtx = steps.filter(s=>s.status==="active").length>0 ? "\n\nACTIVE STEPS: "+steps.filter(s=>s.status==="active").map(s=>`"${s.title}"`).join(", ") : "";
    const plansCtx = plans.length>0 ? "\n\nPLANS: "+plans.map(p=>`"${p.title}"`).join(", ") : "";
    const profileCtx = profile?.setup ? `\nAge: ${profile.setup.age||"unknown"} | Gender: ${profile.setup.gender||"unknown"}` : "";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,tools:[{type:"web_search_20250305",name:"web_search"}],
          system:SYSTEM_PROMPT+`\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}${profileCtx}\nGoals: ${profile?.setup?.goals||""}${prefText}${stravaText}${stepsCtx}${plansCtx}`,
          messages:updated.slice(-20).map(m=>({role:m.role,content:m.content})),
        }),
      });
      const data = await res.json(); const raw = data.content?.map(c=>c.text||"").filter(Boolean).join("\n")||"Tell me more?";
      let displayText = raw, newSteps = [...steps], newPlans = [...plans], newPrefs = [...preferences];
      if (raw.includes("---DATA---")) { const parts = raw.split("---DATA---"); displayText = parts[0].trim();
        try { for (const item of JSON.parse(parts[1].trim())) {
          if (item.type==="step") newSteps = [{...item,status:"active",id:Date.now()+Math.random()},...newSteps];
          else if (item.type==="plan") newPlans = [{...item,tasks:(item.tasks||[]).map(t=>({...t,done:false}))},...newPlans.filter(p=>p.title!==item.title)];
          else if (item.type==="preference") newPrefs = [...newPrefs.filter(p=>p.key!==item.key),item];
          else if (item.type==="delete_step") newSteps = newSteps.filter(s=>!s.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
          else if (item.type==="delete_plan") newPlans = newPlans.filter(p=>!p.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
        } setSteps(newSteps); setPlans(newPlans); setPreferences(newPrefs); } catch (e) { console.error("Parse:",e); }
      }
      const newMsgs = [...updated,{role:"assistant",content:displayText}]; setMessages(newMsgs);
      persist(profile,newSteps,newPlans,newMsgs,newPrefs);
      if (newSteps.length>steps.length) setTimeout(()=>setMode("steps"),600);
      else if (newPlans.length>plans.length) setTimeout(()=>setMode("plans"),600);
    } catch (err) { console.error(err); setMessages(prev=>[...prev,{role:"assistant",content:"Quick hiccup \u2014 say that again?"}]); }
    setLoading(false);
  };

  const deleteStep = id => { const u = steps.filter(s=>s.id!==id); setSteps(u); persist(profile,u,plans,messages,preferences); };
  const markStep = (id,status) => { if (status==="done") setFeedbackStep(steps.find(s=>s.id===id)); const u = steps.map(s=>s.id===id?{...s,status}:s); setSteps(u); persist(profile,u,plans,messages,preferences); };
  const submitFeedback = () => { if (!feedbackText.trim()||!feedbackStep) return; sendMessage(`Completed "${feedbackStep.title}": ${feedbackText.trim()}`); setFeedbackStep(null); setFeedbackText(""); setMode("chat"); };
  const deletePlan = idx => { const u = plans.filter((_,i)=>i!==idx); setPlans(u); setExpandedPlan(null); persist(profile,steps,u,messages,preferences); };
  const togglePlanTask = (pi,ti) => { const u = plans.map((p,i)=>i===pi?{...p,tasks:p.tasks.map((t,j)=>j===ti?{...t,done:!t.done}:t)}:p); setPlans(u); persist(profile,steps,u,messages,preferences); };
  const updateProfile = p => { setProfile(p); persist(p,steps,plans,messages,preferences); };
  const disconnectStrava = async () => { try { await window.storage.delete("mns-strava"); } catch {} setStravaData(null); };
  const resetAll = async () => { try { await window.storage.delete("mns-v10"); await window.storage.delete("mns-strava"); } catch {} setProfile(null); setMessages([]); setSteps([]); setPlans([]); setPreferences([]); setStravaData(null); setScreen("auth"); setShowSettings(false); };

  const activeSteps = steps.filter(s=>s.status==="active");
  const doneSteps = steps.filter(s=>s.status==="done");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (screen==="auth") return (<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><AuthScreen onAuth={handleAuth} /></div>);
  if (screen==="socials") return (<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SocialLinkScreen onContinue={handleSocials} stravaConnected={!!stravaData} stravaProfile={stravaData?.profile} /></div>);
  if (screen==="setup") return (<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup} /></div>);
  if (screen==="deepprofile") return (<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepProfileFinish} existingInsights={profile?.insights||[]} /></div>);
  if (showEarnings) return (<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><EarningsDashboard onClose={()=>setShowEarnings(false)} /></div>);
  if (showSettings) return (<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SettingsPanel profile={profile} stravaData={stravaData} preferences={preferences} onUpdateProfile={updateProfile} onConnectStrava={connectStrava} onDisconnectStrava={disconnectStrava} onDeepProfile={()=>{setShowSettings(false);setScreen("deepprofile");}} onSignOut={resetAll} onClose={()=>setShowSettings(false)} /></div>);

  const bubbleStyle = isUser => ({ ...F, maxWidth: "82%", padding: "12px 16px", borderRadius: 18, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", ...(isUser ? { background: C.accGrad, color: "#fff", borderBottomRightRadius: 4 } : { background: C.card, color: C.t1, borderBottomLeftRadius: 4, boxShadow: C.shadow }) });

  return (
    <div style={{ ...F, height: "100vh", color: C.t1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg }}>
      <style>{font}</style>

      {/* Feedback modal */}
      {feedbackStep && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: C.card, borderRadius: 22, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ fontSize: 12, color: C.acc, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>How did it go?</div>
            <div style={{ ...S, fontSize: 20, color: C.t1, marginBottom: 16 }}>{feedbackStep.title}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>{["Loved it!","It was okay","Not for me","Too expensive","Too far","More like this"].map(q=>(<button key={q} onClick={()=>setFeedbackText(q)} style={{ ...F, padding: "8px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer", background: feedbackText===q ? C.accSoft : C.bg, border: `1.5px solid ${feedbackText===q ? C.acc : C.b2}`, color: feedbackText===q ? C.acc : C.t2 }}>{q}</button>))}</div>
            <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} rows={2} placeholder="Or type..." style={{ ...F, width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.b2}`, background: C.bg, color: C.t1, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 10 }}><button onClick={()=>{setFeedbackStep(null);setFeedbackText("");}} style={{ ...F, flex: 1, padding: 12, borderRadius: 14, border: `1px solid ${C.b1}`, background: C.card, color: C.t2, fontSize: 14, cursor: "pointer" }}>Skip</button><button onClick={submitFeedback} disabled={!feedbackText.trim()} style={{ ...F, flex: 1, padding: 12, borderRadius: 14, border: "none", fontSize: 14, fontWeight: 600, cursor: feedbackText.trim()?"pointer":"default", background: feedbackText.trim()?C.accGrad:"rgba(0,0,0,0.04)", color: feedbackText.trim()?"#fff":C.t3 }}>Submit</button></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "16px 20px 12px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ ...F, fontSize: 13, color: C.t3 }}>{greeting},</div>
          <div style={{ ...S, fontSize: 22, color: C.t1 }}>{profile?.name}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={()=>setShowEarnings(true)} style={{ width: 36, height: 36, borderRadius: 12, background: C.card, border: `1px solid ${C.b1}`, boxShadow: C.shadow, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{"\u{1F4B0}"}</button>
          <button onClick={()=>setShowSettings(true)} style={{ width: 36, height: 36, borderRadius: 12, background: C.card, border: `1px solid ${C.b1}`, boxShadow: C.shadow, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{"\u2699\uFE0F"}</button>
        </div>
      </div>

      {/* Quick status */}
      {activeSteps.length > 0 && mode !== "chat" && (
        <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
          <div style={{ padding: "12px 16px", borderRadius: 14, background: C.accSoft, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 13, color: C.acc, fontWeight: 500, flex: 1 }}>{activeSteps.length} step{activeSteps.length!==1?"s":""} to do today</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.acc }}>{doneSteps.length} done</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", padding: "0 20px", gap: 6, flexShrink: 0, marginBottom: 4 }}>
        {[{id:"steps",label:"Steps",count:activeSteps.length},{id:"plans",label:"Plans",count:plans.length},{id:"chat",label:"Coach"}].map(t => (
          <button key={t.id} onClick={()=>{setMode(t.id);if(t.id==="chat")setTimeout(()=>inputRef.current?.focus(),100);}} style={{ ...F, flex: 1, padding: "11px 0", background: mode===t.id ? C.card : "transparent", border: mode===t.id ? `1.5px solid ${C.b2}` : "1.5px solid transparent", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: mode===t.id ? 600 : 400, color: mode===t.id ? C.t1 : C.t3, boxShadow: mode===t.id ? C.shadow : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
            {t.label}{t.count>0 && <span style={{ fontSize: 10, background: mode===t.id ? C.accSoft : C.bg, color: C.acc, padding: "2px 7px", borderRadius: 8, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* STEPS */}
        {mode === "steps" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 80px" }}>
            {activeSteps.length===0 && doneSteps.length===0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px", background: C.accSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{"\u{1F463}"}</div>
                <div style={{ ...S, fontSize: 20, color: C.t1, marginBottom: 8 }}>Ready for your first step?</div>
                <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px" }}>Chat with your coach and I'll create personalized, actionable steps just for you.</div>
                <button onClick={()=>{setMode("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{ ...F, padding: "13px 28px", borderRadius: 14, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", background: C.accGrad, color: "#fff", boxShadow: "0 4px 16px rgba(232,85,61,0.2)" }}>Talk to your coach {"\u2192"}</button>
              </div>
            ) : (<>
              {activeSteps.length>0 && <div style={{ marginBottom: 24 }}><div style={{ ...F, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 12 }}>To do ({activeSteps.length})</div>
                {activeSteps.map(step => (
                  <div key={step.id} style={{ padding: "18px 20px", borderRadius: 18, marginBottom: 10, background: C.card, boxShadow: C.shadow, position: "relative", transition: "box-shadow 0.2s" }}>
                    <button onClick={()=>deleteStep(step.id)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>{"\u00D7"}</button>
                    {step.category && <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{step.category}</div>}
                    <div style={{ ...F, fontSize: 16, fontWeight: 600, color: C.t1, lineHeight: 1.4, marginBottom: 4, paddingRight: 28 }}>{step.title}</div>
                    {step.time && <div style={{ fontSize: 13, color: C.t3, marginBottom: 6 }}>{step.time}</div>}
                    {step.why && <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.55, marginBottom: 14 }}>{step.why}</div>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {step.link && <TrackedLink href={step.link} actionId={step.id} category={step.category} title={step.title} style={{ ...F, fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: 12, background: C.accGrad, color: "#fff", textDecoration: "none", display: "inline-block", boxShadow: "0 2px 8px rgba(232,85,61,0.15)" }}>{step.linkText||"Do it"} {"\u2197"}</TrackedLink>}
                      <button onClick={()=>markStep(step.id,"done")} style={{ ...F, fontSize: 14, fontWeight: 500, padding: "10px 18px", borderRadius: 12, background: C.tealSoft, border: `1px solid ${C.tealBorder}`, color: C.teal, cursor: "pointer" }}>Done {"\u2713"}</button>
                      <button onClick={()=>talkAbout(`Let's talk about: "${step.title}"`)} style={{ ...F, fontSize: 13, padding: "10px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.b1}`, color: C.t3, cursor: "pointer" }}>Discuss</button>
                    </div>
                  </div>
                ))}</div>}
              {doneSteps.length>0 && <div><div style={{ ...F, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 12 }}>Done ({doneSteps.length})</div>{doneSteps.slice(0,5).map(s=>(<div key={s.id} style={{ padding: "12px 16px", borderRadius: 14, marginBottom: 6, background: C.tealSoft, border: `1px solid ${C.tealBorder}`, display: "flex", alignItems: "center", gap: 10, opacity: 0.6 }}><span style={{ color: C.teal, fontSize: 14 }}>{"\u2713"}</span><span style={{ fontSize: 14, textDecoration: "line-through", color: C.t2, flex: 1 }}>{s.title}</span><button onClick={()=>deleteStep(s.id)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14 }}>{"\u00D7"}</button></div>))}</div>}
            </>)}
          </div>
        )}

        {/* PLANS */}
        {mode === "plans" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 80px" }}>
            {plans.length===0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px", background: C.accSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{"\u{1F4CB}"}</div>
                <div style={{ ...S, fontSize: 20, color: C.t1, marginBottom: 8 }}>Plan something amazing</div>
                <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px" }}>Tell your coach about a trip, project, or big goal and I'll break it into steps.</div>
                <button onClick={()=>{setMode("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{ ...F, padding: "13px 28px", borderRadius: 14, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", background: C.accGrad, color: "#fff", boxShadow: "0 4px 16px rgba(232,85,61,0.2)" }}>Talk to your coach {"\u2192"}</button>
              </div>
            ) : (<><div style={{ ...F, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3, marginBottom: 12 }}>Your plans ({plans.length})</div>
              {plans.map((plan,pi) => { const open = expandedPlan===pi, done = plan.tasks?.filter(t=>t.done).length||0, total = plan.tasks?.length||0; return (<div key={pi} style={{ marginBottom: 12 }}>
                <div style={{ padding: "18px 20px", borderRadius: open ? "18px 18px 0 0" : 18, cursor: "pointer", background: C.card, boxShadow: C.shadow, position: "relative" }}>
                  <button onClick={e=>{e.stopPropagation();deletePlan(pi);}} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>{"\u00D7"}</button>
                  <div onClick={()=>setExpandedPlan(open?null:pi)}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: C.t1, paddingRight: 28 }}>{plan.title}</div>
                    {plan.date && <div style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>{plan.date}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}><div style={{ flex: 1, height: 4, background: C.accSoft, borderRadius: 2 }}><div style={{ height: "100%", width: total?(done/total*100)+"%":"0%", background: C.accGrad, borderRadius: 2 }} /></div><span style={{ fontSize: 12, fontWeight: 600, color: C.acc }}>{done}/{total}</span></div>
                  </div>
                  <button onClick={()=>talkAbout(`Let's discuss: "${plan.title}"`)} style={{ ...F, fontSize: 12, padding: "6px 12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.b1}`, color: C.t3, cursor: "pointer", marginTop: 10 }}>Discuss this plan</button>
                </div>
                {open && <div style={{ padding: "8px 20px 18px", background: C.card, boxShadow: C.shadow, borderRadius: "0 0 18px 18px", borderTop: `1px solid ${C.b1}` }}>
                  {plan.tasks?.map((task,ti) => (<div key={ti} style={{ padding: "12px 0", borderBottom: ti<plan.tasks.length-1?`1px solid ${C.b1}`:"none" }}><div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <button onClick={()=>togglePlanTask(pi,ti)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, cursor: "pointer", background: task.done?C.teal:"transparent", border: `2px solid ${task.done?C.teal:C.b2}`, display: "flex", alignItems: "center", justifyContent: "center", color: task.done?"#fff":"transparent", fontSize: 12 }}>{task.done?"\u2713":""}</button>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 500, color: C.t1, textDecoration: task.done?"line-through":"none", opacity: task.done?0.5:1 }}>{task.title}</div>
                      {task.links?.length>0 && !task.done && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{task.links.map((l,li) => <TrackedLink key={li} href={l.url} actionId={`plan-${pi}-${ti}-${li}`} category="travel" title={task.title} style={{ ...F, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, background: C.accSoft, color: C.acc, textDecoration: "none", display: "inline-block", border: `1px solid ${C.accBorder}` }}>{l.label} {"\u2197"}</TrackedLink>)}</div>}
                    </div></div></div>))}
                </div>}
              </div>); })}</>)}
          </div>
        )}

        {/* CHAT */}
        {mode === "chat" && (<>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
            {messages.map((msg,i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role==="user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                {msg.role!=="user" && <div style={{ width: 28, height: 28, borderRadius: 10, background: C.accGrad, flexShrink: 0, marginRight: 10, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{"\u{1F463}"}</div>}
                <div style={bubbleStyle(msg.role==="user")}>{msg.content}</div>
              </div>
            ))}
            {loading && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><div style={{ width: 28, height: 28, borderRadius: 10, background: C.accGrad, flexShrink: 0 }} /><div style={{ padding: "12px 18px", borderRadius: 18, background: C.card, boxShadow: C.shadow, display: "flex", gap: 5 }}>{[0,1,2].map(i=><div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.t3, animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />)}</div></div>}
            <div ref={chatEnd} />
          </div>
          <div style={{ padding: "10px 20px 20px", flexShrink: 0 }}><div style={{ display: "flex", gap: 10 }}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder="What do you want to do?" style={{ ...F, flex: 1, padding: "13px 16px", fontSize: 15, borderRadius: 14, border: `1.5px solid ${C.b2}`, background: C.card, color: C.t1, outline: "none", boxSizing: "border-box", boxShadow: C.shadow }} />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{ width: 46, height: 46, borderRadius: 14, border: "none", flexShrink: 0, cursor: input.trim()&&!loading?"pointer":"default", background: input.trim()&&!loading?C.accGrad:"rgba(0,0,0,0.04)", color: input.trim()&&!loading?"#fff":C.t3, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: input.trim()&&!loading?"0 2px 8px rgba(232,85,61,0.2)":"none" }}>{"\u2191"}</button>
          </div></div>
        </>)}
      </div>

      <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-6px) } }`}</style>
    </div>
  );
}

