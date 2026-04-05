import { X, Check, Heart, Sparkles, Share2, Calendar, ExternalLink } from "lucide-react";
import { C, F, SEGMENTS } from "./constants.js";
import { FadeIn, catToSeg, catIcon, TLink } from "./utils.jsx";

export default function StepCard({step,onDone,onBooked,onDelete,onLove,onTalk,onAddCal,onShare,delay=0}){
  const seg=SEGMENTS[catToSeg(step.category)];
  return(<FadeIn delay={delay}><div style={{padding:"18px 20px",borderRadius:18,marginBottom:10,background:C.card,boxShadow:C.shadow,position:"relative",borderLeft:`4px solid ${seg?.color||C.acc}`}}>
    <button onClick={()=>onDelete(step.id)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:16}}><X size={16}/></button>
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
      {step.link&&<TLink href={step.link} actionId={step.id} category={step.category} title={step.title} style={{...F,fontSize:13,fontWeight:600,padding:"9px 16px",borderRadius:12,background:C.accGrad,color:"#fff",textDecoration:"none",display:"inline-block"}}>{step.linkText||"Do it"} <ExternalLink size={11}/></TLink>}
      <button onClick={()=>onBooked(step)} style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.1)",color:"#4285F4",cursor:"pointer"}}><Calendar size={14}/> Booked</button>
      <button onClick={()=>onDone(step.id)} style={{...F,fontSize:13,padding:"9px 16px",borderRadius:12,background:C.tealSoft,border:`1px solid ${C.tealBorder}`,color:C.teal,cursor:"pointer"}}>Done <Check size={14}/></button>
      <button onClick={()=>onLove(step.id)} style={{width:38,height:38,borderRadius:12,border:"none",cursor:"pointer",background:step.loved?"rgba(220,38,38,0.08)":"rgba(0,0,0,0.02)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all 0.2s"}}>{step.loved?<Heart size={16} fill="#DC2626" color="#DC2626"/>:<Heart size={16} color={C.t3}/>}</button>
    </div>
    <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
      <button onClick={()=>onTalk(`Work on step: "${step.title}". Find specific options with prices and booking links.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer",fontWeight:500}}>Work on this</button>
      <button onClick={()=>onTalk(`Make "${step.title}" even better. Find a more specific, exciting, or well-reviewed option. Upgrade it.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}><Sparkles size={14}/> Make better</button>
      <button onClick={()=>onTalk(`Find alternative to "${step.title}" with prices and details.`)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}>Alternative</button>
      <button onClick={()=>onShare(step)} style={{...F,fontSize:11,padding:"6px 12px",borderRadius:10,background:C.cream,border:"none",color:C.t2,cursor:"pointer"}}><Share2 size={12}/> Share</button>
    </div>
  </div></FadeIn>);
}
