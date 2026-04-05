import { useState, useEffect, useRef, useCallback } from "react";

const font = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap');`;
const H = { fontFamily: "'Fraunces', serif" };
const F = { fontFamily: "'DM Sans', sans-serif" };

// ─── WARM LUXURY PALETTE ───
const C = {
  bg: "#FAF6F1", card: "#FFFFFF", warm: "#FFF5EE", cream: "#F5EDE4",
  b1: "rgba(28,25,23,0.06)", b2: "rgba(28,25,23,0.1)",
  t1: "#1C1917", t2: "#6B6560", t3: "#A39E99",
  acc: "#D4522A", acc2: "#E8764E", accSoft: "#FDE8E0", accBorder: "rgba(212,82,42,0.12)",
  accGrad: "linear-gradient(135deg, #D4522A 0%, #E8764E 100%)",
  teal: "#0F766E", tealSoft: "#E6F7F5", tealBorder: "rgba(15,118,110,0.1)",
  gold: "#B45309", goldSoft: "#FEF3C7",
  shadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)",
  shadowLg: "0 4px 12px rgba(0,0,0,0.05), 0 16px 40px rgba(0,0,0,0.06)",
  // Category colors
  cat: { fitness: "#D4522A", wellness: "#0F766E", career: "#6D28D9", learning: "#2563EB", social: "#DB2777", events: "#D97706", travel: "#0284C7", products: "#78716C" },
};

// ─── CATEGORY HELPERS ───
const catColor = c => C.cat[c] || C.acc;
const catSoft = c => { const colors = { fitness: "#FDE8E0", wellness: "#E6F7F5", career: "#EDE9FE", learning: "#DBEAFE", social: "#FCE7F3", events: "#FEF3C7", travel: "#E0F2FE", products: "#F5F5F4" }; return colors[c] || C.accSoft; };
const catIcon = c => { const icons = { fitness: "\u{1F3CB}", wellness: "\u{1F9D8}", career: "\u{1F4BC}", learning: "\u{1F4DA}", social: "\u{1F91D}", events: "\u{1F389}", travel: "\u2708\uFE0F", products: "\u{1F6CD}\uFE0F" }; return icons[c] || "\u2728"; };

// ─── TIME GREETING ───
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

// ─── ANIMATED WRAPPER ───
function FadeIn({ children, delay = 0, style: sx }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, []);
  return <div style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", ...sx }}>{children}</div>;
}

// ─── PROGRESS RING ───
function ProgressRing({ progress, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2; const circ = 2 * Math.PI * r; const offset = circ - progress * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.cream} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.acc} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

// ─── SUGGESTION CHIPS ───
function SuggestionChips({ onSelect }) {
  const chips = ["Find me a class", "Plan a trip", "What should I do today?", "Help me with a goal"];
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 0 8px", scrollbarWidth: "none" }}>
      {chips.map(c => (
        <button key={c} onClick={() => onSelect(c)} style={{ ...F, padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, background: C.card, border: `1.5px solid ${C.b2}`, color: C.t2, cursor: "pointer", whiteSpace: "nowrap", boxShadow: C.shadow, transition: "all 0.15s" }}>{c}</button>
      ))}
    </div>
  );
}

// ─── AFFILIATE SYSTEM (compact) ───
const AFFILIATE_PARTNERS = { "classpass.com":{tag:"mnstep-20",commission:2.5,name:"ClassPass"}, "eventbrite.com":{tag:"mnstep",commission:1.5,name:"Eventbrite"}, "udemy.com":{tag:"mnstep",commission:1.8,name:"Udemy"}, "skillshare.com":{tag:"mnstep",commission:2,name:"Skillshare"}, "mindbody.io":{tag:"mnstep-20",commission:2,name:"Mindbody"}, "meetup.com":{tag:"mnstep",commission:.75,name:"Meetup"}, "amazon.com":{tag:"mnstep-20",commission:.5,name:"Amazon"}, "linkedin.com/learning":{tag:"mnstep",commission:2.2,name:"LinkedIn Learning"}, "airbnb.com":{tag:"mnstep",commission:3,name:"Airbnb"}, "kayak.com":{tag:"mnstep",commission:.8,name:"Kayak"}, "booking.com":{tag:"aid=mnstep",commission:2.5,name:"Booking.com"}, "vrbo.com":{tag:"mnstep",commission:2,name:"VRBO"} };
function wrapAffiliateLink(url,id){if(!url)return url;try{const u=new URL(url);u.searchParams.set("utm_source","mynextstep");u.searchParams.set("utm_medium","app");u.searchParams.set("utm_campaign",`action_${id||"u"}`);const h=u.hostname.replace("www.","");for(const[d,p]of Object.entries(AFFILIATE_PARTNERS)){if(h.includes(d.split("/")[0])){u.searchParams.set("ref",p.tag);break;}}return u.toString();}catch{return url;}}
function trackClick(id,url,cat,title){try{const c=JSON.parse(localStorage.getItem("mns_clicks")||"[]");const p=((u)=>{try{const h=new URL(u).hostname.replace("www.","");for(const[d,p]of Object.entries(AFFILIATE_PARTNERS))if(h.includes(d.split("/")[0]))return p;}catch{}return{commission:.1,name:"Other"};})(url);c.push({id:id||Date.now().toString(),url,category:cat||"other",title:title||"",timestamp:new Date().toISOString(),estimatedCommission:p.commission,partner:p.name});localStorage.setItem("mns_clicks",JSON.stringify(c));}catch{}}
function getClickStats(){try{const c=JSON.parse(localStorage.getItem("mns_clicks")||"[]");const n=new Date();const f=(a,d)=>a.filter(x=>x.timestamp>=d);const s=a=>a.reduce((t,x)=>t+(x.estimatedCommission||0),0);const ts=new Date(n.getFullYear(),n.getMonth(),n.getDate()).toISOString();const ws=new Date(n-7*864e5).toISOString();const ms=new Date(n.getFullYear(),n.getMonth(),1).toISOString();const cats={};c.forEach(x=>{cats[x.category||"other"]=(cats[x.category||"other"]||0)+(x.estimatedCommission||0);});return{today:{clicks:f(c,ts).length,commission:s(f(c,ts))},week:{clicks:f(c,ws).length,commission:s(f(c,ws))},month:{clicks:f(c,ms).length,commission:s(f(c,ms))},lifetime:{clicks:c.length,commission:s(c)},categories:cats,recent:c.slice(-10).reverse()};}catch{return{today:{clicks:0,commission:0},week:{clicks:0,commission:0},month:{clicks:0,commission:0},lifetime:{clicks:0,commission:0},categories:{},recent:[]};}}
function TrackedLink({href,actionId,category,title,children,style:sx}){return<a href={wrapAffiliateLink(href,actionId)} target="_blank" rel="noopener noreferrer" onClick={()=>trackClick(actionId,href,category,title)} style={sx}>{children}</a>;}

// ─── STREAK HELPER ───
function getStreak(steps) {
  const done = steps.filter(s => s.status === "done").length;
  const total = steps.length;
  return { done, total, active: steps.filter(s => s.status === "active").length };
}

