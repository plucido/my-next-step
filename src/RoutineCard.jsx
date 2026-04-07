import { useState, memo } from "react";
import { X, Check, Sparkles, RotateCcw } from "lucide-react";
import { C, F, SEGMENTS } from "./constants.js";
import { FadeIn, catToSeg } from "./utils.jsx";

export default memo(function RoutineCard({routine,onPause,onDelete,onComplete,onTalk,delay=0}){
  const [justCompleted, setJustCompleted] = useState(false);
  const seg=SEGMENTS[catToSeg(routine.category)];
  const days=(routine.days||[]).map(d=>d.slice(0,3).charAt(0).toUpperCase()+d.slice(1,3)).join(", ");
  const completions = routine.completions || 0;

  function handleComplete() {
    if (onComplete) onComplete(routine.id);
    setJustCompleted(true);
    setTimeout(function(){ setJustCompleted(false); }, 2000);
  }

  return(<FadeIn delay={delay}><div style={{padding:"16px 18px",borderRadius:18,marginBottom:10,background:routine.paused?"rgba(0,0,0,0.02)":justCompleted?(seg?.soft||C.accSoft):C.card,boxShadow:C.shadow,position:"relative",borderLeft:"4px solid "+(routine.paused?C.t3:seg?.color||C.acc),opacity:routine.paused?.5:1,transition:"background 0.3s"}}>
    <button onClick={function(){onDelete(routine.id);}} style={{position:"absolute",top:12,right:12,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14}}><X size={16}/></button>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{fontSize:14}}><RotateCcw size={14}/></span>
      <span style={{...F,fontSize:10,fontWeight:700,color:seg?.color||C.acc,textTransform:"uppercase",letterSpacing:1.5}}>{routine.schedule}</span>
      {days?<span style={{...F,fontSize:10,color:C.t3}}>{days}</span>:null}
      {completions>0?<span style={{...F,fontSize:9,fontWeight:600,color:C.teal,background:C.tealSoft,padding:"2px 6px",borderRadius:5}}>{completions}x done</span>:null}
      {routine.paused?<span style={{...F,fontSize:9,fontWeight:600,color:C.gold,background:C.goldSoft,padding:"2px 6px",borderRadius:5}}>Paused</span>:null}
    </div>
    <div style={{...F,fontSize:15,fontWeight:600,color:C.t1,lineHeight:1.4,marginBottom:4,paddingRight:24}}>{routine.title}</div>
    {routine.description?<div style={{...F,fontSize:13,color:C.t2,lineHeight:1.55,marginBottom:12}}>{routine.description}</div>:null}
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {!routine.paused?<button onClick={handleComplete} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:justCompleted?C.tealSoft:seg?.soft||C.accSoft,border:"1px solid "+(justCompleted?C.tealBorder:(seg?.color||C.acc)+"30"),color:justCompleted?C.teal:seg?.color||C.acc,cursor:"pointer",fontWeight:600}}>{justCompleted?<span><Check size={12}/> Done!</span>:<span><Check size={12}/> Mark done</span>}</button>:null}
      <button onClick={function(){onPause(routine.id);}} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:routine.paused?C.tealSoft:C.cream,border:routine.paused?"1px solid "+C.tealBorder:"none",color:routine.paused?C.teal:C.t2,cursor:"pointer",fontWeight:routine.paused?600:400}}>{routine.paused?"Resume":"Pause"}</button>
      <button onClick={function(){onTalk('Generate a fresh step for my "'+routine.title+'" routine. Search for something specific and new.');}} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.accSoft,border:"1px solid "+C.accBorder,color:C.acc,cursor:"pointer",fontWeight:600}}>Generate now</button>
      <button onClick={function(){onTalk('Update my "'+routine.title+'" routine. Make it better or change the schedule.');}} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}><Sparkles size={14}/> Improve</button>
    </div>
  </div></FadeIn>);
})
