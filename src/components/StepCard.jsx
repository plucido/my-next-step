import { useState, memo } from "react";
import { X, Check, Heart, Sparkles, Share2, Calendar, ExternalLink, ThumbsDown, Clock, ChevronRight } from "lucide-react";
import { C, F, SEGMENTS } from "../lib/constants.js";
import { FadeIn, catToSeg, catIcon, TLink } from "../lib/utils.jsx";

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

export default memo(function StepCard({step,onDone,onBooked,onDislike,onDelete,onLove,onTalk,onSwap,onChoose,onAddCal,onShare,onSnooze,delay=0}){
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
    {step.options&&step.options.length>0&&!step.chosen?(
      <div style={{marginBottom:10}}>
        <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Pick one</div>
        {step.options.map((opt,oi)=>(
          <div key={oi} onClick={()=>{if(onChoose)onChoose(step.id,opt);}} style={{padding:"12px 14px",borderRadius:12,marginBottom:6,background:C.card,border:`1.5px solid ${C.b2}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"border-color 0.15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor=seg?.color||C.acc;}} onMouseOut={e=>{e.currentTarget.style.borderColor=C.b2;}}>
            <div style={{flex:1}}>
              <div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>{opt.name}</div>
              <div style={{...F,fontSize:12,color:C.t2,marginTop:2}}>{opt.why}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              {opt.price&&<span style={{...F,fontSize:12,fontWeight:600,color:seg?.color||C.acc}}>{opt.price}</span>}
              <div style={{width:28,height:28,borderRadius:8,background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={14} color={C.acc}/></div>
            </div>
          </div>
        ))}
      </div>
    ):(
      <div>
        {step.why&&<div style={{...F,fontSize:13,color:C.t2,lineHeight:1.55,marginBottom:10}}>{step.chosen?`You picked: ${step.chosen.name}`:step.why}</div>}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:6}}>
          {(step.chosen?.link||step.link)&&!step.booked&&<a href={step.chosen?.link||step.link} target="_blank" rel="noopener noreferrer" onClick={()=>{onBooked(step);}} style={{...F,fontSize:14,fontWeight:700,padding:"11px 20px",borderRadius:14,background:C.accGrad,color:"#fff",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",boxShadow:"0 2px 8px rgba(212,82,42,0.2)"}}>Book it <ExternalLink size={12}/></a>}
          {step.booked&&<span style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:"rgba(15,118,110,0.08)",border:`1px solid ${C.tealBorder}`,color:C.teal,display:"inline-flex",alignItems:"center",gap:6}}><Check size={14}/> Booked</span>}
          {!(step.chosen?.link||step.link)&&!step.booked&&step.time&&<button onClick={()=>onBooked(step)} style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.1)",color:"#4285F4",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><Calendar size={14}/> Add to calendar</button>}
          <button onClick={()=>onDone(step.id)} style={{...F,fontSize:12,padding:"8px 14px",borderRadius:10,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,color:C.teal,cursor:"pointer"}}>Done</button>
          <button onClick={()=>onLove(step.id)} style={{width:36,height:36,borderRadius:10,border:"none",cursor:"pointer",background:step.loved?"rgba(220,38,38,0.08)":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{step.loved?<Heart size={15} fill="#DC2626" color="#DC2626"/>:<Heart size={15} color={C.t3}/>}</button>
          <button onClick={()=>onDislike(step.id)} style={{width:36,height:36,borderRadius:10,border:"none",cursor:"pointer",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}><ThumbsDown size={15} color={C.t3}/></button>
        </div>
      </div>
    )}
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      <button onClick={()=>{if(onSwap)onSwap(step);else onTalk(`Find a different alternative to "${step.title}" with prices and details. Something fresh.`);}} style={{...F,fontSize:11,padding:"5px 10px",borderRadius:8,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Swap</button>
      {step.time&&<button onClick={()=>onTalk(`Reschedule "${step.title}" to a different time. Suggest a few options that work with my calendar.`)} style={{...F,fontSize:11,padding:"5px 10px",borderRadius:8,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}><Clock size={11}/> Reschedule</button>}
      <button onClick={()=>onShare(step)} style={{...F,fontSize:11,padding:"5px 10px",borderRadius:8,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Share</button>
    </div>
  </div></FadeIn>);
})
