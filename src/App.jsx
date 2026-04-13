import { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import { Heart, Sparkles, Calendar, Settings, ArrowUp, MessageCircle, ChevronRight, X, Check, Search, Flame, HelpCircle } from "lucide-react";

import { font, H, F, C, SEGMENTS, SEG_KEYS, SYSTEM_PROMPT, PROFILE_SECTIONS, AFF } from "./lib/constants.js";
import { getUserId, saveFB, loadFB, deleteFB } from "./lib/firebase.js";
import { getGreeting, FadeIn, ProgressRing, clean, wrapLink, trackClick, TLink, catToSeg, segIcon, catIcon, catIconMap, Logo } from "./lib/utils.jsx";
import { loadGSI, decJwt, connectStrava, exchStrava, fetchStrava, connectGCal, fetchGCal, addGCalEvent, addGCalRecurring } from "./lib/auth.js";
import StepCard from "./components/StepCard.jsx";
import JourneyCard from "./components/JourneyCard.jsx";
import RoutineCard from "./components/RoutineCard.jsx";
import TimelineView from "./components/TimelineView.jsx";
import ToastContainer, { showToast, showConfirm } from "./components/Toast.jsx";
import { getBadges } from "./modals/Badges.jsx";
import { requestNotificationPermission, startReminderChecks, stopReminderChecks } from "./lib/notifications.js";
import { SponsorCard, BottomBanner, InlineFeedAd, CalendarAd } from "./components/AdBanner.jsx";
const UpgradeModal = lazy(() => import("./modals/UpgradeModal.jsx"));

// Lazy-loaded screens and modals
const AuthScreen = lazy(() => import("./screens/AuthScreen.jsx"));
const SetupScreen = lazy(() => import("./screens/SetupScreen.jsx"));
const QuickProfile = lazy(() => import("./screens/QuickProfile.jsx"));
const DeepProfileChat = lazy(() => import("./screens/DeepProfileChat.jsx"));
const SettingsPanel = lazy(() => import("./screens/Settings.jsx"));
const Walkthrough = lazy(() => import("./screens/Walkthrough.jsx"));
const HelpModal = lazy(() => import("./modals/HelpModal.jsx"));
const SearchModal = lazy(() => import("./modals/SearchModal.jsx"));
const ShareModal = lazy(() => import("./modals/ShareModal.jsx"));
const WeeklySummary = lazy(() => import("./modals/WeeklySummary.jsx"));
const BadgesModal = lazy(() => import("./modals/Badges.jsx"));
const LegalModal = lazy(() => import("./modals/LegalModal.jsx"));

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
  // Single unified chat history (guide knows everything across all segments)
  const[chats,setChats]=useState({all:[]});
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
  const[showHelp,setShowHelp]=useState(false);
  const[showSearch,setShowSearch]=useState(false);
  const[darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem("mns_dark")==="true";}catch{return false;}});
  const[showWeekly,setShowWeekly]=useState(false);
  const[showBadges,setShowBadges]=useState(false);
  const[showUpgrade,setShowUpgrade]=useState(false);
  const userTier=profile?.tier||"free";
  const[settingsTab,setSettingsTab]=useState("profile");
  const[editField,setEditField]=useState(null);
  const[editVal,setEditVal]=useState("");
  const[genderEdit,setGenderEdit]=useState("");
  const[genderOtherEdit,setGenderOtherEdit]=useState("");
  const[legalModal,setLegalModal]=useState(null);
  const[deleteConfirm,setDeleteConfirm]=useState(false);
  const[deleteText,setDeleteText]=useState("");
  const[healthSection,setHealthSection]=useState({fitness:true,food:true,medical:false,travel:false});
  const[petType,setPetType]=useState("Dog");
  const[petBreed,setPetBreed]=useState("");
  const[petAge,setPetAge]=useState("");
  const[transitionMsg,setTransitionMsg]=useState(null); // {text, targetSeg, count, type}
  const chatEnd=useRef(null);const inputRef=useRef(null);const persistTimer=useRef(null);

  const trimChats = (ch) => {
    if (!ch) return ch;
    var out = {};
    for (var k in ch) {
      if (Array.isArray(ch[k]) && ch[k].length > 50) {
        out[k] = ch[k].slice(-50);
      } else {
        out[k] = ch[k];
      }
    }
    return out;
  };

  const normalizeChats = (ch) => {
    if (!ch) return {all:[]};
    // If already unified format
    if (ch.all) return {all: ch.all};
    // Migrate from per-segment format: merge all into one sorted conversation
    const all = [...(ch.career||ch.work||[]),...(ch.wellness||ch.me||[]),...(ch.adventure||[]),...(ch.fun||[]),...(ch.social||[])].sort((a,b)=>(a.ts||0)-(b.ts||0));
    return {all};
  };

  // Current segment's data
  const activeSteps=allSteps.filter(s=>s.status==="active");
  const filterBySeg=(items,seg,catFn)=>seg==="everything"?items:items.filter(i=>catFn(i)===seg);
  const segSteps=filterBySeg(activeSteps,segment,s=>catToSeg(s.category));
  const matchPlanKeywords=(title,seg)=>{const t=title.toLowerCase();const kw={career:["career","work","job","interview","resume","linkedin"],wellness:["gym","yoga","run","health","diet","meditation"],adventure:["friend","party","dinner","concert","group","date","trip","travel","flight","hotel","vacation","hike","explore","fun","event"]};if((kw[seg]||[]).some(w=>t.includes(w)))return true;return false;};
  const segPlans=segment==="everything"?allPlans:allPlans.filter(p=>{const cats=(p.tasks||[]).map(t=>t.category).filter(Boolean);if(cats.length)return cats.some(c=>catToSeg(c)===segment);const title=(p.title||"").toLowerCase();if(matchPlanKeywords(title,segment))return true;if(SEG_KEYS.some(s=>s!==segment&&matchPlanKeywords(title,s)))return false;return segment==="wellness";});
  const segRoutines=filterBySeg(allRoutines,segment,r=>catToSeg(r.category));
  const segMessages=chats.all||[];
  const doneSteps=allSteps.filter(s=>s.status==="done");
  const expiredSteps=allSteps.filter(s=>s.status==="expired");

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[segMessages.length,loading]);

  // Strava OAuth redirect
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const code=p.get("code");if(code&&p.get("scope")?.includes("read")){window.history.replaceState({},"",window.location.pathname);setShowSettings(true);setSettingsTab("connections");exchStrava(code).then(async d=>{if(d?.access_token){const pr=await fetchStrava(d.access_token);const full={...d,profile:pr};setStravaData(full);const uid=getUserId(profile);if(uid)saveFB(uid,"strava",full);}});}},[]);

  // Load data — try localStorage first for instant load, then Firebase for latest
  useEffect(()=>{(async()=>{
    try{const hint=localStorage.getItem("mns_last_user");if(hint){
      // Instant load from localStorage cache (no network needed)
      try{const cached=localStorage.getItem("mns_appdata_"+hint);if(cached){const d=JSON.parse(cached);if(d?.profile?.setup){setProfile(d.profile);setAllSteps(d.steps||[]);setAllPlans(d.plans||[]);setAllRoutines(d.routines||[]);setChats(trimChats(normalizeChats(d.chats)));setPreferences(d.preferences||[]);setScreen("main");}}}catch{}
      // Then sync from Firebase in background for latest data
      try{const [data, sv, cv] = await Promise.all([
        loadFB(hint, "appdata"),
        loadFB(hint, "strava"),
        loadFB(hint, "calendar")
      ]);
      if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setAllRoutines(data.routines||[]);setChats(trimChats(normalizeChats(data.chats)));setPreferences(data.preferences||[]);}
      if(sv)setStravaData(sv);
      if(cv){setCalToken(cv.token);setCalData(cv.events);}
      }catch(e){console.log("Firebase sync failed, using cached data:",e);}
    }}catch{}
    // Migration from old format
    try{const s=await window.storage.get("mns-v11");if(s){const d=JSON.parse(s.value);if(d.profile?.setup){setProfile(d.profile);setAllSteps(d.steps||[]);setAllPlans(d.plans||[]);setChats({career:[],wellness:d.messages||[],adventure:[]});setPreferences(d.preferences||[]);setScreen("main");const uid=getUserId(d.profile);if(uid){saveFB(uid,"appdata",{...d,chats:{career:[],wellness:d.messages||[],adventure:[]}});window.storage.delete("mns-v11").catch(()=>{});}}}}catch{}
  })();},[]);

  useEffect(()=>{
    if(screen==="main"){requestNotificationPermission();startReminderChecks(()=>({allSteps,allRoutines,calData}));}
    return ()=>{ stopReminderChecks(); };
  },[screen]);

  // Follow-up check: prompt feedback for booked events that have passed
  useEffect(()=>{if(screen!=="main"||!allSteps.length)return;const now=new Date();allSteps.filter(s=>s.status==="active"&&s.booked&&s.time).forEach(s=>{const t=(s.time||"").toLowerCase();let eventDate=new Date();if(t.includes("yesterday")||t.includes("last")){setFeedbackStep(s);return;}const age=s.createdAt?(now-new Date(s.createdAt))/36e5:0;if((t.includes("today")&&age>18)||(t.includes("tonight")&&age>12)){setFeedbackStep(s);}});},[screen,allSteps.length]);

  const persist=(p,s,pl,ch,pr,rt)=>{
    const data={profile:p||profile,steps:s||allSteps,plans:pl||allPlans,chats:ch||chats,preferences:pr||preferences,routines:rt||allRoutines};
    const uid=getUserId(p||profile);
    if(!uid)return;
    localStorage.setItem("mns_last_user",uid);
    // Save to localStorage immediately for instant feel
    try{localStorage.setItem("mns_appdata_"+uid,JSON.stringify(data));}catch{}
    // Debounce Firebase write to 2 seconds
    if(persistTimer.current)clearTimeout(persistTimer.current);
    persistTimer.current=setTimeout(()=>{
      saveFB(uid,"appdata",data);
    },2000);
  };

  const handleAuth=async(auth)=>{const uid=auth.email?auth.email.replace(/[^a-zA-Z0-9]/g,"_"):null;if(uid){
    // Check localStorage first (instant, works offline)
    try{const cached=localStorage.getItem("mns_appdata_"+uid);if(cached){const d=JSON.parse(cached);if(d?.profile?.setup){setProfile(d.profile);setAllSteps(d.steps||[]);setAllPlans(d.plans||[]);setAllRoutines(d.routines||[]);setChats(trimChats(normalizeChats(d.chats)));setPreferences(d.preferences||[]);localStorage.setItem("mns_last_user",uid);setScreen("main");
    // Background sync from Firebase
    loadFB(uid,"appdata").then(data=>{if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setAllRoutines(data.routines||[]);setChats(trimChats(normalizeChats(data.chats)));setPreferences(data.preferences||[]);}}).catch(()=>{});
    loadFB(uid,"strava").then(sv=>{if(sv)setStravaData(sv);}).catch(()=>{});
    loadFB(uid,"calendar").then(cv=>{if(cv){setCalToken(cv.token);setCalData(cv.events);}}).catch(()=>{});
    return;}}}catch{}
    // No localStorage cache — try Firebase directly
    try{const data=await loadFB(uid,"appdata");if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setAllRoutines(data.routines||[]);setChats(trimChats(normalizeChats(data.chats)));setPreferences(data.preferences||[]);localStorage.setItem("mns_last_user",uid);setScreen("main");return;}}catch(e){console.log("Firebase load failed during auth:",e);}
    }const p={name:auth.name,email:auth.email,method:auth.method};setProfile(p);setAllSteps([]);setAllPlans([]);setAllRoutines([]);setChats({all:[]});setPreferences([]);localStorage.setItem("mns_last_user",getUserId(p));setScreen("setup");};
  const handleSetup=function(setup){const full={...profile,setup};setProfile(full);setAllSteps([]);setAllPlans([]);setAllRoutines([]);setPreferences([]);const w=[{role:"assistant",content:"Hey "+full.name+"!\n\nI'm your Next Step guide. Tell me what's on your mind and I'll make it happen.",ts:Date.now()}];setChats({all:w});setView("steps");persist(full,[],[],{all:w},[],[]); setScreen("welcome");};
  const handleQuickProfile=function(data){const full={...profile,quickProfile:data,health:{...(profile?.health||{}),fitnessLevel:data.fitness==="Just starting"?"Beginner":data.fitness==="Active"?"Intermediate":data.fitness==="Very active"?"Advanced":profile?.health?.fitnessLevel,allergies:data.allergies||[],diets:data.diet||[],otherAllergies:data.otherAllergies||profile?.health?.otherAllergies||""}};setProfile(full);persist(full,allSteps,allPlans,chats,preferences,allRoutines);if(data.deepProfile){setScreen("deepprofile");}else{setScreen("main");}};
  const handleDeepFinish=insights=>{
    const full={...profile,insights};setProfile(full);
    if(!(chats.all||[]).length){const w=[{role:"assistant",content:`Hey ${full.name}! I'm your Next Step guide. Tell me what's on your mind and I'll make it happen.`,ts:Date.now()}];setChats({all:w});persist(full,[],[],{all:w},[],[]); }
    else persist(full,allSteps,allPlans,chats,preferences);
    setView("steps");setScreen("main");
  };

  const sendMessage=async text=>{
    const msg=text||input.trim();if(!msg||loading)return;
    const ts=Date.now();
    const userMsg={role:"user",content:msg,ts};
    const allChat=[...(chats.all||[]),userMsg];
    const newChats={all:allChat};
    setChats(newChats);setInput("");setLoading(true);
    if(inputRef.current)inputRef.current.style.height="auto";

    // Build context — only include what's relevant to save tokens
    const msgLower=msg.toLowerCase();
    const isHealth=/workout|gym|run|yoga|exercise|diet|doctor|health|fitness|weight|medical|allerg/i.test(msgLower);
    const isTravel=/trip|travel|flight|hotel|vacation|book|reserve|airport/i.test(msgLower);
    const isFood=/restaurant|dinner|lunch|food|eat|cuisine|cook/i.test(msgLower);
    const isSchedule=/calendar|schedule|when|tonight|tomorrow|weekend|today|time|busy/i.test(msgLower);

    const now=new Date();const timeCtx=`\nTIME: ${now.toLocaleString()} ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][now.getDay()]}. ${now.getHours()>=20?"Late evening.":now.getHours()>=17?"Evening.":""}${now.getDay()===0||now.getDay()===6?" Weekend.":""}`;
    const profileCtx=profile?.setup?`\nAge: ${profile.setup.age||"?"} | Gender: ${profile.setup.gender||"?"}`:"";
    const qp=profile?.quickProfile;const quickCtx=qp?`\nInterests: ${(qp.interests||[]).join(", ")||"?"} | Budget: ${qp.budget||"?"} | ${qp.relationship||""} | ${qp.work||""}`:"";

    const stepsCtx=activeSteps.length>0?"\n\nACTIVE STEPS:\n"+activeSteps.slice(0,10).map(s=>`- "${s.title}" (${s.category})${s.loved?" [LOVED]":""}`).join("\n"):"";
    const dislikedCtx=allSteps.filter(s=>s.disliked).length>0?"\nDISLIKED: "+allSteps.filter(s=>s.disliked).slice(0,8).map(s=>s.title).join(", "):"";
    const lovedCtx=allSteps.filter(s=>s.loved).length>0?"\nLOVED: "+allSteps.filter(s=>s.loved).slice(0,5).map(s=>s.title).join(", "):"";
    const completedCtx=doneSteps.length>0?"\nRecent completions: "+doneSteps.slice(0,5).map(s=>s.title).join(", "):"";
    const prefText=preferences.length>0?"\nPrefs: "+preferences.slice(-10).map(p=>p.value).join("; "):"";
    const favsCtx=(profile?.favorites||[]).length>0?"\nFavorites: "+(profile.favorites).slice(0,8).map(f=>f.title).join(", "):"";
    const petsCtx=(profile?.pets||[]).length>0?"\nPets: "+(profile.pets).map(p=>p.name+" ("+p.type+")").join(", "):"";
    const plansCtx=allPlans.length>0?"\nPaths: "+allPlans.slice(0,5).map(p=>p.title).join(", "):"";
    const routineCtx=allRoutines.filter(r=>!r.paused).length>0?"\nRecurring: "+allRoutines.filter(r=>!r.paused).slice(0,5).map(r=>r.title+" ("+r.schedule+")").join(", "):"";

    // Conditional — only include heavy sections when relevant
    const healthCtx=isHealth&&profile?.health?`\n\nHEALTH: Level:${profile.health.fitnessLevel||"?"} Goals:${(profile.health.fitnessGoals||[]).join(",")} Prefs:${(profile.health.workoutPrefs||[]).join(",")} Injuries:${profile.health.injuries||"none"} Allergies:${(profile.health.allergies||[]).join(",")} Diet:${(profile.health.diets||[]).join(",")}`:"";
    const calCtx=isSchedule&&calData?.length>0?"\n\nCALENDAR:\n"+calData.slice(0,8).map(e=>{const d=new Date(e.start);return`- ${d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})} ${e.allDay?"":d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}: ${e.title}`;}).join("\n"):"";
    const travelCtx=isTravel&&profile?.travel?`\nTravel: ${profile.travel.flightClass||""} ${profile.travel.flightStops||""} Hotel:${profile.travel.hotelBudget||""} ${profile.travel.hotelStyle||""}${(profile.travel.brands||[]).length>0?" Brands:"+profile.travel.brands.join(","):""}`:"";
    const sp=stravaData?.profile;const stravaText=isHealth&&sp?`\nStrava: ${sp.allTimeRuns} runs, ${sp.allTimeRides} rides`:"";
    const dp=profile?.derivedProfile;const derivedCtx=dp?`\nProfile: cuisine:${(dp.cuisinePreferences||[]).join(",")} music:${(dp.musicTaste||[]).join(",")} travel:${dp.travelStyle||"?"} social:${dp.socialStyle||"?"}`:"";


    try{
      // Strip ts field and ensure valid alternating roles for API
      const cleanMsgs=allChat.slice(-10).filter(m=>!m.isError).map(m=>({role:m.role,content:typeof m.content==="string"?m.content:JSON.stringify(m.content)})).filter(m=>m.content&&m.content.trim()&&!m.content.startsWith("Something went wrong")&&!m.content.startsWith("Quick hiccup"));
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

      const sysPrompt=SYSTEM_PROMPT+`\n\nUser is viewing: ${SEGMENTS[segment]?.label||"Your Journey"} segment. Auto-categorize items to the right segment.\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}${profileCtx}${quickCtx}${healthCtx}${prefText}${stravaText}${timeCtx}${stepsCtx}${lovedCtx}${dislikedCtx}${completedCtx}${favsCtx}${petsCtx}${plansCtx}${routineCtx}${calCtx}${travelCtx}${derivedCtx}`;

      let finalText="",currentMsgs=[...safeApiMsgs],attempts=0;
      while(attempts<3){attempts++;
        const needsSearch=/find|search|near|book|reserve|restaurant|flight|hotel|class|doctor|event|show|concert|where|price|cost|\$/i.test(msg);
        const isSimple=msg.length<50&&/^(yes|no|ok|sure|sounds good|thanks|love it|more|got it|cool|nice|perfect|great|do it|go ahead)/i.test(msg);
        const maxTok=isSimple?500:needsSearch?2000:1200;
        const tools=needsSearch?[{type:"web_search_20250305",name:"web_search"}]:undefined;
        const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json","x-user-id":getUserId(profile)},body:JSON.stringify({model:"auto",max_tokens:maxTok,tools:tools,system:sysPrompt,messages:currentMsgs})});
        if(res.status===429||res.status>=500){
          const wait=attempts*3000;
          console.log(`API ${res.status}, retrying in ${wait}ms (attempt ${attempts}/3)...`);
          await new Promise(r=>setTimeout(r,wait));
          continue;
        }
        if(!res.ok){const errText=await res.text();console.error("API error:",res.status,errText);
          let errMsg=`Something went wrong (${res.status}).`;
          try{const errJson=JSON.parse(errText);if(errJson.error?.message)errMsg+=` ${errJson.error.message.slice(0,200)}`;}catch{errMsg+=` ${errText.slice(0,200)}`;}
          finalText=errMsg;break;}
        const data=await res.json();
        console.log("API attempt",attempts,"stop:",data.stop_reason,"blocks:",data.content?.length);
        if(!data.content||data.content.length===0){console.error("Empty content from API:",JSON.stringify(data));finalText="Hmm, I didn't get a response. Try again?";break;}
        for(const block of data.content)if(block.type==="text"&&block.text)finalText+=block.text+"\n";
        if(data.stop_reason==="end_turn"||data.stop_reason==="stop")break;
        if(data.stop_reason==="tool_use"){currentMsgs.push({role:"assistant",content:data.content});const tr=[];for(const b of data.content){if(b.type==="tool_use")tr.push({type:"tool_result",tool_use_id:b.id,content:"Search complete. Now respond with 1-2 casual sentences, then ---DATA--- followed by a JSON array of steps/paths based on what you found. Remember: the cards are the product, not the chat text."});if(b.type==="server_tool_use")tr.push({type:"tool_result",tool_use_id:b.id,content:""});}if(tr.length)currentMsgs.push({role:"user",content:tr});finalText="";continue;}
        break;
      }

      const raw=finalText.trim()||"Let me think...";
      console.log("Raw AI response:", raw.slice(0, 300));
      let displayText=raw,newSteps=[...allSteps],newPlans=[...allPlans],newPrefs=[...preferences],newRoutines=[...allRoutines];
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
        const items=JSON.parse(jsonStr);
        for(const item of(Array.isArray(items)?items:[items])){
          const defaultCat=segment==="career"?"career":segment==="wellness"?"fitness":segment==="adventure"?"social":"travel";
          if(item.type==="step"){const newStep={...item,title:clean(item.title),why:clean(item.why),category:item.category||defaultCat,status:"active",id:Date.now()+Math.random(),createdAt:new Date().toISOString()};newSteps=[newStep,...newSteps];if(calToken&&item.time)addGCalEvent(calToken,newStep.title,newStep.why,item.time).catch(()=>{});}
          else if(item.type==="plan")newPlans=[{...item,title:clean(item.title),tasks:(item.tasks||[]).map(t=>({...t,title:clean(t.title),done:false,category:t.category||item.category||defaultCat}))},...newPlans.filter(p=>p.title!==item.title)];
          else if(item.type==="routine"){newRoutines=[{...item,category:item.category||defaultCat,id:Date.now()+Math.random(),createdAt:new Date().toISOString(),paused:false},...newRoutines.filter(r=>r.title!==item.title)];if(calToken)addGCalRecurring(calToken,item.title,item.description,item.schedule,item.days,item.time).catch(()=>{});}
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
      if(!displayText)displayText=newSteps.length>allSteps.length?"Here's what I found!":newPlans.length>allPlans.length?"Plan mapped out!":"Let me know what you think.";

      const isError=displayText.startsWith("Something went wrong")||displayText.startsWith("Hmm, I didn't")||displayText.startsWith("Quick hiccup");
      const finalChat={all:[...(newChats.all||[]),{role:"assistant",content:clean(displayText),ts:Date.now(),isError:isError}]};
      setChats(finalChat);
      if(!isError)persist(profile,newSteps,newPlans,finalChat,newPrefs,newRoutines);
      // Auto-navigate to the correct segment with transition
      if(!isError){
        const createdSteps=newSteps.filter(s=>!allSteps.find(o=>o.id===s.id));
        const createdPlans=newPlans.filter(p=>!allPlans.find(o=>o.title===p.title));
        const createdRoutines=newRoutines.filter(r=>!allRoutines.find(o=>o.id===r.id));
        const totalCreated=createdSteps.length+createdPlans.length+createdRoutines.length;
        if(totalCreated>0){
          const firstItem=createdSteps[0]||null;
          const firstPlan=createdPlans[0]||null;
          const firstRoutine=createdRoutines[0]||null;
          const itemCat=firstItem?.category||(firstPlan?.tasks?.[0]?.category)||firstRoutine?.category||null;
          const targetSeg=itemCat?catToSeg(itemCat):segment;
          const targetLabel=SEGMENTS[targetSeg]?.label||"Your Journey";
          const type=createdSteps.length>0?"step":createdPlans.length>0?"path":"recurring step";
          const text=totalCreated===1?(type==="step"?`New step: ${firstItem?.title||"Ready!"}`:(type==="path"?`Plan: ${firstPlan?.title||"Mapped out!"}`:`Repeating: ${firstRoutine?.title||"Set up!"}`)):`${totalCreated} new items created`;
          setTransitionMsg({text,targetSeg,targetLabel,count:totalCreated});
          setTimeout(()=>{setTransitionMsg(null);},6000);
        }
      }
    }catch(err){console.error(err);const errChat={all:[...(newChats.all||[]),{role:"assistant",content:"Quick hiccup \u2014 say that again?",ts:Date.now(),isError:true}]};setChats(errChat);}
    setLoading(false);
  };

  const deleteStep=useCallback(id=>{const u=allSteps.filter(s=>s.id!==id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);},[allSteps,profile,allPlans,chats,preferences]);
  const markStep=useCallback((id,st)=>{const step=allSteps.find(s=>s.id===id);if(st==="done"){setFeedbackStep(step);if(step){const pref={key:`completed_${step.category||"general"}`,value:`Completed "${step.title}" - user enjoys ${step.category||"this type"}`};const np=[...preferences.filter(p=>p.key!==pref.key),pref];setPreferences(np);const u=allSteps.map(s=>s.id===id?{...s,status:st,completedAt:new Date().toISOString()}:s);setAllSteps(u);persist(profile,u,allPlans,chats,np);return;}}const u=allSteps.map(s=>s.id===id?{...s,status:st}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);},[allSteps,profile,allPlans,chats,preferences]);
  const dislikeStep=useCallback((id)=>{const step=allSteps.find(s=>s.id===id);if(step){const pref={key:`dislike_${(step.title||"").slice(0,30).replace(/\s+/g,"_").toLowerCase()}`,value:`Disliked "${step.title}" - do NOT recommend this or similar again`};const np=[...preferences,pref];setPreferences(np);setFeedbackStep(step);const u=allSteps.map(s=>s.id===id?{...s,status:"done",disliked:true}:s);setAllSteps(u);persist(profile,u,allPlans,chats,np);}},[allSteps,profile,allPlans,chats,preferences]);
  const loveStep=useCallback(id=>{const step=allSteps.find(s=>s.id===id);const u=allSteps.map(s=>s.id===id?{...s,loved:!s.loved}:s);setAllSteps(u);if(step&&!step.loved){const pref={key:`loved_${step.category||"general"}`,value:`Loved "${step.title}"`};const np=[...preferences.filter(p=>p.key!==pref.key),pref];setPreferences(np);const fav={title:step.title,category:step.category||"general",link:step.link,addedAt:new Date().toISOString()};const favs=[fav,...(profile?.favorites||[]).filter(f=>f.title!==step.title)].slice(0,30);const p={...profile,favorites:favs};setProfile(p);persist(p,u,allPlans,chats,np);}else{if(step?.loved){const favs=(profile?.favorites||[]).filter(f=>f.title!==step.title);const p={...profile,favorites:favs};setProfile(p);persist(p,u,allPlans,chats,preferences);}else persist(profile,u,allPlans,chats,preferences);}},[allSteps,profile,allPlans,chats,preferences]);
  const submitFeedback=()=>{if(!feedbackText.trim()||!feedbackStep)return;sendMessage(`Completed "${feedbackStep.title}": ${feedbackText.trim()}`);setFeedbackStep(null);setFeedbackText("");setView("chat");};
  const submitMissedReason=()=>{if(!missedReason.trim()||!missedStep)return;sendMessage(`I didn't do "${missedStep.title}". Reason: ${missedReason.trim()}`);const u=allSteps.filter(s=>s.id!==missedStep.id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);setMissedStep(null);setMissedReason("");setView("chat");};
  const dismissMissed=id=>{const u=allSteps.filter(s=>s.id!==id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const deletePlan=idx=>{const u=allPlans.filter((_,i)=>i!==idx);setAllPlans(u);persist(profile,allSteps,u,chats,preferences);};
  const toggleTask=(pi,ti)=>{const u=allPlans.map((p,i)=>i===pi?{...p,tasks:p.tasks.map((t,j)=>j===ti?{...t,done:!t.done}:t)}:p);setAllPlans(u);persist(profile,allSteps,u,chats,preferences);};
  const pauseRoutine=id=>{const u=allRoutines.map(r=>r.id===id?{...r,paused:!r.paused}:r);setAllRoutines(u);persist(profile,allSteps,allPlans,chats,preferences,u);};
  const deleteRoutine=id=>{showConfirm("Delete this repeating step permanently?",function(){const u=allRoutines.filter(r=>r.id!==id);setAllRoutines(u);persist(profile,allSteps,allPlans,chats,preferences,u);});};
  const completeRoutine=id=>{const u=allRoutines.map(r=>r.id===id?{...r,completions:(r.completions||0)+1,lastCompleted:new Date().toISOString()}:r);setAllRoutines(u);persist(profile,allSteps,allPlans,chats,preferences,u);};
  const snoozeStep=useCallback((id,until)=>{const u=allSteps.map(s=>s.id===id?{...s,snoozedUntil:until,status:"active"}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);showToast("Snoozed until "+new Date(until).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}));},[allSteps,profile,allPlans,chats,preferences]);
  const talkAbout=useCallback(text=>{setView("chat");setTimeout(()=>{inputRef.current?.focus();sendMessage(text);},100);},[]);
  const swapStep=useCallback((step)=>{sendMessage(`Replace "${step.title}" with a different option. Delete the old one and create a fresh alternative with prices and booking links. Keep the same category.`);},[]);
  const chooseOption=useCallback((stepId,option)=>{const u=allSteps.map(s=>s.id===stepId?{...s,chosen:option,title:option.name,why:option.why,link:option.link}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);},[allSteps,profile,allPlans,chats,preferences]);
  const[shareModalItem,setShareModalItem]=useState(null);
  const shareItem=useCallback((item)=>{setShareModalItem(item);},[]);
  const handleBooked=useCallback((step)=>{handleAddCal(step.title,step.why,step.time);const u=allSteps.map(s=>s.id===step.id?{...s,booked:true}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);},[allSteps,profile,allPlans,chats,preferences,calToken]);
  // Compute insights for stats
  const completedByCategory={};doneSteps.forEach(s=>{const c=s.category||"other";completedByCategory[c]=(completedByCategory[c]||0)+1;});
  const totalCompleted=doneSteps.length;
  const thisWeekDone=doneSteps.filter(s=>{const d=new Date(s.completedAt||s.createdAt);return(Date.now()-d.getTime())<7*864e5;}).length;
  const handleAddCal=useCallback(async(title,why,time)=>{const addWithToken=async(token)=>{const ok=await addGCalEvent(token,title,why,time);if(ok){showToast("Added to Calendar!");return true;}return false;};if(!calToken){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});await addWithToken(r.access_token);});return;}const ok=await addWithToken(calToken);if(!ok){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});await addWithToken(r.access_token);});}},[calToken,profile]);
  const resetAll=async(deleteAccount)=>{const uid=getUserId(profile);if(uid&&deleteAccount){deleteFB(uid,"appdata");deleteFB(uid,"strava");deleteFB(uid,"calendar");}localStorage.removeItem("mns_last_user");setProfile(null);setAllSteps([]);setAllPlans([]);setChats({all:[]});setPreferences([]);setStravaData(null);setCalData(null);setScreen("auth");setShowSettings(false);};

  // Expiration check
  useEffect(()=>{const now=new Date(),h=now.getHours();let changed=false;const u=allSteps.map(s=>{if(s.status!=="active")return s;const t=(s.time||"").toLowerCase(),age=s.createdAt?(Date.now()-new Date(s.createdAt).getTime())/36e5:0;if((age>48)||(t.includes("tonight")&&age>14)||(t.includes("today")&&age>24)){changed=true;return{...s,status:"expired"};}return s;});if(changed){setAllSteps(u);persist(profile,u,allPlans,chats,preferences);}},[allSteps.length]);

  if(screen==="auth")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><AuthScreen onAuth={handleAuth}/></div></Suspense>);
  if(screen==="setup")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup}/></div></Suspense>);
  if(screen==="quickprofile")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><QuickProfile profile={profile} onComplete={handleQuickProfile}/></div></Suspense>);
  if(screen==="welcome")return(<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><style>{font}</style>
    <FadeIn><div style={{maxWidth:400,textAlign:"center"}}>
      <div style={{width:72,height:72,borderRadius:22,margin:"0 auto 24px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 28px rgba(212,82,42,0.25)"}}><Logo size={38} color="#fff"/></div>
      <h1 style={{...H,fontSize:26,color:C.t1,marginBottom:12}}>Welcome, {profile?.name}!</h1>
      <div style={{textAlign:"left",marginBottom:28}}>
        {[
          {emoji:"💬",title:"Ask me anything",desc:"Plan a trip, find a restaurant, start a workout — just type what you want."},
          {emoji:"📋",title:"Pick from real options",desc:"I'll find specific places with prices and links. You choose the one you like."},
          {emoji:"🗂️",title:"Everything stays organized",desc:"Your steps automatically sort into Career, Wellness, and Adventure tabs."},
        ].map((item,i)=>(
          <FadeIn key={i} delay={150+i*100}><div style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<2?"1px solid "+C.b1:"none"}}>
            <span style={{fontSize:24,flexShrink:0}}>{item.emoji}</span>
            <div><div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>{item.title}</div><div style={{...F,fontSize:13,color:C.t3,marginTop:2}}>{item.desc}</div></div>
          </div></FadeIn>
        ))}
      </div>
      <FadeIn delay={500}><button onClick={()=>{setScreen("main");setView("chat");setTimeout(()=>inputRef.current?.focus(),200);}} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:700,border:"none",cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 16px rgba(212,82,42,0.25)"}}>Let's take my next step!</button></FadeIn>
    </div></FadeIn>
  </div>);
  if(screen==="deepprofile")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepFinish} existingInsights={profile?.insights||[]}/></div></Suspense>);

  const segInfo=SEGMENTS[segment]||{label:"Your Journey",color:C.acc,soft:C.accSoft,desc:"all your steps and paths across every area of your life"};
  const bubble=u=>({...F,maxWidth:"82%",padding:"13px 18px",borderRadius:20,fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",...(u?{background:C.accGrad,color:"#fff",borderBottomRightRadius:6}:{background:C.card,color:C.t1,borderBottomLeftRadius:6,boxShadow:C.shadow})});

  return(
    <Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}>
    <div style={{...F,height:"100vh",color:C.t1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
      <style>{font}{`
        *{-webkit-tap-highlight-color:transparent;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dpb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes landIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes landFade{from{opacity:0}to{opacity:1}}
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        button{transition:transform 0.1s ease,opacity 0.15s ease;}
        button:active{transform:scale(0.97);opacity:0.9;}
        input:focus,textarea:focus{border-color:${C.acc} !important;box-shadow:0 0 0 3px rgba(212,82,42,0.08);}
        ::-webkit-scrollbar{width:0;height:0;}
        input,textarea,select{font-size:16px !important;}
      `}</style>
      {feedbackStep&&(<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"100%",maxWidth:420,background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
        <div style={{...F,fontSize:12,color:C.acc,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>How did it go?</div>
        <div style={{...H,fontSize:20,color:C.t1,marginBottom:16}}>{feedbackStep.title}</div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{["Loved it!","It was okay","Not for me","Too expensive","Too far","More like this"].map(q=>(<button key={q} onClick={()=>setFeedbackText(q)} style={{...F,padding:"8px 14px",borderRadius:12,fontSize:13,cursor:"pointer",background:feedbackText===q?C.accSoft:C.cream,border:`1.5px solid ${feedbackText===q?C.acc:C.b2}`,color:feedbackText===q?C.acc:C.t2}}>{q}</button>))}</div>
        <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} rows={2} placeholder="Or type..." style={{...F,width:"100%",padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.b2}`,background:C.bg,color:C.t1,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:14}}/>
        <div style={{display:"flex",gap:10}}><button onClick={()=>{setFeedbackStep(null);setFeedbackText("");}} style={{...F,flex:1,padding:12,borderRadius:16,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:14,cursor:"pointer"}}>Skip</button><button onClick={submitFeedback} disabled={!feedbackText.trim()} style={{...F,flex:1,padding:12,borderRadius:16,border:"none",fontSize:14,fontWeight:600,cursor:feedbackText.trim()?"pointer":"default",background:feedbackText.trim()?C.accGrad:"rgba(0,0,0,0.04)",color:feedbackText.trim()?"#fff":C.t3}}>Submit</button></div>
      </div></div>)}
      {missedStep&&(<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{width:"100%",maxWidth:420,background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
        <div style={{...F,fontSize:12,color:"#B45309",fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Missed step</div>
        <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>{missedStep.title}</div>
        <div style={{...F,fontSize:14,color:C.t3,marginBottom:16,lineHeight:1.5}}>Telling your guide why helps improve future recommendations.</div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{["Forgot","No time","Changed mind","Too far","Found better","Not interested"].map(q=>(<button key={q} onClick={()=>setMissedReason(q)} style={{...F,padding:"8px 14px",borderRadius:12,fontSize:13,cursor:"pointer",background:missedReason===q?C.goldSoft:C.cream,border:`1.5px solid ${missedReason===q?"#B45309":C.b2}`,color:missedReason===q?"#B45309":C.t2}}>{q}</button>))}</div>
        <textarea value={missedReason} onChange={e=>setMissedReason(e.target.value)} rows={2} placeholder="Or tell us more..." style={{...F,width:"100%",padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.b2}`,background:C.bg,color:C.t1,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:14}}/>
        <div style={{display:"flex",gap:10}}><button onClick={()=>{dismissMissed(missedStep.id);setMissedStep(null);setMissedReason("");}} style={{...F,flex:1,padding:12,borderRadius:16,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:14,cursor:"pointer"}}>Just remove</button><button onClick={submitMissedReason} disabled={!missedReason.trim()} style={{...F,flex:1,padding:12,borderRadius:16,border:"none",fontSize:14,fontWeight:600,cursor:missedReason.trim()?"pointer":"default",background:missedReason.trim()?C.accGrad:"rgba(0,0,0,0.04)",color:missedReason.trim()?"#fff":C.t3}}>Tell guide</button></div>
      </div></div>)}
      <div style={{padding:"14px 20px 4px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div>
            <div style={{...F,fontSize:12,color:C.t3}}>{getGreeting()},</div>
            <div style={{...H,fontSize:20,color:C.t1}}>{profile?.name}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
          {(()=>{
            const now=new Date();const weekAgo=new Date(now-7*864e5);
            const thisWeek=allSteps.filter(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt)>=weekAgo).length;
            let streak=0;const d=new Date(now);d.setHours(0,0,0,0);
            while(true){const ds=d.toDateString();if(allSteps.some(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt).toDateString()===ds)){streak++;d.setDate(d.getDate()-1);}else break;}
            if(streak<2)return null;
            return(<div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:10,background:C.goldSoft}}>
              <Flame size={12} color={C.gold}/><span style={{...F,fontSize:11,fontWeight:700,color:C.gold}}>{streak}</span>
            </div>);
          })()}
          <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Settings size={16}/></button>
          </div>
        </div>
      </div>
      <div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:6}}>
        <button onClick={()=>{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,flex:"0 0 auto",padding:"10px 16px",background:view==="chat"?C.accGrad:"transparent",border:view==="chat"?"none":`1.5px solid ${C.b2}`,borderRadius:14,cursor:"pointer",fontSize:13,fontWeight:600,color:view==="chat"?"#fff":C.t2,boxShadow:view==="chat"?"0 2px 8px rgba(212,82,42,0.2)":"none",display:"flex",alignItems:"center",gap:5,transition:"all 0.2s"}}><MessageCircle size={14}/> Guide</button>
        {SEG_KEYS.map(s=>{const info=SEGMENTS[s];const active=segment===s&&view==="steps";const count=activeSteps.filter(x=>catToSeg(x.category)===s).length;
          return(<button key={s} onClick={()=>{setSegment(s);setExpandedPlan(null);setView("steps");}} style={{...F,flex:1,padding:"10px 4px",background:active?C.card:"transparent",border:active?`1.5px solid ${info.color}30`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",fontSize:12,fontWeight:active?600:400,color:active?info.color:C.t3,boxShadow:active?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:3,transition:"all 0.2s"}}>
            {info.label}{count>0?<span style={{fontSize:9,background:active?info.color+"15":C.cream,color:info.color,padding:"1px 5px",borderRadius:6,fontWeight:700}}>{count}</span>:null}
          </button>);
        })}
        <button onClick={()=>{setSegment(segment==="everything"?"wellness":"everything");setView("steps");}} style={{...F,padding:"10px 12px",background:segment==="everything"&&view==="steps"?C.card:"transparent",border:segment==="everything"&&view==="steps"?`1.5px solid ${C.acc}30`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",boxShadow:segment==="everything"&&view==="steps"?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.2s",fontSize:12,color:segment==="everything"&&view==="steps"?C.acc:C.t3}}><Calendar size={14}/> My Journey</button>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {segment==="everything"&&(
          <TimelineView
            allSteps={allSteps} allPlans={allPlans} allRoutines={allRoutines} doneSteps={doneSteps} calData={calData}
            expandedPlan={expandedPlan} setExpandedPlan={setExpandedPlan}
            markStep={markStep} deleteStep={deleteStep} loveStep={loveStep} dislikeStep={dislikeStep} handleBooked={handleBooked}
            deletePlan={deletePlan} toggleTask={toggleTask} pauseRoutine={pauseRoutine} deleteRoutine={deleteRoutine} completeRoutine={completeRoutine}
            talkAbout={talkAbout} swapStep={swapStep} chooseOption={chooseOption} shareItem={shareItem} handleAddCal={handleAddCal} snoozeStep={snoozeStep}
            userTier={userTier}
          />
        )}
        {view==="steps"&&segment!=="everything"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"8px 20px 80px"}}>
            {segSteps.length===0&&segPlans.length===0&&segRoutines.length===0&&doneSteps.length===0&&expiredSteps.length===0?(
              <FadeIn><div style={{textAlign:"center",padding:"36px 20px"}}>
                <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:segInfo.soft||C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{segIcon(segment)}</div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>No {segInfo.label.toLowerCase()} steps yet</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto 24px"}}>Try asking: "Find a restaurant tonight" or "Plan a trip to Italy"</div>
                <button onClick={()=>{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,padding:"14px 32px",borderRadius:16,border:"none",fontSize:15,fontWeight:600,cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 16px rgba(212,82,42,0.2)",marginBottom:12}}>Ask me anything {"\u2192"}</button>
                <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginTop:8}}>
                  {(()=>{const qp=profile?.quickProfile||{};const interests=(qp.interests||[]);const loc=profile?.setup?.location||"";
                    if(segment==="career"){const base=["Help me grow my career","Find a course near me"];if(qp.work)base.push(qp.work.includes("Between")?"Help me find a job":"Networking events in "+loc);return base;}
                    if(segment==="adventure"){const base=[];if(interests.includes("Travel"))base.push("Plan a weekend trip");if(interests.includes("Nightlife")||interests.includes("Wine & Dining"))base.push("Find a great restaurant for tonight");base.push("Find events this weekend");if(interests.includes("Outdoors"))base.push("Outdoor activities near me");if(base.length<3)base.push("Plan something with friends");return base.slice(0,4);}
                    const base=["What should I do today?"];if(interests.includes("Fitness")||interests.includes("Yoga"))base.push("Build me a workout plan");else base.push("Help me start exercising");if(interests.includes("Meditation"))base.push("Set up a daily meditation");else base.push("Find a gym or class near me");return base;
                  })().map(c=>(<button key={c} onClick={()=>{setView("chat");setInput(c);setTimeout(()=>sendMessage(c),100);}} style={{...F,padding:"7px 14px",borderRadius:18,fontSize:12,fontWeight:500,background:C.card,border:`1.5px solid ${C.b2}`,color:C.t2,cursor:"pointer",boxShadow:C.shadow}}>{c}</button>))}
                </div>
              </div></FadeIn>
            ):(<>
              {segSteps.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Steps ({segSteps.length})</div>
                {segSteps.slice(0,segment==="everything"?10:5).map((step,i)=><>{i===2&&userTier==="free"?<SponsorCard segment={segment} onUpgrade={()=>setShowUpgrade(true)}/>:null}{i===4&&userTier==="free"?<InlineFeedAd tier={userTier}/>:null}<StepCard key={step.id} step={step} onDone={id=>markStep(id,"done")} onBooked={handleBooked} onDislike={dislikeStep} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onSwap={swapStep} onChoose={chooseOption} onAddCal={handleAddCal} onSnooze={snoozeStep} onShare={shareItem} delay={i*50}/></>)}
                {segSteps.length>(segment==="everything"?10:5)&&<div style={{...F,fontSize:12,color:C.t3,textAlign:"center",padding:"8px 0"}}>+{segSteps.length-(segment==="everything"?10:5)} more steps</div>}
              </div>}
              {segPlans.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Plans ({segPlans.length})</div>
                {segPlans.slice(0,segment==="everything"?allPlans.length:2).map((plan,pi)=><JourneyCard key={pi} plan={plan} pi={allPlans.indexOf(plan)} open={expandedPlan===allPlans.indexOf(plan)} onToggle={i=>setExpandedPlan(expandedPlan===i?null:i)} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onSnooze={snoozeStep} onShare={shareItem} delay={pi*50}/>)}
                {segment!=="everything"&&segPlans.length>2&&<button onClick={()=>setSegment("everything")} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",padding:"8px 0",width:"100%",textAlign:"center"}}>View all plans</button>}
              </div>}
              {segRoutines.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Repeating ({segRoutines.length})</div>
                {segRoutines.map((r,i)=><RoutineCard key={r.id} routine={r} onPause={pauseRoutine} onDelete={deleteRoutine} onComplete={completeRoutine} onTalk={talkAbout} delay={i*50}/>)}
              </div>}
              {(()=>{const segDone=segment==="everything"?doneSteps:doneSteps.filter(s=>catToSeg(s.category)===segment);return segDone.length>0?<div style={{marginBottom:20}}><div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Completed ({segDone.length})</div>{segDone.slice(0,segment==="everything"?5:3).map(s=>(<div key={s.id} style={{padding:"12px 16px",borderRadius:14,marginBottom:6,background:s.loved?"rgba(220,38,38,0.04)":C.tealSoft,border:`1px solid ${s.loved?"rgba(220,38,38,0.1)":C.tealBorder}`,display:"flex",alignItems:"center",gap:10,opacity:s.loved?.7:.5}}><span style={{color:s.loved?"#DC2626":C.teal}}>{s.loved?<Heart size={14} fill="#DC2626" color="#DC2626"/>:<Check size={14}/>}</span><span style={{...F,fontSize:13,textDecoration:"line-through",color:C.t2,flex:1}}>{s.title}</span><button onClick={()=>loveStep(s.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:s.loved?1:.4}}>{s.loved?<Heart size={14} fill="#DC2626" color="#DC2626"/>:<Heart size={14} color={C.t3}/>}</button><button onClick={()=>deleteStep(s.id)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:13}}><X size={16}/></button></div>))}{segDone.length>(segment==="everything"?5:3)&&<div style={{...F,fontSize:12,color:C.t3,textAlign:"center",padding:4}}>+{segDone.length-(segment==="everything"?5:3)} more</div>}</div>:null;})()}
              {expiredSteps.length>0&&(segment==="everything"||expiredSteps.some(s=>catToSeg(s.category)===segment))&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#B45309",marginBottom:12}}>Expired ({(segment==="everything"?expiredSteps:expiredSteps.filter(s=>catToSeg(s.category)===segment)).length})</div>
                {(segment==="everything"?expiredSteps:expiredSteps.filter(s=>catToSeg(s.category)===segment)).map(s=>(<div key={s.id} style={{padding:"14px 16px",borderRadius:14,marginBottom:6,background:C.goldSoft,border:"1px solid rgba(180,83,9,0.08)",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:14,opacity:.6}}>{catIcon(s.category)}</span>
                  <div style={{flex:1}}><div style={{...F,fontSize:13,color:C.t1,fontWeight:500,opacity:.7}}>{s.title}</div>{s.time&&<div style={{...F,fontSize:11,color:"#B45309",marginTop:2}}>Was: {s.time}</div>}</div>
                  <button onClick={()=>{setMissedStep(s);setMissedReason("");}} style={{...F,fontSize:11,padding:"5px 10px",borderRadius:8,background:C.card,border:`1px solid ${C.b2}`,color:C.t2,cursor:"pointer"}}>Why?</button>
                  <button onClick={()=>dismissMissed(s.id)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14}}><X size={16}/></button>
                </div>))}
              </div>}
            </>)}
            {doneSteps.length>=3&&!profile?.insights?.length&&segment!=="everything"&&(
              <FadeIn delay={200}><div style={{padding:"16px 18px",borderRadius:16,background:C.accSoft,border:`1px solid ${C.accBorder}`,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:20}}><MessageCircle size={18}/></span>
                  <div style={{flex:1}}>
                    <div style={{...F,fontSize:14,fontWeight:600,color:C.acc}}>You're on a roll!</div>
                    <div style={{...F,fontSize:13,color:C.t2,marginTop:2}}>Go deeper with your guide so I can personalize even more.</div>
                  </div>
                  <button onClick={()=>setScreen("deepprofile")} style={{...F,fontSize:12,fontWeight:600,padding:"8px 14px",borderRadius:10,background:C.accGrad,color:"#fff",border:"none",cursor:"pointer"}}>Let's go</button>
                </div>
              </div></FadeIn>
            )}
          </div>
          {view==="steps"&&(
            <div style={{padding:"8px 20px 14px",flexShrink:0,borderTop:`1px solid ${C.b1}`}}>
              <button onClick={()=>{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,width:"100%",padding:"14px 18px",borderRadius:14,background:C.card,border:`1.5px solid ${C.b2}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",gap:10,color:C.t3,fontSize:15}}>
                <MessageCircle size={16} color={C.acc}/>
                <span>Ask your guide for more...</span>
              </button>
            </div>
          )}
        </>)}
        {view==="chat"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"10px 20px"}}>
            {(chats.all||[]).length===0&&!loading&&(
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <div style={{width:56,height:56,borderRadius:18,margin:"0 auto 14px",background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><Logo size={28} color={C.acc}/></div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:6}}>What can I help you with?</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:300,margin:"0 auto"}}>Plan a trip, find a restaurant, start a workout routine, grow your career — I'll create actionable steps you can book right away.</div>
              </div>
            )}
            {(chats.all||[]).map((msg,i)=>(
              <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:10}}>
                {msg.role!=="user"&&<div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0,marginRight:10,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><Logo size={18} color="#fff"/></div>}
                <div style={bubble(msg.role==="user")}>{msg.content}</div>
              </div>
            ))}
            {loading&&<div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/></div>
              <div style={{maxWidth:"70%"}}>
                <div style={{padding:"14px 18px",borderRadius:20,borderBottomLeftRadius:6,background:C.card,boxShadow:C.shadow}}>
                  <div style={{height:12,width:"80%",borderRadius:6,background:`linear-gradient(90deg,${C.cream} 25%,${C.b1} 50%,${C.cream} 75%)`,backgroundSize:"400px 100%",animation:"shimmer 1.5s ease infinite",marginBottom:8}}>{null}</div>
                  <div style={{height:12,width:"60%",borderRadius:6,background:`linear-gradient(90deg,${C.cream} 25%,${C.b1} 50%,${C.cream} 75%)`,backgroundSize:"400px 100%",animation:"shimmer 1.5s ease infinite"}}>{null}</div>
                </div>
                <div style={{...F,fontSize:11,color:C.t3,marginTop:4,fontStyle:"italic"}}>Searching and thinking...</div>
              </div>
            </div>}
            <div ref={chatEnd}/>
          </div>
          {(chats.all||[]).length<=4&&<div style={{padding:"0 20px 6px",flexShrink:0}}>
            <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
              {(segSteps.length>0?["What else should I try?","Switch things up","Find me something new"]:segment==="career"?["Help me grow my career","Find a course","Networking events near me"]:segment==="adventure"?["Plan a trip","Find events this weekend","Plan something with friends"]:["What should I do today?","Set up a repeating step","Find something nearby"]).map(c=>(<button key={c} onClick={()=>{setInput(c);setTimeout(()=>sendMessage(c),50);}} style={{...F,padding:"7px 14px",borderRadius:18,fontSize:12,fontWeight:500,background:C.card,border:`1.5px solid ${C.b2}`,color:C.t2,cursor:"pointer",whiteSpace:"nowrap",boxShadow:C.shadow}}>{c}</button>))}
            </div>
          </div>}
          {(chats.all||[]).length>0&&<div style={{padding:"0 20px 4px",flexShrink:0,textAlign:"right"}}>
            <button onClick={()=>{showConfirm("Clear this conversation?",function(){const nc={all:[]};setChats(nc);persist(profile,allSteps,allPlans,nc,preferences);});}} style={{...F,fontSize:11,color:C.t3,background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>Clear conversation</button>
          </div>}
          <div style={{padding:"6px 20px 12px",flexShrink:0}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <textarea ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,150)+"px";}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="What can I help you with?" rows={1} style={{...F,flex:1,padding:"13px 18px",fontSize:16,borderRadius:18,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow,resize:"none",maxHeight:150,lineHeight:1.5}} onFocus={e=>{e.target.style.borderColor=C.acc;e.target.style.boxShadow="0 0 0 3px rgba(212,82,42,0.1)";}} onBlur={e=>{e.target.style.borderColor=C.b2;e.target.style.boxShadow=C.shadow;}}/>
              <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:46,height:46,borderRadius:16,border:"none",flexShrink:0,cursor:input.trim()&&!loading?"pointer":"default",background:input.trim()&&!loading?C.accGrad:"rgba(0,0,0,0.04)",color:input.trim()&&!loading?"#fff":C.t3,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:1}}><ArrowUp size={18}/></button>
            </div>
          </div>
          <BottomBanner tier={userTier} onUpgrade={()=>setShowUpgrade(true)}/>
        </>)}
      </div>

      {transitionMsg&&<div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:150,padding:"12px 16px 12px 20px",borderRadius:20,background:C.accGrad,color:"#fff",boxShadow:"0 8px 32px rgba(212,82,42,0.3)",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 0.4s ease",maxWidth:380}}>
        <Check size={18}/>
        <span style={{...F,fontSize:13,fontWeight:600,flex:1}}>{transitionMsg.text}</span>
        <button onClick={()=>{setSegment(transitionMsg.targetSeg);setView("steps");setTransitionMsg(null);}} style={{...F,fontSize:12,fontWeight:700,padding:"6px 14px",borderRadius:12,background:"rgba(255,255,255,0.25)",color:"#fff",border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>See it</button>
        <button onClick={()=>setTransitionMsg(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",padding:4,display:"flex"}}><X size={14}/></button>
      </div>}

      {showSettings && <SettingsPanel
        setShowSettings={setShowSettings}
        profile={profile} setProfile={setProfile}
        settingsTab={settingsTab} setSettingsTab={setSettingsTab}
        editField={editField} setEditField={setEditField} editVal={editVal} setEditVal={setEditVal}
        genderEdit={genderEdit} setGenderEdit={setGenderEdit} genderOtherEdit={genderOtherEdit} setGenderOtherEdit={setGenderOtherEdit}
        healthSection={healthSection} setHealthSection={setHealthSection}
        petType={petType} setPetType={setPetType} petBreed={petBreed} setPetBreed={setPetBreed} petAge={petAge} setPetAge={setPetAge}
        deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} deleteText={deleteText} setDeleteText={setDeleteText}
        legalModal={legalModal} setLegalModal={setLegalModal}
        stravaData={stravaData} setStravaData={setStravaData} calData={calData} setCalData={setCalData} calToken={calToken} setCalToken={setCalToken}
        allSteps={allSteps} allPlans={allPlans} chats={chats} preferences={preferences} allRoutines={allRoutines}
        persist={persist} resetAll={resetAll} setScreen={setScreen}
        doneSteps={doneSteps} totalCompleted={totalCompleted} thisWeekDone={thisWeekDone} completedByCategory={completedByCategory}
      />}
      <LegalModal legalModal={legalModal} setLegalModal={setLegalModal} profile={profile} setProfile={setProfile} persist={persist} allSteps={allSteps} allPlans={allPlans} chats={chats} preferences={preferences} />
      <ShareModal item={shareModalItem} onClose={()=>setShareModalItem(null)} />
      <ToastContainer/>
      {showHelp?<HelpModal onClose={()=>setShowHelp(false)}/>:null}
      {showWeekly?<WeeklySummary onClose={()=>setShowWeekly(false)} allSteps={allSteps} allPlans={allPlans} allRoutines={allRoutines} profile={profile}/>:null}
      {showBadges?<BadgesModal onClose={()=>setShowBadges(false)} allSteps={allSteps} allRoutines={allRoutines} allPlans={allPlans} profile={profile}/>:null}
      {showUpgrade?<Suspense fallback={null}><UpgradeModal onClose={()=>setShowUpgrade(false)} onUpgrade={()=>{window.open("/api/billing/checkout","_blank");setShowUpgrade(false);}}/></Suspense>:null}
      {showSearch?<SearchModal allSteps={allSteps} allPlans={allPlans} allRoutines={allRoutines} onClose={()=>setShowSearch(false)} onNavigate={function(r){if(r.seg)setSegment(r.seg);setView("steps");}}/>:null}
    </div>
    </Suspense>
  );
}