// ─── EARNINGS DASHBOARD ───
function EarningsDashboard({onClose}){
  const stats=getClickStats();const mx=Math.max(...Object.values(stats.categories),1);
  return(<div style={{...F,minHeight:"100vh",padding:"20px 20px 40px",background:C.bg}}><div style={{maxWidth:480,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}><h2 style={{...H,fontSize:28,color:C.t1,margin:0}}>Earnings</h2><button onClick={onClose} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:C.t3}}>{"\u00D7"}</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
      {[{l:"Today",d:stats.today},{l:"This week",d:stats.week},{l:"This month",d:stats.month},{l:"Lifetime",d:stats.lifetime}].map((p,i)=>(<FadeIn key={p.l} delay={i*80}><div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>{p.l}</div><div style={{...H,fontSize:26,fontWeight:600,color:C.t1}}>${p.d.commission.toFixed(2)}</div><div style={{...F,fontSize:12,color:C.t3,marginTop:4}}>{p.d.clicks} click{p.d.clicks!==1?"s":""}</div></div></FadeIn>))}
    </div>
    {Object.keys(stats.categories).length>0&&<FadeIn delay={320}><div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow,marginBottom:16}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>By category</div>{Object.entries(stats.categories).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>(<div key={cat} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{...F,fontSize:13,fontWeight:500,color:C.t1,textTransform:"capitalize"}}>{cat}</span><span style={{...F,fontSize:13,color:C.acc,fontWeight:600}}>${val.toFixed(2)}</span></div><div style={{height:4,background:C.cream,borderRadius:2}}><div style={{height:"100%",width:`${(val/mx)*100}%`,background:C.accGrad,borderRadius:2,transition:"width 0.6s ease"}}/></div></div>))}</div></FadeIn>}
    {stats.recent.length>0&&<FadeIn delay={400}><div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Recent</div>{stats.recent.map((c,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<stats.recent.length-1?`1px solid ${C.b1}`:"none"}}><div><div style={{...F,fontSize:13,color:C.t1,fontWeight:500}}>{c.title}</div><div style={{...F,fontSize:11,color:C.t3}}>{c.partner}</div></div><div style={{...F,fontSize:13,fontWeight:600,color:C.teal}}>${c.estimatedCommission.toFixed(2)}</div></div>))}</div></FadeIn>}
  </div></div>);
}

const SOCIALS=[{id:"linkedin",label:"LinkedIn",icon:"in",color:"#0A66C2",real:false},{id:"instagram",label:"Instagram",icon:"\u{1F4F7}",color:"#E4405F",real:false},{id:"spotify",label:"Spotify",icon:"\u{1F3B5}",color:"#1DB954",real:false},{id:"strava",label:"Strava",icon:"\u{1F3C3}",color:"#FC4C02",real:true},{id:"calendar",label:"Google Calendar",icon:"\u{1F4C5}",color:"#4285F4",real:false}];
const PROFILE_SECTIONS=[{id:"basics",label:"The basics",icon:"\u{1F464}",questions:["What's your current job or role?","What does your typical day look like?","What's your living situation?"]},{id:"personality",label:"Your personality",icon:"\u{1F31F}",questions:["Are you more introverted or extroverted?","What motivates you most?","How do you handle stress?"]},{id:"lifestyle",label:"Lifestyle & habits",icon:"\u{1F3E0}",questions:["What does a typical weekend look like?","Do you exercise regularly?","Do you cook or eat out?"]},{id:"dreams",label:"Dreams & goals",icon:"\u2728",questions:["Where do you see yourself in 5 years?","What have you always wanted to try?","What's holding you back?"]},{id:"challenges",label:"Current challenges",icon:"\u{1F525}",questions:["What's your biggest challenge right now?","What area of life feels most stuck?"]}];

const SYSTEM_PROMPT=`You are the AI engine behind "My Next Step" \u2014 a warm, personal AI life coach.

CRITICAL RULES:
1. DO NOT generate steps or plans until you deeply understand what the person wants. Ask 2-3 clarifying questions first.
2. When conversation shifts, output DELETE actions to remove irrelevant steps/plans.
3. EVERY recommendation must have PRE-FILLED links with search parameters.
4. PREFER affiliate-friendly platforms: ClassPass, Eventbrite, Udemy, Skillshare, Mindbody, Meetup, Amazon, LinkedIn Learning, Airbnb, Kayak, Booking.com, VRBO.
5. Tag every step with a category: fitness, wellness, career, learning, social, events, travel, products.
6. After feedback, ADAPT. Be concise. 1-3 sentences. Be warm and encouraging.

OUTPUT FORMAT (after "---DATA---"):
[{"type":"step","title":"...","why":"...","link":"https://...","linkText":"...","category":"fitness","time":"..."}]
[{"type":"plan","title":"...","date":"...","tasks":[{"title":"...","links":[{"label":"...","url":"https://..."}]}]}]
[{"type":"preference","key":"...","value":"..."}]
[{"type":"delete_step","title":"..."},{"type":"delete_plan","title":"..."}]
Only output ---DATA--- when you have SPECIFIC recommendations.`;

