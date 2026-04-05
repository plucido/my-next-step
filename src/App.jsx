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
  career: { label: "Career", icon: "\u{1F680}", color: "#6D28D9", soft: "#EDE9FE", desc: "Work, professional growth, side hustles, networking" },
  wellness: { label: "Health", icon: "\u{1F33F}", color: "#0F766E", soft: "#E6F7F5", desc: "Fitness, health, habits, self-care, mental health" },
  fun: { label: "Fun", icon: "\u{1F389}", color: "#DB2777", soft: "#FCE7F3", desc: "Friends, dating, events, hobbies, going out" },
  adventure: { label: "Adventure", icon: "\u{1F30D}", color: "#D97706", soft: "#FEF3C7", desc: "Trips, travel, bucket list, new experiences" },
};
const SEG_KEYS = ["career", "wellness", "fun", "adventure"];
// Map AI categories to segments
const catToSeg = c => {
  if (["career", "learning", "products"].includes(c)) return "career";
  if (["fitness", "wellness"].includes(c)) return "wellness";
  if (["social", "events"].includes(c)) return "fun";
  if (["travel"].includes(c)) return "adventure";
  return "wellness"; // default
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
function clean(text){if(!text)return text;let t=text;
  // Strip markdown
  t=t.replace(/\*\*\*(.*?)\*\*\*/g,"$1");t=t.replace(/\*\*(.*?)\*\*/g,"$1");t=t.replace(/\*(.*?)\*/g,"$1");
  t=t.replace(/^#{1,6}\s+/gm,"");t=t.replace(/`([^`]+)`/g,"$1");t=t.replace(/```[\s\S]*?```/g,"");
  t=t.replace(/_{2}(.*?)_{2}/g,"$1");t=t.replace(/~{2}(.*?)~{2}/g,"$1");t=t.replace(/\[([^\]]+)\]\([^)]+\)/g,"$1");
  // Strip ALL CAPS HEADERS like "FLIGHTS:", "PERFECT TIMING:", "HOTELS:"
  t=t.replace(/^[A-Z][A-Z\s]{2,}:\s*/gm,"");
  // Strip bullets and list markers
  t=t.replace(/^[\u2022\-\*]\s*/gm,"");t=t.replace(/^\d+[.)]\s*/gm,"");
  // Strip orphaned punctuation lines (citation artifacts)
  t=t.replace(/^\s*[.!]\s*$/gm,"");
  // Strip citation markers like [1], [2] etc
  t=t.replace(/\[\d+\]/g,"");
  // Collapse excessive whitespace
  t=t.replace(/\n{3,}/g,"\n\n");t=t.replace(/^\s+$/gm,"");
  return t.trim();}

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
const SYSTEM_PROMPT=`You are the AI engine behind "My Next Step" \u2014 a warm life guide app.

The app has 4 segments: Career, Health (wellness/fitness), Fun, Adventure. You're chatting in one segment but know everything across all.

CRITICAL FORMAT RULES:
- ABSOLUTELY NO MARKDOWN EVER. No asterisks, no bold (**), no bullets (\u2022), no headers (#), no numbered lists, no colons followed by lists. PLAIN CONVERSATIONAL TEXT ONLY.
- Write like you're texting a friend. Short sentences. Line breaks between ideas.
- Keep your chat response to 2-3 SHORT sentences max. The step/journey cards show all the detail.
- DO NOT dump research findings as a wall of text. Put specific recommendations into steps and journey tasks instead.

BAD (never do this):
"FLIGHTS: United runs $1,122... HOTELS: \u2022 San Firenze Suites..."

GOOD (do this):
"Ooh Florence in September is dreamy! I found some great flights and hotels for you \u2014 check out the cards below."
Then put the actual recommendations in ---DATA--- as steps/journeys.

THE TWO-MESSAGE RULE:
- If the user EXPLICITLY asks for a step, journey, plan, or recommendation: CREATE or UPDATE one IMMEDIATELY in your FIRST response. No questions. Just do it.
- If the user's intent is clear ("plan a trip to Florence", "I want to start running"): CREATE or UPDATE IMMEDIATELY. First response. No questions.
- If it's vague ("I'm bored", "help me"): Ask ONE clarifying question, then on their next message, you MUST create or update a step/journey. Maximum two exchanges before a card appears or changes.
- For expensive things (trips, gear, classes): Ask about budget AND create a preliminary step/journey in the SAME response. "What's your budget? Here's a starting point you can adjust:" then ---DATA---.
- NEVER go three exchanges without creating or updating something. That's a failure.
- If the conversation is about an existing step or journey, UPDATE it (output it with the same title to replace it, or delete the old and create a new one). Don't just talk about it.

ALWAYS CREATE STEPS OR JOURNEYS:
- Every response that discusses doing something MUST include ---DATA---.
- If you searched the web, put findings INTO cards, not chat text.
- Trip = journey. Class/restaurant/event = step. Always.
- If the user is just chatting/venting with no action needed, you can skip ---DATA---.
- When in doubt, CREATE. Users can dismiss what they don't want.

SPECIFICITY:
- Every step and journey task must name a SPECIFIC place, price, and link. Never "Book a hotel" \u2014 instead "Book Hotel Brunelleschi, ~$350/night, Duomo views".
- Use web search to find real options.

BUDGET: Ask naturally when relevant. Store as preference.

ALLERGIES & DIETARY RESTRICTIONS (when health profile has them):
- ALWAYS check the user's allergies and dietary preferences before recommending restaurants, food experiences, or meal plans.
- If they have Gluten-free/Celiac, NEVER recommend places without GF options. Search for "gluten free [cuisine] [location]".
- If they have food allergies, mention it when creating restaurant steps: "They have GF options and can accommodate nut allergies."
- For dietary preferences (vegan, keto, etc.), filter recommendations accordingly.
- When in doubt about a restaurant's allergy accommodations, note it: "Call ahead to confirm they can handle your [allergy]."

HEALTH ASSISTANT (only when user has health enabled):
- Help users find the RIGHT type of doctor for their symptoms. Use web search to find highly-rated, in-network options near them.
- Always ask about their insurance if you don't know it. Store as preference.
- HMO plans require a PCP referral before seeing a specialist. If user has HMO, ALWAYS create TWO steps: one to call PCP for referral, one for the specialist appointment.
- PPO/EPO/POS plans can go directly to specialists.
- Search Zocdoc, Healthgrades, or Google for "[specialist type] [insurance provider] [location]" to find in-network doctors.
- Include doctor ratings, distance, and direct booking links in steps.
- Explain copay vs deductible simply when relevant.
- You are NOT a medical professional. Never diagnose. Help them find the right provider.
- Create steps for appointments with booking links, not just advice.

FITNESS COACHING (only when user has health enabled):
- Use their fitness level, goals, workout preferences, frequency, and injuries to build personalized routines.
- For beginners: start simple, 3 exercises per muscle group, emphasize form over weight. Create a journey with a weekly plan.
- For intermediate/advanced: more complex splits, progressive overload, periodization.
- Always respect injuries. If they have a bad knee, no heavy squats \u2014 suggest alternatives.
- Create SPECIFIC workout steps: "Upper body push day: bench press 3x10, OHP 3x8, tricep dips 3x12" not vague "do some chest exercises."
- Build workout journeys with weekly schedules as tasks.
- If they like classes, search for specific classes near them (CrossFit boxes, yoga studios, etc.) with prices.
- Connect their Strava data if available \u2014 use running stats to recommend appropriate running plans.
- Suggest rest days based on their frequency preference.

MANAGING ITEMS:
- Delete old steps/journeys when conversation shifts.
- To update a journey, output it with the SAME title \u2014 it replaces the old one.
- Loved steps = strong signal, recommend more like them.

IMPROVING USER IDEAS:
- When a user shares a vague idea ("I should work out more", "maybe learn to cook"), don't just agree. ENHANCE it into something specific and actionable.
- Turn "I should work out" into a specific class recommendation with time, place, and price.
- Turn "learn to cook" into a specific cooking class or a structured journey with weekly tasks.
- Always make their ideas BETTER and more concrete than what they said.

ROUTINES (recurring activities):
- When the user wants something ongoing (weekly workouts, Saturday adventures, daily meditation, monthly book club), create a ROUTINE not a step.
- A routine has: title, description, schedule (daily/weekly/biweekly/monthly), day(s) of week, category, and a "generateBefore" hint (how many days before to generate a fresh step).
- Example: "Find me something fun every Saturday" = routine that generates a fresh step every Thursday with a specific Saturday activity.
- Example: "Weekly upper body workout" = routine that generates a workout step every week.
- The user can pause/resume routines. Paused routines stop generating steps.
- Output format: {"type":"routine","title":"Saturday Adventure","description":"Find a fun new activity every Saturday","schedule":"weekly","days":["saturday"],"category":"events","generateBefore":2}

OUTPUT FORMAT:
EVERY response must follow this pattern:
1. One to two casual sentences (the chat bubble)
2. The literal text ---DATA---
3. A JSON array with steps/journeys

If you discuss ANY activity, place, class, trip, event, or recommendation, you MUST create a step or journey for it. NO EXCEPTIONS.
If you ask the user a question and don't have enough info yet, that's the ONLY time you can skip ---DATA---.

Example 1 - simple step:
Nice, yoga is a great call! Here's one near you.

---DATA---
[{"type":"step","title":"7pm Vinyasa at Black Swan Yoga","why":"$15 drop-in, 10 min away on Westheimer, beginner-friendly","link":"https://www.google.com/maps/search/Black+Swan+Yoga+Houston","linkText":"Get directions","category":"fitness","time":"Tonight 7pm"}]

Example 2 - journey:
Florence in September is dreamy! Here's your trip.

---DATA---
[{"type":"plan","title":"Florence Romantic Getaway","date":"Sep 15-22, 2026","tasks":[{"title":"Book Alaska/Condor flight HOU-FLR, ~$893 roundtrip","links":[{"label":"Google Flights","url":"https://www.google.com/travel/flights?q=flights+houston+to+florence+september+2026"}]},{"title":"Book Hotel Brunelleschi, ~$350/night, Duomo views","links":[{"label":"Booking.com","url":"https://www.booking.com/searchresults.html?ss=Hotel+Brunelleschi+Florence"}]}]}]

Example 3 - multiple steps:
Here are a few things to try this week!

---DATA---
[{"type":"step","title":"Morning run at Memorial Park","why":"Free, 3-mile loop, shaded trail","link":"https://www.google.com/maps/search/Memorial+Park+Running+Trail+Houston","linkText":"Map","category":"fitness","time":"Tomorrow 7am"},{"type":"step","title":"Try Uchi Houston for dinner","why":"Japanese farmhouse cuisine, $$$, incredible omakase","link":"https://www.google.com/search?q=Uchi+Houston+reservation","linkText":"Reserve","category":"social","time":"Friday evening"}]

Example 4 - routine (recurring):
I'll set up a weekly workout routine for you!

---DATA---
[{"type":"routine","title":"Weekly Upper Body Day","description":"Push-pull upper body split: bench press 3x10, bent rows 3x10, OHP 3x8, pull-ups 3x8, tricep dips 3x12","schedule":"weekly","days":["monday"],"category":"fitness","generateBefore":1}]

Types: step, plan (journey), routine, delete_step, delete_plan, delete_routine, preference
The step/journey cards ARE the product. Text without ---DATA--- is a failed response.`;

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
    <p style={{...F,fontSize:17,color:C.t2,lineHeight:1.6,maxWidth:310,margin:"0 auto 44px"}}>Your AI guide that turns goals into clear, actionable steps.</p>
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
function StepCard({step,onDone,onDelete,onLove,onTalk,onAddCal,onShare,delay=0}){
  const seg=SEGMENTS[catToSeg(step.category)];
  return(<FadeIn delay={delay}><div style={{padding:"18px 20px",borderRadius:18,marginBottom:10,background:C.card,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${seg?.color||C.acc}`}}>
    <button onClick={()=>onDelete(step.id)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}>{"\u00D7"}</button>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{fontSize:14}}>{catIcon(step.category)}</span>
      <span style={{...F,fontSize:10,fontWeight:700,color:seg?.color||C.acc,textTransform:"uppercase",letterSpacing:1.5}}>{step.category}</span>
      {step.recurring&&<span style={{...F,fontSize:9,fontWeight:600,color:C.teal,background:C.tealSoft,padding:"2px 6px",borderRadius:5}}>{step.recurring}</span>}
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
      <button onClick={()=>onTalk(`Make "${step.title}" even better. Find a more specific, exciting, or well-reviewed option. Upgrade it.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>{"\u2728"} Make better</button>
      <button onClick={()=>onTalk(`Find alternative to "${step.title}" with prices and details.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Alternative</button>
      <button onClick={()=>onShare(step)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>{"\u{1F4E4}"} Share</button>
      {step.time&&<button onClick={()=>onAddCal(step.title,step.why,step.time)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.1)",color:"#4285F4",cursor:"pointer"}}>{"\u{1F4C5}"} Calendar</button>}
    </div>
  </div></FadeIn>);
}

// ─── JOURNEY CARD ───
function JourneyCard({plan,pi,open,onToggle,onDelete,onTalk,onToggleTask,onShare,delay=0}){
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
        <button onClick={()=>onTalk(`Make my "${plan.title}" journey even better. Upgrade the tasks with better options, add anything I'm missing.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t3,cursor:"pointer"}}>{"\u2728"} Improve</button>
        <button onClick={()=>onShare(plan)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t3,cursor:"pointer"}}>{"\u{1F4E4}"} Share</button>
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

// ─── ROUTINE CARD ───
function RoutineCard({routine,onPause,onDelete,onTalk,delay=0}){
  const seg=SEGMENTS[catToSeg(routine.category)];
  const days=(routine.days||[]).map(d=>d.slice(0,3).charAt(0).toUpperCase()+d.slice(1,3)).join(", ");
  return(<FadeIn delay={delay}><div style={{padding:"16px 18px",borderRadius:18,marginBottom:10,background:routine.paused?"rgba(0,0,0,0.02)":C.card,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${routine.paused?C.t3:seg?.color||C.teal}`,opacity:routine.paused?.5:1}}>
    <button onClick={()=>onDelete(routine.id)} style={{position:"absolute",top:12,right:12,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14}}>{"\u00D7"}</button>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{fontSize:14}}>{"\u{1F504}"}</span>
      <span style={{...F,fontSize:10,fontWeight:700,color:seg?.color||C.teal,textTransform:"uppercase",letterSpacing:1.5}}>{routine.schedule}</span>
      {days&&<span style={{...F,fontSize:10,color:C.t3}}>{days}</span>}
      {routine.paused&&<span style={{...F,fontSize:9,fontWeight:600,color:C.gold,background:C.goldSoft,padding:"2px 6px",borderRadius:5}}>Paused</span>}
    </div>
    <div style={{...F,fontSize:15,fontWeight:600,color:C.t1,lineHeight:1.4,marginBottom:4,paddingRight:24}}>{routine.title}</div>
    {routine.description&&<div style={{...F,fontSize:13,color:C.t2,lineHeight:1.55,marginBottom:12}}>{routine.description}</div>}
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      <button onClick={()=>onPause(routine.id)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:routine.paused?C.tealSoft:C.cream,border:routine.paused?`1px solid ${C.tealBorder}`:"none",color:routine.paused?C.teal:C.t2,cursor:"pointer",fontWeight:routine.paused?600:400}}>{routine.paused?"Resume":"Pause"}</button>
      <button onClick={()=>onTalk(`Generate a fresh step for my "${routine.title}" routine. Search for something specific and new.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.accSoft,border:`1px solid ${C.accBorder}`,color:C.acc,cursor:"pointer",fontWeight:600}}>Generate now</button>
      <button onClick={()=>onTalk(`Update my "${routine.title}" routine. Make it better or change the schedule.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>{"\u2728"} Improve</button>
    </div>
  </div></FadeIn>);
}

// ─── MAIN APP ───
export default function App(){
  const[screen,setScreen]=useState("auth");
  const[profile,setProfile]=useState(null);
  const[segment,setSegment]=useState("wellness"); // work, me, social, everything
  const[view,setView]=useState("steps"); // steps, chat
  const[allSteps,setAllSteps]=useState([]);
  const[allPlans,setAllPlans]=useState([]);
  const[allRoutines,setAllRoutines]=useState([]);
  const[preferences,setPreferences]=useState([]);
  // Per-segment chat histories
  const[chats,setChats]=useState({career:[],wellness:[],fun:[],adventure:[]});
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[expandedPlan,setExpandedPlan]=useState(null);
  const[feedbackStep,setFeedbackStep]=useState(null);
  const[feedbackText,setFeedbackText]=useState("");
  const[missedStep,setMissedStep]=useState(null);
  const[missedReason,setMissedReason]=useState("");
  const[stravaData,setStravaData]=useState(null);
  const[calData,setCalData]=useState(null);
  const[calToken,setCalToken]=useState(null);
  const[showSettings,setShowSettings]=useState(false);
  const[settingsTab,setSettingsTab]=useState("profile");
  const[editField,setEditField]=useState(null);
  const[editVal,setEditVal]=useState("");
  const[genderEdit,setGenderEdit]=useState("");
  const[genderOtherEdit,setGenderOtherEdit]=useState("");
  const[legalModal,setLegalModal]=useState(null);
  const[deleteConfirm,setDeleteConfirm]=useState(false);
  const[deleteText,setDeleteText]=useState("");
  const chatEnd=useRef(null);const inputRef=useRef(null);

  // Normalize chats from old format (work/me/social) to new (career/wellness/fun/adventure)
  const normalizeChats = (ch) => {
    if (!ch) return {career:[],wellness:[],fun:[],adventure:[]};
    return {
      career: ch.career || ch.work || [],
      wellness: ch.wellness || ch.me || [],
      fun: ch.fun || ch.social || [],
      adventure: ch.adventure || [],
    };
  };

  // Current segment's data
  const segSteps=segment==="everything"?allSteps.filter(s=>s.status==="active"):allSteps.filter(s=>s.status==="active"&&catToSeg(s.category)===segment);
  const segPlans=segment==="everything"?allPlans:allPlans.filter(p=>{const cats=(p.tasks||[]).map(t=>t.category).filter(Boolean);if(cats.length)return cats.some(c=>catToSeg(c)===segment);const title=(p.title||"").toLowerCase();if(["career","work","job","interview","resume","linkedin"].some(w=>title.includes(w)))return segment==="career";if(["gym","yoga","run","health","diet","meditation"].some(w=>title.includes(w)))return segment==="wellness";if(["friend","party","dinner","concert","group","date"].some(w=>title.includes(w)))return segment==="fun";if(["trip","travel","flight","hotel","vacation","hike","explore"].some(w=>title.includes(w)))return segment==="adventure";return segment==="wellness";});
  const segRoutines=segment==="everything"?allRoutines:allRoutines.filter(r=>catToSeg(r.category)===segment);
  const segMessages=segment==="everything"?[...(chats.career||[]),...(chats.wellness||[]),...(chats.fun||[]),...(chats.adventure||[])].sort((a,b)=>(a.ts||0)-(b.ts||0)):chats[segment]||[];
  const doneSteps=allSteps.filter(s=>s.status==="done");
  const expiredSteps=allSteps.filter(s=>s.status==="expired");

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[segMessages.length,loading]);

  // Strava OAuth redirect
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const code=p.get("code");if(code&&p.get("scope")?.includes("read")){window.history.replaceState({},"",window.location.pathname);exchStrava(code).then(async d=>{if(d?.access_token){const pr=await fetchStrava(d.access_token);const full={...d,profile:pr};setStravaData(full);const uid=getUserId(profile);if(uid)saveFB(uid,"strava",full);}});}},[]);

  // Load data
  useEffect(()=>{(async()=>{
    try{const hint=localStorage.getItem("mns_last_user");if(hint){
      const data=await loadFB(hint,"appdata");
      if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setAllRoutines(data.routines||[]);setChats(normalizeChats(data.chats));setPreferences(data.preferences||[]);setScreen("main");}
      const sv=await loadFB(hint,"strava");if(sv)setStravaData(sv);
      const cv=await loadFB(hint,"calendar");if(cv){setCalToken(cv.token);setCalData(cv.events);}
    }}catch{}
    // Migration from old format
    try{const s=await window.storage.get("mns-v11");if(s){const d=JSON.parse(s.value);if(d.profile?.setup){setProfile(d.profile);setAllSteps(d.steps||[]);setAllPlans(d.plans||[]);setChats({career:[],wellness:d.messages||[],fun:[],adventure:[]});setPreferences(d.preferences||[]);setScreen("main");const uid=getUserId(d.profile);if(uid){saveFB(uid,"appdata",{...d,chats:{career:[],wellness:d.messages||[],fun:[],adventure:[]}});window.storage.delete("mns-v11").catch(()=>{});}}}}catch{}
  })();},[]);

  const persist=(p,s,pl,ch,pr,rt)=>{const data={profile:p||profile,steps:s||allSteps,plans:pl||allPlans,chats:ch||chats,preferences:pr||preferences,routines:rt||allRoutines};const uid=getUserId(p||profile);if(uid){saveFB(uid,"appdata",data);localStorage.setItem("mns_last_user",uid);}};

  const handleAuth=auth=>{const p={name:auth.name,email:auth.email,method:auth.method};setProfile(p);localStorage.setItem("mns_last_user",getUserId(p));setScreen("setup");};
  const handleSetup=function(setup){const full={...profile,setup};setProfile(full);const w=[{role:"assistant",content:"Hey "+full.name+"! \u{1F463}\n\nI'm your Next Step guide. Pick a segment above and tell me what's on your mind.\n\nI'll turn it into real steps you can act on today.",ts:Date.now()}];setChats({career:[],wellness:w,fun:[],adventure:[]});setView("steps");persist(full,[],[],{career:[],wellness:w,fun:[],adventure:[]},[]); setScreen("main");};
  const handleDeepFinish=insights=>{
    const full={...profile,insights};setProfile(full);
    if(!chats.wellness.length){const w=[{role:"assistant",content:`Hey ${full.name}! ${"\u{1F463}"}\n\nI'm your Next Step guide. I'm here to help with your career, wellness, fun plans, and adventures.\n\nWhat's on your mind?`,ts:Date.now()}];setChats({career:[],wellness:w,fun:[],adventure:[]});persist(full,[],[],{career:[],wellness:w,fun:[],adventure:[]},[]); }
    else persist(full,allSteps,allPlans,chats,preferences);
    setView("steps");setScreen("main");
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
    const allMsgs=[...(chats.career||[]),...(chats.wellness||[]),...(chats.fun||[]),...(chats.adventure||[])].sort((a,b)=>(a.ts||0)-(b.ts||0));
    const prefText=preferences.length>0?"\n\nPREFERENCES:\n"+preferences.map(p=>`- ${p.key}: ${p.value}`).join("\n"):"";
    const sp=stravaData?.profile;const stravaText=sp?`\n\nSTRAVA: ${sp.name} | ${sp.allTimeRuns} runs, ${sp.allTimeRides} rides`:"";
    const stepsCtx=allSteps.filter(s=>s.status==="active").length>0?"\n\nALL ACTIVE STEPS:\n"+allSteps.filter(s=>s.status==="active").map(s=>`- "${s.title}" (${s.category}, ${catToSeg(s.category)})${s.loved?" [LOVED]":""}`).join("\n"):"";
    const lovedCtx=allSteps.filter(s=>s.loved).length>0?"\n\nLOVED STEPS:\n"+allSteps.filter(s=>s.loved).map(s=>`- "${s.title}" (${s.category})`).join("\n"):"";
    const plansCtx=allPlans.length>0?"\n\nJOURNEYS:\n"+allPlans.map(p=>{const d=p.tasks?.filter(t=>t.done).length||0;return`- "${p.title}" (${p.date||"no date"}, ${d}/${p.tasks?.length||0} done)`;}).join("\n"):"";
    const routineCtx=allRoutines.filter(r=>!r.paused).length>0?"\n\nACTIVE ROUTINES:\n"+allRoutines.filter(r=>!r.paused).map(r=>`- "${r.title}" (${r.schedule}, ${(r.days||[]).join("/")||"flexible"}, ${r.category})`).join("\n"):"";
    const calCtx=calData?.length>0?"\n\nCALENDAR:\n"+calData.slice(0,10).map(e=>{const d=new Date(e.start);return`- ${d.toLocaleDateString()} ${e.allDay?"all day":d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}: ${e.title}`;}).join("\n"):"";
    const profileCtx=profile?.setup?`\nAge: ${profile.setup.age||"?"} | Gender: ${profile.setup.gender||"?"}`:"";
    const healthCtx=profile?.health?.enabled?`\n\nHEALTH & FITNESS PROFILE (user opted in):\nFitness level: ${profile.health.fitnessLevel||"not set"}\nGoals: ${(profile.health.fitnessGoals||[]).join(", ")||"not set"}\nPrefers: ${(profile.health.workoutPrefs||[]).join(", ")||"not set"}\nFrequency: ${profile.health.workoutFreq||"not set"}\nInjuries/limits: ${profile.health.injuries||"none"}\nAllergies: ${(profile.health.allergies||[]).join(", ")||"none"}\nDietary preferences: ${(profile.health.diets||[]).join(", ")||"none"}${profile.health.otherAllergies?"\nOther allergies: "+profile.health.otherAllergies:""}\nInsurance: ${profile.health.provider||"not set"}\nPlan type: ${profile.health.planType||"not set"}${profile.health.planType==="HMO"?" (REQUIRES PCP REFERRAL for specialists)":""}\nPCP: ${profile.health.pcp||"not set"}`:"";
    // Cross-segment context summary
    const otherSegs=SEG_KEYS.filter(s=>s!==segment);
    const crossCtx=otherSegs.map(s=>{const msgs=chats[s]||[];if(!msgs.length)return"";const last=msgs.filter(m=>m.role==="user").slice(-2).map(m=>m.content).join(", ");return last?`\nIn ${SEGMENTS[s].label}: recently discussed "${last.slice(0,80)}"`:"";}).filter(Boolean).join("");

    try{
      // Strip ts field and ensure valid alternating roles for API
      const cleanMsgs=segChat.slice(-20).map(m=>({role:m.role,content:typeof m.content==="string"?m.content:JSON.stringify(m.content)})).filter(m=>m.content&&m.content.trim());
      // Ensure messages alternate user/assistant (API requirement)
      const apiMsgs=[];
      for(const m of cleanMsgs){
        if(apiMsgs.length>0&&apiMsgs[apiMsgs.length-1].role===m.role){
          apiMsgs[apiMsgs.length-1].content+="\n"+m.content;
        } else {
          apiMsgs.push({...m});
        }
      }
      // Ensure first message is from user
      while(apiMsgs.length>0&&apiMsgs[0].role!=="user")apiMsgs.shift();
      // If no messages left, add the current one
      if(apiMsgs.length===0)apiMsgs.push({role:"user",content:msg});
      // Safety: ensure no empty content
      const safeApiMsgs=apiMsgs.filter(m=>m.content&&m.content.trim()).map(m=>({role:m.role,content:m.content.trim()}));
      
      const sysPrompt=SYSTEM_PROMPT+`\n\nCURRENT SEGMENT: ${SEGMENTS[segment].label} (${SEGMENTS[segment].desc})\nFocus on ${SEGMENTS[segment].label.toLowerCase()} topics, but use knowledge from all segments.\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}${profileCtx}${healthCtx}${prefText}${stravaText}${stepsCtx}${lovedCtx}${plansCtx}${routineCtx}${calCtx}${crossCtx}`;

      let finalText="",currentMsgs=[...safeApiMsgs],attempts=0;
      while(attempts<3){attempts++;
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,tools:[{type:"web_search_20250305",name:"web_search"}],system:sysPrompt,messages:currentMsgs})});
        if(res.status===429){
          // Rate limited - wait and retry
          const wait=attempts*3000;
          console.log(`Rate limited, waiting ${wait}ms...`);
          await new Promise(r=>setTimeout(r,wait));
          continue;
        }
        if(!res.ok){const errText=await res.text();console.error("API error:",res.status,errText);
          let errMsg=`Something went wrong (${res.status}).`;
          try{const errJson=JSON.parse(errText);if(errJson.error?.message)errMsg+=` ${errJson.error.message.slice(0,100)}`;}catch{}
          finalText=errMsg;break;}
        const data=await res.json();
        console.log("API attempt",attempts,"stop:",data.stop_reason,"blocks:",data.content?.length);
        if(!data.content||data.content.length===0){console.error("Empty content from API:",JSON.stringify(data));finalText="Hmm, I didn't get a response. Try again?";break;}
        for(const block of data.content)if(block.type==="text"&&block.text)finalText+=block.text+"\n";
        if(data.stop_reason==="end_turn"||data.stop_reason==="stop")break;
        if(data.stop_reason==="tool_use"){currentMsgs.push({role:"assistant",content:data.content});const tr=[];for(const b of data.content)if(b.type==="tool_use")tr.push({type:"tool_result",tool_use_id:b.id,content:"Search complete. Now respond with 1-2 casual sentences, then ---DATA--- followed by a JSON array of steps/journeys based on what you found. Remember: the cards are the product, not the chat text."});if(tr.length)currentMsgs.push({role:"user",content:tr});finalText="";continue;}
        break;
      }

      const raw=finalText.trim()||"Let me think...";
      console.log("Raw AI response:", raw.slice(0, 300));
      let displayText=raw,newSteps=[...allSteps],newPlans=[...allPlans],newPrefs=[...preferences];
      let jsonStr=null;
      if(raw.includes("---DATA---")){const p=raw.split("---DATA---");displayText=p[0].trim();jsonStr=p[1]?.trim();}
      else{
        const m=raw.match(/\[[\s\S]*?"type"\s*:\s*"(step|plan|routine|preference|delete_step|delete_plan|delete_routine)"[\s\S]*?\]/);
        if(m){displayText=raw.slice(0,raw.indexOf(m[0])).trim();jsonStr=m[0];}
        else{const single=raw.match(/\{[\s\S]*?"type"\s*:\s*"(step|plan|routine)"[\s\S]*?\}/);if(single){displayText=raw.slice(0,raw.indexOf(single[0])).trim();jsonStr="["+single[0]+"]";}}
      }
      if(jsonStr){try{
        jsonStr=jsonStr.replace(/```json\s*/g,"").replace(/```\s*/g,"").replace(/,\s*\]/g,"]").trim();
        console.log("Parsing JSON:", jsonStr.slice(0, 200));
        const items=JSON.parse(jsonStr);let newRoutines=[...allRoutines];
        for(const item of(Array.isArray(items)?items:[items])){
          if(item.type==="step")newSteps=[{...item,status:"active",id:Date.now()+Math.random(),createdAt:new Date().toISOString()},...newSteps];
          else if(item.type==="plan")newPlans=[{...item,tasks:(item.tasks||[]).map(t=>({...t,done:false}))},...newPlans.filter(p=>p.title!==item.title)];
          else if(item.type==="routine")newRoutines=[{...item,id:Date.now()+Math.random(),createdAt:new Date().toISOString(),paused:false},...newRoutines.filter(r=>r.title!==item.title)];
          else if(item.type==="preference")newPrefs=[...newPrefs.filter(p=>p.key!==item.key),item];
          else if(item.type==="delete_step")newSteps=newSteps.filter(s=>!s.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
          else if(item.type==="delete_plan")newPlans=newPlans.filter(p=>!p.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
          else if(item.type==="delete_routine")newRoutines=newRoutines.filter(r=>!r.title.toLowerCase().includes(item.title.toLowerCase().slice(0,20)));
        }
        console.log("Parsed OK. Steps:", newSteps.length-allSteps.length, "Plans:", newPlans.length-allPlans.length, "Routines:", newRoutines.length-allRoutines.length);
        setAllSteps(newSteps);setAllPlans(newPlans);setAllRoutines(newRoutines);setPreferences(newPrefs);
      }catch(e){console.error("JSON parse error:",e.message,"Input:",jsonStr?.slice(0,200));}}
      else{console.log("NO JSON FOUND in response");}


      displayText=displayText.replace(/\[[\s\S]*?"type"\s*:[\s\S]*?\]/g,"").trim();
      if(!displayText)displayText=newSteps.length>allSteps.length?"Here's what I found!":newPlans.length>allPlans.length?"Journey mapped out!":"Let me know what you think.";

      const finalChat={...newChats,[segment]:[...(newChats[segment]||[]),{role:"assistant",content:clean(displayText),ts:Date.now()}]};
      setChats(finalChat);persist(profile,newSteps,newPlans,finalChat,newPrefs,allRoutines);
      if(newSteps.length>allSteps.length||newPlans.length>allPlans.length)setTimeout(()=>setView("steps"),600);
    }catch(err){console.error(err);const errChat={...newChats,[segment]:[...(newChats[segment]||[]),{role:"assistant",content:"Quick hiccup \u2014 say that again?",ts:Date.now()}]};setChats(errChat);}
    setLoading(false);
  };

  const deleteStep=id=>{const u=allSteps.filter(s=>s.id!==id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const markStep=(id,st)=>{if(st==="done")setFeedbackStep(allSteps.find(s=>s.id===id));const u=allSteps.map(s=>s.id===id?{...s,status:st}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const loveStep=id=>{const step=allSteps.find(s=>s.id===id);const u=allSteps.map(s=>s.id===id?{...s,loved:!s.loved}:s);setAllSteps(u);if(step&&!step.loved){const pref={key:`loved_${step.category||"general"}`,value:`Loved "${step.title}"`};const np=[...preferences.filter(p=>p.key!==pref.key),pref];setPreferences(np);persist(profile,u,allPlans,chats,np);}else persist(profile,u,allPlans,chats,preferences);};
  const submitFeedback=()=>{if(!feedbackText.trim()||!feedbackStep)return;sendMessage(`Completed "${feedbackStep.title}": ${feedbackText.trim()}`);setFeedbackStep(null);setFeedbackText("");setView("chat");};
  const submitMissedReason=()=>{if(!missedReason.trim()||!missedStep)return;sendMessage(`I didn't do "${missedStep.title}". Reason: ${missedReason.trim()}`);const u=allSteps.filter(s=>s.id!==missedStep.id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);setMissedStep(null);setMissedReason("");setView("chat");};
  const dismissMissed=id=>{const u=allSteps.filter(s=>s.id!==id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const deletePlan=idx=>{const u=allPlans.filter((_,i)=>i!==idx);setAllPlans(u);persist(profile,allSteps,u,chats,preferences);};
  const toggleTask=(pi,ti)=>{const u=allPlans.map((p,i)=>i===pi?{...p,tasks:p.tasks.map((t,j)=>j===ti?{...t,done:!t.done}:t)}:p);setAllPlans(u);persist(profile,allSteps,u,chats,preferences);};
  const pauseRoutine=id=>{const u=allRoutines.map(r=>r.id===id?{...r,paused:!r.paused}:r);setAllRoutines(u);persist(profile,allSteps,allPlans,chats,preferences,u);};
  const deleteRoutine=id=>{const u=allRoutines.filter(r=>r.id!==id);setAllRoutines(u);persist(profile,allSteps,allPlans,chats,preferences,u);};
  const talkAbout=text=>{setView("chat");setTimeout(()=>{inputRef.current?.focus();sendMessage(text);},100);};
  const shareItem=async(item)=>{
    const isJourney=!!item.tasks;
    const text=isJourney?`Check out this journey: ${item.title}\n${item.date?`Date: ${item.date}\n`:""}Tasks:\n${item.tasks?.map(t=>`- ${t.title}`).join("\n")}\n\nPlanned with My Next Step`
      :`${item.title}${item.why?` - ${item.why}`:""}${item.time?`\nWhen: ${item.time}`:""}${item.link?`\n${item.link}`:""}\n\nShared from My Next Step`;
    if(navigator.share){try{await navigator.share({title:isJourney?item.title:item.title,text});}catch{}}
    else{try{await navigator.clipboard.writeText(text);alert("Copied to clipboard!");}catch{}}
  };
  // Compute insights for stats
  const completedByCategory={};doneSteps.forEach(s=>{const c=s.category||"other";completedByCategory[c]=(completedByCategory[c]||0)+1;});
  const totalCompleted=doneSteps.length;
  const thisWeekDone=doneSteps.filter(s=>{const d=new Date(s.completedAt||s.createdAt);return(Date.now()-d.getTime())<7*864e5;}).length;
  const handleAddCal=async(title,why,time)=>{if(!calToken){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});const ok=await addGCalEvent(r.access_token,title,why,time);alert(ok?"Added to Calendar!":"Couldn't add.");});return;}const ok=await addGCalEvent(calToken,title,why,time);alert(ok?"Added to Calendar!":"Try reconnecting calendar.");};
  const resetAll=async()=>{const uid=getUserId(profile);if(uid){deleteFB(uid,"appdata");deleteFB(uid,"strava");deleteFB(uid,"calendar");}localStorage.removeItem("mns_last_user");setProfile(null);setAllSteps([]);setAllPlans([]);setChats({career:[],wellness:[],fun:[],adventure:[]});setPreferences([]);setStravaData(null);setCalData(null);setScreen("auth");setShowSettings(false);};

  // Expiration check
  useEffect(()=>{const now=new Date(),h=now.getHours();let changed=false;const u=allSteps.map(s=>{if(s.status!=="active")return s;const t=(s.time||"").toLowerCase(),age=s.createdAt?(Date.now()-new Date(s.createdAt).getTime())/36e5:0;if((age>48)||(t.includes("tonight")&&age>14)||(t.includes("today")&&age>24)){changed=true;return{...s,status:"expired"};}return s;});if(changed){setAllSteps(u);persist(profile,u,allPlans,chats,preferences);}},[allSteps.length]);

  if(screen==="auth")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><AuthScreen onAuth={handleAuth}/></div>);
  if(screen==="setup")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup}/></div>);
  if(screen==="deepprofile")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepFinish} existingInsights={profile?.insights||[]}/></div>);

  const segInfo=SEGMENTS[segment]||{label:"Everything",icon:"\u{1F4C5}",color:C.acc,soft:C.accSoft,desc:"all your steps and journeys across every area of your life"};
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

      {/* Missed step modal */}
      {missedStep&&(<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"100%",maxWidth:420,background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
        <div style={{...F,fontSize:12,color:"#B45309",fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Missed step</div>
        <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>{missedStep.title}</div>
        <div style={{...F,fontSize:14,color:C.t3,marginBottom:16,lineHeight:1.5}}>Telling your guide why helps improve future recommendations.</div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{["Forgot","No time","Changed mind","Too far","Found better","Not interested"].map(q=>(<button key={q} onClick={()=>setMissedReason(q)} style={{...F,padding:"8px 14px",borderRadius:12,fontSize:13,cursor:"pointer",background:missedReason===q?C.goldSoft:C.cream,border:`1.5px solid ${missedReason===q?"#B45309":C.b2}`,color:missedReason===q?"#B45309":C.t2}}>{q}</button>))}</div>
        <textarea value={missedReason} onChange={e=>setMissedReason(e.target.value)} rows={2} placeholder="Or tell us more..." style={{...F,width:"100%",padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.b2}`,background:C.bg,color:C.t1,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:14}}/>
        <div style={{display:"flex",gap:10}}><button onClick={()=>{dismissMissed(missedStep.id);setMissedStep(null);setMissedReason("");}} style={{...F,flex:1,padding:12,borderRadius:16,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:14,cursor:"pointer"}}>Just remove</button><button onClick={submitMissedReason} disabled={!missedReason.trim()} style={{...F,flex:1,padding:12,borderRadius:16,border:"none",fontSize:14,fontWeight:600,cursor:missedReason.trim()?"pointer":"default",background:missedReason.trim()?C.accGrad:"rgba(0,0,0,0.04)",color:missedReason.trim()?"#fff":C.t3}}>Tell guide</button></div>
      </div></div>)}

      {/* Top header with streak */}
      <div style={{padding:"14px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div><div style={{...F,fontSize:12,color:C.t3}}>{getGreeting()},</div><div style={{...H,fontSize:22,color:C.t1}}>{profile?.name}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {(()=>{
            const now=new Date();const weekAgo=new Date(now-7*864e5);
            const thisWeek=allSteps.filter(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt)>=weekAgo).length;
            const today=allSteps.filter(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt).toDateString()===now.toDateString()).length;
            const activeCount=allSteps.filter(s=>s.status==="active").length;
            // Calculate streak days
            let streak=0;const d=new Date(now);d.setHours(0,0,0,0);
            while(true){const ds=d.toDateString();if(allSteps.some(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt).toDateString()===ds)){streak++;d.setDate(d.getDate()-1);}else break;}
            if(thisWeek===0&&streak===0)return null;
            return(<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:12,background:streak>=3?C.goldSoft:C.cream}}>
              {streak>0&&<><span style={{fontSize:14}}>{streak>=7?"\u{1F525}":streak>=3?"\u{1F4AA}":"\u2728"}</span><span style={{...F,fontSize:12,fontWeight:700,color:streak>=3?C.gold:C.t2}}>{streak}d</span></>}
              {thisWeek>0&&<span style={{...F,fontSize:11,color:C.t3}}>{thisWeek} this week</span>}
            </div>);
          })()}
          <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{"\u2699\uFE0F"}</button>
        </div>
      </div>

      {/* Segment selector */}
      <div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:4}}>
        {[...SEG_KEYS,"everything"].map(s=>{const info=SEGMENTS[s]||{label:"Everything",icon:"\u{1F4C5}",color:C.acc};const active=segment===s;const count=s==="everything"?allSteps.filter(x=>x.status==="active").length:allSteps.filter(x=>x.status==="active"&&catToSeg(x.category)===s).length;
          return(<button key={s} onClick={()=>{setSegment(s);setExpandedPlan(null);if(s==="everything")setView("steps");}} style={{...F,flex:1,padding:"10px 4px",background:active?C.card:"transparent",border:active?`1.5px solid ${info.color}30`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",fontSize:12,fontWeight:active?600:400,color:active?info.color:C.t3,boxShadow:active?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.2s"}}>
            <span style={{fontSize:14}}>{info.icon}</span>{info.label}{count>0&&<span style={{fontSize:9,background:active?info.color+"15":C.cream,color:info.color,padding:"1px 5px",borderRadius:6,fontWeight:700}}>{count}</span>}
          </button>);
        })}
      </div>

      {/* Sub-tabs: Steps / Chat */}
      {segment!=="everything"&&<div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:6}}>
        {[{id:"steps",label:"Steps & Journeys"},{id:"chat",label:"Guide"}].map(t=>(<button key={t.id} onClick={()=>{setView(t.id);if(t.id==="chat")setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,flex:1,padding:"10px 0",background:view===t.id?C.card:"transparent",border:view===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:view===t.id?600:400,color:view===t.id?C.t1:C.t3,boxShadow:view===t.id?C.shadow:"none",transition:"all 0.15s"}}>{t.label}</button>))}
      </div>}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* EVERYTHING - Calendar Timeline View */}
        {segment==="everything"&&(
          <div style={{flex:1,overflowY:"auto",padding:"8px 20px 80px"}}>
            {(()=>{
              // Build a unified timeline of next 14 days
              const now=new Date();const days=[];
              for(let i=0;i<14;i++){const d=new Date(now);d.setDate(d.getDate()+i);d.setHours(0,0,0,0);days.push(d);}
              const isToday=d=>d.toDateString()===now.toDateString();
              const isTomorrow=d=>{const t=new Date(now);t.setDate(t.getDate()+1);return d.toDateString()===t.toDateString();};
              const dayLabel=d=>isToday(d)?"Today":isTomorrow(d)?"Tomorrow":d.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"});
              
              // Get Google Calendar events mapped to dates
              const calByDate={};(calData||[]).forEach(e=>{const d=new Date(e.start);const key=d.toDateString();if(!calByDate[key])calByDate[key]=[];calByDate[key].push(e);});
              
              // Get active steps (try to map by time hint)
              const stepsByDate={};allSteps.filter(s=>s.status==="active").forEach(s=>{const t=(s.time||"").toLowerCase();let key=now.toDateString();// Default to today
              if(t.includes("tomorrow")){const d=new Date(now);d.setDate(d.getDate()+1);key=d.toDateString();}
              else if(t.includes("this week")||t.includes("this weekend")){const d=new Date(now);d.setDate(d.getDate()+(6-d.getDay()+7)%7||7);key=d.toDateString();}
              if(!stepsByDate[key])stepsByDate[key]=[];stepsByDate[key].push(s);});
              
              const hasContent=days.some(d=>(calByDate[d.toDateString()]||[]).length>0||(stepsByDate[d.toDateString()]||[]).length>0)||allSteps.filter(s=>s.status==="active").length>0||allPlans.length>0||allRoutines.length>0;
              
              if(!hasContent)return(<FadeIn><div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{"\u{1F4C5}"}</div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>Your timeline</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Start chatting in any segment to see your steps, journeys, and calendar events here.</div>
              </div></FadeIn>);
              
              return(<div>
                {/* Active routines banner */}
                {allRoutines.filter(r=>!r.paused).length>0&&<div style={{marginBottom:16}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Active routines</div>
                  {allRoutines.filter(r=>!r.paused).map((r,i)=><RoutineCard key={r.id} routine={r} onPause={pauseRoutine} onDelete={deleteRoutine} onTalk={talkAbout} delay={i*30}/>)}
                </div>}
                
                {/* Journeys */}
                {allPlans.length>0&&<div style={{marginBottom:16}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Journeys ({allPlans.length})</div>
                  {allPlans.map((plan,pi)=><JourneyCard key={pi} plan={plan} pi={pi} open={expandedPlan===pi} onToggle={i=>setExpandedPlan(expandedPlan===i?null:i)} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onShare={shareItem} delay={pi*30}/>)}
                </div>}
                
                {/* Day-by-day timeline */}
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Timeline</div>
                {days.map((day,di)=>{
                  const key=day.toDateString();
                  const calEvents=calByDate[key]||[];
                  const daySteps=stepsByDate[key]||[];
                  if(calEvents.length===0&&daySteps.length===0&&di>1)return null;// Skip empty days after tomorrow
                  const today=isToday(day);
                  return(<div key={key} style={{marginBottom:12}}>
                    <div style={{...F,fontSize:13,fontWeight:600,color:today?C.acc:C.t1,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                      {today&&<div style={{width:8,height:8,borderRadius:4,background:C.acc}}/>}
                      {dayLabel(day)}
                    </div>
                    {calEvents.length===0&&daySteps.length===0&&<div style={{...F,fontSize:13,color:C.t3,padding:"8px 0",fontStyle:"italic"}}>Nothing scheduled</div>}
                    {/* Google Calendar events - grey */}
                    {calEvents.map((e,i)=>{const d=new Date(e.start);return(
                      <div key={`cal-${i}`} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,background:"#F5F5F4",borderLeft:"4px solid #D4D4D4",display:"flex",alignItems:"center",gap:10}}>
                        <span style={{...F,fontSize:11,color:"#A3A3A3",minWidth:50,fontWeight:600}}>{e.allDay?"All day":d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</span>
                        <div style={{flex:1}}>
                          <div style={{...F,fontSize:13,color:"#737373"}}>{e.title}</div>
                          {e.location&&<div style={{...F,fontSize:11,color:"#A3A3A3",marginTop:2}}>{e.location}</div>}
                        </div>
                        <span style={{...F,fontSize:10,color:"#A3A3A3"}}>GCal</span>
                      </div>
                    );})}
                    {/* Our steps - colored by segment */}
                    {daySteps.map((s,i)=>{const seg=SEGMENTS[catToSeg(s.category)];return(
                      <div key={s.id} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,background:C.card,borderLeft:`4px solid ${seg?.color||C.acc}`,boxShadow:C.shadow,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{...F,fontSize:11,color:seg?.color||C.acc,minWidth:50,fontWeight:600}}>{s.time||"Anytime"}</span>
                        <div style={{flex:1}}>
                          <div style={{...F,fontSize:13,fontWeight:600,color:C.t1}}>{s.title}</div>
                          {s.why&&<div style={{...F,fontSize:11,color:C.t2,marginTop:2}}>{s.why}</div>}
                        </div>
                        <span style={{fontSize:12}}>{catIcon(s.category)}</span>
                      </div>
                    );})}
                  </div>);
                })}
                
                {/* Unscheduled steps */}
                {(()=>{const scheduled=new Set();Object.values(stepsByDate).forEach(arr=>arr.forEach(s=>scheduled.add(s.id)));const unsched=allSteps.filter(s=>s.status==="active"&&!scheduled.has(s.id));return unsched.length>0?<div style={{marginTop:8}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Anytime</div>
                  {unsched.map(s=>{const seg=SEGMENTS[catToSeg(s.category)];return(
                    <div key={s.id} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,background:C.card,borderLeft:`4px solid ${seg?.color||C.acc}`,boxShadow:C.shadow,display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:12}}>{catIcon(s.category)}</span>
                      <div style={{flex:1}}><div style={{...F,fontSize:13,fontWeight:600,color:C.t1}}>{s.title}</div></div>
                      <span style={{...F,fontSize:10,color:seg?.color,fontWeight:600,textTransform:"capitalize"}}>{catToSeg(s.category)}</span>
                    </div>);
                  })}
                </div>:null;})()}
                
                {/* Completed */}
                {doneSteps.length>0&&<div style={{marginTop:12}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Completed ({doneSteps.length})</div>
                  {doneSteps.slice(0,5).map(s=>(<div key={s.id} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,background:s.loved?"rgba(220,38,38,0.04)":C.tealSoft,border:`1px solid ${s.loved?"rgba(220,38,38,0.1)":C.tealBorder}`,display:"flex",alignItems:"center",gap:10,opacity:.5}}><span style={{color:s.loved?"#DC2626":C.teal}}>{s.loved?"\u2764\uFE0F":"\u2713"}</span><span style={{...F,fontSize:13,textDecoration:"line-through",color:C.t2,flex:1}}>{s.title}</span></div>))}
                </div>}
              </div>);
            })()}
          </div>
        )}

        {/* STEPS & JOURNEYS VIEW (non-everything segments) */}
        {view==="steps"&&segment!=="everything"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"8px 20px 80px"}}>
            {segSteps.length===0&&segPlans.length===0&&segRoutines.length===0&&doneSteps.length===0&&expiredSteps.length===0?(
              <FadeIn><div style={{padding:"20px 0"}}>
                {/* Welcome hero */}
                <div style={{textAlign:"center",padding:"24px 20px 32px"}}>
                  <div style={{...H,fontSize:24,color:C.t1,marginBottom:8}}>What's next for you?</div>
                  <div style={{...F,fontSize:15,color:C.t2,lineHeight:1.6,maxWidth:300,margin:"0 auto"}}>Pick a segment above, then chat with your guide to start building your steps and journeys.</div>
                </div>
                {/* Segment quick starts */}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {SEG_KEYS.map(s=>{const info=SEGMENTS[s];return(
                    <button key={s} onClick={()=>{setSegment(s);setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,width:"100%",padding:"18px 20px",borderRadius:18,background:C.card,boxShadow:C.shadow,border:`1.5px solid ${info.color}15`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
                      <div style={{width:44,height:44,borderRadius:14,background:info.soft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{info.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:600,color:C.t1}}>{info.label}</div>
                        <div style={{fontSize:13,color:C.t3,marginTop:2}}>{info.desc}</div>
                      </div>
                      <span style={{color:info.color,fontSize:18}}>{"\u203A"}</span>
                    </button>
                  );})}
                </div>
              </div></FadeIn>
            ):segSteps.length===0&&segPlans.length===0&&segRoutines.length===0?(
              <FadeIn><div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:segInfo.soft||C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{segInfo.icon}</div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>Nothing in {segInfo.label} yet</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:260,margin:"0 auto 20px"}}>Chat with your guide about {segInfo.desc.toLowerCase()}.</div>
                {segment!=="everything"&&<button onClick={()=>{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,padding:"12px 28px",borderRadius:14,border:"none",fontSize:15,fontWeight:600,cursor:"pointer",background:C.accGrad,color:"#fff"}}>Start chatting {"\u2192"}</button>}
              </div></FadeIn>
            ):(<>
              {/* Weekly progress bar */}
              {(()=>{
                const now=new Date();const weekAgo=new Date(now-7*864e5);
                const completed=allSteps.filter(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt)>=weekAgo).length;
                const active=segSteps.length;
                const total=completed+active;
                if(total===0)return null;
                // Show week's activity as dots (Mon-Sun)
                const days=[];for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const ds=d.toDateString();const hasDone=allSteps.some(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt).toDateString()===ds);const hasCreated=allSteps.some(s=>s.createdAt&&new Date(s.createdAt).toDateString()===ds);days.push({label:["S","M","T","W","T","F","S"][d.getDay()],done:hasDone,active:hasCreated,today:d.toDateString()===now.toDateString()});}
                return(<FadeIn><div style={{padding:"14px 18px",borderRadius:16,background:C.card,boxShadow:C.shadow,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3}}>This week</div>
                    <div style={{...F,fontSize:13,fontWeight:600,color:C.teal}}>{completed} completed</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
                    {days.map((d,i)=>(<div key={i} style={{textAlign:"center",flex:1}}>
                      <div style={{...F,fontSize:10,color:d.today?C.t1:C.t3,fontWeight:d.today?700:400,marginBottom:4}}>{d.label}</div>
                      <div style={{width:24,height:24,borderRadius:8,margin:"0 auto",background:d.done?C.teal:d.active?C.accSoft:d.today?C.cream:"transparent",border:d.today&&!d.done?`2px solid ${C.acc}`:`2px solid ${d.done?C.teal:d.active?C.accBorder:"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:d.done?"#fff":"transparent"}}>{d.done?"\u2713":""}</div>
                    </div>))}
                  </div>
                </div></FadeIn>);
              })()}
              {segSteps.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Steps ({segSteps.length})</div>
                {segSteps.slice(0,segment==="everything"?10:5).map((step,i)=><StepCard key={step.id} step={step} onDone={id=>markStep(id,"done")} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onShare={shareItem} delay={i*50}/>)}
                {segSteps.length>(segment==="everything"?10:5)&&<div style={{...F,fontSize:12,color:C.t3,textAlign:"center",padding:"8px 0"}}>+{segSteps.length-(segment==="everything"?10:5)} more steps</div>}
              </div>}
              {segPlans.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Journeys ({segPlans.length})</div>
                {segPlans.slice(0,segment==="everything"?allPlans.length:2).map((plan,pi)=><JourneyCard key={pi} plan={plan} pi={allPlans.indexOf(plan)} open={expandedPlan===allPlans.indexOf(plan)} onToggle={i=>setExpandedPlan(expandedPlan===i?null:i)} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onShare={shareItem} delay={pi*50}/>)}
                {segment!=="everything"&&segPlans.length>2&&<button onClick={()=>setSegment("everything")} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",padding:"8px 0",width:"100%",textAlign:"center"}}>View all journeys</button>}
              </div>}
              {/* Routines */}
              {segRoutines.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Routines ({segRoutines.length})</div>
                {segRoutines.map((r,i)=><RoutineCard key={r.id} routine={r} onPause={pauseRoutine} onDelete={deleteRoutine} onTalk={talkAbout} delay={i*50}/>)}
              </div>}
              {/* Completed steps - show in all views */}
              {(()=>{const segDone=segment==="everything"?doneSteps:doneSteps.filter(s=>catToSeg(s.category)===segment);return segDone.length>0?<div style={{marginBottom:20}}><div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Completed ({segDone.length})</div>{segDone.slice(0,segment==="everything"?5:3).map(s=>(<div key={s.id} style={{padding:"12px 16px",borderRadius:14,marginBottom:6,background:s.loved?"rgba(220,38,38,0.04)":C.tealSoft,border:`1px solid ${s.loved?"rgba(220,38,38,0.1)":C.tealBorder}`,display:"flex",alignItems:"center",gap:10,opacity:s.loved?.7:.5}}><span style={{color:s.loved?"#DC2626":C.teal}}>{s.loved?"\u2764\uFE0F":"\u2713"}</span><span style={{...F,fontSize:13,textDecoration:"line-through",color:C.t2,flex:1}}>{s.title}</span><button onClick={()=>loveStep(s.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:s.loved?1:.4}}>{s.loved?"\u2764\uFE0F":"\u{1F90D}"}</button><button onClick={()=>deleteStep(s.id)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:13}}>{"\u00D7"}</button></div>))}{segDone.length>(segment==="everything"?5:3)&&<div style={{...F,fontSize:12,color:C.t3,textAlign:"center",padding:4}}>+{segDone.length-(segment==="everything"?5:3)} more</div>}</div>:null;})()}
              {/* Expired steps */}
              {expiredSteps.length>0&&(segment==="everything"||expiredSteps.some(s=>catToSeg(s.category)===segment))&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#B45309",marginBottom:12}}>Expired ({(segment==="everything"?expiredSteps:expiredSteps.filter(s=>catToSeg(s.category)===segment)).length})</div>
                {(segment==="everything"?expiredSteps:expiredSteps.filter(s=>catToSeg(s.category)===segment)).map(s=>(<div key={s.id} style={{padding:"14px 16px",borderRadius:14,marginBottom:6,background:C.goldSoft,border:"1px solid rgba(180,83,9,0.08)",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:14,opacity:.6}}>{catIcon(s.category)}</span>
                  <div style={{flex:1}}><div style={{...F,fontSize:13,color:C.t1,fontWeight:500,opacity:.7}}>{s.title}</div>{s.time&&<div style={{...F,fontSize:11,color:"#B45309",marginTop:2}}>Was: {s.time}</div>}</div>
                  <button onClick={()=>{setMissedStep(s);setMissedReason("");}} style={{...F,fontSize:11,padding:"5px 10px",borderRadius:8,background:C.card,border:`1px solid ${C.b2}`,color:C.t2,cursor:"pointer"}}>Why?</button>
                  <button onClick={()=>dismissMissed(s.id)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14}}>{"\u00D7"}</button>
                </div>))}
              </div>}
            </>)}

            {/* Deep profile prompt - shows after 3 completed steps if no insights yet */}
            {doneSteps.length>=3&&!profile?.insights?.length&&segment!=="everything"&&(
              <FadeIn delay={200}><div style={{padding:"16px 18px",borderRadius:16,background:C.accSoft,border:`1px solid ${C.accBorder}`,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:20}}>{"\u{1F4AC}"}</span>
                  <div style={{flex:1}}>
                    <div style={{...F,fontSize:14,fontWeight:600,color:C.acc}}>You're on a roll!</div>
                    <div style={{...F,fontSize:13,color:C.t2,marginTop:2}}>Go deeper with your guide so I can personalize even more.</div>
                  </div>
                  <button onClick={()=>setScreen("deepprofile")} style={{...F,fontSize:12,fontWeight:600,padding:"8px 14px",borderRadius:10,background:C.accGrad,color:"#fff",border:"none",cursor:"pointer"}}>Let's go</button>
                </div>
              </div></FadeIn>
            )}
          </div>

          {/* Quick-add bar at bottom of steps view */}
          {segment!=="everything"&&(view==="steps")&&(
            <div style={{padding:"8px 20px 16px",flexShrink:0,borderTop:`1px solid ${C.b1}`}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){e.preventDefault();setView("chat");setTimeout(()=>sendMessage(input.trim()),100);}}} placeholder="Quick ask your guide..." style={{...F,flex:1,padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow}} onFocus={e=>{e.target.style.borderColor=segInfo.color;}} onBlur={e=>{e.target.style.borderColor=C.b2;}}/>
                <button onClick={()=>{if(input.trim()){setView("chat");setTimeout(()=>sendMessage(input.trim()),100);}else{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}}} style={{width:44,height:44,borderRadius:14,border:"none",cursor:"pointer",background:C.accGrad,color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(212,82,42,0.2)"}}>{input.trim()?"\u2191":"\u{1F4AC}"}</button>
              </div>
            </div>
          )}
        </>)}

        {/* CHAT VIEW */}
        {view==="chat"&&segment!=="everything"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"10px 20px"}}>
            {/* Empty chat state */}
            {(chats[segment]||[]).length===0&&!loading&&(
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <div style={{width:56,height:56,borderRadius:18,margin:"0 auto 14px",background:segInfo.soft||C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{segInfo.icon}</div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:6}}>Ask me anything about {segInfo.label.toLowerCase()}</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>{segInfo.desc}. I'll turn ideas into steps and journeys you can act on.</div>
              </div>
            )}
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
          {/* Suggestion chips + clear chat */}
          {(chats[segment]||[]).length<=4&&<div style={{padding:"0 20px 6px",flexShrink:0}}>
            <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
              {(segSteps.length>0?["What else should I try?","Switch things up","Find me something new"]:segment==="career"?["Help me grow my career","Find a course","Networking events near me"]:segment==="fun"?["Plan something with friends","Find events this weekend","Group activities near me"]:segment==="adventure"?["Plan a trip","Find a new experience","Weekend getaway ideas"]:["What should I do today?","Help me build a habit","Find something nearby"]).map(c=>(<button key={c} onClick={()=>{setInput(c);setTimeout(()=>sendMessage(c),50);}} style={{...F,padding:"7px 14px",borderRadius:18,fontSize:12,fontWeight:500,background:C.card,border:`1.5px solid ${C.b2}`,color:C.t2,cursor:"pointer",whiteSpace:"nowrap",boxShadow:C.shadow}}>{c}</button>))}
            </div>
          </div>}
          {(chats[segment]||[]).length>2&&<div style={{padding:"0 20px 4px",flexShrink:0,textAlign:"right"}}>
            <button onClick={()=>{if(confirm("Clear this conversation? Steps and journeys will be kept.")){const nc={...chats,[segment]:[]};setChats(nc);persist(profile,allSteps,allPlans,nc,preferences);}}} style={{...F,fontSize:11,color:C.t3,background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>Clear conversation</button>
          </div>}
          <div style={{padding:"6px 20px 16px",flexShrink:0}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <textarea ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,150)+"px";}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={`Ask about ${segInfo.label.toLowerCase()}...`} rows={1} style={{...F,flex:1,padding:"13px 18px",fontSize:15,borderRadius:18,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow,resize:"none",maxHeight:150,lineHeight:1.5}} onFocus={e=>{e.target.style.borderColor=segInfo.color;e.target.style.boxShadow=`0 0 0 3px ${segInfo.color}15`;}} onBlur={e=>{e.target.style.borderColor=C.b2;e.target.style.boxShadow=C.shadow;}}/>
              <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:46,height:46,borderRadius:16,border:"none",flexShrink:0,cursor:input.trim()&&!loading?"pointer":"default",background:input.trim()&&!loading?C.accGrad:"rgba(0,0,0,0.04)",color:input.trim()&&!loading?"#fff":C.t3,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:1}}>{"\u2191"}</button>
            </div>
            {input.length>50&&<div style={{...F,fontSize:11,color:C.t3,marginTop:6,textAlign:"right"}}>Shift+Enter for new line</div>}
          </div>
        </>)}
      </div>

      {/* Full settings overlay */}
      {showSettings&&<div style={{position:"fixed",inset:0,zIndex:200,background:C.bg,overflowY:"auto",padding:20}}><div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{...H,fontSize:26,color:C.t1,margin:0}}>Settings</h2><button onClick={()=>setShowSettings(false)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:C.t3}}>{"\u00D7"}</button></div>

        <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow,marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:52,height:52,borderRadius:16,background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",fontWeight:700}}>{profile?.name?.charAt(0)?.toUpperCase()}</div>
          <div><div style={{...H,fontSize:18,color:C.t1}}>{profile?.name}</div><div style={{...F,fontSize:13,color:C.t3}}>{profile?.email}</div></div>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {[{id:"profile",l:"Profile"},{id:"health",l:"Health & Fitness"},{id:"connections",l:"Connected"},{id:"insights",l:"AI Insights"},{id:"about",l:"About"}].map(t=>(<button key={t.id} onClick={()=>setSettingsTab(t.id)} style={{...F,flex:1,padding:"9px 4px",background:settingsTab===t.id?C.card:"transparent",border:settingsTab===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:12,cursor:"pointer",fontSize:10,fontWeight:settingsTab===t.id?600:400,color:settingsTab===t.id?C.t1:C.t3,boxShadow:settingsTab===t.id?C.shadow:"none"}}>{t.l}</button>))}
        </div>

        {settingsTab==="profile"&&<div>
          {[{k:"name",l:"Name",i:"\u{1F464}",v:profile?.name},{k:"age",l:"Age",i:"\u{1F382}",v:profile?.setup?.age},{k:"gender",l:"Gender",i:"\u2728",v:profile?.setup?.gender},{k:"location",l:"Location",i:"\u{1F4CD}",v:profile?.setup?.location}].map(f=>(
            <div key={f.k} style={{padding:"16px 18px",borderRadius:16,background:C.card,boxShadow:C.shadow,marginBottom:8}}>
              {editField===f.k?(<div>
                <label style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:8}}>{f.l}</label>
                {f.k==="gender"?<div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Male","Female","Other","Prefer not to say"].map(g=><button key={g} onClick={()=>setGenderEdit(g)} style={{...F,padding:"7px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:genderEdit===g?C.accSoft:C.card,border:`1.5px solid ${genderEdit===g?C.acc:C.b2}`,color:genderEdit===g?C.acc:C.t2}}>{g}</button>)}</div>{genderEdit==="Other"&&<input value={genderOtherEdit} onChange={e=>setGenderOtherEdit(e.target.value)} placeholder="How do you identify?" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:10,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box",marginTop:8}}/>}</div>
                :<input value={editVal} onChange={e=>setEditVal(e.target.value)} style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/>}
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button onClick={()=>setEditField(null)} style={{...F,flex:1,padding:9,borderRadius:12,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button>
                  <button onClick={()=>{const p={...profile};if(f.k==="name")p.name=editVal.trim();else if(f.k==="age")p.setup={...p.setup,age:editVal.trim()};else if(f.k==="gender")p.setup={...p.setup,gender:genderEdit==="Other"?genderOtherEdit:genderEdit};else if(f.k==="location")p.setup={...p.setup,location:editVal.trim()};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,flex:1,padding:9,borderRadius:12,border:"none",background:C.accGrad,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button>
                </div>
              </div>):(<div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <span style={{fontSize:16,marginTop:2}}>{f.i}</span>
                <div style={{flex:1}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{f.l}</div><div style={{...F,fontSize:15,color:C.t1}}>{f.v||"Not set"}</div></div>
                <button onClick={()=>{setEditField(f.k);setEditVal(f.v||"");if(f.k==="gender")setGenderEdit(f.v||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button>
              </div>)}
            </div>
          ))}
          <button onClick={()=>{setShowSettings(false);setScreen("deepprofile");}} style={{...F,width:"100%",padding:"16px 18px",borderRadius:16,background:C.accSoft,border:`1px solid ${C.accBorder}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",marginTop:8}}><span style={{fontSize:18}}>{"\u{1F4AC}"}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.acc}}>Go deeper with guide</div><div style={{fontSize:12,color:C.t3}}>{profile?.insights?.length||0} insights</div></div></button>
          <button onClick={resetAll} style={{...F,width:"100%",padding:"14px",borderRadius:14,marginTop:20,background:"rgba(220,60,60,0.04)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",fontSize:14,cursor:"pointer"}}>Sign out</button>
        </div>}

        {settingsTab==="health"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:profile?.health?.enabled?16:0}}>
              <div style={{width:44,height:44,borderRadius:14,background:profile?.health?.enabled?"#E6F7F5":"#F5F5F4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{profile?.health?.enabled?"\u2705":"\u{1F3CB}\uFE0F"}</div>
              <div style={{flex:1}}>
                <div style={{...F,fontSize:15,fontWeight:600,color:C.t1}}>Health & Fitness</div>
                <div style={{...F,fontSize:13,color:C.t3,marginTop:2}}>{profile?.health?.enabled?"Active \u2014 personalized health & workout help":"Workouts, doctor search, insurance help"}</div>
              </div>
              <button onClick={()=>{const p={...profile,health:{...(profile?.health||{}),enabled:!profile?.health?.enabled}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{width:48,height:28,borderRadius:14,border:"none",cursor:"pointer",background:profile?.health?.enabled?C.teal:"#D4D4D4",position:"relative",transition:"all 0.2s"}}>
                <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,left:profile?.health?.enabled?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/>
              </button>
            </div>
            {!profile?.health?.enabled&&<div style={{...F,fontSize:13,color:C.t3,lineHeight:1.6,marginTop:12,padding:"12px 14px",background:C.cream,borderRadius:12}}>When enabled, your guide can build custom workout routines, find in-network doctors, understand your insurance, and give personalized fitness recommendations based on your goals and experience.</div>}
          </div>
          {profile?.health?.enabled&&<>
            {/* Fitness profile */}
            <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}>
              <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Fitness profile</div>
              <div style={{marginBottom:14}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Fitness level</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["Beginner","Intermediate","Advanced"].map(t=>(<button key={t} onClick={()=>{const p={...profile,health:{...profile.health,fitnessLevel:t}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"8px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:profile?.health?.fitnessLevel===t?C.tealSoft:C.cream,border:`1.5px solid ${profile?.health?.fitnessLevel===t?C.teal:C.b2}`,color:profile?.health?.fitnessLevel===t?C.teal:C.t2,fontWeight:profile?.health?.fitnessLevel===t?600:400}}>{t}</button>))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Fitness goals (select all that apply)</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Lose weight","Build muscle","Get toned","Improve cardio","Flexibility","Stress relief","General health","Train for event"].map(g=>{const goals=profile?.health?.fitnessGoals||[];const on=goals.includes(g);return(<button key={g} onClick={()=>{const ng=on?goals.filter(x=>x!==g):[...goals,g];const p={...profile,health:{...profile.health,fitnessGoals:ng}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?C.accSoft:C.cream,border:`1.5px solid ${on?C.acc:C.b2}`,color:on?C.acc:C.t2,fontWeight:on?600:400}}>{g}</button>);})}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Workout preferences</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Gym","Home workouts","Outdoor","Classes","Yoga","Running","Swimming","Sports","HIIT","Weight training"].map(g=>{const prefs=profile?.health?.workoutPrefs||[];const on=prefs.includes(g);return(<button key={g} onClick={()=>{const np=on?prefs.filter(x=>x!==g):[...prefs,g];const p={...profile,health:{...profile.health,workoutPrefs:np}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?"#E6F7F5":C.cream,border:`1.5px solid ${on?C.teal:C.b2}`,color:on?C.teal:C.t2,fontWeight:on?600:400}}>{g}</button>);})}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>How often can you work out?</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["1-2x/week","3-4x/week","5-6x/week","Daily"].map(t=>(<button key={t} onClick={()=>{const p={...profile,health:{...profile.health,workoutFreq:t}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"8px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:profile?.health?.workoutFreq===t?C.accSoft:C.cream,border:`1.5px solid ${profile?.health?.workoutFreq===t?C.acc:C.b2}`,color:profile?.health?.workoutFreq===t?C.acc:C.t2,fontWeight:profile?.health?.workoutFreq===t?600:400}}>{t}</button>))}
                </div>
              </div>
              <div>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Any injuries or limitations?</div>
                {editField==="injuries"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. bad knee, lower back issues" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...profile.health,injuries:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>
                :<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.injuries||"None"}</div><button onClick={()=>{setEditField("injuries");setEditVal(profile?.health?.injuries||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}
              </div>
            </div>
            {/* Allergies & dietary restrictions */}
            <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}>
              <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Allergies & dietary restrictions</div>
              <div style={{...F,fontSize:12,color:C.t3,marginBottom:10}}>Select any that apply. Your guide will factor these into restaurant and food recommendations.</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["Gluten-free / Celiac","Dairy","Eggs","Peanuts","Tree nuts","Soy","Fish","Crustaceans (shrimp, crab, lobster)","Molluscs (clams, oysters, squid)","Wheat","Sesame","Legumes","Mustard","Sulfites","Corn","Nightshades"].map(a=>{const allergies=profile?.health?.allergies||[];const on=allergies.includes(a);return(<button key={a} onClick={()=>{const na=on?allergies.filter(x=>x!==a):[...allergies,a];const p={...profile,health:{...profile.health,allergies:na}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?"rgba(220,60,60,0.06)":C.cream,border:`1.5px solid ${on?"#DC3C3C":C.b2}`,color:on?"#DC3C3C":C.t2,fontWeight:on?600:400}}>{on?"\u26A0\uFE0F ":""}{a}</button>);})}
              </div>
              <div style={{marginTop:12}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Dietary preferences</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Vegetarian","Vegan","Pescatarian","Keto","Paleo","Halal","Kosher","Low sodium","Low sugar","Lactose-free"].map(d=>{const diets=profile?.health?.diets||[];const on=diets.includes(d);return(<button key={d} onClick={()=>{const nd=on?diets.filter(x=>x!==d):[...diets,d];const p={...profile,health:{...profile.health,diets:nd}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?C.tealSoft:C.cream,border:`1.5px solid ${on?C.teal:C.b2}`,color:on?C.teal:C.t2,fontWeight:on?600:400}}>{d}</button>);})}
                </div>
              </div>
              <div style={{marginTop:12}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Other allergies or notes</div>
                {editField==="other_allergies"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. kiwi, latex, specific medications" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...profile.health,otherAllergies:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>
                :<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.otherAllergies||"None"}</div><button onClick={()=>{setEditField("other_allergies");setEditVal(profile?.health?.otherAllergies||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}
              </div>
            </div>
            {/* Insurance info */}
            <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow}}>
              <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Insurance</div>
              <div style={{marginBottom:14}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Insurance Provider</div>
                {editField==="insurance_provider"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. Blue Cross, Aetna, Cigna, United" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...profile.health,provider:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>
                :<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.provider||"Not set"}</div><button onClick={()=>{setEditField("insurance_provider");setEditVal(profile?.health?.provider||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Plan Type</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["HMO","PPO","EPO","POS","Not sure"].map(t=>(<button key={t} onClick={()=>{const p={...profile,health:{...profile.health,planType:t}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"8px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:profile?.health?.planType===t?C.tealSoft:C.cream,border:`1.5px solid ${profile?.health?.planType===t?C.teal:C.b2}`,color:profile?.health?.planType===t?C.teal:C.t2,fontWeight:profile?.health?.planType===t?600:400}}>{t}</button>))}
                </div>
                {profile?.health?.planType==="HMO"&&<div style={{...F,fontSize:12,color:C.gold,marginTop:8,padding:"8px 12px",background:C.goldSoft,borderRadius:10}}>HMO plans require a referral from your PCP before seeing a specialist. Your guide will remind you of this.</div>}
              </div>
              <div>
                <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Primary Care Physician (PCP)</div>
                {editField==="pcp"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Doctor's name or clinic" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...profile.health,pcp:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>
                :<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.pcp||"Not set"}</div><button onClick={()=>{setEditField("pcp");setEditVal(profile?.health?.pcp||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}
              </div>
            </div>
            {/* What guide helps with */}
            <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
              <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>What your guide can help with</div>
              {[{i:"\u{1F3CB}\uFE0F",t:"Build a custom workout routine for your goals and level"},{i:"\u{1F4C6}",t:"Create a weekly training plan with rest days"},{i:"\u{1FA7A}",t:"Find the right specialist based on your symptoms"},{i:"\u{1F3E5}",t:"Search for in-network doctors near you"},{i:"\u{1F4CB}",t:"Remind you about referrals if you have an HMO"},{i:"\u{1F4B0}",t:"Explain copays and deductibles"},{i:"\u26A0\uFE0F",t:"Adapt workouts around your injuries"}].map((x,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<6?`1px solid ${C.b1}`:"none"}}><span style={{fontSize:16}}>{x.i}</span><span style={{...F,fontSize:14,color:C.t2,lineHeight:1.5}}>{x.t}</span></div>))}
            </div>
            {/* Health apps */}
            <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
              <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Health apps</div>
              {[{i:"\u{1F34E}",l:"Apple Health",d:"Steps, heart rate, sleep"},{i:"\u{1F4AA}",l:"MyFitnessPal",d:"Nutrition, calories"},{i:"\u{1F49A}",l:"Fitbit",d:"Activity, sleep, heart rate"},{i:"\u{1F9E0}",l:"Headspace",d:"Meditation, mindfulness"}].map(s=>(<div key={s.l} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.b1}`,opacity:.4}}><span style={{fontSize:18}}>{s.i}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500,color:C.t1}}>{s.l}</div><div style={{...F,fontSize:12,color:C.t3}}>{s.d} \u00B7 Coming soon</div></div></div>))}
            </div>
            <div style={{...F,fontSize:12,color:C.t3,lineHeight:1.6,padding:"14px 16px",background:C.cream,borderRadius:14}}>Your guide is not a medical professional. Recommendations help you find healthcare providers and build fitness routines, not diagnose or treat conditions. Always consult a licensed physician for medical concerns.</div>
          </>}
        </div>}

        {settingsTab==="connections"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}>{"\u{1F3C3}"}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>Strava</div><div style={{...F,fontSize:12,color:stravaData?"#FC4C02":C.t3}}>{stravaData?"Connected":"Not connected"}</div></div>{stravaData?<button onClick={async()=>{deleteFB(getUserId(profile),"strava");setStravaData(null);}} style={{...F,fontSize:12,padding:"6px 14px",borderRadius:10,background:"rgba(220,60,60,0.04)",color:"#DC3C3C",border:"1px solid rgba(220,60,60,0.1)",cursor:"pointer"}}>Disconnect</button>:<button onClick={connectStrava} style={{...F,fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,background:C.accSoft,color:C.acc,border:`1px solid ${C.accBorder}`,cursor:"pointer"}}>Connect</button>}</div>
            {stravaData?.profile&&<div style={{padding:"10px 14px",borderRadius:12,background:C.bg,marginTop:10,display:"flex",gap:16}}><div><div style={{...F,fontSize:18,fontWeight:700,color:"#FC4C02"}}>{stravaData.profile.allTimeRuns}</div><div style={{...F,fontSize:10,color:C.t3}}>Runs</div></div><div><div style={{...F,fontSize:18,fontWeight:700,color:"#FC4C02"}}>{stravaData.profile.allTimeRunDistance}</div><div style={{...F,fontSize:10,color:C.t3}}>Distance</div></div><div><div style={{...F,fontSize:18,fontWeight:700,color:"#FC4C02"}}>{stravaData.profile.allTimeRides}</div><div style={{...F,fontSize:10,color:C.t3}}>Rides</div></div></div>}
          </div>
          <div style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}>{"\u{1F4C5}"}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>Google Calendar</div><div style={{...F,fontSize:12,color:calData?"#4285F4":C.t3}}>{calData?`Connected \u00B7 ${calData.length} events`:"Not connected"}</div></div>{calData?<button onClick={async()=>{deleteFB(getUserId(profile),"calendar");setCalData(null);setCalToken(null);}} style={{...F,fontSize:12,padding:"6px 14px",borderRadius:10,background:"rgba(220,60,60,0.04)",color:"#DC3C3C",border:"1px solid rgba(220,60,60,0.1)",cursor:"pointer"}}>Disconnect</button>:<button onClick={()=>connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);saveFB(getUserId(profile),"calendar",{token:r.access_token,events:ev});})} style={{...F,fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,background:"rgba(66,133,244,0.06)",color:"#4285F4",border:"1px solid rgba(66,133,244,0.1)",cursor:"pointer"}}>Connect</button>}</div>
            {calData?.length>0&&<div style={{marginTop:10}}>{calData.slice(0,4).map((e,i)=>{const d=new Date(e.start);return<div key={i} style={{display:"flex",gap:8,padding:"6px 14px",borderRadius:10,background:C.bg,marginBottom:4,alignItems:"center"}}><span style={{...F,fontSize:11,fontWeight:600,color:"#4285F4",minWidth:55}}>{d.toLocaleDateString([],{month:"short",day:"numeric"})}</span><span style={{...F,fontSize:12,color:C.t2,flex:1}}>{e.title}</span></div>;})}{calData.length>4&&<div style={{...F,fontSize:11,color:C.t3,textAlign:"center",marginTop:4}}>+{calData.length-4} more</div>}</div>}
          </div>
          {[{i:"in",l:"LinkedIn",c:"#0A66C2"},{i:"\u{1F4F7}",l:"Instagram",c:"#E4405F"},{i:"\u{1F3B5}",l:"Spotify",c:"#1DB954"}].map(s=>(<div key={s.l} style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12,opacity:.4}}><span style={{fontSize:20,width:24,textAlign:"center"}}>{s.i}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500,color:C.t1}}>{s.l}</div><div style={{...F,fontSize:12,color:C.t3}}>Coming soon</div></div></div>))}
        </div>}

        {settingsTab==="insights"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Stats overview */}
          <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
            <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Your activity</div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1,padding:14,borderRadius:12,background:C.accSoft,textAlign:"center"}}><div style={{...H,fontSize:24,color:C.acc}}>{totalCompleted}</div><div style={{...F,fontSize:11,color:C.t2,marginTop:2}}>Completed</div></div>
              <div style={{flex:1,padding:14,borderRadius:12,background:C.tealSoft,textAlign:"center"}}><div style={{...H,fontSize:24,color:C.teal}}>{thisWeekDone}</div><div style={{...F,fontSize:11,color:C.t2,marginTop:2}}>This week</div></div>
              <div style={{flex:1,padding:14,borderRadius:12,background:C.cream,textAlign:"center"}}><div style={{...H,fontSize:24,color:C.gold}}>{allSteps.filter(s=>s.loved).length}</div><div style={{...F,fontSize:11,color:C.t2,marginTop:2}}>Loved</div></div>
            </div>
          </div>
          {/* Category breakdown */}
          {Object.keys(completedByCategory).length>0&&<div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
            <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>What you do most</div>
            {Object.entries(completedByCategory).sort((a,b)=>b[1]-a[1]).map(([cat,count])=>{const pct=totalCompleted>0?count/totalCompleted*100:0;return(
              <div key={cat} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{...F,fontSize:13,fontWeight:500,color:C.t1,textTransform:"capitalize"}}>{catIcon(cat)} {cat}</span><span style={{...F,fontSize:12,color:C.t3}}>{count} done</span></div>
                <div style={{height:6,background:C.cream,borderRadius:3}}><div style={{height:"100%",width:`${pct}%`,background:C.accGrad,borderRadius:3,transition:"width 0.5s"}}/></div>
              </div>
            );})}
          </div>}
          {/* Profile insights */}
          {profile?.insights?.length>0&&<div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Profile insights ({profile.insights.length})</div>{profile.insights.map((ins,i)=>(<div key={i} style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,padding:"8px 0",borderBottom:i<profile.insights.length-1?`1px solid ${C.b1}`:"none"}}>{ins.text}</div>))}</div>}
          {/* Learned preferences */}
          {preferences.length>0&&<div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Learned preferences</div>{preferences.map((p,i)=>(<div key={i} style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,padding:"8px 0",borderBottom:i<preferences.length-1?`1px solid ${C.b1}`:"none"}}><span style={{fontWeight:600,color:C.t1,textTransform:"capitalize"}}>{p.key?.replace(/_/g," ")}:</span> {p.value}</div>))}</div>}
          {totalCompleted===0&&!profile?.insights?.length&&!preferences.length&&<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:28,marginBottom:8}}>{"\u{1F9E0}"}</div><div style={{...F,fontSize:14,color:C.t2}}>Complete some steps to see your patterns here.</div></div>}
        </div>}

        {settingsTab==="about"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><div style={{width:40,height:40,borderRadius:12,background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff"}}>{"\u{1F463}"}</div><div><div style={{...H,fontSize:16,color:C.t1}}>My Next Step</div><div style={{...F,fontSize:12,color:C.t3}}>v1.0 Beta</div></div></div>
            <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6}}>Your AI guide that turns goals into actionable steps.</div>
          </div>
          <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
            <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Legal</div>
            <div onClick={()=>setLegalModal("terms")} style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"5px 0"}}>Terms of Service</div>
            <div onClick={()=>setLegalModal("privacy")} style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"5px 0"}}>Privacy Policy</div>
            <div onClick={()=>setLegalModal("affiliate")} style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"5px 0"}}>Affiliate Disclosure</div>
            <div style={{...F,fontSize:13,color:C.t3,marginTop:8,lineHeight:1.5,padding:"10px 14px",background:C.cream,borderRadius:10}}>Some links may earn us a small commission at no extra cost to you. This helps keep My Next Step free.</div>
          </div>
          <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
            <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Data</div>
            {!deleteConfirm?<button onClick={()=>{setDeleteConfirm(true);setDeleteText("");}} style={{...F,width:"100%",padding:"12px",borderRadius:12,background:"rgba(220,60,60,0.04)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",fontSize:13,cursor:"pointer",textAlign:"left"}}>Delete my account and all data</button>
            :<div>
              <div style={{...F,fontSize:14,color:"#DC3C3C",fontWeight:600,marginBottom:8}}>This is permanent</div>
              <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.6,marginBottom:12}}>Your profile, all steps, journeys, routines, chat history, and connected accounts will be permanently deleted. This cannot be undone.</div>
              <div style={{...F,fontSize:12,color:C.t3,marginBottom:8}}>Type <span style={{fontWeight:700,color:"#DC3C3C"}}>delete my account</span> to confirm:</div>
              <input value={deleteText} onChange={e=>setDeleteText(e.target.value)} placeholder="delete my account" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:"1.5px solid rgba(220,60,60,0.3)",background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setDeleteConfirm(false);setDeleteText("");}} style={{...F,flex:1,padding:10,borderRadius:12,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button onClick={()=>{if(deleteText.toLowerCase().trim()==="delete my account"){const uid=getUserId(profile);if(uid){deleteFB(uid,"appdata");deleteFB(uid,"strava");deleteFB(uid,"calendar");}resetAll();}}} disabled={deleteText.toLowerCase().trim()!=="delete my account"} style={{...F,flex:1,padding:10,borderRadius:12,border:"none",background:deleteText.toLowerCase().trim()==="delete my account"?"#DC3C3C":"rgba(220,60,60,0.1)",color:deleteText.toLowerCase().trim()==="delete my account"?"#fff":"rgba(220,60,60,0.3)",fontSize:13,fontWeight:600,cursor:deleteText.toLowerCase().trim()==="delete my account"?"pointer":"default"}}>Delete permanently</button>
              </div>
            </div>}
          </div>
        </div>}

        {/* Legal modals */}
        {legalModal&&<div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setLegalModal(null)}><div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,maxHeight:"80vh",overflowY:"auto",background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{...H,fontSize:20,color:C.t1}}>{legalModal==="terms"?"Terms of Service":legalModal==="privacy"?"Privacy Policy":"Affiliate Disclosure"}</div><button onClick={()=>setLegalModal(null)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:18}}>{"\u00D7"}</button></div>
          <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.8}}>
            {legalModal==="terms"&&<div>
              <p>Last updated: April 2026</p>
              <p>Welcome to My Next Step. By using this app, you agree to these terms.</p>
              <p>My Next Step provides AI-powered life guidance including step and journey recommendations, fitness suggestions, and healthcare provider search. The app is not a substitute for professional medical, financial, or legal advice.</p>
              <p>We use third-party AI (Anthropic Claude) to generate recommendations. While we strive for accuracy, recommendations may not always be perfect. Always verify important details independently.</p>
              <p>You retain ownership of all personal data you provide. We store your data securely using Firebase/Firestore. You can delete your account and all associated data at any time from Settings.</p>
              <p>We reserve the right to modify these terms. Continued use of the app constitutes acceptance of updated terms.</p>
            </div>}
            {legalModal==="privacy"&&<div>
              <p>Last updated: April 2026</p>
              <p>Your privacy matters to us. Here's how we handle your data:</p>
              <p>We collect: your name, email, age, gender, location, fitness preferences, insurance information (if opted in), chat history, and step/journey data.</p>
              <p>We use this data to: personalize AI recommendations, sync your data across devices, and improve the app experience.</p>
              <p>We do NOT: sell your data, share it with advertisers, or use it for any purpose beyond providing the My Next Step service.</p>
              <p>Third-party services: We use Firebase (Google) for data storage, Anthropic Claude for AI, and optionally connect to Strava and Google Calendar with your explicit permission.</p>
              <p>Data deletion: You can delete all your data at any time from Settings. When you delete your account, all data is permanently removed from our servers.</p>
              <p>Health data: Health and fitness information is only collected when you explicitly opt in. It is used solely to personalize recommendations and is never shared.</p>
            </div>}
            {legalModal==="affiliate"&&<div>
              <p>Last updated: April 2026</p>
              <p>My Next Step may include links to third-party products and services. Some of these links are affiliate links, meaning we may earn a small commission if you make a purchase or booking through them.</p>
              <p>This comes at no additional cost to you. Affiliate relationships do not influence which products or services we recommend \u2014 recommendations are based on your personal preferences, location, and goals.</p>
              <p>Our affiliate partners may include: ClassPass, Eventbrite, Udemy, Skillshare, Mindbody, Meetup, Amazon, LinkedIn Learning, Airbnb, Kayak, Booking.com, VRBO, and others.</p>
              <p>Revenue from affiliate links helps keep My Next Step free for all users.</p>
            </div>}
          </div>
        </div></div>}
      </div></div>}
    </div>
  );
}
