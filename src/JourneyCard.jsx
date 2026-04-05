import { X, Check, Sparkles, Share2, Calendar, AlertTriangle, ExternalLink } from "lucide-react";
import { C, F } from "./constants.js";
import { FadeIn, TLink } from "./utils.jsx";

export default function JourneyCard({plan,pi,open,onToggle,onDelete,onTalk,onToggleTask,onShare,delay=0}){
  const done=plan.tasks?.filter(t=>t.done).length||0,total=plan.tasks?.length||0,allDone=total>0&&done===total;
  let isPast=false;try{const m=(plan.date||"").match(/(\w+)\s+\d{1,2}\s*[-\u2013]\s*(\d{1,2}),?\s*(\d{4})/);if(m){const d=new Date(`${m[1]} ${m[2]}, ${m[3]}`);d.setHours(23,59);isPast=d<new Date();}else{const s=(plan.date||"").match(/(\w+\s+\d{1,2}),?\s*(\d{4})/);if(s){const d=new Date(`${s[1]}, ${s[2]}`);d.setHours(23,59);isPast=d<new Date();}}}catch{}
  const borderColor=isPast&&!allDone?"#DC3C3C":allDone?C.teal:C.b1;
  const bg=isPast&&!allDone?"rgba(220,60,60,0.02)":allDone?C.tealSoft:C.card;
  return(<FadeIn delay={delay}><div style={{marginBottom:10}}>
    <div style={{padding:"18px 20px",borderRadius:open?"18px 18px 0 0":18,cursor:"pointer",background:bg,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${borderColor}`}}>
      <button onClick={e=>{e.stopPropagation();onDelete(pi);}} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}><X size={16}/></button>
      <div onClick={()=>onToggle(pi)}>
        <div style={{...F,fontSize:16,fontWeight:600,color:C.t1,paddingRight:24}}>{plan.title}</div>
        {plan.date&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}><span style={{fontSize:13}}>{isPast&&!allDone?<AlertTriangle size={13} color="#DC3C3C"/>:allDone?<Check size={13} color={C.teal}/>:<Calendar size={13} color={C.t3}/>}</span><span style={{...F,fontSize:13,color:isPast&&!allDone?"#DC3C3C":allDone?C.teal:C.t3,fontWeight:isPast?600:400}}>{plan.date}</span>{isPast&&!allDone&&<span style={{...F,fontSize:10,fontWeight:600,color:"#DC3C3C",background:"rgba(220,60,60,0.08)",padding:"2px 8px",borderRadius:6}}>Overdue</span>}{allDone&&<span style={{...F,fontSize:10,fontWeight:600,color:C.teal,background:C.tealSoft,padding:"2px 8px",borderRadius:6}}>Done</span>}</div>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}><div style={{flex:1,height:4,background:C.cream,borderRadius:2}}><div style={{height:"100%",width:total?(done/total*100)+"%":"0%",background:allDone?C.teal:isPast?"#DC3C3C":C.accGrad,borderRadius:2,transition:"width 0.5s"}}/></div><span style={{...F,fontSize:11,fontWeight:600,color:allDone?C.teal:C.acc}}>{done}/{total}</span></div>
      </div>
      <div style={{display:"flex",gap:6,marginTop:10}}>
        {isPast&&!allDone&&<button onClick={()=>onTalk(`My journey "${plan.title}" is overdue (${plan.date}). Help me reschedule.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:"rgba(220,60,60,0.06)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",cursor:"pointer",fontWeight:600}}>Reschedule</button>}
        {!allDone&&(()=>{const nt=plan.tasks?.find(t=>!t.done);return nt?<button onClick={()=>onTalk(`Work on "${nt.title}" for my "${plan.title}" journey. Find specific options with prices.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.accSoft,border:`1px solid ${C.accBorder}`,color:C.acc,cursor:"pointer",fontWeight:600}}>Next task</button>:null;})()}
        <button onClick={()=>onTalk(`Work on journey "${plan.title}". What should I focus on?`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t3,cursor:"pointer"}}>Work on this</button>
        <button onClick={()=>onTalk(`Make my "${plan.title}" journey even better. Upgrade the tasks with better options, add anything I'm missing.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t3,cursor:"pointer"}}><Sparkles size={14}/> Improve</button>
        <button onClick={()=>onShare(plan)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t3,cursor:"pointer"}}><Share2 size={12}/> Share</button>
      </div>
    </div>
    {open&&<div style={{padding:"8px 20px 16px",background:bg,boxShadow:C.shadow,borderRadius:"0 0 18px 18px",borderTop:`1px solid ${C.b1}`}}>
      {plan.tasks?.map((task,ti)=>(<div key={ti} style={{padding:"12px 0",borderBottom:ti<plan.tasks.length-1?`1px solid ${C.b1}`:"none"}}><div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <button onClick={()=>onToggleTask(pi,ti)} style={{width:22,height:22,borderRadius:7,flexShrink:0,marginTop:1,cursor:"pointer",background:task.done?C.teal:"transparent",border:`2px solid ${task.done?C.teal:C.b2}`,display:"flex",alignItems:"center",justifyContent:"center",color:task.done?"#fff":"transparent",fontSize:12}}>{task.done?"\u2713":""}</button>
        <div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500,color:C.t1,textDecoration:task.done?"line-through":"none",opacity:task.done?.5:1}}>{task.title}</div>
          {task.links?.length>0&&!task.done&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>{task.links.map((l,li)=><TLink key={li} href={l.url} actionId={`j-${pi}-${ti}-${li}`} category="travel" title={task.title} style={{...F,fontSize:11,fontWeight:600,padding:"5px 12px",borderRadius:8,background:C.accSoft,color:C.acc,textDecoration:"none",display:"inline-block",border:`1px solid ${C.accBorder}`}}>{l.label} <ExternalLink size={11}/></TLink>)}</div>}
        </div></div></div>))}
    </div>}
  </div></FadeIn>);
}
