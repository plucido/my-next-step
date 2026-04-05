import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

// ─── FIREBASE ───
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBzV5b0K5bGjZZEXfC8Jqxus_PvH4oeXBc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "my-next-step-492323.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "my-next-step-492323",
  storageBucket: "my-next-step-492323.firebasestorage.app",
  messagingSenderId: "468026107222",
  appId: "1:468026107222:web:5544bb25aadc07c234e2f7",
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
function getUserId(p) { return p?.email ? p.email.replace(/[^a-zA-Z0-9]/g, "_") : null; }
async function saveFB(uid, key, data) { if (!uid) return; try { await setDoc(doc(db, "users", uid, "data", key), { value: JSON.stringify(data), updatedAt: new Date().toISOString() }); } catch (e) { console.error("FB save:", e); } }
async function loadFB(uid, key) { if (!uid) return null; try { const s = await getDoc(doc(db, "users", uid, "data", key)); if (s.exists()) return JSON.parse(s.data().value); } catch (e) { console.error("FB load:", e); } return null; }
async function deleteFB(uid, key) { if (!uid) return; try { await deleteDoc(doc(db, "users", uid, "data", key)); } catch (e) {} }

// ─── DESIGN SYSTEM ───
const font = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap');`;
const H = { fontFamily: "'Fraunces', serif" };
const F = { fontFamily: "'DM Sans', sans-serif" };
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
};

// ─── SEGMENTS ───
const SEGMENTS = {
  work: { label: "Work", icon: "\u{1F4BC}", color: "#6D28D9", soft: "#EDE9FE", desc: "Career, professional growth, side hustles" },
  me: { label: "Me", icon: "\u{1F331}", color: "#0F766E", soft: "#E6F7F5", desc: "Health, hobbies, personal goals, solo adventures" },
  social: { label: "Social", icon: "\u{1F91D}", color: "#DB2777", soft: "#FCE7F3", desc: "Friends, family, events, group activities" },
};
const SEG_KEYS = ["work", "me", "social"];
// Map AI categories to segments
const catToSeg = c => {
  if (["career", "learning", "products"].includes(c)) return "work";
  if (["fitness", "wellness", "travel"].includes(c)) return "me";
  if (["social", "events"].includes(c)) return "social";
  return "me"; // default
};
const catIcon = c => ({ fitness:"\u{1F3CB}", wellness:"\u{1F9D8}", career:"\u{1F4BC}", learning:"\u{1F4DA}", social:"\u{1F91D}", events:"\u{1F389}", travel:"\u2708\uFE0F", products:"\u{1F6CD}\uFE0F" })[c] || "\u2728";

function getGreeting() { const h = new Date().getHours(); if (h >= 5 && h < 12) return "Good morning"; if (h >= 12 && h < 17) return "Good afternoon"; return "Good evening"; }
function FadeIn({ children, delay = 0, style: sx }) { const [s, setS] = useState(false); useEffect(() => { const t = setTimeout(() => setS(true), delay); return () => clearTimeout(t); }, []); return <div style={{ opacity: s ? 1 : 0, transform: s ? "translateY(0)" : "translateY(10px)", transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)", ...sx }}>{children}</div>; }
function ProgressRing({ progress, size = 32, stroke = 3, color }) { const r = (size - stroke) / 2, ci = 2 * Math.PI * r; return <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.cream} strokeWidth={stroke} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color||C.acc} strokeWidth={stroke} strokeDasharray={ci} strokeDashoffset={ci - progress * ci} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} /></svg>; }

// ─── AFFILIATE (compact) ───
const AFF = { "classpass.com":{tag:"mnstep-20",c:2.5},"eventbrite.com":{tag:"mnstep",c:1.5},"udemy.com":{tag:"mnstep",c:1.8},"skillshare.com":{tag:"mnstep",c:2},"mindbody.io":{tag:"mnstep-20",c:2},"meetup.com":{tag:"mnstep",c:.75},"amazon.com":{tag:"mnstep-20",c:.5},"linkedin.com/learning":{tag:"mnstep",c:2.2},"airbnb.com":{tag:"mnstep",c:3},"kayak.com":{tag:"mnstep",c:.8},"booking.com":{tag:"aid=mnstep",c:2.5},"vrbo.com":{tag:"mnstep",c:2} };
function wrapLink(url,id){if(!url)return url;try{const u=new URL(url);u.searchParams.set("utm_source","mynextstep");u.searchParams.set("utm_medium","app");u.searchParams.set("utm_campaign",`a_${id||"u"}`);const h=u.hostname.replace("www.","");for(const[d,p]of Object.entries(AFF))if(h.includes(d.split("/")[0])){u.searchParams.set("ref",p.tag);break;}return u.toString();}catch{return url;}}
function trackClick(id,url,cat,title){try{const c=JSON.parse(localStorage.getItem("mns_clicks")||"[]");const h=new URL(url).hostname.replace("www.","");let cm=.1;for(const[d,p]of Object.entries(AFF))if(h.includes(d.split("/")[0])){cm=p.c;break;}c.push({id:id||""+Date.now(),url,category:cat||"other",title:title||"",timestamp:new Date().toISOString(),estimatedCommission:cm});localStorage.setItem("mns_clicks",JSON.stringify(c));}catch{}}
function TLink({href,actionId,category,title,children,style:sx}){return<a href={wrapLink(href,actionId)} target="_blank" rel="noopener noreferrer" onClick={()=>trackClick(actionId,href,category,title)} style={sx}>{children}</a>;}