// ─── AUTH HELPERS ───
function loadGoogleScript(){return new Promise(r=>{if(document.getElementById("gsi"))return r();const s=document.createElement("script");s.id="gsi";s.src="https://accounts.google.com/gsi/client";s.onload=r;document.head.appendChild(s);});}
function decodeJwt(t){try{return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));}catch{return null;}}
function connectStrava(){const c=import.meta.env.VITE_STRAVA_CLIENT_ID;if(!c)return;window.location.href=`https://www.strava.com/oauth/authorize?client_id=${c}&response_type=code&redirect_uri=${window.location.origin}&scope=read,activity:read&approval_prompt=auto`;}
async function exchangeStravaCode(code){try{return await(await fetch("https://www.strava.com/oauth/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:import.meta.env.VITE_STRAVA_CLIENT_ID,client_secret:import.meta.env.VITE_STRAVA_CLIENT_SECRET,code,grant_type:"authorization_code"})})).json();}catch{return null;}}
async function fetchStravaProfile(token){try{const[a,b]=await Promise.all([fetch("https://www.strava.com/api/v3/athlete",{headers:{Authorization:`Bearer ${token}`}}),fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10",{headers:{Authorization:`Bearer ${token}`}})]);const at=await a.json();const ac=await b.json();let st=null;if(at.id){try{st=await(await fetch(`https://www.strava.com/api/v3/athletes/${at.id}/stats`,{headers:{Authorization:`Bearer ${token}`}})).json();}catch{}}const rc=Array.isArray(ac)?ac.slice(0,10).map(a=>({type:a.type,name:a.name,distance:(a.distance/1000).toFixed(1)+" km",duration:Math.round(a.moving_time/60)+" min",date:new Date(a.start_date_local).toLocaleDateString(),pace:a.type==="Run"?(a.moving_time/60/(a.distance/1000)).toFixed(1)+" min/km":null})):[];return{name:`${at.firstname||""} ${at.lastname||""}`.trim(),city:at.city||"",recentActivities:rc,allTimeRuns:st?.all_run_totals?.count||0,allTimeRunDistance:st?.all_run_totals?.distance?(st.all_run_totals.distance/1000).toFixed(0)+" km":"0 km",allTimeRides:st?.all_ride_totals?.count||0,allTimeRideDistance:st?.all_ride_totals?.distance?(st.all_ride_totals.distance/1000).toFixed(0)+" km":"0 km",recentRunCount:st?.recent_run_totals?.count||0,recentRideCount:st?.recent_ride_totals?.count||0};}catch{return null;}}

// ─── AUTH SCREEN ───
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("landing");const[email,setEmail]=useState("");const[name,setName]=useState("");const gRef=useRef(null);
  useEffect(()=>{const c=import.meta.env.VITE_GOOGLE_CLIENT_ID;if(!c||mode!=="landing")return;loadGoogleScript().then(()=>{if(!window.google?.accounts?.id)return;window.google.accounts.id.initialize({client_id:c,callback:r=>{const u=decodeJwt(r.credential);if(u)onAuth({name:u.given_name||u.name||"User",email:u.email,method:"google"});}});if(gRef.current)window.google.accounts.id.renderButton(gRef.current,{type:"standard",theme:"outline",size:"large",width:380,text:"continue_with",shape:"pill"});});},[mode]);
  const inp={...F,width:"100%",padding:"15px 18px",fontSize:15,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.02)"};
  if(mode==="email")return(
    <div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}>
      <FadeIn><div style={{width:"100%",maxWidth:400}}>
        <button onClick={()=>setMode("landing")} style={{...F,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14,marginBottom:28}}>{"\u2190"} Back</button>
        <h2 style={{...H,fontSize:32,color:C.t1,marginBottom:10}}>Create your account</h2>
        <p style={{...F,color:C.t2,fontSize:15,marginBottom:36,lineHeight:1.6}}>Start your journey to better recommendations.</p>
        <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8,fontWeight:500}}>Your name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="First name" style={{...inp,marginBottom:18}} />
        <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8,fontWeight:500}}>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" type="email" style={{...inp,marginBottom:28}} />
        <button onClick={()=>name.trim()&&email.includes("@")&&onAuth({name:name.trim(),email,method:"email"})} disabled={!name.trim()||!email.includes("@")} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:name.trim()&&email.includes("@")?"pointer":"default",background:name.trim()&&email.includes("@")?C.accGrad:"rgba(0,0,0,0.04)",color:name.trim()&&email.includes("@")?"#fff":C.t3,boxShadow:name.trim()&&email.includes("@")?"0 4px 20px rgba(212,82,42,0.25)":"none",transition:"all 0.2s"}}>Create account {"\u2192"}</button>
      </div></FadeIn>
    </div>
  );
  return(
    <div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}>
      <FadeIn><div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <div style={{width:68,height:68,borderRadius:20,margin:"0 auto 24px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,color:"#fff",boxShadow:"0 8px 28px rgba(212,82,42,0.3)"}}>{"\u{1F463}"}</div>
        <h1 style={{...H,fontSize:46,color:C.t1,lineHeight:1.05,marginBottom:14}}>My Next Step</h1>
        <p style={{...F,fontSize:17,color:C.t2,lineHeight:1.6,maxWidth:310,margin:"0 auto 44px"}}>Your AI coach that turns goals into clear, actionable steps.</p>
        <div ref={gRef} style={{display:"flex",justifyContent:"center",marginBottom:14}} />
        <div style={{display:"flex",alignItems:"center",gap:16,margin:"22px 0"}}><div style={{flex:1,height:1,background:C.b1}} /><span style={{...F,fontSize:12,color:C.t3}}>or</span><div style={{flex:1,height:1,background:C.b1}} /></div>
        <button onClick={()=>setMode("email")} style={{...F,width:"100%",padding:"15px",borderRadius:16,fontSize:15,fontWeight:500,background:C.card,color:C.t2,border:`1.5px solid ${C.b2}`,cursor:"pointer",boxShadow:C.shadow,transition:"all 0.15s"}}>Sign up with email</button>
      </div></FadeIn>
    </div>
  );
}

// ─── SOCIAL LINK ───
function SocialLinkScreen({onContinue,stravaConnected,stravaProfile}){
  const[linked,setLinked]=useState(stravaConnected?["strava"]:[]);
  return(
    <div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}>
      <FadeIn><div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:36}}><h2 style={{...H,fontSize:30,color:C.t1,marginBottom:10}}>Connect your world</h2><p style={{color:C.t2,fontSize:15,lineHeight:1.6}}>We read your data to personalize. Never post on your behalf.</p></div>
        {stravaConnected&&stravaProfile&&<div style={{padding:18,borderRadius:18,background:C.card,boxShadow:C.shadow,marginBottom:18,borderLeft:`4px solid #FC4C02`}}><div style={{...F,fontSize:12,fontWeight:600,color:"#FC4C02",marginBottom:4}}>Strava connected</div><div style={{fontSize:14,color:C.t1}}>{stravaProfile.name} {"\u00B7"} {stravaProfile.allTimeRuns} runs, {stravaProfile.allTimeRides} rides</div></div>}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
          {SOCIALS.map((s,i)=>{const on=linked.includes(s.id);return(<FadeIn key={s.id} delay={i*60}><button onClick={()=>{if(s.id==="strava"&&!on){connectStrava();return;}if(s.real||on)setLinked(p=>on?p.filter(x=>x!==s.id):[...p,s.id]);}} style={{...F,width:"100%",padding:"16px 18px",borderRadius:16,cursor:s.real?"pointer":"default",display:"flex",alignItems:"center",gap:14,background:C.card,border:`1.5px solid ${on?s.color:C.b1}`,boxShadow:on?C.shadowLg:C.shadow,opacity:s.real?1:.45,textAlign:"left",transition:"all 0.2s"}}><span style={{fontSize:24,width:32,textAlign:"center"}}>{s.icon}</span><span style={{flex:1,color:C.t1,fontSize:15,fontWeight:500}}>{s.label}{s.real&&!on&&<span style={{fontSize:10,color:C.acc,marginLeft:8,fontWeight:700}}>LIVE</span>}{!s.real&&<span style={{fontSize:10,color:C.t3,marginLeft:8}}>Soon</span>}</span>{on&&<span style={{color:s.color,fontWeight:700,fontSize:18}}>{"\u2713"}</span>}</button></FadeIn>);})}
        </div>
        <button onClick={()=>onContinue(linked)} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 20px rgba(212,82,42,0.25)"}}>Continue {"\u2192"}</button>
        {linked.length===0&&<button onClick={()=>onContinue([])} style={{...F,display:"block",margin:"14px auto 0",background:"none",border:"none",color:C.t3,fontSize:14,cursor:"pointer"}}>Skip for now</button>}
      </div></FadeIn>
    </div>
  );
}

// ─── SETUP ───
function SetupScreen({profile,onComplete}){
  const[location,setLocation]=useState("");const[goals,setGoals]=useState("");const[age,setAge]=useState("");const[gender,setGender]=useState("");const[genderOther,setGenderOther]=useState("");
  const inp={...F,width:"100%",padding:"15px 18px",fontSize:15,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.02)"};
  const ok=location.trim()&&goals.trim();
  return(
    <div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}>
      <FadeIn><div style={{width:"100%",maxWidth:420}}>
        <h2 style={{...H,fontSize:30,color:C.t1,marginBottom:8}}>A bit about you</h2>
        <p style={{color:C.t2,fontSize:15,marginBottom:36,lineHeight:1.6}}>Helps your coach give relevant recommendations, {profile.name}.</p>
        <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8,fontWeight:500}}>Age</label>
        <input value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 28" type="number" style={{...inp,marginBottom:20}} />
        <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:10,fontWeight:500}}>Gender</label>
        <div style={{display:"flex",gap:8,marginBottom:gender==="Other"?12:20,flexWrap:"wrap"}}>
          {["Male","Female","Other","Prefer not to say"].map(g=>(<button key={g} onClick={()=>setGender(g)} style={{...F,padding:"10px 18px",borderRadius:14,fontSize:14,cursor:"pointer",background:gender===g?C.accSoft:C.card,border:`1.5px solid ${gender===g?C.acc:C.b2}`,color:gender===g?C.acc:C.t2,fontWeight:gender===g?600:400,boxShadow:gender===g?`0 2px 8px rgba(212,82,42,0.1)`:C.shadow,transition:"all 0.15s"}}>{g}</button>))}
        </div>
        {gender==="Other"&&<input value={genderOther} onChange={e=>setGenderOther(e.target.value)} placeholder="How do you identify?" style={{...inp,marginBottom:20}} />}
        <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8,fontWeight:500}}>Where are you based?</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, State" style={{...inp,marginBottom:20}} />
        <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8,fontWeight:500}}>What are you focused on?</label>
        <textarea value={goals} onChange={e=>setGoals(e.target.value)} rows={3} placeholder="A trip, career goal, getting healthier..." style={{...inp,resize:"vertical",lineHeight:1.6,marginBottom:28}} />
        <button onClick={()=>ok&&onComplete({location:location.trim(),goals:goals.trim(),age:age.trim(),gender:gender==="Other"?genderOther:gender})} disabled={!ok} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:ok?"pointer":"default",background:ok?C.accGrad:"rgba(0,0,0,0.04)",color:ok?"#fff":C.t3,boxShadow:ok?"0 4px 20px rgba(212,82,42,0.25)":"none",transition:"all 0.2s"}}>Continue {"\u2192"}</button>
      </div></FadeIn>
    </div>
  );
}

