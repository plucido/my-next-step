import { useState, useEffect, useRef } from "react";
import { C, F, H } from "../lib/constants.js";
import { FadeIn, Logo } from "../lib/utils.jsx";
import { loadGSI, decJwt } from "../lib/auth.js";
import { Footprints, Sparkles, Calendar, Heart } from "lucide-react";

export default function AuthScreen({onAuth}){
  const[mode,setMode]=useState("landing");
  const[email,setEmail]=useState("");
  const[name,setName]=useState("");
  const gRef=useRef(null);

  useEffect(function(){
    var c=import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if(!c||mode!=="landing")return;
    loadGSI().then(function(){
      if(!window.google?.accounts?.id)return;
      window.google.accounts.id.initialize({client_id:c,callback:function(r){
        var u=decJwt(r.credential);
        if(u)onAuth({name:u.given_name||u.name||"User",email:u.email,method:"google"});
      }});
      if(gRef.current)window.google.accounts.id.renderButton(gRef.current,{type:"standard",theme:"outline",size:"large",width:380,text:"continue_with",shape:"pill"});
    });
  },[mode]);

  var inp={...F,width:"100%",padding:"15px 18px",fontSize:15,borderRadius:16,border:"1.5px solid "+C.b2,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"};

  var features = [
    {icon:<Footprints size={18} color={C.acc}/>,text:"AI-powered steps tailored to your goals"},
    {icon:<Calendar size={18} color={C.teal}/>,text:"Smart calendar integration"},
    {icon:<Heart size={18} color="#DB2777"/>,text:"Learns your preferences over time"},
    {icon:<Sparkles size={18} color="#D97706"/>,text:"Career, wellness & adventure"},
  ];

  if(mode==="email") return (
    <div style={{...F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}>
      <FadeIn>
        <div style={{width:"100%",maxWidth:400}}>
          <button onClick={function(){setMode("landing");}} style={{...F,background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:14,marginBottom:28}}>{"\u2190"} Back</button>
          <h2 style={{...H,fontSize:32,color:C.t1,marginBottom:28}}>Create your account</h2>
          <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Your name</label>
          <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="First name" style={{...inp,marginBottom:18}} />
          <label style={{...F,fontSize:12,color:C.t3,display:"block",marginBottom:8}}>Email</label>
          <input value={email} onChange={function(e){setEmail(e.target.value);}} placeholder="you@email.com" type="email" style={{...inp,marginBottom:28}} />
          <button onClick={function(){if(name.trim()&&email.includes("@"))onAuth({name:name.trim(),email:email,method:"email"});}} disabled={!name.trim()||!email.includes("@")} style={{...F,width:"100%",padding:"16px",borderRadius:16,fontSize:16,fontWeight:600,border:"none",cursor:name.trim()&&email.includes("@")?"pointer":"default",background:name.trim()&&email.includes("@")?C.accGrad:"rgba(0,0,0,0.04)",color:name.trim()&&email.includes("@")?"#fff":C.t3}}>Create account {"\u2192"}</button>
        </div>
      </FadeIn>
    </div>
  );

  return (
    <div style={{...F,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}>
      <FadeIn>
        <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
          <div style={{width:80,height:80,borderRadius:24,margin:"0 auto 28px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 12px 36px rgba(212,82,42,0.25)"}}><Logo size={42} color="#fff"/></div>
          <h1 style={{...H,fontSize:42,color:C.t1,lineHeight:1.05,marginBottom:12,letterSpacing:"-0.5px"}}>My Next Step</h1>
          <p style={{...F,fontSize:17,color:C.t2,lineHeight:1.6,maxWidth:320,margin:"0 auto 36px"}}>Your AI guide that turns goals into clear, actionable steps.</p>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:36,textAlign:"left"}}>
            {features.map(function(f,i){
              return (
                <FadeIn key={i} delay={200+i*100}>
                  <div style={{padding:"14px 16px",borderRadius:14,background:C.card,boxShadow:C.shadow,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flexShrink:0}}>{f.icon}</div>
                    <span style={{...F,fontSize:12,color:C.t2,lineHeight:1.4}}>{f.text}</span>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <div ref={gRef} style={{display:"flex",justifyContent:"center",marginBottom:14}} />
          <div style={{display:"flex",alignItems:"center",gap:16,margin:"18px 0"}}><div style={{flex:1,height:1,background:C.b1}}/><span style={{...F,fontSize:12,color:C.t3}}>or</span><div style={{flex:1,height:1,background:C.b1}}/></div>
          <button onClick={function(){setMode("email");}} style={{...F,width:"100%",padding:"15px",borderRadius:16,fontSize:15,fontWeight:500,background:C.card,color:C.t2,border:"1.5px solid "+C.b2,cursor:"pointer",boxShadow:C.shadow}}>Sign up with email</button>

          <p style={{...F,fontSize:11,color:C.t3,marginTop:24,lineHeight:1.6}}>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </FadeIn>
    </div>
  );
}