// ─── MARKDOWN CLEANER ───
function clean(text){if(!text)return text;let t=text;t=t.replace(/\*\*\*(.*?)\*\*\*/g,"$1");t=t.replace(/\*\*(.*?)\*\*/g,"$1");t=t.replace(/\*(.*?)\*/g,"$1");t=t.replace(/^#{1,6}\s+/gm,"");t=t.replace(/^[\-]\s+/gm,"\u2022 ");t=t.replace(/`([^`]+)`/g,"$1");t=t.replace(/```[\s\S]*?```/g,"");t=t.replace(/_{2}(.*?)_{2}/g,"$1");t=t.replace(/~{2}(.*?)~{2}/g,"$1");const lr=/\[([^\]]+)\]\([^)]+\)/g;t=t.replace(lr,"$1");return t.trim();}

// ─── AUTH HELPERS ───
function loadGSI(){return new Promise(r=>{if(document.getElementById("gsi"))return r();const s=document.createElement("script");s.id="gsi";s.src="https://accounts.google.com/gsi/client";s.onload=r;document.head.appendChild(s);});}
function decJwt(t){try{return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));}catch{return null;}}
function connectStrava(){const c=import.meta.env.VITE_STRAVA_CLIENT_ID;if(c)window.location.href=`https://www.strava.com/oauth/authorize?client_id=${c}&response_type=code&redirect_uri=${window.location.origin}&scope=read,activity:read&approval_prompt=auto`;}
async function exchStrava(code){try{return await(await fetch("https://www.strava.com/oauth/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:import.meta.env.VITE_STRAVA_CLIENT_ID,client_secret:import.meta.env.VITE_STRAVA_CLIENT_SECRET,code,grant_type:"authorization_code"})})).json();}catch{return null;}}
async function fetchStrava(token){try{const[a,b]=await Promise.all([fetch("https://www.strava.com/api/v3/athlete",{headers:{Authorization:`Bearer ${token}`}}),fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10",{headers:{Authorization:`Bearer ${token}`}})]);const at=await a.json(),ac=await b.json();let st=null;if(at.id)try{st=await(await fetch(`https://www.strava.com/api/v3/athletes/${at.id}/stats`,{headers:{Authorization:`Bearer ${token}`}})).json();}catch{}const rc=Array.isArray(ac)?ac.slice(0,10).map(x=>({type:x.type,name:x.name,distance:(x.distance/1000).toFixed(1)+"km",duration:Math.round(x.moving_time/60)+"min",date:new Date(x.start_date_local).toLocaleDateString()})):[];return{name:`${at.firstname||""} ${at.lastname||""}`.trim(),city:at.city||"",recentActivities:rc,allTimeRuns:st?.all_run_totals?.count||0,allTimeRunDistance:st?.all_run_totals?.distance?(st.all_run_totals.distance/1000).toFixed(0)+"km":"0km",allTimeRides:st?.all_ride_totals?.count||0,allTimeRideDistance:st?.all_ride_totals?.distance?(st.all_ride_totals.distance/1000).toFixed(0)+"km":"0km"};}catch{return null;}}

// ─── GOOGLE CALENDAR ───
function connectGCal(cb){const cid=import.meta.env.VITE_GOOGLE_CLIENT_ID;if(!cid)return;loadGSI().then(()=>{if(!window.google?.accounts?.oauth2)return;window.google.accounts.oauth2.initTokenClient({client_id:cid,scope:"https://www.googleapis.com/auth/calendar.events",callback:r=>{if(r.access_token)cb(r);}}).requestAccessToken();});}
async function fetchGCal(token){try{const now=new Date().toISOString(),end=new Date(Date.now()+14*864e5).toISOString();const r=await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(end)}&maxResults=30&singleEvents=true&orderBy=startTime`,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json();return(d.items||[]).map(e=>({title:e.summary||"",start:e.start?.dateTime||e.start?.date||"",end:e.end?.dateTime||e.end?.date||"",location:e.location||"",allDay:!!e.start?.date&&!e.start?.dateTime}));}catch{return null;}}
async function addGCalEvent(token,title,desc,time){try{const s=new Date();const tl=(time||"").toLowerCase();if(tl.includes("tomorrow"))s.setDate(s.getDate()+1);if(tl.includes("tonight")||tl.includes("pm")){const m=tl.match(/(\d{1,2})\s*pm/);s.setHours(m?parseInt(m[1])+12:19,0,0);}if(tl.includes("am")){const m=tl.match(/(\d{1,2})\s*am/);if(m)s.setHours(parseInt(m[1]),0,0);}if(tl.includes("weekend")){s.setDate(s.getDate()+(6-s.getDay()+7)%7||7);s.setHours(10,0,0);}const e=new Date(s.getTime()+36e5);const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;const r=await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({summary:title,description:desc||"From My Next Step",start:{dateTime:s.toISOString(),timeZone:tz},end:{dateTime:e.toISOString(),timeZone:tz}})});return r.ok;}catch{return false;}}

// ─── SYSTEM PROMPT ───
const SYSTEM_PROMPT=`You are the AI engine behind "My Next Step" \u2014 a warm, personal life coach.

The app has 3 life segments: Work (career, professional growth), Me (health, hobbies, personal goals), Social (friends, events, group activities).
The user is currently chatting in one segment. Focus your responses on that segment, but remember everything across all segments to build a complete picture of who they are.

WHEN TO CREATE STEPS/JOURNEYS:
- If the user says what they want, MAKE IT immediately.
- If they confirm ("yeah", "do it", "sounds good"), CREATE right away.
- If vague, ask ONE question then act.
- When in doubt, CREATE. A dismissable step beats an empty conversation.

SPECIFICITY:
- NEVER give vague tasks like "Book a hotel". Always recommend SPECIFIC places with names, prices, details.
- Use web search to find real options before recommending.
- Include prices. Pre-fill links with search parameters.

BUDGET: Ask about budget naturally when relevant. Store it as a preference.

MANAGING ITEMS:
- Delete irrelevant steps/journeys when conversation shifts.
- To update a journey, output it with the SAME title. It replaces the old one.
- If user has LOVED steps, recommend more in that style.
- If Google Calendar is connected, avoid scheduling conflicts.

TONE:
- Write like a friend texting. Casual, warm, no fluff.
- NEVER use markdown: no asterisks, bold, bullets, headers. Plain text only.
- 1-3 sentences. Cards do the work.

OUTPUT FORMAT (after "---DATA---"):
All in one JSON array:
{"type":"step","title":"6pm Vinyasa at Black Swan Yoga","why":"$15, 10min from you","link":"https://...","linkText":"Book","category":"fitness","time":"Tonight 6pm"}
{"type":"plan","title":"Austin Trip","date":"May 15-18, 2026","tasks":[{"title":"Book Southwest HOU-AUS ~$89","links":[{"label":"Kayak","url":"https://..."}]}]}
{"type":"delete_step","title":"yoga"}
{"type":"delete_plan","title":"Austin"}
{"type":"preference","key":"budget_hotels","value":"$150-200/night"}

Categories: fitness, wellness, career, learning, social, events, travel, products
ALWAYS output ---DATA--- when you can. Create aggressively.`;

const PROFILE_SECTIONS=[{id:"basics",label:"The basics",icon:"\u{1F464}",questions:["What's your current job or role?","What does your typical day look like?","What's your living situation?"]},{id:"personality",label:"Your personality",icon:"\u{1F31F}",questions:["Are you more introverted or extroverted?","What motivates you most?","How do you handle stress?"]},{id:"lifestyle",label:"Lifestyle & habits",icon:"\u{1F3E0}",questions:["What does a typical weekend look like?","Do you exercise regularly?","Do you cook or eat out?"]},{id:"dreams",label:"Dreams & goals",icon:"\u2728",questions:["Where do you see yourself in 5 years?","What have you always wanted to try?","What's holding you back?"]},{id:"challenges",label:"Current challenges",icon:"\u{1F525}",questions:["What's your biggest challenge right now?","What area of life feels most stuck?"]}];

// ─── AUTH SCREEN ───
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("landing");const[email,setEmail]=useState("");const[name,setName]=useState("");const gRef=useRef(null);
  useEffect(()=>{const c=import.meta.env.VITE_GOOGLE_CLIENT_ID;if(!c||mode!=="landing")return;loadGSI().then(()=>{if(!window.google?.accounts?.id)return;window.google.accounts.id.initialize({client_id:c,callback:r=>{const u=decJwt(r.credential);if(u)onAuth({name:u.given_name||u.name||"User",email:u.email,method:"google"});}});if(gRef.current)window.google.accounts.id.renderButton(gRef.current,{type:"standard",theme:"outline",size:"large",width:380,text:"continue_with",shape:"pill"});});},[mode]);
  const inp={...F,width:"100%",padding:"15px 18px",fontSize:15,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"};
  if(mode==="email")return(<div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}><FadeIn><div style={{width:"100%",maxWidth:400}}>
    <button onClick={()=>setMode("landing")} style={{...F,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14,marginBottom:28}}>{"\u2190"} Back</button>
    <h2 style={{...H,fontSize:32,color:C.t1,marginBottom:28}}>Create your account</h2>
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Your name</label>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="First name" style={{...inp,marginBottom:18}} />
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Email</label>
    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" type="email" style={{...inp,marginBottom:28}} />
    <button onClick={()=>name.trim()&&email.includes("@")&&onAuth({name:name.trim(),email,method:"email"})} disabled={!name.trim()||!email.includes("@")} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:name.trim()&&email.includes("@")?"pointer":"default",background:name.trim()&&email.includes("@")?C.accGrad:"rgba(0,0,0,0.04)",color:name.trim()&&email.includes("@")?"#fff":C.t3}}>Create account {"\u2192"}</button>
  </div></FadeIn></div>);
  return(<div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}><FadeIn><div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
    <div style={{width:68,height:68,borderRadius:20,margin:"0 auto 24px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,color:"#fff",boxShadow:"0 8px 28px rgba(212,82,42,0.3)"}}>{"\u{1F463}"}</div>
    <h1 style={{...H,fontSize:46,color:C.t1,lineHeight:1.05,marginBottom:14}}>My Next Step</h1>
    <p style={{...F,fontSize:17,color:C.t2,lineHeight:1.6,maxWidth:310,margin:"0 auto 44px"}}>Your AI coach that turns goals into clear, actionable steps.</p>
    <div ref={gRef} style={{display:"flex",justifyContent:"center",marginBottom:14}} />
    <div style={{display:"flex",alignItems:"center",gap:16,margin:"22px 0"}}><div style={{flex:1,height:1,background:C.b1}}/><span style={{...F,fontSize:12,color:C.t3}}>or</span><div style={{flex:1,height:1,background:C.b1}}/></div>
    <button onClick={()=>setMode("email")} style={{...F,width:"100%",padding:"15px",borderRadius:16,fontSize:15,fontWeight:500,background:C.card,color:C.t2,border:`1.5px solid ${C.b2}`,cursor:"pointer",boxShadow:C.shadow}}>Sign up with email</button>
  </div></FadeIn></div>);
}

// ─── SETUP SCREEN ───
function SetupScreen({profile,onComplete}){
  const[location,setLocation]=useState("");const[age,setAge]=useState("");const[gender,setGender]=useState("");const[genderOther,setGenderOther]=useState("");
  const inp={...F,width:"100%",padding:"15px 18px",fontSize:15,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"};
  return(<div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}><FadeIn><div style={{width:"100%",maxWidth:420}}>
    <h2 style={{...H,fontSize:30,color:C.t1,marginBottom:8}}>A bit about you</h2>
    <p style={{color:C.t2,fontSize:15,marginBottom:36}}>Just the basics, {profile.name}.</p>
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Age</label>
    <input value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 28" type="number" style={{...inp,marginBottom:20}} />
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:10}}>Gender</label>
    <div style={{display:"flex",gap:8,marginBottom:gender==="Other"?12:20,flexWrap:"wrap"}}>
      {["Male","Female","Other","Prefer not to say"].map(g=>(<button key={g} onClick={()=>setGender(g)} style={{...F,padding:"10px 18px",borderRadius:14,fontSize:14,cursor:"pointer",background:gender===g?C.accSoft:C.card,border:`1.5px solid ${gender===g?C.acc:C.b2}`,color:gender===g?C.acc:C.t2,fontWeight:gender===g?600:400,transition:"all 0.15s"}}>{g}</button>))}
    </div>
    {gender==="Other"&&<input value={genderOther} onChange={e=>setGenderOther(e.target.value)} placeholder="How do you identify?" style={{...inp,marginBottom:20}} />}
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Where are you based?</label>
    <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, State" style={{...inp,marginBottom:28}} />
    <button onClick={()=>location.trim()&&onComplete({location:location.trim(),age:age.trim(),gender:gender==="Other"?genderOther:gender})} disabled={!location.trim()} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:location.trim()?"pointer":"default",background:location.trim()?C.accGrad:"rgba(0,0,0,0.04)",color:location.trim()?"#fff":C.t3}}>Continue {"\u2192"}</button>
  </div></FadeIn></div>);
}

// ─── DEEP PROFILE CHAT ───
function DeepProfileChat({profile,onFinish,existingInsights}){
  const[msgs,setMsgs]=useState([]);const[inp,setInp]=useState("");const[busy,setBusy]=useState(false);
  const[insights,setInsights]=useState(existingInsights||[]);const[section,setSection]=useState(null);
  const endRef=useRef(null);const inpRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,busy]);
  const startSec=sec=>{setSection(sec);setMsgs([{role:"assistant",content:`Let's talk about ${sec.label.toLowerCase()}.\n\n${sec.questions[0]}`}]);setTimeout(()=>inpRef.current?.focus(),100);};
  const send=async()=>{if(!inp.trim()||busy)return;const u=[...msgs,{role:"user",content:inp.trim()}];setMsgs(u);setInp("");setBusy(true);
    try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:`Onboarding for "My Next Step". Warm, no markdown.\nUser: ${profile.name} | ${profile.setup?.location||""}\nSection: ${section.label}\nQuestions: ${section.questions.join(" | ")}\nONE question. After 3-5 exchanges: "INSIGHTS:" then "- " bullets.`,messages:u.map(m=>({role:m.role,content:m.content}))})});const d=await r.json();const text=clean(d.content?.map(c=>c.text||"").filter(Boolean).join("\n")||"Tell me more?");
      if(text.includes("INSIGHTS:")){const p=text.split("INSIGHTS:");setInsights(prev=>[...prev.filter(i=>i.section!==section.id),...p[1].split("\n").filter(l=>l.trim().startsWith("- ")).map(l=>({section:section.id,text:l.trim().slice(2)}))]);setMsgs(prev=>[...prev,{role:"assistant",content:clean(p[0].trim())}]);}
      else setMsgs(prev=>[...prev,{role:"assistant",content:text}]);
    }catch{setMsgs(prev=>[...prev,{role:"assistant",content:"Hiccup \u2014 say that again?"}]);}setBusy(false);};
  const bubble=u=>({...F,maxWidth:"82%",padding:"13px 18px",borderRadius:20,fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",...(u?{background:C.accGrad,color:"#fff",borderBottomRightRadius:6}:{background:C.card,color:C.t1,borderBottomLeftRadius:6,boxShadow:C.shadow})});
  if(!section)return(<div style={{...F,minHeight:"100vh",padding:24,background:C.bg}}><FadeIn><div style={{maxWidth:460,margin:"0 auto",paddingTop:32}}>
    <div style={{textAlign:"center",marginBottom:36}}><div style={{width:56,height:56,borderRadius:18,margin:"0 auto 16px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff"}}>{"\u{1F4AC}"}</div><h2 style={{...H,fontSize:28,color:C.t1,marginBottom:8}}>Let's get to know you</h2><p style={{color:C.t2,fontSize:15,maxWidth:320,margin:"0 auto"}}>~2 min each. Makes everything more personal.</p></div>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>{PROFILE_SECTIONS.map((sec,i)=>{const done=insights.some(x=>x.section===sec.id);return(<FadeIn key={sec.id} delay={i*60}><div onClick={()=>startSec(sec)} style={{padding:"18px 20px",borderRadius:18,cursor:"pointer",background:C.card,boxShadow:C.shadow,border:done?`1.5px solid ${C.teal}`:"1.5px solid transparent",display:"flex",alignItems:"center",gap:14}}><div style={{width:42,height:42,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:done?C.tealSoft:C.cream}}>{done?"\u2713":sec.icon}</div><div style={{flex:1}}><div style={{...F,fontSize:15,fontWeight:600,color:C.t1}}>{sec.label}</div><div style={{...F,fontSize:13,color:done?C.teal:C.t3,marginTop:3}}>{done?"Done":"~2 min"}</div></div><span style={{color:C.t3,fontSize:18}}>{"\u203A"}</span></div></FadeIn>);})}</div>
    <button onClick={()=>onFinish(insights)} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:"pointer",background:C.accGrad,color:"#fff"}}>{insights.length===0?"Skip for now \u2192":"Continue \u2192"}</button>
  </div></FadeIn></div>);
  return(<div style={{...F,display:"flex",flexDirection:"column",height:"100vh",maxWidth:480,margin:"0 auto",background:C.bg}}>
    <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",gap:12}}><button onClick={()=>setSection(null)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:18}}>{"\u2190"}</button><div style={{...F,fontSize:16,fontWeight:600,color:C.t1}}>{section.label}</div></div>
    <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>{msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}}>{m.role!=="user"&&<div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0,marginRight:10,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>{"\u{1F463}"}</div>}<div style={bubble(m.role==="user")}>{m.content}</div></div>))}{busy&&<div style={{display:"flex",gap:10,marginBottom:12}}><div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0}}/><div style={{padding:"13px 20px",borderRadius:20,background:C.card,boxShadow:C.shadow,display:"flex",gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.t3,animation:`dpb 1.2s ease ${i*.15}s infinite`}}/>)}</div></div>}<div ref={endRef}/></div>
    <div style={{padding:"12px 20px 22px"}}><div style={{display:"flex",gap:10,alignItems:"flex-end"}}><textarea ref={inpRef} value={inp} onChange={e=>{setInp(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,150)+"px";}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Type your answer..." rows={1} style={{...F,flex:1,padding:"13px 18px",fontSize:15,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",resize:"none",maxHeight:150,lineHeight:1.5}}/><button onClick={send} disabled={!inp.trim()||busy} style={{width:46,height:46,borderRadius:16,border:"none",flexShrink:0,cursor:inp.trim()&&!busy?"pointer":"default",background:inp.trim()&&!busy?C.accGrad:"rgba(0,0,0,0.04)",color:inp.trim()&&!busy?"#fff":C.t3,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:1}}>{"\u2191"}</button></div></div>
    <style>{`@keyframes dpb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
  </div>);
}

// ─── STEP CARD ───
function StepCard({step,onDone,onDelete,onLove,onTalk,onAddCal,delay=0}){
  const seg=SEGMENTS[catToSeg(step.category)];
  return(<FadeIn delay={delay}><div style={{padding:"18px 20px",borderRadius:18,marginBottom:10,background:C.card,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${seg?.color||C.acc}`}}>
    <button onClick={()=>onDelete(step.id)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}>{"\u00D7"}</button>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{fontSize:14}}>{catIcon(step.category)}</span>
      <span style={{...F,fontSize:10,fontWeight:700,color:seg?.color||C.acc,textTransform:"uppercase",letterSpacing:1.5}}>{step.category}</span>
      {step.createdAt&&<span style={{...F,fontSize:10,color:C.t3,marginLeft:"auto"}}>{((d)=>{const m=Math.floor(d/6e4);if(m<60)return m+"m";const h=Math.floor(m/60);if(h<24)return h+"h";return Math.floor(h/24)+"d";})(Date.now()-new Date(step.createdAt).getTime())} ago</span>}
    </div>
    <div style={{...F,fontSize:15,fontWeight:600,color:C.t1,lineHeight:1.4,marginBottom:4,paddingRight:24}}>{step.title}</div>
    {step.time&&<div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>{step.time}</div>}
    {step.why&&<div style={{...F,fontSize:13,color:C.t2,lineHeight:1.55,marginBottom:14}}>{step.why}</div>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
      {step.link&&<TLink href={step.link} actionId={step.id} category={step.category} title={step.title} style={{...F,fontSize:13,fontWeight:600,padding:"9px 16px",borderRadius:12,background:C.accGrad,color:"#fff",textDecoration:"none",display:"inline-block"}}>{step.linkText||"Do it"} {"\u2197"}</TLink>}
      <button onClick={()=>onDone(step.id)} style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,color:C.teal,cursor:"pointer"}}>Done {"\u2713"}</button>
      <button onClick={()=>onLove(step.id)} style={{width:38,height:38,borderRadius:12,border:"none",cursor:"pointer",background:step.loved?"rgba(220,38,38,0.08)":"rgba(0,0,0,0.02)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all 0.2s"}}>{step.loved?"\u2764\uFE0F":"\u{1F90D}"}</button>
    </div>
    <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
      <button onClick={()=>onTalk(`Work on step: "${step.title}". Find specific options with prices and booking links.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer",fontWeight:500}}>Work on this</button>
      <button onClick={()=>onTalk(`Find alternative to "${step.title}" with prices and details.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Alternative</button>
      {step.time&&<button onClick={()=>onAddCal(step.title,step.why,step.time)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.1)",color:"#4285F4",cursor:"pointer"}}>{"\u{1F4C5}"} Calendar</button>}
    </div>
  </div></FadeIn>);
}

// ─── JOURNEY CARD ───
function JourneyCard({plan,pi,open,onToggle,onDelete,onTalk,onToggleTask,delay=0}){
  const done=plan.tasks?.filter(t=>t.done).length||0,total=plan.tasks?.length||0,allDone=total>0&&done===total;
  let isPast=false;try{const m=(plan.date||"").match(/(\w+)\s+\d{1,2}\s*[-\u2013]\s*(\d{1,2}),?\s*(\d{4})/);if(m){const d=new Date(`${m[1]} ${m[2]}, ${m[3]}`);d.setHours(23,59);isPast=d<new Date();}else{const s=(plan.date||"").match(/(\w+\s+\d{1,2}),?\s*(\d{4})/);if(s){const d=new Date(`${s[1]}, ${s[2]}`);d.setHours(23,59);isPast=d<new Date();}}}catch{}
  const borderColor=isPast&&!allDone?"#DC3C3C":allDone?C.teal:C.b1;
  const bg=isPast&&!allDone?"rgba(220,60,60,0.02)":allDone?C.tealSoft:C.card;
  return(<FadeIn delay={delay}><div style={{marginBottom:10}}>
    <div style={{padding:"18px 20px",borderRadius:open?"18px 18px 0 0":18,cursor:"pointer",background:bg,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${borderColor}`}}>
      <button onClick={e=>{e.stopPropagation();onDelete(pi);}} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}>{"\u00D7"}</button>
      <div onClick={()=>onToggle(pi)}>
        <div style={{...F,fontSize:16,fontWeight:600,color:C.t1,paddingRight:24}}>{plan.title}</div>
        {plan.date&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}><span style={{fontSize:13}}>{isPast&&!allDone?"\u{1F534}":allDone?"\u2705":"\u{1F4C5}"}</span><span style={{...F,fontSize:13,color:isPast&&!allDone?"#DC3C3C":allDone?C.teal:C.t3,fontWeight:isPast?600:400}}>{plan.date}</span>{isPast&&!allDone&&<span style={{...F,fontSize:10,fontWeight:600,color:"#DC3C3C",background:"rgba(220,60,60,0.08)",padding:"2px 8px",borderRadius:6}}>Overdue</span>}{allDone&&<span style={{...F,fontSize:10,fontWeight:600,color:C.teal,background:C.tealSoft,padding:"2px 8px",borderRadius:6}}>Done</span>}</div>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}><div style={{flex:1,height:4,background:C.cream,borderRadius:2}}><div style={{height:"100%",width:total?(done/total*100)+"%":"0%",background:allDone?C.teal:isPast?"#DC3C3C":C.accGrad,borderRadius:2,transition:"width 0.5s"}}/></div><span style={{...F,fontSize:11,fontWeight:600,color:allDone?C.teal:C.acc}}>{done}/{total}</span></div>
      </div>
      <div style={{display:"flex",gap:6,marginTop:10}}>
        {isPast&&!allDone&&<button onClick={()=>onTalk(`My journey "${plan.title}" is overdue (${plan.date}). Help me reschedule.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:"rgba(220,60,60,0.06)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",cursor:"pointer",fontWeight:600}}>Reschedule</button>}
        {!allDone&&(()=>{const nt=plan.tasks?.find(t=>!t.done);return nt?<button onClick={()=>onTalk(`Work on "${nt.title}" for my "${plan.title}" journey. Find specific options with prices.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.accSoft,border:`1px solid ${C.accBorder}`,color:C.acc,cursor:"pointer",fontWeight:600}}>Next task</button>:null;})()}
        <button onClick={()=>onTalk(`Work on journey "${plan.title}". What should I focus on?`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t3,cursor:"pointer"}}>Work on this</button>
      </div>
    </div>
    {open&&<div style={{padding:"8px 20px 16px",background:bg,boxShadow:C.shadow,borderRadius:"0 0 18px 18px",borderTop:`1px solid ${C.b1}`}}>
      {plan.tasks?.map((task,ti)=>(<div key={ti} style={{padding:"12px 0",borderBottom:ti<plan.tasks.length-1?`1px solid ${C.b1}`:"none"}}><div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <button onClick={()=>onToggleTask(pi,ti)} style={{width:22,height:22,borderRadius:7,flexShrink:0,marginTop:1,cursor:"pointer",background:task.done?C.teal:"transparent",border:`2px solid ${task.done?C.teal:C.b2}`,display:"flex",alignItems:"center",justifyContent:"center",color:task.done?"#fff":"transparent",fontSize:12}}>{task.done?"\u2713":""}</button>
        <div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500,color:C.t1,textDecoration:task.done?"line-through":"none",opacity:task.done?.5:1}}>{task.title}</div>
          {task.links?.length>0&&!task.done&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>{task.links.map((l,li)=><TLink key={li} href={l.url} actionId={`j-${pi}-${ti}-${li}`} category="travel" title={task.title} style={{...F,fontSize:11,fontWeight:600,padding:"5px 12px",borderRadius:8,background:C.accSoft,color:C.acc,textDecoration:"none",display:"inline-block",border:`1px solid ${C.accBorder}`}}>{l.label} {"\u2197"}</TLink>)}</div>}
        </div></div></div>))}
    </div>}
  </div></FadeIn>);
}

// ─── MAIN APP ───
export default function App(){
  const[screen,setScreen]=useState("auth");
  const[profile,setProfile]=useState(null);
  const[segment,setSegment]=useState("me"); // work, me, social, everything
  const[view,setView]=useState("steps"); // steps, chat
  const[allSteps,setAllSteps]=useState([]);
  const[allPlans,setAllPlans]=useState([]);
  const[preferences,setPreferences]=useState([]);
  // Per-segment chat histories
  const[chats,setChats]=useState({work:[],me:[],social:[]});
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[expandedPlan,setExpandedPlan]=useState(null);
  const[feedbackStep,setFeedbackStep]=useState(null);
  const[feedbackText,setFeedbackText]=useState("");
  const[stravaData,setStravaData]=useState(null);
  const[calData,setCalData]=useState(null);
  const[calToken,setCalToken]=useState(null);
  const[showSettings,setShowSettings]=useState(false);
  const chatEnd=useRef(null);const inputRef=useRef(null);

  // Current segment's data
  const segSteps=segment==="everything"?allSteps.filter(s=>s.status==="active"):allSteps.filter(s=>s.status==="active"&&catToSeg(s.category)===segment);
  const segPlans=segment==="everything"?allPlans:allPlans.filter(p=>{const cats=(p.tasks||[]).map(t=>t.category).filter(Boolean);if(cats.length)return cats.some(c=>catToSeg(c)===segment);const title=(p.title||"").toLowerCase();if(["career","work","job","interview","resume","linkedin"].some(w=>title.includes(w)))return segment==="work";if(["gym","yoga","run","health","diet","meditation"].some(w=>title.includes(w)))return segment==="me";if(["friend","party","dinner","concert","group","date"].some(w=>title.includes(w)))return segment==="social";return segment==="me";});
  const segMessages=segment==="everything"?[...chats.work,...chats.me,...chats.social].sort((a,b)=>(a.ts||0)-(b.ts||0)):chats[segment]||[];
  const doneSteps=allSteps.filter(s=>s.status==="done");
  const expiredSteps=allSteps.filter(s=>s.status==="expired");

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[segMessages.length,loading]);

  // Strava OAuth redirect
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const code=p.get("code");if(code&&p.get("scope")?.includes("read")){window.history.replaceState({},"",window.location.pathname);exchStrava(code).then(async d=>{if(d?.access_token){const pr=await fetchStrava(d.access_token);const full={...d,profile:pr};setStravaData(full);const uid=getUserId(profile);if(uid)saveFB(uid,"strava",full);}});}},[]);

  // Load data
  useEffect(()=>{(async()=>{
    try{const hint=localStorage.getItem("mns_last_user");if(hint){
      const data=await loadFB(hint,"appdata");
      if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setChats(data.chats||{work:[],me:[],social:[]});setPreferences(data.preferences||[]);setScreen("main");}
      const sv=await loadFB(hint,"strava");if(sv)setStravaData(sv);
      const cv=await loadFB(hint,"calendar");if(cv){setCalToken(cv.token);setCalData(cv.events);}
    }}catch{}
    // Migration from old format
    try{const s=await window.storage.get("mns-v11");if(s){const d=JSON.parse(s.value);if(d.profile?.setup){setProfile(d.profile);setAllSteps(d.steps||[]);setAllPlans(d.plans||[]);setChats({work:[],me:d.messages||[],social:[]});setPreferences(d.preferences||[]);setScreen("main");const uid=getUserId(d.profile);if(uid){saveFB(uid,"appdata",{...d,chats:{work:[],me:d.messages||[],social:[]}});window.storage.delete("mns-v11").catch(()=>{});}}}}catch{}
  })();},[]);

  const persist=(p,s,pl,ch,pr)=>{const data={profile:p||profile,steps:s||allSteps,plans:pl||allPlans,chats:ch||chats,preferences:pr||preferences};const uid=getUserId(p||profile);if(uid){saveFB(uid,"appdata",data);localStorage.setItem("mns_last_user",uid);}};

  const handleAuth=auth=>{const p={name:auth.name,email:auth.email,method:auth.method};setProfile(p);localStorage.setItem("mns_last_user",getUserId(p));setScreen("setup");};
  const handleSetup=setup=>{setProfile(p=>({...p,setup}));setScreen("deepprofile");};
  const handleDeepFinish=insights=>{
    const full={...profile,insights};setProfile(full);
    if(!chats.me.length){const w=[{role:"assistant",content:`Hey ${full.name}! ${"\u{1F463}"}\n\nI'm your Next Step coach. I'm here to help across your whole life \u2014 work, personal stuff, and social plans.\n\nWhat's on your mind?`,ts:Date.now()}];setChats({work:[],me:w,social:[]});setView("chat");persist(full,[],[],{work:[],me:w,social:[]},[]); }
    else persist(full,allSteps,allPlans,chats,preferences);
    setScreen("main");setTimeout(()=>inputRef.current?.focus(),200);
  };

  const sendMessage=async text=>{
    const msg=text||input.trim();if(!msg||loading||segment==="everything")return;
    const ts=Date.now();
    const userMsg={role:"user",content:msg,ts};
    const segChat=[...(chats[segment]||[]),userMsg];
    const newChats={...chats,[segment]:segChat};
    setChats(newChats);setInput("");setLoading(true);
    if(inputRef.current)inputRef.current.style.height="auto";

    // Build full profile context from ALL segments
    const allMsgs=[...chats.work,...chats.me,...chats.social].sort((a,b)=>(a.ts||0)-(b.ts||0));
    const prefText=preferences.length>0?"\n\nPREFERENCES:\n"+preferences.map(p=>`- ${p.key}: ${p.value}`).join("\n"):"";
    const sp=stravaData?.profile;const stravaText=sp?`\n\nSTRAVA: ${sp.name} | ${sp.allTimeRuns} runs, ${sp.allTimeRides} rides`:"";
    const stepsCtx=allSteps.filter(s=>s.status==="active").length>0?"\n\nALL ACTIVE STEPS:\n"+allSteps.filter(s=>s.status==="active").map(s=>`- "${s.title}" (${s.category}, ${catToSeg(s.category)})${s.loved?" [LOVED]":""}`).join("\n"):"";
    const lovedCtx=allSteps.filter(s=>s.loved).length>0?"\n\nLOVED STEPS:\n"+allSteps.filter(s=>s.loved).map(s=>`- "${s.title}" (${s.category})`).join("\n"):"";
    const plansCtx=allPlans.length>0?"\n\nJOURNEYS:\n"+allPlans.map(p=>{const d=p.tasks?.filter(t=>t.done).length||0;return`- "${p.title}" (${p.date||"no date"}, ${d}/${p.tasks?.length||0} done)`;}).join("\n"):"";
    const calCtx=calData?.length>0?"\n\nCALENDAR:\n"+calData.slice(0,10).map(e=>{const d=new Date(e.start);return`- ${d.toLocaleDateString()} ${e.allDay?"all day":d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}: ${e.title}`;}).join("\n"):"";
    const profileCtx=profile?.setup?`\nAge: ${profile.setup.age||"?"} | Gender: ${profile.setup.gender||"?"}`:"";
    // Cross-segment context summary
    const otherSegs=SEG_KEYS.filter(s=>s!==segment);
    const crossCtx=otherSegs.map(s=>{const msgs=chats[s]||[];if(!msgs.length)return"";const last=msgs.filter(m=>m.role==="user").slice(-2).map(m=>m.content).join(", ");return last?`\nIn ${SEGMENTS[s].label}: recently discussed "${last.slice(0,80)}"`:"";}).filter(Boolean).join("");

    try{
      const apiMsgs=segChat.slice(-20).map(m=>({role:m.role,content:m.content}));
      const sysPrompt=SYSTEM_PROMPT+`\n\nCURRENT SEGMENT: ${SEGMENTS[segment].label} (${SEGMENTS[segment].desc})\nFocus on ${SEGMENTS[segment].label.toLowerCase()} topics, but use knowledge from all segments.\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}${profileCtx}${prefText}${stravaText}${stepsCtx}${lovedCtx}${plansCtx}${calCtx}${crossCtx}`;

      let finalText="",currentMsgs=[...apiMsgs],attempts=0;
      while(attempts<3){attempts++;
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,tools:[{type:"web_search_20250305",name:"web_search"}],system:sysPrompt,messages:currentMsgs})});
        const data=await res.json();
        if(!data.content){finalText="Let me try that again.";break;}
        for(const block of data.content)if(block.type==="text"&&block.text)finalText+=block.text+"\n";
        if(data.stop_reason==="end_turn"||data.stop_reason==="stop")break;
        if(data.stop_reason==="tool_use"){currentMsgs.push({role:"assistant",content:data.content});const tr=[];for(const b of data.content)if(b.type==="tool_use")tr.push({type:"tool_result",tool_use_id:b.id,content:"Search done. Create specific steps/journeys with links."});if(tr.length)currentMsgs.push({role:"user",content:tr});finalText="";continue;}
        break;
      }

      const raw=finalText.trim()||"Let me think...";
      let displayText=raw,newSteps=[...allSteps],newPlans=[...allPlans],newPrefs=[...preferences];
      let jsonStr=null;
      if(raw.includes("---DATA---")){const p=raw.split("---DATA---");displayText=p[0].trim();jsonStr=p[1]?.trim();}
      else{const m=raw.match(/\[[\s\S]*?"type"\s*:\s*"(step|plan|preference|delete_step|delete_plan)"[\s\S]*?\]/);if(m){displayText=raw.slice(0,raw.indexOf(m[0])).trim();jsonStr=m[0];}}
      if(jsonStr){try{jsonStr=jsonStr.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();const items=JSON.parse(jsonStr);for(const item of(Array.isArray(items)?items:[items])){
        if(item.type==="step")newSteps=[{...item,status:"active",id:Date.now()+Math.random(),createdAt:new Date().toISOString()},...newSteps];
        else if(item.type==="plan")newPlans=[{...item,tasks:(item.tasks||[]).map(t=>({...t,done:false}))},...newPlans.filter(p=>p.title!==item.title)];
        else if(item.type==="preference")newPrefs=[...newPrefs.filter(p=>p.key!==item.key),item];
        else if(item.type==="delete_step")newSteps=newSteps.filter(s=>!s.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
        else if(item.type==="delete_plan")newPlans=newPlans.filter(p=>!p.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
      }setAllSteps(newSteps);setAllPlans(newPlans);setPreferences(newPrefs);}catch(e){console.error("Parse:",e);}}

      displayText=displayText.replace(/\[[\s\S]*?"type"\s*:[\s\S]*?\]/g,"").trim();
      if(!displayText)displayText=newSteps.length>allSteps.length?"Here's what I found!":newPlans.length>allPlans.length?"Journey mapped out!":"Let me know what you think.";

      const finalChat={...newChats,[segment]:[...(newChats[segment]||[]),{role:"assistant",content:clean(displayText),ts:Date.now()}]};
      setChats(finalChat);persist(profile,newSteps,newPlans,finalChat,newPrefs);
      if(newSteps.length>allSteps.length||newPlans.length>allPlans.length)setTimeout(()=>setView("steps"),600);
    }catch(err){console.error(err);const errChat={...newChats,[segment]:[...(newChats[segment]||[]),{role:"assistant",content:"Quick hiccup \u2014 say that again?",ts:Date.now()}]};setChats(errChat);}
    setLoading(false);
  };

  const deleteStep=id=>{const u=allSteps.filter(s=>s.id!==id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const markStep=(id,st)=>{if(st==="done")setFeedbackStep(allSteps.find(s=>s.id===id));const u=allSteps.map(s=>s.id===id?{...s,status:st}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const loveStep=id=>{const step=allSteps.find(s=>s.id===id);const u=allSteps.map(s=>s.id===id?{...s,loved:!s.loved}:s);setAllSteps(u);if(step&&!step.loved){const pref={key:`loved_${step.category||"general"}`,value:`Loved "${step.title}"`};const np=[...preferences.filter(p=>p.key!==pref.key),pref];setPreferences(np);persist(profile,u,allPlans,chats,np);}else persist(profile,u,allPlans,chats,preferences);};
  const submitFeedback=()=>{if(!feedbackText.trim()||!feedbackStep)return;sendMessage(`Completed "${feedbackStep.title}": ${feedbackText.trim()}`);setFeedbackStep(null);setFeedbackText("");setView("chat");};
  const deletePlan=idx=>{const u=allPlans.filter((_,i)=>i!==idx);setAllPlans(u);persist(profile,allSteps,u,chats,preferences);};
  const toggleTask=(pi,ti)=>{const u=allPlans.map((p,i)=>i===pi?{...p,tasks:p.tasks.map((t,j)=>j===ti?{...t,done:!t.done}:t)}:p);setAllPlans(u);persist(profile,allSteps,u,chats,preferences);};
  const talkAbout=text=>{setView("chat");setTimeout(()=>{inputRef.current?.focus();sendMessage(text);},100);};
  const handleAddCal=async(title,why,time)=>{if(!calToken){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});const ok=await addGCalEvent(r.access_token,title,why,time);alert(ok?"Added to Calendar!":"Couldn't add.");});return;}const ok=await addGCalEvent(calToken,title,why,time);alert(ok?"Added to Calendar!":"Try reconnecting calendar.");};
  const resetAll=async()=>{const uid=getUserId(profile);if(uid){deleteFB(uid,"appdata");deleteFB(uid,"strava");deleteFB(uid,"calendar");}localStorage.removeItem("mns_last_user");setProfile(null);setAllSteps([]);setAllPlans([]);setChats({work:[],me:[],social:[]});setPreferences([]);setStravaData(null);setCalData(null);setScreen("auth");setShowSettings(false);};

  // Expiration check
  useEffect(()=>{const now=new Date(),h=now.getHours();let changed=false;const u=allSteps.map(s=>{if(s.status!=="active")return s;const t=(s.time||"").toLowerCase(),age=s.createdAt?(Date.now()-new Date(s.createdAt).getTime())/36e5:0;if((age>48)||(t.includes("tonight")&&age>14)||(t.includes("today")&&age>24)){changed=true;return{...s,status:"expired"};}return s;});if(changed){setAllSteps(u);persist(profile,u,allPlans,chats,preferences);}},[allSteps.length]);

  if(screen==="auth")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><AuthScreen onAuth={handleAuth}/></div>);
  if(screen==="setup")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup}/></div>);
  if(screen==="deepprofile")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepFinish} existingInsights={profile?.insights||[]}/></div>);

  const segInfo=SEGMENTS[segment]||{label:"Everything",icon:"\u{1F4C5}",color:C.acc};
  const bubble=u=>({...F,maxWidth:"82%",padding:"13px 18px",borderRadius:20,fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",...(u?{background:C.accGrad,color:"#fff",borderBottomRightRadius:6}:{background:C.card,color:C.t1,borderBottomLeftRadius:6,boxShadow:C.shadow})});

  return(
    <div style={{...F,height:"100vh",color:C.t1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
      <style>{font}{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes dpb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>

      {/* Feedback modal */}
      {feedbackStep&&(<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"100%",maxWidth:420,background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
        <div style={{...F,fontSize:12,color:C.acc,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>How did it go?</div>
        <div style={{...H,fontSize:20,color:C.t1,marginBottom:16}}>{feedbackStep.title}</div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{["Loved it!","It was okay","Not for me","Too expensive","Too far","More like this"].map(q=>(<button key={q} onClick={()=>setFeedbackText(q)} style={{...F,padding:"8px 14px",borderRadius:12,fontSize:13,cursor:"pointer",background:feedbackText===q?C.accSoft:C.cream,border:`1.5px solid ${feedbackText===q?C.acc:C.b2}`,color:feedbackText===q?C.acc:C.t2}}>{q}</button>))}</div>
        <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} rows={2} placeholder="Or type..." style={{...F,width:"100%",padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.b2}`,background:C.bg,color:C.t1,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:14}}/>
        <div style={{display:"flex",gap:10}}><button onClick={()=>{setFeedbackStep(null);setFeedbackText("");}} style={{...F,flex:1,padding:12,borderRadius:16,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:14,cursor:"pointer"}}>Skip</button><button onClick={submitFeedback} disabled={!feedbackText.trim()} style={{...F,flex:1,padding:12,borderRadius:16,border:"none",fontSize:14,fontWeight:600,cursor:feedbackText.trim()?"pointer":"default",background:feedbackText.trim()?C.accGrad:"rgba(0,0,0,0.04)",color:feedbackText.trim()?"#fff":C.t3}}>Submit</button></div>
      </div></div>)}

      {/* Top header */}
      <div style={{padding:"14px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div><div style={{...F,fontSize:12,color:C.t3}}>{getGreeting()},</div><div style={{...H,fontSize:22,color:C.t1}}>{profile?.name}</div></div>
        <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{"\u2699\uFE0F"}</button>
      </div>

      {/* Segment selector */}
      <div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:4}}>
        {[...SEG_KEYS,"everything"].map(s=>{const info=SEGMENTS[s]||{label:"Everything",icon:"\u{1F4C5}",color:C.acc};const active=segment===s;const count=s==="everything"?allSteps.filter(x=>x.status==="active").length:allSteps.filter(x=>x.status==="active"&&catToSeg(x.category)===s).length;
          return(<button key={s} onClick={()=>{setSegment(s);setExpandedPlan(null);}} style={{...F,flex:1,padding:"10px 4px",background:active?C.card:"transparent",border:active?`1.5px solid ${info.color}30`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",fontSize:12,fontWeight:active?600:400,color:active?info.color:C.t3,boxShadow:active?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.2s"}}>
            <span style={{fontSize:14}}>{info.icon}</span>{info.label}{count>0&&<span style={{fontSize:9,background:active?info.color+"15":C.cream,color:info.color,padding:"1px 5px",borderRadius:6,fontWeight:700}}>{count}</span>}
          </button>);
        })}
      </div>

      {/* Sub-tabs: Steps / Chat */}
      {segment!=="everything"&&<div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:6}}>
        {[{id:"steps",label:"Steps & Journeys"},{id:"chat",label:"Coach"}].map(t=>(<button key={t.id} onClick={()=>{setView(t.id);if(t.id==="chat")setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,flex:1,padding:"10px 0",background:view===t.id?C.card:"transparent",border:view===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:view===t.id?600:400,color:view===t.id?C.t1:C.t3,boxShadow:view===t.id?C.shadow:"none",transition:"all 0.15s"}}>{t.label}</button>))}
      </div>}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* STEPS & JOURNEYS VIEW */}
        {(view==="steps"||segment==="everything")&&(
          <div style={{flex:1,overflowY:"auto",padding:"8px 20px 80px"}}>
            {segSteps.length===0&&segPlans.length===0?(
              <FadeIn><div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:segInfo.soft||C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{segInfo.icon}</div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>Nothing here yet</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:260,margin:"0 auto 20px"}}>{segment==="everything"?"Start chatting in any segment to get steps and journeys.":`Chat with your coach about ${segInfo.desc.toLowerCase()}.`}</div>
                {segment!=="everything"&&<button onClick={()=>{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,padding:"12px 28px",borderRadius:14,border:"none",fontSize:15,fontWeight:600,cursor:"pointer",background:C.accGrad,color:"#fff"}}>Start chatting {"\u2192"}</button>}
              </div></FadeIn>
            ):(<>
              {segSteps.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Steps ({segSteps.length})</div>
                {segSteps.slice(0,segment==="everything"?10:5).map((step,i)=><StepCard key={step.id} step={step} onDone={id=>markStep(id,"done")} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} delay={i*50}/>)}
                {segSteps.length>(segment==="everything"?10:5)&&<div style={{...F,fontSize:12,color:C.t3,textAlign:"center",padding:"8px 0"}}>+{segSteps.length-(segment==="everything"?10:5)} more steps</div>}
              </div>}
              {segPlans.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Journeys ({segPlans.length})</div>
                {segPlans.slice(0,segment==="everything"?allPlans.length:2).map((plan,pi)=><JourneyCard key={pi} plan={plan} pi={allPlans.indexOf(plan)} open={expandedPlan===allPlans.indexOf(plan)} onToggle={i=>setExpandedPlan(expandedPlan===i?null:i)} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} delay={pi*50}/>)}
                {segment!=="everything"&&segPlans.length>2&&<button onClick={()=>setSegment("everything")} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",padding:"8px 0",width:"100%",textAlign:"center"}}>View all journeys</button>}
              </div>}
              {segment==="everything"&&doneSteps.length>0&&<div><div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Completed ({doneSteps.length})</div>{doneSteps.slice(0,5).map(s=>(<div key={s.id} style={{padding:"12px 16px",borderRadius:14,marginBottom:6,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,display:"flex",alignItems:"center",gap:10,opacity:.5}}><span style={{color:C.teal}}>{"\u2713"}</span><span style={{...F,fontSize:13,textDecoration:"line-through",color:C.t2,flex:1}}>{s.title}</span></div>))}</div>}
            </>)}
          </div>
        )}

        {/* CHAT VIEW */}
        {view==="chat"&&segment!=="everything"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"10px 20px"}}>
            {(chats[segment]||[]).map((msg,i)=>(
              <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:10}}>
                {msg.role!=="user"&&<div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0,marginRight:10,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>{"\u{1F463}"}</div>}
                <div style={bubble(msg.role==="user")}>{msg.content}</div>
              </div>
            ))}
            {loading&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/></div>
              <div style={{...F,fontSize:14,color:C.t3,fontStyle:"italic"}}>Thinking...</div>
            </div>}
            <div ref={chatEnd}/>
          </div>
          <div style={{padding:"6px 20px 16px",flexShrink:0}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <textarea ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,150)+"px";}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={`Ask about ${segInfo.label.toLowerCase()}...`} rows={1} style={{...F,flex:1,padding:"13px 18px",fontSize:15,borderRadius:18,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow,resize:"none",maxHeight:150,lineHeight:1.5}} onFocus={e=>{e.target.style.borderColor=segInfo.color;e.target.style.boxShadow=`0 0 0 3px ${segInfo.color}15`;}} onBlur={e=>{e.target.style.borderColor=C.b2;e.target.style.boxShadow=C.shadow;}}/>
              <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:46,height:46,borderRadius:16,border:"none",flexShrink:0,cursor:input.trim()&&!loading?"pointer":"default",background:input.trim()&&!loading?C.accGrad:"rgba(0,0,0,0.04)",color:input.trim()&&!loading?"#fff":C.t3,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:1}}>{"\u2191"}</button>
            </div>
            {input.length>50&&<div style={{...F,fontSize:11,color:C.t3,marginTop:6,textAlign:"right"}}>Shift+Enter for new line</div>}
          </div>
        </>)}
      </div>

      {/* Simple settings overlay */}
      {showSettings&&(<div style={{position:"fixed",inset:0,zIndex:200,background:C.bg,overflowY:"auto",padding:20}}><div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}><h2 style={{...H,fontSize:26,color:C.t1,margin:0}}>Settings</h2><button onClick={()=>setShowSettings(false)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:C.t3}}>{"\u00D7"}</button></div>
        <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow,marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:52,height:52,borderRadius:16,background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",fontWeight:700}}>{profile?.name?.charAt(0)?.toUpperCase()}</div>
          <div><div style={{...H,fontSize:18,color:C.t1}}>{profile?.name}</div><div style={{...F,fontSize:13,color:C.t3}}>{profile?.email}</div><div style={{...F,fontSize:11,color:C.t3}}>{profile?.setup?.location}</div></div>
        </div>
        <button onClick={()=>{setShowSettings(false);setScreen("deepprofile");}} style={{...F,width:"100%",padding:"16px 20px",borderRadius:16,background:C.accSoft,border:`1px solid ${C.accBorder}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",marginBottom:16}}><span style={{fontSize:18}}>{"\u{1F4AC}"}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.acc}}>Go deeper with coach</div><div style={{fontSize:12,color:C.t3}}>{profile?.insights?.length||0} insights</div></div></button>
        <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Connections</div>
        <div style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow,marginBottom:8,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}>{"\u{1F3C3}"}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500}}>{stravaData?"Strava connected":"Strava"}</div></div>{stravaData?<button onClick={async()=>{deleteFB(getUserId(profile),"strava");setStravaData(null);}} style={{...F,fontSize:12,padding:"6px 14px",borderRadius:10,background:"rgba(220,60,60,0.04)",color:"#DC3C3C",border:"1px solid rgba(220,60,60,0.1)",cursor:"pointer"}}>Disconnect</button>:<button onClick={connectStrava} style={{...F,fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,background:C.accSoft,color:C.acc,border:`1px solid ${C.accBorder}`,cursor:"pointer"}}>Connect</button>}</div>
        <div style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow,marginBottom:16,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}>{"\u{1F4C5}"}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500}}>{calData?"Calendar connected":"Google Calendar"}</div></div>{calData?<button onClick={async()=>{deleteFB(getUserId(profile),"calendar");setCalData(null);setCalToken(null);}} style={{...F,fontSize:12,padding:"6px 14px",borderRadius:10,background:"rgba(220,60,60,0.04)",color:"#DC3C3C",border:"1px solid rgba(220,60,60,0.1)",cursor:"pointer"}}>Disconnect</button>:<button onClick={()=>connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);saveFB(getUserId(profile),"calendar",{token:r.access_token,events:ev});})} style={{...F,fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,background:"rgba(66,133,244,0.06)",color:"#4285F4",border:"1px solid rgba(66,133,244,0.1)",cursor:"pointer"}}>Connect</button>}</div>
        <button onClick={resetAll} style={{...F,width:"100%",padding:"14px",borderRadius:14,background:"rgba(220,60,60,0.04)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",fontSize:14,cursor:"pointer"}}>Sign out</button>
      </div></div>)}
    </div>
  );
}
