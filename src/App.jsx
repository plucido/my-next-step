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
import { SponsorCard, AdBanner } from "./components/AdBanner.jsx";
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
  // Per-segment chat histories
  const[chats,setChats]=useState({career:[],wellness:[],adventure:[]});
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
  const[showWalkthrough,setShowWalkthrough]=useState(()=>{try{return !localStorage.getItem("mns_walkthrough_done");}catch{return true;}});
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
    if (!ch) return {career:[],wellness:[],adventure:[]};
    return {
      career: ch.career || ch.work || [],
      wellness: ch.wellness || ch.me || [],
      adventure: [...(ch.adventure || []), ...(ch.fun || []), ...(ch.social || [])].sort((a,b)=>(a.ts||0)-(b.ts||0)),
    };
  };

  // Current segment's data
  const activeSteps=allSteps.filter(s=>s.status==="active");
  const filterBySeg=(items,seg,catFn)=>seg==="everything"?items:items.filter(i=>catFn(i)===seg);
  const segSteps=filterBySeg(activeSteps,segment,s=>catToSeg(s.category));
  const matchPlanKeywords=(title,seg)=>{const t=title.toLowerCase();const kw={career:["career","work","job","interview","resume","linkedin"],wellness:["gym","yoga","run","health","diet","meditation"],adventure:["friend","party","dinner","concert","group","date","trip","travel","flight","hotel","vacation","hike","explore","fun","event"]};if((kw[seg]||[]).some(w=>t.includes(w)))return true;return false;};
  const segPlans=segment==="everything"?allPlans:allPlans.filter(p=>{const cats=(p.tasks||[]).map(t=>t.category).filter(Boolean);if(cats.length)return cats.some(c=>catToSeg(c)===segment);const title=(p.title||"").toLowerCase();if(matchPlanKeywords(title,segment))return true;if(SEG_KEYS.some(s=>s!==segment&&matchPlanKeywords(title,s)))return false;return segment==="wellness";});
  const segRoutines=filterBySeg(allRoutines,segment,r=>catToSeg(r.category));
  const segMessages=segment==="everything"?[...(chats.career||[]),...(chats.wellness||[]),...(chats.adventure||[])].sort((a,b)=>(a.ts||0)-(b.ts||0)):chats[segment]||[];
  const doneSteps=allSteps.filter(s=>s.status==="done");
  const expiredSteps=allSteps.filter(s=>s.status==="expired");

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[segMessages.length,loading]);

  // Strava OAuth redirect
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const code=p.get("code");if(code&&p.get("scope")?.includes("read")){window.history.replaceState({},"",window.location.pathname);setShowSettings(true);setSettingsTab("connections");exchStrava(code).then(async d=>{if(d?.access_token){const pr=await fetchStrava(d.access_token);const full={...d,profile:pr};setStravaData(full);const uid=getUserId(profile);if(uid)saveFB(uid,"strava",full);}});}},[]);

  // Load data
  useEffect(()=>{(async()=>{
    try{const hint=localStorage.getItem("mns_last_user");if(hint){
      const [data, sv, cv] = await Promise.all([
        loadFB(hint, "appdata"),
        loadFB(hint, "strava"),
        loadFB(hint, "calendar")
      ]);
      if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setAllRoutines(data.routines||[]);setChats(trimChats(normalizeChats(data.chats)));setPreferences(data.preferences||[]);setScreen("main");}
      if(sv)setStravaData(sv);
      if(cv){setCalToken(cv.token);setCalData(cv.events);}
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

  const handleAuth=async(auth)=>{const uid=auth.email?auth.email.replace(/[^a-zA-Z0-9]/g,"_"):null;if(uid){const data=await loadFB(uid,"appdata");if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setAllRoutines(data.routines||[]);setChats(trimChats(normalizeChats(data.chats)));setPreferences(data.preferences||[]);localStorage.setItem("mns_last_user",uid);const sv=await loadFB(uid,"strava");if(sv)setStravaData(sv);const cv=await loadFB(uid,"calendar");if(cv){setCalToken(cv.token);setCalData(cv.events);}setScreen("main");return;}}const p={name:auth.name,email:auth.email,method:auth.method};setProfile(p);localStorage.setItem("mns_last_user",getUserId(p));setScreen("setup");};
  const handleSetup=function(setup){const full={...profile,setup};setProfile(full);const w=[{role:"assistant",content:"Hey "+full.name+"!\n\nI'm your Next Step guide. Pick a segment above and tell me what's on your mind.\n\nI'll turn it into real steps you can act on today.",ts:Date.now()}];setChats({career:[],wellness:w,adventure:[]});setView("steps");persist(full,[],[],{career:[],wellness:w,adventure:[]},[]); setScreen("welcome");};
  const handleQuickProfile=function(data){const full={...profile,quickProfile:data,health:{...(profile?.health||{}),fitnessLevel:data.fitness==="Just starting"?"Beginner":data.fitness==="Active"?"Intermediate":data.fitness==="Very active"?"Advanced":profile?.health?.fitnessLevel,allergies:data.allergies||[],diets:data.diet||[],otherAllergies:data.otherAllergies||profile?.health?.otherAllergies||""}};setProfile(full);persist(full,allSteps,allPlans,chats,preferences);if(data.deepProfile){setScreen("deepprofile");}else{setScreen("main");}};
  const handleDeepFinish=insights=>{
    const full={...profile,insights};setProfile(full);
    if(!chats.wellness.length){const w=[{role:"assistant",content:`Hey ${full.name}! \n\nI'm your Next Step guide. I'm here to help with your career, wellness, fun plans, and adventures.\n\nWhat's on your mind?`,ts:Date.now()}];setChats({career:[],wellness:w,adventure:[]});persist(full,[],[],{career:[],wellness:w,adventure:[]},[]); }
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
    const plansCtx=allPlans.length>0?"\nJourneys: "+allPlans.slice(0,5).map(p=>p.title).join(", "):"";
    const routineCtx=allRoutines.filter(r=>!r.paused).length>0?"\nRoutines: "+allRoutines.filter(r=>!r.paused).slice(0,5).map(r=>r.title+" ("+r.schedule+")").join(", "):"";

    // Conditional — only include heavy sections when relevant
    const healthCtx=isHealth&&profile?.health?`\n\nHEALTH: Level:${profile.health.fitnessLevel||"?"} Goals:${(profile.health.fitnessGoals||[]).join(",")} Prefs:${(profile.health.workoutPrefs||[]).join(",")} Injuries:${profile.health.injuries||"none"} Allergies:${(profile.health.allergies||[]).join(",")} Diet:${(profile.health.diets||[]).join(",")}`:"";
    const calCtx=isSchedule&&calData?.length>0?"\n\nCALENDAR:\n"+calData.slice(0,8).map(e=>{const d=new Date(e.start);return`- ${d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})} ${e.allDay?"":d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}: ${e.title}`;}).join("\n"):"";
    const travelCtx=isTravel&&profile?.travel?`\nTravel: ${profile.travel.flightClass||""} ${profile.travel.flightStops||""} Hotel:${profile.travel.hotelBudget||""} ${profile.travel.hotelStyle||""}${(profile.travel.brands||[]).length>0?" Brands:"+profile.travel.brands.join(","):""}`:"";
    const sp=stravaData?.profile;const stravaText=isHealth&&sp?`\nStrava: ${sp.allTimeRuns} runs, ${sp.allTimeRides} rides`:"";
    const dp=profile?.derivedProfile;const derivedCtx=dp?`\nProfile: cuisine:${(dp.cuisinePreferences||[]).join(",")} music:${(dp.musicTaste||[]).join(",")} travel:${dp.travelStyle||"?"} social:${dp.socialStyle||"?"}`:"";

    const otherSegs=SEG_KEYS.filter(s=>s!==segment);
    const crossCtx=otherSegs.map(s=>{const msgs=chats[s]||[];if(!msgs.length)return"";const last=msgs.filter(m=>m.role==="user").slice(-1).map(m=>m.content).join(", ");return last?`\nIn ${SEGMENTS[s].label}: recently discussed "${last.slice(0,80)}"`:"";}).filter(Boolean).join("");

    try{
      // Strip ts field and ensure valid alternating roles for API
      const cleanMsgs=segChat.slice(-20).filter(m=>!m.isError).map(m=>({role:m.role,content:typeof m.content==="string"?m.content:JSON.stringify(m.content)})).filter(m=>m.content&&m.content.trim()&&!m.content.startsWith("Something went wrong")&&!m.content.startsWith("Quick hiccup"));
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

      const sysPrompt=SYSTEM_PROMPT+`\n\nCURRENT SEGMENT: ${SEGMENTS[segment].label} (${SEGMENTS[segment].desc})\nDefault category for this segment: ${segment==="career"?"career":segment==="wellness"?"fitness":"travel"}\nUse this segment's default category UNLESS the content clearly belongs elsewhere (e.g. a trip mentioned in Wellness should be "travel", a workout mentioned in Adventure should be "fitness").\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}${profileCtx}${quickCtx}${healthCtx}${prefText}${stravaText}${timeCtx}${stepsCtx}${lovedCtx}${dislikedCtx}${completedCtx}${favsCtx}${petsCtx}${plansCtx}${routineCtx}${calCtx}${travelCtx}${derivedCtx}${crossCtx}`;

      let finalText="",currentMsgs=[...safeApiMsgs],attempts=0;
      while(attempts<3){attempts++;
        const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json","x-user-id":getUserId(profile)},body:JSON.stringify({model:"auto",max_tokens:2000,tools:[{type:"web_search_20250305",name:"web_search"}],system:sysPrompt,messages:currentMsgs})});
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
        if(data.stop_reason==="tool_use"){currentMsgs.push({role:"assistant",content:data.content});const tr=[];for(const b of data.content){if(b.type==="tool_use")tr.push({type:"tool_result",tool_use_id:b.id,content:"Search complete. Now respond with 1-2 casual sentences, then ---DATA--- followed by a JSON array of steps/journeys based on what you found. Remember: the cards are the product, not the chat text."});if(b.type==="server_tool_use")tr.push({type:"tool_result",tool_use_id:b.id,content:""});}if(tr.length)currentMsgs.push({role:"user",content:tr});finalText="";continue;}
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
      if(!displayText)displayText=newSteps.length>allSteps.length?"Here's what I found!":newPlans.length>allPlans.length?"Journey mapped out!":"Let me know what you think.";

      const isError=displayText.startsWith("Something went wrong")||displayText.startsWith("Hmm, I didn't")||displayText.startsWith("Quick hiccup");
      const finalChat={...newChats,[segment]:[...(newChats[segment]||[]),{role:"assistant",content:clean(displayText),ts:Date.now(),isError:isError}]};
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
          const targetLabel=SEGMENTS[targetSeg]?.label||"Timeline";
          const type=createdSteps.length>0?"step":createdPlans.length>0?"journey":"routine";
          const text=totalCreated===1?(type==="step"?`New step: ${firstItem?.title||"Ready!"}`:(type==="journey"?`Journey: ${firstPlan?.title||"Mapped out!"}`:`Routine: ${firstRoutine?.title||"Set up!"}`)):`${totalCreated} new items created`;
          setTransitionMsg({text,targetSeg,targetLabel,count:totalCreated});
        }
      }
    }catch(err){console.error(err);const errChat={...newChats,[segment]:[...(newChats[segment]||[]),{role:"assistant",content:"Quick hiccup \u2014 say that again?",ts:Date.now(),isError:true}]};setChats(errChat);}
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
  const deleteRoutine=id=>{showConfirm("Delete this routine permanently?",function(){const u=allRoutines.filter(r=>r.id!==id);setAllRoutines(u);persist(profile,allSteps,allPlans,chats,preferences,u);});};
  const completeRoutine=id=>{const u=allRoutines.map(r=>r.id===id?{...r,completions:(r.completions||0)+1,lastCompleted:new Date().toISOString()}:r);setAllRoutines(u);persist(profile,allSteps,allPlans,chats,preferences,u);};
  const snoozeStep=useCallback((id,until)=>{const u=allSteps.map(s=>s.id===id?{...s,snoozedUntil:until,status:"active"}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);showToast("Snoozed until "+new Date(until).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}));},[allSteps,profile,allPlans,chats,preferences]);
  const talkAbout=useCallback(text=>{if(segment==="everything")setSegment("wellness");setView("chat");setTimeout(()=>{inputRef.current?.focus();sendMessage(text);},100);},[segment]);
  const[shareModalItem,setShareModalItem]=useState(null);
  const shareItem=useCallback((item)=>{setShareModalItem(item);},[]);
  const handleBooked=useCallback((step)=>{handleAddCal(step.title,step.why,step.time);const u=allSteps.map(s=>s.id===step.id?{...s,booked:true}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);},[allSteps,profile,allPlans,chats,preferences,calToken]);
  // Compute insights for stats
  const completedByCategory={};doneSteps.forEach(s=>{const c=s.category||"other";completedByCategory[c]=(completedByCategory[c]||0)+1;});
  const totalCompleted=doneSteps.length;
  const thisWeekDone=doneSteps.filter(s=>{const d=new Date(s.completedAt||s.createdAt);return(Date.now()-d.getTime())<7*864e5;}).length;
  const handleAddCal=useCallback(async(title,why,time)=>{const addWithToken=async(token)=>{const ok=await addGCalEvent(token,title,why,time);if(ok){showToast("Added to Calendar!");return true;}return false;};if(!calToken){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});await addWithToken(r.access_token);});return;}const ok=await addWithToken(calToken);if(!ok){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});await addWithToken(r.access_token);});}},[calToken,profile]);
  const resetAll=async(deleteAccount)=>{const uid=getUserId(profile);if(uid&&deleteAccount){deleteFB(uid,"appdata");deleteFB(uid,"strava");deleteFB(uid,"calendar");}localStorage.removeItem("mns_last_user");setProfile(null);setAllSteps([]);setAllPlans([]);setChats({career:[],wellness:[],adventure:[]});setPreferences([]);setStravaData(null);setCalData(null);setScreen("auth");setShowSettings(false);};

  // Expiration check
  useEffect(()=>{const now=new Date(),h=now.getHours();let changed=false;const u=allSteps.map(s=>{if(s.status!=="active")return s;const t=(s.time||"").toLowerCase(),age=s.createdAt?(Date.now()-new Date(s.createdAt).getTime())/36e5:0;if((age>48)||(t.includes("tonight")&&age>14)||(t.includes("today")&&age>24)){changed=true;return{...s,status:"expired"};}return s;});if(changed){setAllSteps(u);persist(profile,u,allPlans,chats,preferences);}},[allSteps.length]);

  if(screen==="auth")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><AuthScreen onAuth={handleAuth}/></div></Suspense>);
  if(screen==="setup")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup}/></div></Suspense>);
  if(screen==="quickprofile")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><QuickProfile profile={profile} onComplete={handleQuickProfile}/></div></Suspense>);
  if(screen==="welcome")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style>
    <FadeIn><div style={{maxWidth:440,margin:"0 auto",padding:"60px 24px 40px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 8px 28px rgba(212,82,42,0.25)"}}><Logo size={34} color="#fff"/></div>
        <h1 style={{...H,fontSize:28,color:C.t1,margin:"0 0 8px"}}>Welcome, {profile?.name}</h1>
        <p style={{...F,fontSize:15,color:C.t2,lineHeight:1.6,margin:0}}>Your guide is ready. Where would you like to start?</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {SEG_KEYS.map(s=>{const info=SEGMENTS[s];return(
          <button key={s} onClick={()=>{setSegment(s);setView("chat");setScreen("main");setTimeout(()=>inputRef.current?.focus(),200);}} style={{...F,width:"100%",padding:"18px 20px",borderRadius:18,background:C.card,boxShadow:C.shadow,border:`1.5px solid ${info.color}15`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
            <div style={{width:48,height:48,borderRadius:16,background:info.soft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{segIcon(s)}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:600,color:C.t1}}>{info.label}</div>
              <div style={{fontSize:13,color:C.t3,marginTop:3}}>{info.desc}</div>
            </div>
            <span style={{color:info.color,fontSize:20}}><ChevronRight size={16}/></span>
          </button>
        );})}
      </div>
      <div style={{textAlign:"center"}}>
        <button onClick={()=>setScreen("main")} style={{...F,fontSize:14,color:C.t3,background:"none",border:"none",cursor:"pointer",padding:"12px 24px"}}>Skip for now {"\u2192"}</button>
      </div>
    </div></FadeIn>
  </div>);
  if(screen==="deepprofile")return(<Suspense fallback={<div style={{background:C.bg,minHeight:"100vh"}}/>}><div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepFinish} existingInsights={profile?.insights||[]}/></div></Suspense>);

  const segInfo=SEGMENTS[segment]||{label:"Timeline",color:C.acc,soft:C.accSoft,desc:"all your steps and journeys across every area of your life"};
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
        <div style={{...F,fontSize:12,color:C.t3,marginBottom:2}}>{getGreeting()},</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{...H,fontSize:22,color:C.t1}}>{profile?.name}</div>
          <div onClick={()=>{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...H,fontSize:22,fontWeight:700,color:C.t1,cursor:"pointer"}}>Take your next step!</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
          {(()=>{
            const now=new Date();const weekAgo=new Date(now-7*864e5);
            const thisWeek=allSteps.filter(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt)>=weekAgo).length;
            const today=allSteps.filter(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt).toDateString()===now.toDateString()).length;
            const activeCount=activeSteps.length;
            // Calculate streak days
            let streak=0;const d=new Date(now);d.setHours(0,0,0,0);
            while(true){const ds=d.toDateString();if(allSteps.some(s=>s.status==="done"&&s.createdAt&&new Date(s.createdAt).toDateString()===ds)){streak++;d.setDate(d.getDate()-1);}else break;}
            if(thisWeek===0&&streak===0)return null;
            return(<div onClick={()=>setShowWeekly(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:12,background:streak>=3?C.goldSoft:C.cream,cursor:"pointer"}}>
              {streak>0&&<><span style={{fontSize:14}}><Flame size={14} color={streak>=7?"#EF4444":C.gold}/></span><span style={{...F,fontSize:12,fontWeight:700,color:streak>=3?C.gold:C.t2}}>{streak}d</span></>}
              {thisWeek>0&&<span style={{...F,fontSize:11,color:C.t3}}>{thisWeek} this week</span>}
            </div>);
          })()}
          {userTier==="free"?<button onClick={()=>setShowUpgrade(true)} style={{...F,height:36,padding:"0 14px",borderRadius:12,background:C.accGrad,border:"none",boxShadow:"0 2px 8px rgba(212,82,42,0.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:12,fontWeight:700,color:"#fff"}}><Sparkles size={12}/> Pro</button>:null}
          <button onClick={()=>setShowBadges(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏅</button>
          <button onClick={()=>setShowSearch(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Search size={16} color={C.t3}/></button>
          <button onClick={()=>setShowHelp(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><HelpCircle size={16} color={C.t3}/></button>
          <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}><Settings size={16}/></button>
          </div>
        </div>
      </div>
      {(()=>{
        var upNext=null;var items=[];
        (calData||[]).forEach(e=>{var d=new Date(e.start);if(d>new Date())items.push({title:e.title,time:d,type:"cal"});});
        activeSteps.forEach(s=>{var t=(s.time||"").toLowerCase();var d=new Date();if(t.includes("tonight")||t.includes("pm")){var m=t.match(/(\d{1,2})\s*pm/);d.setHours(m?parseInt(m[1])+12:19,0,0);}else if(t.includes("am")){var m2=t.match(/(\d{1,2})\s*am/);if(m2)d.setHours(parseInt(m2[1]),0,0);}else if(t.includes("tomorrow")){d.setDate(d.getDate()+1);d.setHours(9,0,0);}else{d=null;}if(d&&d>new Date())items.push({title:s.title,time:d,type:"step",cat:s.category,seg:catToSeg(s.category)});});
        allRoutines.filter(r=>!r.paused&&r.days?.length>0).forEach(r=>{for(var i=0;i<7;i++){var d=new Date();d.setDate(d.getDate()+i);var dn=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][d.getDay()];if(r.days.map(x=>x.toLowerCase()).includes(dn)){var rt=new Date(d);var tp=(r.time||"").toLowerCase();var pm=tp.match(/(\d{1,2})\s*pm/);var am=tp.match(/(\d{1,2})\s*am/);if(pm)rt.setHours(parseInt(pm[1])+(parseInt(pm[1])===12?0:12),0,0);else if(am)rt.setHours(parseInt(am[1])===12?0:parseInt(am[1]),0,0);else rt.setHours(9,0,0);if(rt>new Date()){items.push({title:r.title,time:rt,type:"routine",cat:r.category,seg:catToSeg(r.category)});break;}}}});
        items.sort((a,b)=>a.time-b.time);
        upNext=items[0]||null;
        var withinWeek=upNext&&(upNext.time-new Date())<7*864e5;
        if(!withinWeek||!upNext)return null;
        var diff=upNext.time-new Date();var mins=Math.floor(diff/6e4);var label="";
        if(mins<60)label="in "+mins+" min";else if(mins<1440)label="in "+Math.floor(mins/60)+"h";else if(mins<2880)label="Tomorrow";else label=upNext.time.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"});
        var color=upNext.type==="cal"?"#4285F4":SEGMENTS[upNext.seg]?.color||C.acc;
        return <div style={{padding:"0 20px 6px",flexShrink:0}}>
          <div onClick={()=>{setSegment("everything");setView("steps");}} style={{...F,padding:"10px 16px",borderRadius:14,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:6,height:6,borderRadius:3,background:color,flexShrink:0}}>{null}</div>
            <div style={{flex:1,overflow:"hidden"}}><div style={{fontSize:13,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{upNext.title}</div></div>
            <div style={{...F,fontSize:11,fontWeight:600,color:color,flexShrink:0}}>{label}</div>
            <span style={{color:C.t3}}><ChevronRight size={14}/></span>
          </div>
        </div>;
      })()}
      {!profile?.quickProfile&&<div style={{padding:"0 20px 6px",flexShrink:0}}>
        <button onClick={()=>setScreen("quickprofile")} style={{...F,width:"100%",padding:"10px 16px",borderRadius:14,background:C.cream,border:`1px solid ${C.b1}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
          <span style={{fontSize:16}}><Sparkles size={14}/></span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>Help me personalize</div><div style={{fontSize:11,color:C.t3}}>Quick checklist to tailor your experience</div></div>
          <span style={{fontSize:12,color:C.t3}}><ChevronRight size={16}/></span>
        </button>
      </div>}
      <div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:4}}>
        {SEG_KEYS.map(s=>{const info=SEGMENTS[s];const active=segment===s&&segment!=="everything";const stepCount=activeSteps.filter(x=>catToSeg(x.category)===s).length;const planCount=allPlans.filter(p=>{const cats=(p.tasks||[]).map(t=>t.category).filter(Boolean);return cats.length?cats.some(c=>catToSeg(c)===s):false;}).length;const routineCount=allRoutines.filter(r=>catToSeg(r.category)===s&&!r.paused).length;const count=stepCount+planCount+routineCount;
          return(<button key={s} onClick={()=>{setSegment(s);setExpandedPlan(null);setView("steps");}} style={{...F,flex:1,padding:"10px 4px",background:active?C.card:"transparent",border:active?`1.5px solid ${info.color}30`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",fontSize:13,fontWeight:active?600:400,color:active?info.color:C.t3,boxShadow:active?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.2s"}}>
            {info.label}{count>0?<span style={{fontSize:9,background:active?info.color+"15":C.cream,color:info.color,padding:"1px 5px",borderRadius:6,fontWeight:700}}>{count}</span>:null}
          </button>);
        })}
        <button onClick={()=>{setSegment(segment==="everything"?"wellness":"everything");setView("steps");}} style={{...F,width:40,padding:"10px 0",background:segment==="everything"?C.card:"transparent",border:segment==="everything"?`1.5px solid ${C.acc}30`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",boxShadow:segment==="everything"?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}><Calendar size={16} color={segment==="everything"?C.acc:C.t3}/></button>
      </div>
      {segment!=="everything"&&<div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:6}}>
        {[{id:"steps",label:"Steps"},{id:"chat",label:"Guide"}].map(t=>(<button key={t.id} onClick={()=>{setView(t.id);if(t.id==="chat")setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,flex:1,padding:"10px 0",background:view===t.id?C.card:"transparent",border:view===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:view===t.id?600:400,color:view===t.id?C.t1:C.t3,boxShadow:view===t.id?C.shadow:"none",transition:"all 0.15s"}}>{t.label}</button>))}
      </div>}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {segment==="everything"&&(
          <TimelineView
            allSteps={allSteps} allPlans={allPlans} allRoutines={allRoutines} doneSteps={doneSteps} calData={calData}
            expandedPlan={expandedPlan} setExpandedPlan={setExpandedPlan}
            markStep={markStep} deleteStep={deleteStep} loveStep={loveStep} dislikeStep={dislikeStep} handleBooked={handleBooked}
            deletePlan={deletePlan} toggleTask={toggleTask} pauseRoutine={pauseRoutine} deleteRoutine={deleteRoutine} completeRoutine={completeRoutine}
            talkAbout={talkAbout} shareItem={shareItem} handleAddCal={handleAddCal} snoozeStep={snoozeStep}
          />
        )}
        {view==="steps"&&segment!=="everything"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"8px 20px 80px"}}>
            {segSteps.length===0&&segPlans.length===0&&segRoutines.length===0&&doneSteps.length===0&&expiredSteps.length===0?(
              <FadeIn><div style={{textAlign:"center",padding:"36px 20px"}}>
                <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:segInfo.soft||C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{segIcon(segment)}</div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>Nothing in {segInfo.label} yet</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto 24px"}}>Tell your guide what you're looking for and I'll create personalized steps and journeys.</div>
                <button onClick={()=>{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,padding:"14px 32px",borderRadius:16,border:"none",fontSize:15,fontWeight:600,cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 16px rgba(212,82,42,0.2)",marginBottom:12}}>Talk to your guide {"\u2192"}</button>
                <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginTop:8}}>
                  {(()=>{const qp=profile?.quickProfile||{};const interests=(qp.interests||[]);const loc=profile?.setup?.location||"";
                    if(segment==="career"){const base=["Help me grow my career","Find a course near me"];if(qp.work)base.push(qp.work.includes("Between")?"Help me find a job":"Networking events in "+loc);return base;}
                    if(segment==="adventure"){const base=[];if(interests.includes("Travel"))base.push("Plan a weekend trip");if(interests.includes("Nightlife")||interests.includes("Wine & Dining"))base.push("Find a great restaurant for tonight");base.push("Find events this weekend");if(interests.includes("Outdoors"))base.push("Outdoor activities near me");if(base.length<3)base.push("Plan something fun with friends");return base.slice(0,4);}
                    const base=["What should I do today?"];if(interests.includes("Fitness")||interests.includes("Yoga"))base.push("Build me a workout plan");else base.push("Help me start exercising");if(interests.includes("Meditation"))base.push("Set up a meditation routine");else base.push("Find a gym or class near me");return base;
                  })().map(c=>(<button key={c} onClick={()=>{setView("chat");setInput(c);setTimeout(()=>sendMessage(c),100);}} style={{...F,padding:"7px 14px",borderRadius:18,fontSize:12,fontWeight:500,background:C.card,border:`1.5px solid ${C.b2}`,color:C.t2,cursor:"pointer",boxShadow:C.shadow}}>{c}</button>))}
                </div>
              </div></FadeIn>
            ):(<>
              {segSteps.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Steps ({segSteps.length})</div>
                {segSteps.slice(0,segment==="everything"?10:5).map((step,i)=><>{i===3&&userTier==="free"?<SponsorCard segment={segment}/>:null}<StepCard key={step.id} step={step} onDone={id=>markStep(id,"done")} onBooked={handleBooked} onDislike={dislikeStep} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onSnooze={snoozeStep} onShare={shareItem} delay={i*50}/></>)}
                {segSteps.length>(segment==="everything"?10:5)&&<div style={{...F,fontSize:12,color:C.t3,textAlign:"center",padding:"8px 0"}}>+{segSteps.length-(segment==="everything"?10:5)} more steps</div>}
              </div>}
              {segPlans.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Journeys ({segPlans.length})</div>
                {segPlans.slice(0,segment==="everything"?allPlans.length:2).map((plan,pi)=><JourneyCard key={pi} plan={plan} pi={allPlans.indexOf(plan)} open={expandedPlan===allPlans.indexOf(plan)} onToggle={i=>setExpandedPlan(expandedPlan===i?null:i)} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onSnooze={snoozeStep} onShare={shareItem} delay={pi*50}/>)}
                {segment!=="everything"&&segPlans.length>2&&<button onClick={()=>setSegment("everything")} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",padding:"8px 0",width:"100%",textAlign:"center"}}>View all journeys</button>}
              </div>}
              {segRoutines.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Routines ({segRoutines.length})</div>
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
          {segment!=="everything"&&(view==="steps")&&(
            <div style={{padding:"8px 20px 16px",flexShrink:0,borderTop:`1px solid ${C.b1}`}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){e.preventDefault();setView("chat");setTimeout(()=>sendMessage(input.trim()),100);}}} placeholder="Quick ask your guide..." style={{...F,flex:1,padding:"12px 16px",fontSize:14,borderRadius:14,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow}} onFocus={e=>{e.target.style.borderColor=segInfo.color;}} onBlur={e=>{e.target.style.borderColor=C.b2;}}/>
                <button onClick={()=>{if(input.trim()){setView("chat");setTimeout(()=>sendMessage(input.trim()),100);}else{setView("chat");setTimeout(()=>inputRef.current?.focus(),100);}}} style={{width:44,height:44,borderRadius:14,border:"none",cursor:"pointer",background:C.accGrad,color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(212,82,42,0.2)"}}>{input.trim()?<ArrowUp size={18}/>:<MessageCircle size={18}/>}</button>
              </div>
            </div>
          )}
        </>)}
        {view==="chat"&&segment!=="everything"&&(<>
          <div style={{flex:1,overflowY:"auto",padding:"10px 20px"}}>
            {(chats[segment]||[]).length===0&&!loading&&(
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <div style={{width:56,height:56,borderRadius:18,margin:"0 auto 14px",background:segInfo.soft||C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{segIcon(segment)}</div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:6}}>Ask me anything about {segInfo.label.toLowerCase()}</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>{segInfo.desc}. I'll turn ideas into steps and journeys you can act on.</div>
              </div>
            )}
            {(chats[segment]||[]).map((msg,i)=>(
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
          {(chats[segment]||[]).length<=4&&<div style={{padding:"0 20px 6px",flexShrink:0}}>
            <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
              {(segSteps.length>0?["What else should I try?","Switch things up","Find me something new"]:segment==="career"?["Help me grow my career","Find a course","Networking events near me"]:segment==="adventure"?["Plan a trip","Find events this weekend","Plan something with friends"]:["What should I do today?","Help me build a habit","Find something nearby"]).map(c=>(<button key={c} onClick={()=>{setInput(c);setTimeout(()=>sendMessage(c),50);}} style={{...F,padding:"7px 14px",borderRadius:18,fontSize:12,fontWeight:500,background:C.card,border:`1.5px solid ${C.b2}`,color:C.t2,cursor:"pointer",whiteSpace:"nowrap",boxShadow:C.shadow}}>{c}</button>))}
            </div>
          </div>}
          {(chats[segment]||[]).length>0&&<div style={{padding:"0 20px 4px",flexShrink:0,textAlign:"right"}}>
            <button onClick={()=>{showConfirm("Clear this conversation?",function(){const nc={...chats,[segment]:[]};setChats(nc);persist(profile,allSteps,allPlans,nc,preferences);});}} style={{...F,fontSize:11,color:C.t3,background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>Clear conversation</button>
          </div>}
          <div style={{padding:"6px 20px 16px",flexShrink:0}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <textarea ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,150)+"px";}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={`Ask about ${segInfo.label.toLowerCase()}...`} rows={1} style={{...F,flex:1,padding:"13px 18px",fontSize:15,borderRadius:18,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",boxShadow:C.shadow,resize:"none",maxHeight:150,lineHeight:1.5}} onFocus={e=>{e.target.style.borderColor=segInfo.color;e.target.style.boxShadow=`0 0 0 3px ${segInfo.color}15`;}} onBlur={e=>{e.target.style.borderColor=C.b2;e.target.style.boxShadow=C.shadow;}}/>
              <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:46,height:46,borderRadius:16,border:"none",flexShrink:0,cursor:input.trim()&&!loading?"pointer":"default",background:input.trim()&&!loading?C.accGrad:"rgba(0,0,0,0.04)",color:input.trim()&&!loading?"#fff":C.t3,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:1}}><ArrowUp size={18}/></button>
            </div>
            {input.length>50&&<div style={{...F,fontSize:11,color:C.t3,marginTop:6,textAlign:"right"}}>Shift+Enter for new line</div>}
          </div>
        </>)}
      </div>

      {transitionMsg&&<div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:150,padding:"12px 16px 12px 20px",borderRadius:20,background:C.accGrad,color:"#fff",boxShadow:"0 8px 32px rgba(212,82,42,0.3)",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 0.4s ease",maxWidth:380}}>
        <Check size={18}/>
        <span style={{...F,fontSize:13,fontWeight:600,flex:1}}>{transitionMsg.text}</span>
        <button onClick={()=>{setSegment(transitionMsg.targetSeg);setView("steps");setTransitionMsg(null);}} style={{...F,fontSize:12,fontWeight:700,padding:"6px 14px",borderRadius:12,background:"rgba(255,255,255,0.25)",color:"#fff",border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>View {transitionMsg.targetSeg!==segment?`in ${transitionMsg.targetLabel}`:""}</button>
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
      {showWalkthrough&&screen==="main"?<Walkthrough onComplete={()=>{setShowWalkthrough(false);try{localStorage.setItem("mns_walkthrough_done","1");}catch{}}}/>:null}
      {showSearch?<SearchModal allSteps={allSteps} allPlans={allPlans} allRoutines={allRoutines} onClose={()=>setShowSearch(false)} onNavigate={function(r){if(r.seg)setSegment(r.seg);setView("steps");}}/>:null}
    </div>
    </Suspense>
  );
}
