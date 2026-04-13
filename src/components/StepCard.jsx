import { useState, memo } from "react";
import { X, Check, Heart, Sparkles, Share2, Calendar, ExternalLink, ThumbsDown, Clock, ChevronRight, ChevronDown } from "lucide-react";
import { C, F, SEGMENTS } from "../lib/constants.js";
import { FadeIn, catToSeg, catIcon, TLink } from "../lib/utils.jsx";

const SNOOZE_OPTIONS = ["1h","Tonight","Tomorrow","This weekend","Next week"];
function getSnoozeDate(opt){const d=new Date();if(opt==="1h"){d.setHours(d.getHours()+1);}else if(opt==="Tonight"){d.setHours(20,0,0);}else if(opt==="Tomorrow"){d.setDate(d.getDate()+1);d.setHours(9,0,0);}else if(opt==="This weekend"){while(d.getDay()!==6)d.setDate(d.getDate()+1);d.setHours(10,0,0);}else if(opt==="Next week"){d.setDate(d.getDate()+(8-d.getDay())%7||7);d.setHours(9,0,0);}return d.toISOString();}

export default memo(function StepCard({step,onDone,onBooked,onDislike,onDelete,onLove,onTalk,onSwap,onChoose,onAddCal,onShare,onSnooze,delay=0}){
  const seg=SEGMENTS[catToSeg(step.category)];
  const [expanded,setExpanded]=useState(false);
  const hasOptions=step.options&&step.options.length>0&&!step.chosen;

  return(<FadeIn delay={delay}><div style={{padding:"18px 20px",borderRadius:18,marginBottom:10,background:step.booked?C.tealSoft:C.card,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${step.booked?C.teal:seg?.color||C.acc}`}}>
    <button onClick={()=>onDelete(step.id)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}><X size={16}/></button>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{fontSize:14}}>{catIcon(step.category)}</span>
      <span style={{...F,fontSize:10,fontWeight:700,color:seg?.color||C.acc,textTransform:"uppercase",letterSpacing:1.5}}>{step.category}</span>
      {step.booked&&<span style={{...F,fontSize:9,fontWeight:600,color:C.teal,background:"rgba(15,118,110,0.15)",padding:"2px 6px",borderRadius:5}}>On your calendar</span>}
      {step.recurring&&<span style={{...F,fontSize:9,fontWeight:600,color:C.teal,background:C.tealSoft,padding:"2px 6px",borderRadius:5}}>{step.recurring}</span>}
      {step.createdAt&&<span style={{...F,fontSize:10,color:C.t3,marginLeft:"auto"}}>{((d)=>{const m=Math.floor(d/6e4);if(m<60)return m+"m";const h=Math.floor(m/60);if(h<24)return h+"h";return Math.floor(h/24)+"d";})(Date.now()-new Date(step.createdAt).getTime())} ago</span>}
    </div>

    {hasOptions?(
      <div>
        <div style={{...F,fontSize:15,fontWeight:600,color:C.t1,lineHeight:1.4,marginBottom:4,paddingRight:24}}>{step.title}</div>
        {step.time&&<div style={{...F,fontSize:12,color:C.t3,marginBottom:8}}>{step.time}</div>}
        <div style={{...F,fontSize:12,color:C.t2,marginBottom:8}}>Here are your options — tap to choose:</div>
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
        <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center"}}>
          <button onClick={()=>{if(onSwap)onSwap(step);}} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:8,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Get different options</button>
        </div>
      </div>
    ):(
      <div>
        <div onClick={()=>setExpanded(!expanded)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{...F,fontSize:15,fontWeight:600,color:C.t1,lineHeight:1.4,flex:1,paddingRight:24}}>{step.chosen?step.chosen.name:step.title}</div>
            {!expanded&&<ChevronDown size={16} color={C.t3} style={{flexShrink:0,transition:"transform 0.2s",transform:expanded?"rotate(180deg)":"rotate(0)"}}/>}
          </div>
          {step.time&&<div style={{...F,fontSize:12,color:C.t3,marginTop:2}}>{step.time}</div>}
          {!expanded&&step.why&&<div style={{...F,fontSize:13,color:C.t2,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{step.why}</div>}
        </div>

        {expanded&&<div style={{marginTop:8}}>
          {step.why&&<div style={{...F,fontSize:14,color:C.t2,lineHeight:1.65,marginBottom:12}}>{step.why}</div>}
          {step.chosen&&<div style={{...F,fontSize:12,color:C.t3,marginBottom:8}}>You picked this from {step.options?.length||"several"} options</div>}

          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
            {(step.chosen?.link||step.link)&&!step.booked&&<a href={step.chosen?.link||step.link} target="_blank" rel="noopener noreferrer" onClick={()=>{onBooked(step);}} style={{...F,fontSize:14,fontWeight:700,padding:"11px 20px",borderRadius:14,background:C.accGrad,color:"#fff",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",boxShadow:"0 2px 8px rgba(212,82,42,0.2)"}}>Book it <ExternalLink size={12}/></a>}
            {step.booked&&<span style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:"rgba(15,118,110,0.08)",border:`1px solid ${C.tealBorder}`,color:C.teal,display:"inline-flex",alignItems:"center",gap:6}}><Check size={14}/> On your calendar</span>}
            {!(step.chosen?.link||step.link)&&!step.booked&&step.time&&<button onClick={()=>onBooked(step)} style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.1)",color:"#4285F4",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><Calendar size={14}/> Add to calendar</button>}
          </div>

          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
            <button onClick={()=>onDone(step.id)} style={{...F,fontSize:12,padding:"8px 14px",borderRadius:10,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,color:C.teal,cursor:"pointer"}}>I did this</button>
            <button onClick={()=>onLove(step.id)} style={{...F,fontSize:11,padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",background:step.loved?"rgba(220,38,38,0.08)":"transparent",display:"inline-flex",alignItems:"center",gap:4,color:step.loved?"#DC2626":C.t3}}>{step.loved?<Heart size={13} fill="#DC2626" color="#DC2626"/>:<Heart size={13}/>}{step.loved?" Saved":""}</button>
            <button onClick={()=>onDislike(step.id)} style={{...F,fontSize:11,padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"transparent",display:"inline-flex",alignItems:"center",gap:4,color:C.t3}}><ThumbsDown size={13}/> Not for me</button>
            <button onClick={()=>onShare(step)} style={{...F,fontSize:11,padding:"6px 10px",borderRadius:8,background:"transparent",border:"none",color:C.t3,cursor:"pointer"}}>Share</button>
          </div>
        </div>}

        {!expanded&&<div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
          {(step.chosen?.link||step.link)&&!step.booked&&<button onClick={()=>setExpanded(true)} style={{...F,fontSize:13,fontWeight:600,padding:"10px 18px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,boxShadow:"0 2px 8px rgba(212,82,42,0.2)"}}>See details & book</button>}
          {step.booked&&<span style={{...F,fontSize:12,padding:"8px 14px",borderRadius:10,background:"rgba(15,118,110,0.08)",border:`1px solid ${C.tealBorder}`,color:C.teal,display:"inline-flex",alignItems:"center",gap:6}}><Check size={13}/> On your calendar</span>}
          {!(step.chosen?.link||step.link)&&!step.booked&&<button onClick={()=>setExpanded(true)} style={{...F,fontSize:12,padding:"8px 14px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>More details</button>}
          <button onClick={()=>{if(onSwap)onSwap(step);}} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:8,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Get a different option</button>
        </div>}
      </div>
    )}
  </div></FadeIn>);
})
