import { useState, useEffect, useRef, useCallback } from "react";
import { Footprints, Briefcase, Heart, Sparkles, Globe, Calendar, Settings, ArrowUp, MessageCircle, ChevronDown, ChevronRight, X, Check, Share2, Star, Clock, Trash2, Pause, Play, RefreshCw, Plus, MapPin, Search, Dumbbell, UtensilsCrossed, Building2, Flame, TrendingUp, Zap, Send, RotateCcw, ExternalLink, AlertTriangle, Shield } from "lucide-react";

import { font, H, F, C, SEGMENTS, SEG_KEYS, SYSTEM_PROMPT, PROFILE_SECTIONS, AFF } from "./constants.js";
import { getUserId, saveFB, loadFB, deleteFB } from "./firebase.js";
import { getGreeting, FadeIn, ProgressRing, clean, wrapLink, trackClick, TLink, catToSeg, segIcon, catIcon, catIconMap, Logo } from "./utils.jsx";
import { loadGSI, decJwt, connectStrava, exchStrava, fetchStrava, connectGCal, fetchGCal, addGCalEvent } from "./auth.js";
import StepCard from "./StepCard.jsx";
import JourneyCard from "./JourneyCard.jsx";
import RoutineCard from "./RoutineCard.jsx";
import AuthScreen from "./AuthScreen.jsx";
import SetupScreen from "./SetupScreen.jsx";
import DeepProfileChat from "./DeepProfileChat.jsx";
import LegalModal from "./LegalModal.jsx";
import SettingsPanel from "./Settings.jsx";

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
  const[showLanding,setShowLanding]=useState(false);
  const[editField,setEditField]=useState(null);
  const[editVal,setEditVal]=useState("");
  const[genderEdit,setGenderEdit]=useState("");
  const[genderOtherEdit,setGenderOtherEdit]=useState("");
  const[legalModal,setLegalModal]=useState(null);
  const[deleteConfirm,setDeleteConfirm]=useState(false);
  const[deleteText,setDeleteText]=useState("");
  const[healthSection,setHealthSection]=useState({fitness:true,food:true,medical:false});
  const[petType,setPetType]=useState("Dog");
  const[petBreed,setPetBreed]=useState("");
  const[petAge,setPetAge]=useState("");
  const[transitionMsg,setTransitionMsg]=useState(null);
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
      if(data?.profile?.setup){setProfile(data.profile);setAllSteps(data.steps||[]);setAllPlans(data.plans||[]);setAllRoutines(data.routines||[]);setChats(normalizeChats(data.chats));setPreferences(data.preferences||[]);setScreen("main");setShowLanding(true);}
      const sv=await loadFB(hint,"strava");if(sv)setStravaData(sv);
      const cv=await loadFB(hint,"calendar");if(cv){setCalToken(cv.token);setCalData(cv.events);}
    }}catch{}
    // Migration from old format
    try{const s=await window.storage.get("mns-v11");if(s){const d=JSON.parse(s.value);if(d.profile?.setup){setProfile(d.profile);setAllSteps(d.steps||[]);setAllPlans(d.plans||[]);setChats({career:[],wellness:d.messages||[],fun:[],adventure:[]});setPreferences(d.preferences||[]);setScreen("main");const uid=getUserId(d.profile);if(uid){saveFB(uid,"appdata",{...d,chats:{career:[],wellness:d.messages||[],fun:[],adventure:[]}});window.storage.delete("mns-v11").catch(()=>{});}}}}catch{}
  })();},[]);

  const persist=(p,s,pl,ch,pr,rt)=>{const data={profile:p||profile,steps:s||allSteps,plans:pl||allPlans,chats:ch||chats,preferences:pr||preferences,routines:rt||allRoutines};const uid=getUserId(p||profile);if(uid){saveFB(uid,"appdata",data);localStorage.setItem("mns_last_user",uid);}};

  const handleAuth=auth=>{const p={name:auth.name,email:auth.email,method:auth.method};setProfile(p);localStorage.setItem("mns_last_user",getUserId(p));setScreen("setup");};
  const handleSetup=function(setup){const full={...profile,setup};setProfile(full);const w=[{role:"assistant",content:"Hey "+full.name+"!\n\nI'm your Next Step guide. Pick a segment above and tell me what's on your mind.\n\nI'll turn it into real steps you can act on today.",ts:Date.now()}];setChats({career:[],wellness:w,fun:[],adventure:[]});setView("steps");persist(full,[],[],{career:[],wellness:w,fun:[],adventure:[]},[]); setScreen("welcome");};
  const handleDeepFinish=insights=>{
    const full={...profile,insights};setProfile(full);
    if(!chats.wellness.length){const w=[{role:"assistant",content:`Hey ${full.name}! \n\nI'm your Next Step guide. I'm here to help with your career, wellness, fun plans, and adventures.\n\nWhat's on your mind?`,ts:Date.now()}];setChats({career:[],wellness:w,fun:[],adventure:[]});persist(full,[],[],{career:[],wellness:w,fun:[],adventure:[]},[]); }
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
    const favsCtx=(profile?.favorites||[]).length>0?"\n\nFAVORITES (places/things user loves):\n"+(profile.favorites).map(f=>`- "${f.title}" (${f.category})`).join("\n"):"";
    const petsCtx=(profile?.pets||[]).length>0?"\n\nPETS:\n"+(profile.pets).map(p=>`- ${p.name} (${p.type}${p.breed?" / "+p.breed:""}${p.age?", "+p.age:""})`).join("\n"):"";
    const plansCtx=allPlans.length>0?"\n\nJOURNEYS:\n"+allPlans.map(p=>{const d=p.tasks?.filter(t=>t.done).length||0;return`- "${p.title}" (${p.date||"no date"}, ${d}/${p.tasks?.length||0} done)`;}).join("\n"):"";
    const routineCtx=allRoutines.filter(r=>!r.paused).length>0?"\n\nACTIVE ROUTINES:\n"+allRoutines.filter(r=>!r.paused).map(r=>`- "${r.title}" (${r.schedule}, ${(r.days||[]).join("/")||"flexible"}, ${r.category})`).join("\n"):"";
    const calCtx=calData?.length>0?"\n\nCALENDAR:\n"+calData.slice(0,10).map(e=>{const d=new Date(e.start);return`- ${d.toLocaleDateString()} ${e.allDay?"all day":d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}: ${e.title}`;}).join("\n"):"";
    const profileCtx=profile?.setup?`\nAge: ${profile.setup.age||"?"} | Gender: ${profile.setup.gender||"?"}`:"";
    const healthFitness=profile?.health?`\n\nHEALTH & FITNESS:\nFitness level: ${profile.health.fitnessLevel||"not set"}\nGoals: ${(profile.health.fitnessGoals||[]).join(", ")||"not set"}\nPrefers: ${(profile.health.workoutPrefs||[]).join(", ")||"not set"}\nFrequency: ${profile.health.workoutFreq||"not set"}\nInjuries/limits: ${profile.health.injuries||"none"}\nAllergies: ${(profile.health.allergies||[]).join(", ")||"none"}\nDietary preferences: ${(profile.health.diets||[]).join(", ")||"none"}${profile.health.otherAllergies?"\nOther allergies: "+profile.health.otherAllergies:""}`:"";
    const healthMedical=profile?.health?.medicalEnabled?`\n\nMEDICAL (user opted in):\nInsurance: ${profile.health.provider||"not set"}\nPlan type: ${profile.health.planType||"not set"}${profile.health.planType==="HMO"?" (REQUIRES PCP REFERRAL for specialists)":""}\nPCP: ${profile.health.pcp||"not set"}`:"";
    const healthCtx=healthFitness+healthMedical;
    const travelCtx=profile?.travel?`\n\nTRAVEL PREFERENCES:\nCabin: ${profile.travel.flightClass||"not set"}\nStops: ${profile.travel.flightStops||"not set"}\nSeat: ${profile.travel.flightSeat||"not set"}\nHotel room: ${profile.travel.hotelRoom||"not set"}\nHotel budget: ${profile.travel.hotelBudget||"not set"}\nHotel style: ${profile.travel.hotelStyle||"not set"}${(profile.travel.loyalty||[]).length>0?"\nLoyalty programs: "+(profile.travel.loyalty).map(l=>`${l.name} (${l.type}${l.number?" #"+l.number:""})`).join(", "):""}`:"";
    // Cross-segment context summary
    const otherSegs=SEG_KEYS.filter(s=>s!==segment);
    const crossCtx=otherSegs.map(s=>{const msgs=chats[s]||[];if(!msgs.length)return"";const last=msgs.filter(m=>m.role==="user").slice(-2).map(m=>m.content).join(", ");return last?`\nIn ${SEGMENTS[s].label}: recently discussed "${last.slice(0,80)}"`:"";}).filter(Boolean).join("");

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

      const sysPrompt=SYSTEM_PROMPT+`\n\nCURRENT SEGMENT: ${SEGMENTS[segment].label} (${SEGMENTS[segment].desc})\nDefault category for this segment: ${segment==="career"?"career":segment==="wellness"?"fitness":segment==="fun"?"social":"travel"}\nUse this segment's default category UNLESS the content clearly belongs elsewhere (e.g. a trip mentioned in Health should be "travel", a workout mentioned in Fun should be "fitness").\n\nUser: ${profile?.name}\nLocation: ${profile?.setup?.location||""}${profileCtx}${healthCtx}${prefText}${stravaText}${stepsCtx}${lovedCtx}${favsCtx}${petsCtx}${plansCtx}${routineCtx}${calCtx}${travelCtx}${crossCtx}`;

      let finalText="",currentMsgs=[...safeApiMsgs],attempts=0;
      while(attempts<3){attempts++;
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true","anthropic-beta":"web-search-2025-03-05"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,tools:[{type:"web_search_20250305",name:"web_search"}],system:sysPrompt,messages:currentMsgs})});
        if(res.status===429){
          // Rate limited - wait and retry
          const wait=attempts*3000;
          console.log(`Rate limited, waiting ${wait}ms...`);
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
          const defaultCat=segment==="career"?"career":segment==="wellness"?"fitness":segment==="fun"?"social":"travel";
          if(item.type==="step")newSteps=[{...item,category:item.category||defaultCat,status:"active",id:Date.now()+Math.random(),createdAt:new Date().toISOString()},...newSteps];
          else if(item.type==="plan")newPlans=[{...item,tasks:(item.tasks||[]).map(t=>({...t,done:false,category:t.category||item.category||defaultCat}))},...newPlans.filter(p=>p.title!==item.title)];
          else if(item.type==="routine")newRoutines=[{...item,category:item.category||defaultCat,id:Date.now()+Math.random(),createdAt:new Date().toISOString(),paused:false},...newRoutines.filter(r=>r.title!==item.title)];
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
      if(!isError)persist(profile,newSteps,newPlans,finalChat,newPrefs,allRoutines);
      // Auto-navigate to the correct segment with transition
      if(!isError){
        const createdSteps=newSteps.filter(s=>!allSteps.find(o=>o.id===s.id));
        const createdPlans=newPlans.filter(p=>!allPlans.find(o=>o.title===p.title));
        if(createdSteps.length>0||createdPlans.length>0){
          const firstItem=createdSteps[0]||null;
          const firstPlan=createdPlans[0]||null;
          const itemCat=firstItem?.category||(firstPlan?.tasks?.[0]?.category)||null;
          const targetSeg=itemCat?catToSeg(itemCat):segment;
          const targetLabel=SEGMENTS[targetSeg]?.label||"Timeline";
          const isStep=createdSteps.length>0;
          if(targetSeg===segment){
            setTransitionMsg(isStep?"Your next step is ready!":"Journey mapped out!");
            setTimeout(()=>{setView("steps");setTransitionMsg(null);},1200);
          } else {
            setTransitionMsg(`Added to ${targetLabel}! Taking you there...`);
            setTimeout(()=>{setSegment(targetSeg);setView("steps");setTransitionMsg(null);},1800);
          }
        }
      }
    }catch(err){console.error(err);const errChat={...newChats,[segment]:[...(newChats[segment]||[]),{role:"assistant",content:"Quick hiccup \u2014 say that again?",ts:Date.now(),isError:true}]};setChats(errChat);}
    setLoading(false);
  };

  const deleteStep=id=>{const u=allSteps.filter(s=>s.id!==id);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const markStep=(id,st)=>{if(st==="done")setFeedbackStep(allSteps.find(s=>s.id===id));const u=allSteps.map(s=>s.id===id?{...s,status:st}:s);setAllSteps(u);persist(profile,u,allPlans,chats,preferences);};
  const loveStep=id=>{const step=allSteps.find(s=>s.id===id);const u=allSteps.map(s=>s.id===id?{...s,loved:!s.loved}:s);setAllSteps(u);if(step&&!step.loved){const pref={key:`loved_${step.category||"general"}`,value:`Loved "${step.title}"`};const np=[...preferences.filter(p=>p.key!==pref.key),pref];setPreferences(np);const fav={title:step.title,category:step.category||"general",link:step.link,addedAt:new Date().toISOString()};const favs=[fav,...(profile?.favorites||[]).filter(f=>f.title!==step.title)].slice(0,30);const p={...profile,favorites:favs};setProfile(p);persist(p,u,allPlans,chats,np);}else{if(step?.loved){const favs=(profile?.favorites||[]).filter(f=>f.title!==step.title);const p={...profile,favorites:favs};setProfile(p);persist(p,u,allPlans,chats,preferences);}else persist(profile,u,allPlans,chats,preferences);}};
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
  const handleBooked=(step)=>{handleAddCal(step.title,step.why,step.time);markStep(step.id,"done");};
  // Compute insights for stats
  const completedByCategory={};doneSteps.forEach(s=>{const c=s.category||"other";completedByCategory[c]=(completedByCategory[c]||0)+1;});
  const totalCompleted=doneSteps.length;
  const thisWeekDone=doneSteps.filter(s=>{const d=new Date(s.completedAt||s.createdAt);return(Date.now()-d.getTime())<7*864e5;}).length;
  const handleAddCal=async(title,why,time)=>{const addWithToken=async(token)=>{const ok=await addGCalEvent(token,title,why,time);if(ok){alert("Added to Calendar!");return true;}return false;};if(!calToken){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});await addWithToken(r.access_token);});return;}const ok=await addWithToken(calToken);if(!ok){connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);const uid=getUserId(profile);if(uid)saveFB(uid,"calendar",{token:r.access_token,events:ev});await addWithToken(r.access_token);});}};
  const resetAll=async()=>{const uid=getUserId(profile);if(uid){deleteFB(uid,"appdata");deleteFB(uid,"strava");deleteFB(uid,"calendar");}localStorage.removeItem("mns_last_user");setProfile(null);setAllSteps([]);setAllPlans([]);setChats({career:[],wellness:[],fun:[],adventure:[]});setPreferences([]);setStravaData(null);setCalData(null);setScreen("auth");setShowSettings(false);};

  // Expiration check
  useEffect(()=>{const now=new Date(),h=now.getHours();let changed=false;const u=allSteps.map(s=>{if(s.status!=="active")return s;const t=(s.time||"").toLowerCase(),age=s.createdAt?(Date.now()-new Date(s.createdAt).getTime())/36e5:0;if((age>48)||(t.includes("tonight")&&age>14)||(t.includes("today")&&age>24)){changed=true;return{...s,status:"expired"};}return s;});if(changed){setAllSteps(u);persist(profile,u,allPlans,chats,preferences);}},[allSteps.length]);

  if(screen==="auth")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><AuthScreen onAuth={handleAuth}/></div>);
  if(screen==="setup")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><SetupScreen profile={profile} onComplete={handleSetup}/></div>);
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
  if(screen==="deepprofile")return(<div style={{background:C.bg,minHeight:"100vh"}}><style>{font}</style><DeepProfileChat profile={profile} onFinish={handleDeepFinish} existingInsights={profile?.insights||[]}/></div>);

  const segInfo=SEGMENTS[segment]||{label:"Timeline",color:C.acc,soft:C.accSoft,desc:"all your steps and journeys across every area of your life"};
  const bubble=u=>({...F,maxWidth:"82%",padding:"13px 18px",borderRadius:20,fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",...(u?{background:C.accGrad,color:"#fff",borderBottomRightRadius:6}:{background:C.card,color:C.t1,borderBottomLeftRadius:6,boxShadow:C.shadow})});

  return(
    <div style={{...F,height:"100vh",color:C.t1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
      <style>{font}{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes dpb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}@keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes landIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes landFade{from{opacity:0}to{opacity:1}}`}</style>
      {showLanding&&<div style={{position:"fixed",inset:0,zIndex:250,background:C.bg,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",maxWidth:440,margin:"0 auto",width:"100%"}}>
          <div style={{animation:"landIn 0.6s ease",textAlign:"center",marginBottom:32}}>
            <div style={{width:72,height:72,borderRadius:22,margin:"0 auto 20px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 12px 36px rgba(212,82,42,0.25)"}}><Logo size={38} color="#fff"/></div>
            <div style={{...H,fontSize:28,color:C.t1,marginBottom:6}}>
              {getGreeting()}{profile?.name?`, ${profile.name}`:""}</div>
            <div style={{...F,fontSize:15,color:C.t2,lineHeight:1.6}}>What would you like to work on?</div>
          </div>

          <div style={{width:"100%",display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
            {SEG_KEYS.map((s,i)=>{const info=SEGMENTS[s];const count=allSteps.filter(x=>x.status==="active"&&catToSeg(x.category)===s).length;return(
              <button key={s} onClick={()=>{setSegment(s);setView("steps");setShowLanding(false);}} style={{...F,width:"100%",padding:"18px 20px",borderRadius:20,background:C.card,boxShadow:C.shadow,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left",animation:`landIn 0.5s ease ${0.15+i*0.08}s both`}}>
                <div style={{width:48,height:48,borderRadius:16,background:info.soft,display:"flex",alignItems:"center",justifyContent:"center"}}>{segIcon(s,22,info.color)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:600,color:C.t1}}>{info.label}</div>
                  <div style={{fontSize:13,color:C.t3,marginTop:2}}>{count>0?`${count} active step${count>1?"s":""}`:info.desc}</div>
                </div>
                <ChevronRight size={18} color={C.t3}/>
              </button>
            );})}
            <button onClick={()=>{setSegment("everything");setView("steps");setShowLanding(false);}} style={{...F,width:"100%",padding:"14px 20px",borderRadius:16,background:"transparent",border:`1.5px solid ${C.b2}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",animation:`landIn 0.5s ease ${0.15+4*0.08}s both`}}>
              <div style={{width:40,height:40,borderRadius:14,background:C.cream,display:"flex",alignItems:"center",justifyContent:"center"}}><Calendar size={18} color={C.t3}/></div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:500,color:C.t2}}>Timeline</div>
                <div style={{fontSize:12,color:C.t3}}>See everything on your calendar</div>
              </div>
              <ChevronRight size={16} color={C.t3}/>
            </button>
          </div>

          <button onClick={()=>setShowLanding(false)} style={{...F,fontSize:13,color:C.t3,background:"none",border:"none",cursor:"pointer",padding:"10px 20px",animation:`landFade 0.4s ease 0.8s both`}}>Dismiss</button>
        </div>
      </div>}
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
              {streak>0&&<><span style={{fontSize:14}}><Flame size={14} color={streak>=7?"#EF4444":C.gold}/></span><span style={{...F,fontSize:12,fontWeight:700,color:streak>=3?C.gold:C.t2}}>{streak}d</span></>}
              {thisWeek>0&&<span style={{...F,fontSize:11,color:C.t3}}>{thisWeek} this week</span>}
            </div>);
          })()}
          <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}><Settings size={16}/></button>
        </div>
      </div>
      {!profile?.insights?.length&&allSteps.filter(s=>s.status==="active").length>0&&<div style={{padding:"0 20px 6px",flexShrink:0}}>
        <button onClick={()=>{setSegment("wellness");setView("chat");setTimeout(()=>sendMessage("I'd like to tell you more about myself so you can personalize better. Ask me a few questions — don't create any steps, just learn about me."),100);}} style={{...F,width:"100%",padding:"10px 16px",borderRadius:14,background:C.cream,border:`1px solid ${C.b1}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
          <span style={{fontSize:16}}><Sparkles size={14}/></span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>Help me personalize</div><div style={{fontSize:11,color:C.t3}}>Tell your guide about your preferences</div></div>
          <span style={{fontSize:12,color:C.t3}}><ChevronRight size={16}/></span>
        </button>
      </div>}
      <div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:4}}>
        {[...SEG_KEYS,"everything"].map(s=>{const info=SEGMENTS[s]||{label:"Timeline",color:C.acc};const active=segment===s;const count=s==="everything"?allSteps.filter(x=>x.status==="active").length:allSteps.filter(x=>x.status==="active"&&catToSeg(x.category)===s).length;
          return(<button key={s} onClick={()=>{setSegment(s);setExpandedPlan(null);setView("steps");}} style={{...F,flex:1,padding:"10px 4px",background:active?C.card:"transparent",border:active?`1.5px solid ${info.color}30`:"1.5px solid transparent",borderRadius:14,cursor:"pointer",fontSize:12,fontWeight:active?600:400,color:active?info.color:C.t3,boxShadow:active?C.shadow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.2s"}}>
            <span style={{fontSize:14}}>{segIcon(s)}</span>{info.label}{count>0&&<span style={{fontSize:9,background:active?info.color+"15":C.cream,color:info.color,padding:"1px 5px",borderRadius:6,fontWeight:700}}>{count}</span>}
          </button>);
        })}
      </div>
      {segment!=="everything"&&<div style={{display:"flex",padding:"0 20px",gap:6,flexShrink:0,marginBottom:6}}>
        {[{id:"steps",label:"Steps & Journeys"},{id:"chat",label:"Guide"}].map(t=>(<button key={t.id} onClick={()=>{setView(t.id);if(t.id==="chat")setTimeout(()=>inputRef.current?.focus(),100);}} style={{...F,flex:1,padding:"10px 0",background:view===t.id?C.card:"transparent",border:view===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:view===t.id?600:400,color:view===t.id?C.t1:C.t3,boxShadow:view===t.id?C.shadow:"none",transition:"all 0.15s"}}>{t.label}</button>))}
      </div>}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
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
                <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}><Calendar size={20}/></div>
                <div style={{...H,fontSize:20,color:C.t1,marginBottom:8}}>Your timeline</div>
                <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Start chatting in any segment to see your steps, journeys, and calendar events here.</div>
              </div></FadeIn>);

              return(<div>
                {allRoutines.filter(r=>!r.paused).length>0&&<div style={{marginBottom:16}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Active routines</div>
                  {allRoutines.filter(r=>!r.paused).map((r,i)=><RoutineCard key={r.id} routine={r} onPause={pauseRoutine} onDelete={deleteRoutine} onTalk={talkAbout} delay={i*30}/>)}
                </div>}
                {allPlans.length>0&&<div style={{marginBottom:16}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Journeys ({allPlans.length})</div>
                  {allPlans.map((plan,pi)=><JourneyCard key={pi} plan={plan} pi={pi} open={expandedPlan===pi} onToggle={i=>setExpandedPlan(expandedPlan===i?null:i)} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onShare={shareItem} delay={pi*30}/>)}
                </div>}
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
                    {daySteps.map((s,i)=>(<StepCard key={s.id} step={s} onDone={id=>markStep(id,"done")} onBooked={handleBooked} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onShare={shareItem} delay={i*30}/>))}
                  </div>);
                })}
                {(()=>{const scheduled=new Set();Object.values(stepsByDate).forEach(arr=>arr.forEach(s=>scheduled.add(s.id)));const unsched=allSteps.filter(s=>s.status==="active"&&!scheduled.has(s.id));return unsched.length>0?<div style={{marginTop:8}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Anytime</div>
                  {unsched.map((s,i)=>(<StepCard key={s.id} step={s} onDone={id=>markStep(id,"done")} onBooked={handleBooked} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onShare={shareItem} delay={i*30}/>))}
                </div>:null;})()}
                {doneSteps.length>0&&<div style={{marginTop:12}}>
                  <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:10}}>Completed ({doneSteps.length})</div>
                  {doneSteps.slice(0,5).map(s=>(<div key={s.id} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,background:s.loved?"rgba(220,38,38,0.04)":C.tealSoft,border:`1px solid ${s.loved?"rgba(220,38,38,0.1)":C.tealBorder}`,display:"flex",alignItems:"center",gap:10,opacity:.5}}><span style={{color:s.loved?"#DC2626":C.teal}}>{s.loved?<Heart size={14} fill="#DC2626" color="#DC2626"/>:<Check size={14}/>}</span><span style={{...F,fontSize:13,textDecoration:"line-through",color:C.t2,flex:1}}>{s.title}</span></div>))}
                </div>}
              </div>);
            })()}
          </div>
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
                  {(segment==="career"?["Help me grow my career","Find a course","Networking events"]:segment==="fun"?["Plan something with friends","Find events this weekend","Group activities"]:segment==="adventure"?["Plan a trip","Find a new experience","Weekend getaway"]:["What should I do today?","Build a workout routine","Find something nearby"]).map(c=>(<button key={c} onClick={()=>{setView("chat");setInput(c);setTimeout(()=>sendMessage(c),100);}} style={{...F,padding:"7px 14px",borderRadius:18,fontSize:12,fontWeight:500,background:C.card,border:`1.5px solid ${C.b2}`,color:C.t2,cursor:"pointer",boxShadow:C.shadow}}>{c}</button>))}
                </div>
              </div></FadeIn>
            ):(<>
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
                {segSteps.slice(0,segment==="everything"?10:5).map((step,i)=><StepCard key={step.id} step={step} onDone={id=>markStep(id,"done")} onBooked={handleBooked} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onShare={shareItem} delay={i*50}/>)}
                {segSteps.length>(segment==="everything"?10:5)&&<div style={{...F,fontSize:12,color:C.t3,textAlign:"center",padding:"8px 0"}}>+{segSteps.length-(segment==="everything"?10:5)} more steps</div>}
              </div>}
              {segPlans.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Journeys ({segPlans.length})</div>
                {segPlans.slice(0,segment==="everything"?allPlans.length:2).map((plan,pi)=><JourneyCard key={pi} plan={plan} pi={allPlans.indexOf(plan)} open={expandedPlan===allPlans.indexOf(plan)} onToggle={i=>setExpandedPlan(expandedPlan===i?null:i)} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onShare={shareItem} delay={pi*50}/>)}
                {segment!=="everything"&&segPlans.length>2&&<button onClick={()=>setSegment("everything")} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",padding:"8px 0",width:"100%",textAlign:"center"}}>View all journeys</button>}
              </div>}
              {segRoutines.length>0&&<div style={{marginBottom:20}}>
                <div style={{...F,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.t3,marginBottom:12}}>Routines ({segRoutines.length})</div>
                {segRoutines.map((r,i)=><RoutineCard key={r.id} routine={r} onPause={pauseRoutine} onDelete={deleteRoutine} onTalk={talkAbout} delay={i*50}/>)}
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
            {loading&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:10,background:C.accGrad,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/></div>
              <div style={{...F,fontSize:14,color:C.t3,fontStyle:"italic"}}>Thinking...</div>
            </div>}
            <div ref={chatEnd}/>
          </div>
          {(chats[segment]||[]).length<=4&&<div style={{padding:"0 20px 6px",flexShrink:0}}>
            <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
              {(segSteps.length>0?["What else should I try?","Switch things up","Find me something new"]:segment==="career"?["Help me grow my career","Find a course","Networking events near me"]:segment==="fun"?["Plan something with friends","Find events this weekend","Group activities near me"]:segment==="adventure"?["Plan a trip","Find a new experience","Weekend getaway ideas"]:["What should I do today?","Help me build a habit","Find something nearby"]).map(c=>(<button key={c} onClick={()=>{setInput(c);setTimeout(()=>sendMessage(c),50);}} style={{...F,padding:"7px 14px",borderRadius:18,fontSize:12,fontWeight:500,background:C.card,border:`1.5px solid ${C.b2}`,color:C.t2,cursor:"pointer",whiteSpace:"nowrap",boxShadow:C.shadow}}>{c}</button>))}
            </div>
          </div>}
          {(chats[segment]||[]).length>0&&<div style={{padding:"0 20px 4px",flexShrink:0,textAlign:"right"}}>
            <button onClick={()=>{if(confirm("Clear this conversation? Steps and journeys will be kept.")){const nc={...chats,[segment]:[]};setChats(nc);persist(profile,allSteps,allPlans,nc,preferences);}}} style={{...F,fontSize:11,color:C.t3,background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>Clear conversation</button>
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

      {transitionMsg&&<div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:150,padding:"14px 28px",borderRadius:20,background:C.accGrad,color:"#fff",boxShadow:"0 8px 32px rgba(212,82,42,0.3)",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 0.4s ease"}}><Check size={18}/><span style={{...F,fontSize:14,fontWeight:600}}>{transitionMsg}</span></div>}

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
      <LegalModal legalModal={legalModal} setLegalModal={setLegalModal} />
    </div>
  );
}
