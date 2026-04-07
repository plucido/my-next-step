import { useState, memo } from "react";
import { X, Check, Heart, Sparkles, Share2, Calendar, ExternalLink, ThumbsDown, Clock } from "lucide-react";
import { C, F, SEGMENTS } from "./constants.js";
import { FadeIn, catToSeg, catIcon, TLink } from "./utils.jsx";

function getSnoozeDate(option){
  const now=new Date();
  if(option==="1h") return new Date(now.getTime()+60*60*1000).toISOString();
  if(option==="Tonight"){const d=new Date(now);d.setHours(20,0,0,0);if(d<=now) d.setDate(d.getDate()+1);return d.toISOString();}
  if(option==="Tomorrow"){const d=new Date(now);d.setDate(d.getDate()+1);d.setHours(9,0,0,0);return d.toISOString();}
  if(option==="This weekend"){const d=new Date(now);const day=d.getDay();const diff=day===0?7:6-day;d.setDate(d.getDate()+diff);d.setHours(10,0,0,0);return d.toISOString();}
  if(option==="Next week"){const d=new Date(now);const day=d.getDay();const diff=day===0?1:8-day;d.setDate(d.getDate()+diff);d.setHours(9,0,0,0);return d.toISOString();}
  return now.toISOString();
}

const SNOOZE_OPTIONS=["1h","Tonight","Tomorrow","This weekend","Next week"];

export default memo(function StepCard({step,onDone,onBooked,onDislike,onDelete,onLove,onTalk,onAddCal,onShare,onSnooze,delay=0}){
  const seg=SEGMENTS[catToSeg(step.category)];
  const [showSnooze,setShowSnooze]=useState(false);
  return(<FadeIn delay={delay}><div style={{padding:"18px 20px",borderRadius:18,marginBottom:10,background:step.booked?C.tealSoft:C.card,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${step.booked?C.teal:seg?.color||C.acc}`}}>
    <button onClick={()=>onDelete(step.id)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}><X size={16}/></button>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{fontSize:14}}>{catIcon(step.category)}</span>
      <span style={{...F,fontSize:10,fontWeight:700,color:seg?.color||C.acc,textTransform:"uppercase",letterSpacing:1.5}}>{step.category}</span>
      {step.booked&&<span style={{...F,fontSize:9,fontWeight:600,color:C.teal,background:"rgba(15,118,110,0.15)",padding:"2px 6px",borderRadius:5}}>Booked</span>}
      {step.recurring&&<span style={{...F,fontSize:9,fontWeight:600,color:C.teal,background:C.tealSoft,padding:"2px 6px",borderRadius:5}}>{step.recurring}</span>}
      {step.createdAt&&<span style={{...F,fontSize:10,color:C.t3,marginLeft:"auto"}}>{((d)=>{const m=Math.floor(d/6e4);if(m<60)return m+"m";const h=Math.floor(m/60);if(h<24)return h+"h";return Math.floor(h/24)+"d";})(Date.now()-new Date(step.createdAt).getTime())} ago</span>}
    </div>
    <div style={{...F,fontSize:15,fontWeight:600,color:C.t1,lineHeight:1.4,marginBottom:4,paddingRight:24}}>{step.title}</div>
    {step.time&&<div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>{step.time}</div>}
    {step.why&&<div style={{...F,fontSize:13,color:C.t2,lineHeight:1.55,marginBottom:14}}>{step.why}</div>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
      {step.link&&!step.booked&&<a href={step.link} target="_blank" rel="noopener noreferrer" onClick={()=>{onBooked(step);}} style={{...F,fontSize:13,fontWeight:600,padding:"9px 16px",borderRadius:12,background:C.accGrad,color:"#fff",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"}}><Calendar size={14}/> Book it <ExternalLink size={11}/></a>}
      {step.booked&&<span style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:"rgba(15,118,110,0.08)",border:`1px solid ${C.tealBorder}`,color:C.teal,display:"inline-flex",alignItems:"center",gap:6}}><Check size={14}/> Booked</span>}
      {!step.link&&!step.booked&&step.time&&<button onClick={()=>onBooked(step)} style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.1)",color:"#4285F4",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><Calendar size={14}/> Add to calendar</button>}
      <button onClick={()=>onDone(step.id)} style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,color:C.teal,cursor:"pointer"}}>Done <Check size={14}/></button>
      <button onClick={()=>onLove(step.id)} style={{width:38,height:38,borderRadius:12,border:"none",cursor:"pointer",background:step.loved?"rgba(220,38,38,0.08)":"rgba(0,0,0,0.02)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all 0.2s"}}>{step.loved?<Heart size={16} fill="#DC2626" color="#DC2626"/>:<Heart size={16} color={C.t3}/>}</button>
      <button onClick={()=>onDislike(step.id)} style={{width:38,height:38,borderRadius:12,border:"none",cursor:"pointer",background:"rgba(0,0,0,0.02)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}><ThumbsDown size={16} color={C.t3}/></button>
    </div>
    <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
      <button onClick={()=>onTalk(`Work on step: "${step.title}". Find specific options with prices, booking links, and details. Make it actionable.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.accSoft,border:`1px solid ${C.accBorder}`,color:C.acc,cursor:"pointer",fontWeight:600}}>Work on this</button>
      <button onClick={()=>onTalk(`Find a different alternative to "${step.title}" with prices and details. Something fresh.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Alternative</button>
      <button onClick={()=>onShare(step)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}><Share2 size={12}/> Share</button>
      <button onClick={()=>setShowSnooze(!showSnooze)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:showSnooze?C.goldSoft:C.cream,border:"none",color:showSnooze?C.gold:C.t2,cursor:"pointer"}}><Clock size={12}/> Snooze</button>
    </div>
    {showSnooze&&<div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>{SNOOZE_OPTIONS.map(opt=>(<button key={opt} onClick={()=>{onSnooze(step.id,getSnoozeDate(opt));setShowSnooze(false);}} style={{...F,fontSize:11,padding:"5px 10px",borderRadius:8,background:C.goldSoft,border:"none",color:C.gold,cursor:"pointer",fontWeight:600}}>{opt}</button>))}</div>}
  </div></FadeIn>);
})
