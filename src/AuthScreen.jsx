import { useState, useEffect, useRef } from "react";
import { C, F, H } from "./constants.js";
import { FadeIn, Logo } from "./utils.jsx";
import { loadGSI, decJwt } from "./auth.js";

export default function AuthScreen({onAuth}){
  const[mode,setMode]=useState("landing");const[email,setEmail]=useState("");const[name,setName]=useState("");const gRef=useRef(null);
  useEffect(()=>{const c=import.meta.env.VITE_GOOGLE_CLIENT_ID;if(!c||mode!=="landing")return;loadGSI().then(()=>{if(!window.google?.accounts?.id)return;window.google.accounts.id.initialize({client_id:c,callback:r=>{const u=decJwt(r.credential);if(u)onAuth({name:u.given_name||u.name||"User",email:u.email,method:"google"});}});if(gRef.current)window.google.accounts.id.renderButton(gRef.current,{type:"standard",theme:"outline",size:"large",width:380,text:"continue_with",shape:"pill"});});},[mode]);
  const inp={...F,width:"100%",padding:"15px 18px",fontSize:15,borderRadius:16,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"};
  if(mode==="email")return(<div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}><FadeIn><div style={{width:"100%",maxWidth:400}}>
    <button onClick={()=>setMode("landing")} style={{...F,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14,marginBottom:28}}>{"\u2190"} Back</button>
    <h2 style={{...H,fontSize:32,color:C.t1,marginBottom:28}}>Create your account</h2>
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Your name</label>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="First name" style={{...inp,marginBottom:18}} />
    <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Email</label>
    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" type="email" style={{...inp,marginBottom:28}} />
    <button onClick={()=>name.trim()&&email.includes("@")&&onAuth({name:name.trim(),email,method:"email"})} disabled={!name.trim()||!email.includes("@")} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:name.trim()&&email.includes("@")?"pointer":"default",background:name.trim()&&email.includes("@")?C.accGrad:"rgba(0,0,0,0.04)",color:name.trim()&&email.includes("@")?"#fff":C.t3}}>Create account {"\u2192"}</button>
  </div></FadeIn></div>);
  return(<div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}><FadeIn><div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
    <div style={{width:68,height:68,borderRadius:20,margin:"0 auto 24px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 8px 28px rgba(212,82,42,0.3)"}}><Logo size={36} color="#fff"/></div>
    <h1 style={{...H,fontSize:46,color:C.t1,lineHeight:1.05,marginBottom:14}}>My Next Step</h1>
    <p style={{...F,fontSize:17,color:C.t2,lineHeight:1.6,maxWidth:310,margin:"0 auto 44px"}}>Your AI guide that turns goals into clear, actionable steps.</p>
    <div ref={gRef} style={{display:"flex",justifyContent:"center",marginBottom:14}} />
    <div style={{display:"flex",alignItems:"center",gap:16,margin:"22px 0"}}><div style={{flex:1,height:1,background:C.b1}}/><span style={{...F,fontSize:12,color:C.t3}}>or</span><div style={{flex:1,height:1,background:C.b1}}/></div>
    <button onClick={()=>setMode("email")} style={{...F,width:"100%",padding:"15px",borderRadius:16,fontSize:15,fontWeight:500,background:C.card,color:C.t2,border:`1.5px solid ${C.b2}`,cursor:"pointer",boxShadow:C.shadow}}>Sign up with email</button>
  </div></FadeIn></div>);
}
