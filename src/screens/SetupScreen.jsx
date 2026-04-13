import { useState } from "react";
import { C, F, H } from "../lib/constants.js";
import { FadeIn } from "../lib/utils.jsx";

export default function SetupScreen({profile,onComplete}){
  const[location,setLocation]=useState("");const[age,setAge]=useState("");const[gender,setGender]=useState("");const[genderOther,setGenderOther]=useState("");
  const inp={...F,width:"100%",padding:"15px 18px",fontSize:16,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"};
  return(<div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}><FadeIn><div style={{width:"100%",maxWidth:420}}>
    <h2 style={{...H,fontSize:28,color:C.t1,marginBottom:6}}>Quick setup, {profile.name}</h2>
    <p style={{...F,color:C.t2,fontSize:14,marginBottom:28,lineHeight:1.5}}>This helps me find things near you and tailor recommendations to you.</p>
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:4}}>Where are you based?</label>
    <div style={{...F,fontSize:11,color:C.t3,marginBottom:6}}>So I can find restaurants, events, and activities near you</div>
    <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, State" style={{...inp,marginBottom:20}} />
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:4}}>Age</label>
    <div style={{...F,fontSize:11,color:C.t3,marginBottom:6}}>Helps me suggest age-appropriate activities and venues</div>
    <input value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 28" type="number" style={{...inp,marginBottom:20}} />
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:4}}>Gender</label>
    <div style={{...F,fontSize:11,color:C.t3,marginBottom:6}}>Optional — helps with fitness and health recommendations</div>
    <div style={{display:"flex",gap:8,marginBottom:gender==="Other"?12:20,flexWrap:"wrap"}}>
      {["Male","Female","Other","Prefer not to say"].map(g=>(<button key={g} onClick={()=>setGender(g)} style={{...F,padding:"10px 18px",borderRadius:14,fontSize:14,cursor:"pointer",background:gender===g?C.accSoft:C.card,border:`1.5px solid ${gender===g?C.acc:C.b2}`,color:gender===g?C.acc:C.t2,fontWeight:gender===g?600:400,transition:"all 0.15s"}}>{g}</button>))}
    </div>
    {gender==="Other"&&<input value={genderOther} onChange={e=>setGenderOther(e.target.value)} placeholder="How do you identify?" style={{...inp,marginBottom:20}} />}
    <button onClick={()=>location.trim()&&onComplete({location:location.trim(),age:age.trim(),gender:gender==="Other"?genderOther:gender})} disabled={!location.trim()} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:location.trim()?"pointer":"default",background:location.trim()?C.accGrad:"rgba(0,0,0,0.04)",color:location.trim()?"#fff":C.t3}}>Let's go {"\u2192"}</button>
  </div></FadeIn></div>);
}