// ─── DEEP PROFILE CHAT ───
function DeepProfileChat({profile,onFinish,existingInsights}){
  const[msgs,setMsgs]=useState([]);const[inp,setInp]=useState("");const[busy,setBusy]=useState(false);
  const[insights,setInsights]=useState(existingInsights||[]);const[section,setSection]=useState(null);
  const endRef=useRef(null);const inpRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,busy]);
  const completed=PROFILE_SECTIONS.filter(s=>insights.some(i=>i.section===s.id));
  const startSection=sec=>{setSection(sec);setMsgs([{role:"assistant",content:`Let's talk about ${sec.label.toLowerCase()}.\n\n${sec.questions[0]}`}]);setTimeout(()=>inpRef.current?.focus(),100);};
  const send=async()=>{
    if(!inp.trim()||busy)return;const updated=[...msgs,{role:"user",content:inp.trim()}];setMsgs(updated);setInp("");setBusy(true);
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:`Onboarding for "My Next Step". Be warm.\nUser: ${profile.name} | ${profile.setup?.location||""}\nSection: ${section.label}\nQuestions: ${section.questions.join(" | ")}\nONE question. After 3-5 exchanges: "INSIGHTS:" then "- " bullets.`,messages:updated.map(m=>({role:m.role,content:m.content}))})});const data=await res.json();const text=data.content?.map(c=>c.text||"").filter(Boolean).join("\n")||"Tell me more?";
      if(text.includes("INSIGHTS:")){const p=text.split("INSIGHTS:");setInsights(prev=>[...prev.filter(i=>i.section!==section.id),...p[1].split("\n").filter(l=>l.trim().startsWith("- ")).map(l=>({section:section.id,text:l.trim().slice(2)}))]);setMsgs(prev=>[...prev,{role:"assistant",content:p[0].trim()}]);}
      else setMsgs(prev=>[...prev,{role:"assistant",content:text}]);
    }catch{setMsgs(prev=>[...prev,{role:"assistant",content:"Hiccup \u2014 say that again?"}]);}setBusy(false);
  };
  const bubble=u=>({...F,maxWidth:"82%",padding:"13px 18px",borderRadius:20,fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",...(u?{background:C.accGrad,color:"#fff",borderBottomRightRadius:6}:{background:C.card,color:C.t1,borderBottomLeftRadius:6,boxShadow:C.shadow})});

  if(!section)return(
    <div style={{...F,minHeight:"100vh",padding:24,background:C.bg}}>
      <FadeIn><div style={{maxWidth:460,margin:"0 auto",paddingTop:32}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:56,height:56,borderRadius:18,margin:"0 auto 16px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",boxShadow:"0 6px 20px rgba(212,82,42,0.25)"}}>{"\u{1F4AC}"}</div>
          <h2 style={{...H,fontSize:28,color:C.t1,marginBottom:8}}>Let's get to know you</h2>
          <p style={{color:C.t2,fontSize:15,lineHeight:1.6,maxWidth:320,margin:"0 auto"}}>~2 min each. Makes your steps way more personal.</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {PROFILE_SECTIONS.map((sec,i)=>{const done=insights.some(x=>x.section===sec.id);return(
            <FadeIn key={sec.id} delay={i*60}><div onClick={()=>startSection(sec)} style={{padding:"18px 20px",borderRadius:18,cursor:"pointer",background:C.card,boxShadow:C.shadow,border:done?`1.5px solid ${C.teal}`:"1.5px solid transparent",display:"flex",alignItems:"center",gap:14,transition:"all 0.2s"}}>
              <div style={{width:42,height:42,borderRadius:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:done?C.tealSoft:C.cream}}>{done?"\u2713":sec.icon}</div>
              <div style={{flex:1}}><div style={{...F,fontSize:15,fontWeight:600,color:C.t1}}>{sec.label}</div><div style={{...F,fontSize:13,color:done?C.teal:C.t3,marginTop:3}}>{done?"Completed":"~2 min"}</div></div>
              <span style={{color:C.t3,fontSize:18}}>{"\u203A"}</span>
            </div></FadeIn>
          );})}
        </div>
        <button onClick={()=>onFinish(insights)} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 20px rgba(212,82,42,0.25)"}}>{completed.length===0?"Skip for now \u2192":"Continue \u2192"}</button>
      </div></FadeIn>
    </div>
  );
  return(
    <div style={{...F,display:"flex",flexDirection:"column",height:"100vh",maxWidth:480,margin:"0 auto",background:C.bg}}>
      <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}><button onClick={()=>setSection(null)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:18,padding:0}}>{"\u2190"}</button><div style={{...F,fontSize:16,fontWeight:600,color:C.t1}}>{section.label}</div></div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>
        {msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}}>{m.role!=="user"&&<div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0,marginRight:10,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>{"\u{1F463}"}</div>}<div style={bubble(m.role==="user")}>{m.content}</div></div>))}
        {busy&&<div style={{display:"flex",gap:10,marginBottom:12}}><div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0}} /><div style={{padding:"13px 20px",borderRadius:20,background:C.card,boxShadow:C.shadow,display:"flex",gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.t3,animation:`dpb 1.2s ease-in-out ${i*.15}s infinite`}} />)}</div></div>}
        <div ref={endRef} />
      </div>
      <div style={{padding:"12px 20px 22px",flexShrink:0}}><div style={{display:"flex",gap:10}}><input ref={inpRef} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type your answer..." style={{...F,flex:1,padding:"13px 18px",fontSize:15,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow}} /><button onClick={send} disabled={!inp.trim()||busy} style={{width:46,height:46,borderRadius:16,border:"none",flexShrink:0,cursor:inp.trim()&&!busy?"pointer":"default",background:inp.trim()&&!busy?C.accGrad:"rgba(0,0,0,0.04)",color:inp.trim()&&!busy?"#fff":C.t3,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:inp.trim()&&!busy?"0 2px 10px rgba(212,82,42,0.2)":"none"}}>{"\u2191"}</button></div></div>
      <style>{`@keyframes dpb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

// ─── SETTINGS ───
function SettingsPanel({profile,stravaData,preferences,onUpdateProfile,onConnectStrava,onDisconnectStrava,onDeepProfile,onSignOut,onClose}){
  const[editMode,setEditMode]=useState(null);const[editValue,setEditValue]=useState("");const[section,setSection]=useState("account");const[genderEdit,setGenderEdit]=useState(profile.setup?.gender||"");const[genderOther,setGenderOther]=useState("");
  const save=()=>{const p={...profile};if(editMode==="name")p.name=editValue.trim();else if(editMode==="age")p.setup={...p.setup,age:editValue.trim()};else if(editMode==="gender")p.setup={...p.setup,gender:genderEdit==="Other"?genderOther:genderEdit};else if(editMode==="location")p.setup={...p.setup,location:editValue.trim()};else if(editMode==="goals")p.setup={...p.setup,goals:editValue.trim()};onUpdateProfile(p);setEditMode(null);};
  const field=(key,label,icon,value)=>(<div style={{padding:"18px 20px",borderRadius:18,background:C.card,boxShadow:C.shadow,marginBottom:10}}>
    {editMode===key?(<div><label style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:8}}>{label}</label>
      {key==="goals"?<textarea value={editValue} onChange={e=>setEditValue(e.target.value)} rows={3} style={{...F,width:"100%",padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",resize:"vertical",lineHeight:1.5,boxSizing:"border-box"}} />
      :key==="gender"?<div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Male","Female","Other","Prefer not to say"].map(g=><button key={g} onClick={()=>setGenderEdit(g)} style={{...F,padding:"8px 14px",borderRadius:12,fontSize:13,cursor:"pointer",background:genderEdit===g?C.accSoft:C.card,border:`1.5px solid ${genderEdit===g?C.acc:C.b2}`,color:genderEdit===g?C.acc:C.t2}}>{g}</button>)}</div>{genderEdit==="Other"&&<input value={genderOther} onChange={e=>setGenderOther(e.target.value)} placeholder="How do you identify?" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box",marginTop:8}} />}</div>
      :<input value={editValue} onChange={e=>setEditValue(e.target.value)} style={{...F,width:"100%",padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}} />}
      <div style={{display:"flex",gap:8,marginTop:12}}><button onClick={()=>setEditMode(null)} style={{...F,flex:1,padding:10,borderRadius:14,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button><button onClick={save} style={{...F,flex:1,padding:10,borderRadius:14,border:"none",background:C.accGrad,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>
    </div>):(<div style={{display:"flex",alignItems:"flex-start",gap:14}}>
      <span style={{fontSize:18,marginTop:2}}>{icon}</span>
      <div style={{flex:1}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{label}</div><div style={{...F,fontSize:15,color:C.t1,lineHeight:1.4}}>{value||"Not set"}</div></div>
      <button onClick={()=>{if(key==="gender")setGenderEdit(value||"");setEditMode(key);setEditValue(value||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button>
    </div>)}
  </div>);
  return(
    <div style={{...F,minHeight:"100vh",background:C.bg,padding:"20px 20px 40px"}}><div style={{maxWidth:480,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}><h2 style={{...H,fontSize:28,color:C.t1,margin:0}}>Settings</h2><button onClick={onClose} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:C.t3}}>{"\u00D7"}</button></div>
      <div style={{padding:22,borderRadius:20,background:C.card,boxShadow:C.shadow,marginBottom:28,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:56,height:56,borderRadius:18,background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontWeight:700,flexShrink:0}}>{profile.name?.charAt(0)?.toUpperCase()||"?"}</div>
        <div><div style={{...H,fontSize:18,color:C.t1}}>{profile.name}</div><div style={{...F,fontSize:13,color:C.t3,marginTop:2}}>{profile.email}</div></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:24}}>{[{id:"account",l:"Profile"},{id:"connections",l:"Connected"},{id:"preferences",l:"AI insights"},{id:"about",l:"About"}].map(t=>(<button key={t.id} onClick={()=>setSection(t.id)} style={{...F,flex:1,padding:"10px 6px",background:section===t.id?C.card:"transparent",border:section===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",fontSize:12,fontWeight:section===t.id?600:400,color:section===t.id?C.t1:C.t3,boxShadow:section===t.id?C.shadow:"none",transition:"all 0.15s"}}>{t.l}</button>))}</div>

      {section==="account"&&<div>{field("name","Name","\u{1F464}",profile.name)}{field("age","Age","\u{1F382}",profile.setup?.age)}{field("gender","Gender","\u2728",profile.setup?.gender)}{field("location","Location","\u{1F4CD}",profile.setup?.location)}{field("goals","Current focus","\u{1F3AF}",profile.setup?.goals)}
        <button onClick={onDeepProfile} style={{...F,width:"100%",padding:"18px 20px",borderRadius:18,background:C.accSoft,border:`1px solid ${C.accBorder}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",marginTop:8}}><span style={{fontSize:20}}>{"\u{1F4AC}"}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.acc}}>Go deeper with coach</div><div style={{fontSize:12,color:C.t3,marginTop:2}}>{profile.insights?.length||0} insights</div></div><span style={{color:C.acc,fontSize:16}}>{"\u203A"}</span></button>
        <button onClick={onSignOut} style={{...F,width:"100%",padding:"15px",borderRadius:16,marginTop:20,background:"rgba(220,60,60,0.04)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",fontSize:14,fontWeight:500,cursor:"pointer"}}>Sign out</button>
      </div>}
      {section==="connections"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:24}}>{"\u{1F3C3}"}</span><div style={{flex:1}}><div style={{...F,fontSize:15,fontWeight:600,color:C.t1}}>Strava</div><div style={{...F,fontSize:13,color:stravaData?"#FC4C02":C.t3}}>{stravaData?"Connected":"Not connected"}</div></div>{stravaData?<button onClick={onDisconnectStrava} style={{...F,fontSize:12,padding:"8px 16px",borderRadius:12,background:"rgba(220,60,60,0.04)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",cursor:"pointer"}}>Disconnect</button>:<button onClick={onConnectStrava} style={{...F,fontSize:12,fontWeight:600,padding:"8px 16px",borderRadius:12,background:C.accSoft,border:`1px solid ${C.accBorder}`,color:C.acc,cursor:"pointer"}}>Connect</button>}</div>
          {stravaData?.profile&&<div style={{padding:"12px 16px",borderRadius:14,background:C.bg,fontSize:13,color:C.t2,marginTop:12,lineHeight:1.5}}>{stravaData.profile.name} {"\u00B7"} {stravaData.profile.allTimeRuns} runs {"\u00B7"} {stravaData.profile.allTimeRides} rides</div>}
        </div>
        {SOCIALS.filter(s=>!s.real).map(s=>(<div key={s.id} style={{padding:"18px 20px",borderRadius:18,background:C.card,boxShadow:C.shadow,display:"flex",alignItems:"center",gap:14,opacity:.45}}><span style={{fontSize:24,width:32,textAlign:"center"}}>{s.icon}</span><div><div style={{...F,fontSize:15,fontWeight:500,color:C.t1}}>{s.label}</div><div style={{...F,fontSize:12,color:C.t3}}>Coming soon</div></div></div>))}
      </div>}
      {section==="preferences"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
        {profile.insights?.length>0&&<div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Profile insights</div>{profile.insights.map((ins,i)=>(<div key={i} style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,padding:"8px 0",borderBottom:i<profile.insights.length-1?`1px solid ${C.b1}`:"none"}}>{"\u2022"} {ins.text}</div>))}</div>}
        {preferences.length>0&&<div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Learned preferences</div>{preferences.map((p,i)=>(<div key={i} style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,padding:"8px 0",borderBottom:i<preferences.length-1?`1px solid ${C.b1}`:"none"}}><span style={{fontWeight:600,color:C.t1,textTransform:"capitalize"}}>{p.key?.replace(/_/g," ")}:</span> {p.value}</div>))}</div>}
        {!profile.insights?.length&&!preferences.length&&<div style={{textAlign:"center",padding:"48px 20px"}}><div style={{fontSize:32,marginBottom:10}}>{"\u{1F9E0}"}</div><div style={{...F,fontSize:15,color:C.t2}}>No insights yet</div></div>}
      </div>}
      {section==="about"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}><div style={{width:42,height:42,borderRadius:14,background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff"}}>{"\u{1F463}"}</div><div><div style={{...H,fontSize:18,color:C.t1}}>My Next Step</div><div style={{...F,fontSize:12,color:C.t3}}>v1.0 Beta</div></div></div><div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6}}>Your AI coach that turns goals into actionable steps.</div></div>
        <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Legal</div><div style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"6px 0"}}>Terms of Service</div><div style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"6px 0"}}>Privacy Policy</div><div style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"6px 0"}}>Affiliate Disclosure</div><div style={{...F,fontSize:13,color:C.t3,marginTop:8,lineHeight:1.5,padding:"12px 16px",background:C.cream,borderRadius:12}}>Some links may earn us a small commission at no extra cost to you. This helps keep My Next Step free.</div></div>
      </div>}
    </div></div>
  );
}

// ─── MAIN APP ───
export default function App(){
  const[screen,setScreen]=useState("auth");
  const[profile,setProfile]=useState(null);
  const[mode,setMode]=useState("steps");
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[steps,setSteps]=useState([]);
  const[plans,setPlans]=useState([]);
  const[preferences,setPreferences]=useState([]);
  const[expandedPlan,setExpandedPlan]=useState(null);
  const[feedbackStep,setFeedbackStep]=useState(null);
  const[feedbackText,setFeedbackText]=useState("");
  const[stravaData,setStravaData]=useState(null);
  const[showEarnings,setShowEarnings]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const chatEnd=useRef(null);const inputRef=useRef(null);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const code=p.get("code");if(code&&p.get("scope")?.includes("read")){window.history.replaceState({},"",window.location.pathname);exchangeStravaCode(code).then(async d=>{if(d?.access_token){const pr=await fetchStravaProfile(d.access_token);const full={...d,profile:pr};setStravaData(full);window.storage.set("mns-strava",JSON.stringify(full)).catch(()=>{});}});}},[]);
  useEffect(()=>{(async()=>{try{const s=await window.storage.get("mns-v11");if(s){const d=JSON.parse(s.value);if(d.profile?.setup){setProfile(d.profile);setSteps(d.steps||[]);setPlans(d.plans||[]);setMessages(d.messages||[]);setPreferences(d.preferences||[]);setScreen("main");}}}catch{}try{const sv=await window.storage.get("mns-strava");if(sv)setStravaData(JSON.parse(sv.value));}catch{}})();},[]);

  const persist=(p,s,pl,m,pr)=>{window.storage.set("mns-v11",JSON.stringify({profile:p||profile,steps:s||steps,plans:pl||plans,messages:m||messages,preferences:pr||preferences})).catch(()=>{});};

  const handleAuth=auth=>{setProfile({name:auth.name,email:auth.email,method:auth.method});setScreen("socials");};
  const handleSocials=socials=>{setProfile(p=>({...p,socials}));setScreen("setup");};
  const handleSetup=setup=>{setProfile(p=>({...p,setup}));setScreen("deepprofile");};
  const handleDeepProfileFinish=insights=>{
    const full={...profile,insights};setProfile(full);
    if(messages.length===0){const w=[{role:"assistant",content:`Hey ${full.name}! I'm your Next Step coach. ${"\u{1F463}"}\n\nYou're in ${full.setup?.location} and interested in: "${full.setup?.goals}"\n\nBefore I suggest anything \u2014 what's the most important thing you'd like to focus on first?`}];setMessages(w);setMode("chat");persist(full,[],[],w,[]);}
    else persist(full,steps,plans,messages,preferences);
    setScreen("main");setTimeout(()=>inputRef.current?.focus(),200);
  };
  const talkAbout=text=>{setMode("chat");setTimeout(()=>{inputRef.current?.focus();sendMessage(text);},100);};

  const sendMessage=async text=>{
    const msg=text||input.trim();if(!msg||loading)return;
    const userMsg={role:"user",content:msg};const updated=[...messages,userMsg];setMessages(updated);setInput("");setLoading(true);
    const prefText=preferences.length>0?"\n\nPREFERENCES:\n"+preferences.map(p=>`- ${p.key}: ${p.value}`).join("\n"):"";
    const sp=stravaData?.profile;const stravaText=sp?`\n\nSTRAVA: ${sp.name} | ${sp.allTimeRuns} runs (${sp.allTimeRunDistance}), ${sp.allTimeRides} rides (${sp.allTimeRideDistance})`:"";
    const stepsCtx=steps.filter(s=>s.status==="active").length>0?"\n\nACTIVE STEPS: "+steps.filter(s=>s.status==="active").map(s=>`"${s.title}"`).join(", "):"";
    const plansCtx=plans.length>0?"\n\nPLANS: "+plans.map(p=>`"${p.title}"`).join(", "):"";
    const profileCtx=profile?.setup?`\nAge: ${profile.setup.age||"?"} | Gender: ${profile.setup.gender||"?"}`:"";
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,tools:[{type:"web_search_20250305",name:"web_search"}],
          system:SYSTEM_PROMPT+`\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}${profileCtx}\nGoals: ${profile?.setup?.goals||""}${prefText}${stravaText}${stepsCtx}${plansCtx}`,
          messages:updated.slice(-20).map(m=>({role:m.role,content:m.content})),
        }),
      });
      const data=await res.json();const raw=data.content?.map(c=>c.text||"").filter(Boolean).join("\n")||"Tell me more?";
      let displayText=raw,newSteps=[...steps],newPlans=[...plans],newPrefs=[...preferences];
      if(raw.includes("---DATA---")){const parts=raw.split("---DATA---");displayText=parts[0].trim();
        try{for(const item of JSON.parse(parts[1].trim())){
          if(item.type==="step")newSteps=[{...item,status:"active",id:Date.now()+Math.random()},...newSteps];
          else if(item.type==="plan")newPlans=[{...item,tasks:(item.tasks||[]).map(t=>({...t,done:false}))},...newPlans.filter(p=>p.title!==item.title)];
          else if(item.type==="preference")newPrefs=[...newPrefs.filter(p=>p.key!==item.key),item];
          else if(item.type==="delete_step")newSteps=newSteps.filter(s=>!s.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
          else if(item.type==="delete_plan")newPlans=newPlans.filter(p=>!p.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
        }setSteps(newSteps);setPlans(newPlans);setPreferences(newPrefs);}catch(e){console.error("Parse:",e);}
      }
      const newMsgs=[...updated,{role:"assistant",content:displayText}];setMessages(newMsgs);
      persist(profile,newSteps,newPlans,newMsgs,newPrefs);
      if(newSteps.length>steps.length)setTimeout(()=>setMode("steps"),600);
      else if(newPlans.length>plans.length)setTimeout(()=>setMode("plans"),600);
    }catch(err){console.error(err);setMessages(prev=>[...prev,{role:"assistant",content:"Quick hiccup \u2014 say that again?"}]);}
    setLoading(false);
  };

  const deleteStep=id=>{const u=steps.filter(s=>s.id!==id);setSteps(u);persist(profile,u,plans,messages,preferences);};
  const markStep=(id,status)=>{if(status==="done")setFeedbackStep(steps.find(s=>s.id===id));const u=steps.map(s=>s.id===id?{...s,status}:s);setSteps(u);persist(profile,u,plans,messages,preferences);};
  const submitFeedback=()=>{if(!feedbackText.trim()||!feedbackStep)return;sendMessage(`Completed "${feedbackStep.title}": ${feedbackText.trim()}`);setFeedbackStep(null);setFeedbackText("");setMode("chat");};
  const deletePlan=idx=>{const u=plans.filter((_,i)=>i!==idx);setPlans(u);setExpandedPlan(null);persist(profile,steps,u,messages,preferences);};
  const togglePlanTask=(pi,ti)=>{const u=plans.map((p,i)=>i===pi?{...p,tasks:p.tasks.map((t,j)=>j===ti?{...t,done:!t.done}:t)}:p);setPlans(u);persist(profile,steps,u,messages,preferences);};
  const updateProfile=p=>{setProfile(p);persist(p,steps,plans,messages,preferences);};
  const disconnectStrava=async()=>{try{await window.storage.delete("mns-strava");}catch{}setStravaData(null);};
  const resetAll=async()=>{try{await window.storage.delete("mns-v11");await window.storage.delete("mns-strava");}catch{}setProfile(null);setMessages([]);setSteps([]);setPlans([]);setPreferences([]);setStravaData(null);setScreen("auth");setShowSettings(false);};

  const activeSteps=steps.filter(s=>s.status==="active");
  const doneSteps=steps.filter(s=>s.status==="done");
  const streak=getStreak(steps);

  if(screen==="auth")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><AuthScreen onAuth={handleAuth}/></div>);
  if(screen==="socials")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SocialLinkScreen onContinue={handleSocials} stravaConnected={!!stravaData} stravaProfile={stravaData?.profile}/></div>);
  if(screen==="setup")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup}/></div>);
  if(screen==="deepprofile")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepProfileFinish} existingInsights={profile?.insights||[]}/></div>);
  if(showEarnings)return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><EarningsDashboard onClose={()=>setShowEarnings(false)}/></div>);
  if(showSettings)return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SettingsPanel profile={profile} stravaData={stravaData} preferences={preferences} onUpdateProfile={updateProfile} onConnectStrava={connectStrava} onDisconnectStrava={disconnectStrava} onDeepProfile={()=>{setShowSettings(false);setScreen("deepprofile");}} onSignOut={resetAll} onClose={()=>setShowSettings(false)}/></div>);

  const bubble=u=>({...F,maxWidth:"82%",padding:"13px 18px",borderRadius:20,fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",...(u?{background:C.accGrad,color:"#fff",borderBottomRightRadius:6}:{background:C.card,color:C.t1,borderBottomLeftRadius:6,boxShadow:C.shadow})});

  return(
    <div style={{...F,height:"100vh",color:C.t1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
      <style>{font}{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.step-enter{animation:fadeUp 0.3s ease forwards;}`}</style>

      {/* Feedback modal */}
      {feedbackStep&&(
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{width:"100%",maxWidth:420,background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
            <div style={{...F,fontSize:12,color:C.acc,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>How did it go?</div>
            <div style={{...H,fontSize:22,color:C.t1,marginBottom:18}}>{feedbackStep.title}</div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{["Loved it!","It was okay","Not for me","Too expensive","Too far","More like this"].map(q=>(<button key={q} onClick={()=>setFeedbackText(q)} style={{...F,padding:"9px 16px",borderRadius:12,fontSize:13,cursor:"pointer",background:feedbackText===q?C.accSoft:C.cream,border:`1.5px solid ${feedbackText===q?C.acc:C.b2}`,color:feedbackText===q?C.acc:C.t2,fontWeight:feedbackText===q?600:400,transition:"all 0.15s"}}>{q}</button>))}</div>
            <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} rows={2} placeholder="Or type your thoughts..." style={{...F,width:"100%",padding:"13px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.b2}`,background:C.bg,color:C.t1,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:16}} />
            <div style={{display:"flex",gap:10}}><button onClick={()=>{setFeedbackStep(null);setFeedbackText("");}} style={{...F,flex:1,padding:13,borderRadius:16,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:15,cursor:"pointer"}}>Skip</button><button onClick={submitFeedback} disabled={!feedbackText.trim()} style={{...F,flex:1,padding:13,borderRadius:16,border:"none",fontSize:15,fontWeight:600,cursor:feedbackText.trim()?"pointer":"default",background:feedbackText.trim()?C.accGrad:"rgba(0,0,0,0.04)",color:feedbackText.trim()?"#fff":C.t3,boxShadow:feedbackText.trim()?"0 2px 10px rgba(212,82,42,0.2)":"none"}}>Submit</button></div>
          </div>
        </div>
      )}

      {/* Header with greeting + streak */}
      <div style={{padding:"18px 22px 14px",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{...F,fontSize:13,color:C.t3,marginBottom:2}}>{getGreeting()},</div>
          <div style={{...H,fontSize:24,color:C.t1}}>{profile?.name}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {streak.done>0&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:12,background:C.goldSoft}}>
            <ProgressRing progress={streak.total>0?streak.done/streak.total:0} size={24} stroke={3} />
            <span style={{...F,fontSize:12,fontWeight:600,color:C.gold}}>{streak.done} done</span>
          </div>}
          <button onClick={()=>setShowEarnings(true)} style={{width:38,height:38,borderRadius:14,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{"\u{1F4B0}"}</button>
          <button onClick={()=>setShowSettings(true)} style={{width:38,height:38,borderRadius:14,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{"\u2699\uFE0F"}</button>
        </div>
      </div>

      {/* Status card */}
      {activeSteps.length>0&&mode!=="chat"&&(
        <div style={{padding:"0 22px 10px",flexShrink:0}}>
          <div style={{padding:"14px 18px",borderRadius:16,background:C.accSoft,border:`1px solid ${C.accBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{...F,fontSize:14,color:C.acc,fontWeight:500}}>{activeSteps.length} step{activeSteps.length!==1?"s":""} ready for you</div>
            <div style={{...F,fontSize:12,fontWeight:600,color:C.acc,background:C.card,padding:"4px 10px",borderRadius:8}}>{doneSteps.length} done</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",padding:"0 22px",gap:6,flexShrink:0,marginBottom:6}}>
        {[{id:"steps",label:"Steps",count:activeSteps.length},{id:"plans",label:"Plans",count:plans.length},{id:"chat",label:"Coach"}].map(t=>(
          <button key={t.id} onClick={()=>{setMode(t.id);if(t.id==="chat")setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,flex:1,padding:"12px 0",background:mode===t.id?C.card:"transparent",border:mode===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",fontSize:14,fontWeight:mode===t.id?600:400,color:mode===t.id?C.t1:C.t3,boxShadow:mode===t.id?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.2s"}}>
            {t.label}{t.count>0&&<span style={{fontSize:10,background:mode===t.id?C.accSoft:C.cream,color:C.acc,padding:"3px 8px",borderRadius:10,fontWeight:700}}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* STEPS */}
        {mode==="steps"&&(
          <div style={{flex:1,overflowY:"auto",padding:"10px 22px 80px"}}>
            {activeSteps.length===0&&doneSteps.length===0?(
              <FadeIn><div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{width:72,height:72,borderRadius:22,margin:"0 auto 18px",background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{"\u{1F463}"}</div>
                <div style={{...H,fontSize:22,color:C.t1,marginBottom:10}}>Ready for your first step?</div>
                <div style={{...F,fontSize:15,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto 24px"}}>Chat with your coach and I'll create personalized steps just for you.</div>
                <button onClick={()=>{setMode("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,padding:"14px 32px",borderRadius:16,border:"none",fontSize:16,fontWeight:600,cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 20px rgba(212,82,42,0.25)"}}>Talk to your coach {"\u2192"}</button>
              </div></FadeIn>
            ):(<>
              {activeSteps.length>0&&<div style={{marginBottom:28}}><div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:14}}>To do ({activeSteps.length})</div>
                {activeSteps.map((step,si)=>(
                  <FadeIn key={step.id} delay={si*60}><div style={{padding:"20px 22px",borderRadius:20,marginBottom:12,background:C.card,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${catColor(step.category)}`,transition:"box-shadow 0.2s"}}>
                    <button onClick={()=>deleteStep(step.id)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>{"\u00D7"}</button>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>{catIcon(step.category)}</span>
                      <span style={{...F,fontSize:11,fontWeight:700,color:catColor(step.category),textTransform:"uppercase",letterSpacing:1.5}}>{step.category}</span>
                    </div>
                    <div style={{...F,fontSize:16,fontWeight:600,color:C.t1,lineHeight:1.4,marginBottom:5,paddingRight:28}}>{step.title}</div>
                    {step.time&&<div style={{...F,fontSize:13,color:C.t3,marginBottom:8}}>{step.time}</div>}
                    {step.why&&<div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,marginBottom:16}}>{step.why}</div>}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {step.link&&<TrackedLink href={step.link} actionId={step.id} category={step.category} title={step.title} style={{...F,fontSize:14,fontWeight:600,padding:"11px 20px",borderRadius:14,background:C.accGrad,color:"#fff",textDecoration:"none",display:"inline-block",boxShadow:"0 2px 10px rgba(212,82,42,0.15)"}}>{step.linkText||"Do it"} {"\u2197"}</TrackedLink>}
                      <button onClick={()=>markStep(step.id,"done")} style={{...F,fontSize:14,fontWeight:500,padding:"11px 20px",borderRadius:14,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,color:C.teal,cursor:"pointer"}}>Done {"\u2713"}</button>
                      <button onClick={()=>talkAbout(`Let's talk about: "${step.title}"`)} style={{...F,fontSize:13,padding:"11px 16px",borderRadius:14,background:C.cream,border:"none",color:C.t3,cursor:"pointer"}}>Discuss</button>
                    </div>
                  </div></FadeIn>
                ))}</div>}
              {doneSteps.length>0&&<div><div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:14}}>Completed ({doneSteps.length})</div>{doneSteps.slice(0,5).map(s=>(<div key={s.id} style={{padding:"14px 18px",borderRadius:16,marginBottom:8,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,display:"flex",alignItems:"center",gap:10,opacity:.55}}><span style={{color:C.teal,fontSize:16}}>{"\u2713"}</span><span style={{...F,fontSize:14,textDecoration:"line-through",color:C.t2,flex:1}}>{s.title}</span><button onClick={()=>deleteStep(s.id)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14}}>{"\u00D7"}</button></div>))}</div>}
            </>)}
          </div>
        )}

        {/* PLANS */}
        {mode==="plans"&&(
          <div style={{flex:1,overflowY:"auto",padding:"10px 22px 80px"}}>
            {plans.length===0?(
              <FadeIn><div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{width:72,height:72,borderRadius:22,margin:"0 auto 18px",background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{"\u{1F4CB}"}</div>
                <div style={{...H,fontSize:22,color:C.t1,marginBottom:10}}>Plan something amazing</div>
                <div style={{...F,fontSize:15,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto 24px"}}>Tell your coach about a trip, project, or big goal.</div>
                <button onClick={()=>{setMode("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,padding:"14px 32px",borderRadius:16,border:"none",fontSize:16,fontWeight:600,cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 20px rgba(212,82,42,0.25)"}}>Talk to your coach {"\u2192"}</button>
              </div></FadeIn>
            ):(<><div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:14}}>Your plans ({plans.length})</div>
              {plans.map((plan,pi)=>{const open=expandedPlan===pi,done=plan.tasks?.filter(t=>t.done).length||0,total=plan.tasks?.length||0;return(<FadeIn key={pi} delay={pi*60}><div style={{marginBottom:12}}>
                <div style={{padding:"20px 22px",borderRadius:open?"20px 20px 0 0":20,cursor:"pointer",background:C.card,boxShadow:C.shadow,position:"relative"}}>
                  <button onClick={e=>{e.stopPropagation();deletePlan(pi);}} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>{"\u00D7"}</button>
                  <div onClick={()=>setExpandedPlan(open?null:pi)}>
                    <div style={{...F,fontSize:17,fontWeight:600,color:C.t1,paddingRight:28}}>{plan.title}</div>
                    {plan.date&&<div style={{...F,fontSize:13,color:C.t3,marginTop:5}}>{plan.date}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12}}><div style={{flex:1,height:5,background:C.cream,borderRadius:3}}><div style={{height:"100%",width:total?(done/total*100)+"%":"0%",background:C.accGrad,borderRadius:3,transition:"width 0.6s ease"}}/></div><span style={{...F,fontSize:12,fontWeight:600,color:C.acc}}>{done}/{total}</span></div>
                  </div>
                  <button onClick={()=>talkAbout(`Let's discuss: "${plan.title}"`)} style={{...F,fontSize:12,padding:"7px 14px",borderRadius:10,background:C.cream,border:"none",color:C.t3,cursor:"pointer",marginTop:12}}>Discuss plan</button>
                </div>
                {open&&<div style={{padding:"10px 22px 20px",background:C.card,boxShadow:C.shadow,borderRadius:"0 0 20px 20px",borderTop:`1px solid ${C.b1}`}}>
                  {plan.tasks?.map((task,ti)=>(<div key={ti} style={{padding:"14px 0",borderBottom:ti<plan.tasks.length-1?`1px solid ${C.b1}`:"none"}}><div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <button onClick={()=>togglePlanTask(pi,ti)} style={{width:24,height:24,borderRadius:8,flexShrink:0,marginTop:1,cursor:"pointer",background:task.done?C.teal:"transparent",border:`2px solid ${task.done?C.teal:C.b2}`,display:"flex",alignItems:"center",justifyContent:"center",color:task.done?"#fff":"transparent",fontSize:13,transition:"all 0.15s"}}>{task.done?"\u2713":""}</button>
                    <div style={{flex:1}}><div style={{...F,fontSize:15,fontWeight:500,color:C.t1,textDecoration:task.done?"line-through":"none",opacity:task.done?.5:1}}>{task.title}</div>
                      {task.links?.length>0&&!task.done&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{task.links.map((l,li)=><TrackedLink key={li} href={l.url} actionId={`plan-${pi}-${ti}-${li}`} category="travel" title={task.title} style={{...F,fontSize:12,fontWeight:600,padding:"7px 14px",borderRadius:10,background:C.accSoft,color:C.acc,textDecoration:"none",display:"inline-block",border:`1px solid ${C.accBorder}`}}>{l.label} {"\u2197"}</TrackedLink>)}</div>}
                    </div></div></div>))}
                </div>}
              </div></FadeIn>)})}</>)}
          </div>
        )}

        {/* CHAT */}
        {mode==="chat"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"12px 22px"}}>
            {messages.map((msg,i)=>(
              <FadeIn key={i} delay={0}><div style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:12}}>
                {msg.role!=="user"&&<div style={{width:30,height:30,borderRadius:12,background:C.accGrad,flexShrink:0,marginRight:10,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff"}}>{"\u{1F463}"}</div>}
                <div style={bubble(msg.role==="user")}>{msg.content}</div>
              </div></FadeIn>
            ))}
            {loading&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:30,height:30,borderRadius:12,background:C.accGrad,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}} />
              </div>
              <div style={{...F,fontSize:14,color:C.t3,fontStyle:"italic"}}>Thinking about your next step...</div>
            </div>}
            <div ref={chatEnd} />
          </div>
          <div style={{padding:"6px 22px 6px",flexShrink:0}}>
            {messages.length<=2&&<SuggestionChips onSelect={text=>{setInput(text);setTimeout(()=>sendMessage(text),50);}} />}
          </div>
          <div style={{padding:"6px 22px 20px",flexShrink:0}}><div style={{display:"flex",gap:10}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder="What do you want to do?" style={{...F,flex:1,padding:"14px 18px",fontSize:15,borderRadius:18,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow,transition:"border-color 0.2s,box-shadow 0.2s"}} onFocus={e=>{e.target.style.borderColor=C.acc;e.target.style.boxShadow=`0 0 0 3px ${C.accSoft}`;}} onBlur={e=>{e.target.style.borderColor=C.b2;e.target.style.boxShadow=C.shadow;}} />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:48,height:48,borderRadius:16,border:"none",flexShrink:0,cursor:input.trim()&&!loading?"pointer":"default",background:input.trim()&&!loading?C.accGrad:"rgba(0,0,0,0.04)",color:input.trim()&&!loading?"#fff":C.t3,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:input.trim()&&!loading?"0 3px 12px rgba(212,82,42,0.25)":"none",transition:"all 0.2s"}}>{"\u2191"}</button>
          </div></div>
        </>)}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
