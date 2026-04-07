import { useState } from "react";
import { ChevronRight, ChevronLeft, MessageCircle, Footprints, Calendar, Sparkles } from "lucide-react";
import { H, F, C, SEGMENTS } from "../lib/constants.js";
import { FadeIn, Logo } from "../lib/utils.jsx";

var slides = [
  {
    icon: function() { return <Logo size={56}/>; },
    title: "Welcome to My Next Step",
    subtitle: "Your AI-powered life guide for career, wellness, and adventure.",
    render: function() {
      return (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,marginTop:20}}>
          <div style={{display:"flex",gap:10}}>
            {["career","wellness","adventure"].map(function(k) {
              return (
                <div key={k} style={{padding:"8px 16px",borderRadius:20,background:SEGMENTS[k].soft,color:SEGMENTS[k].color,...F,fontSize:13,fontWeight:600}}>
                  {SEGMENTS[k].label}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  },
  {
    icon: function() { return <MessageCircle size={40} color={C.acc} strokeWidth={1.5}/>; },
    title: "Tell your guide what you want",
    subtitle: "Chat naturally about anything you want to do, try, or improve.",
    render: function() {
      return (
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10,maxWidth:300,margin:"16px auto 0"}}>
          <div style={{alignSelf:"flex-end",background:C.accSoft,borderRadius:"16px 16px 4px 16px",padding:"10px 16px",...F,fontSize:13,color:C.t1}}>
            I want to start running this week
          </div>
          <div style={{alignSelf:"flex-start",background:C.cream,borderRadius:"16px 16px 16px 4px",padding:"10px 16px",...F,fontSize:13,color:C.t2}}>
            Nice! Here is a plan to get you going...
          </div>
        </div>
      );
    }
  },
  {
    icon: function() { return <Footprints size={40} color={C.acc} strokeWidth={1.5}/>; },
    title: "Get actionable steps",
    subtitle: "Every recommendation becomes a card you can act on, save, or share.",
    render: function() {
      return (
        <div style={{marginTop:16,maxWidth:280,margin:"16px auto 0"}}>
          <div style={{background:C.card,border:"1px solid "+C.b1,borderRadius:16,padding:"16px 18px",boxShadow:C.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:8,height:8,borderRadius:4,background:SEGMENTS.wellness.color}}></div>
              <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:0.5}}>Wellness</div>
            </div>
            <div style={{...H,fontSize:15,color:C.t1,marginBottom:4}}>Morning run at Memorial Park</div>
            <div style={{...F,fontSize:12,color:C.t2}}>Free, 3-mile loop, shaded trail</div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <div style={{padding:"6px 14px",borderRadius:10,background:C.accSoft,color:C.acc,...F,fontSize:12,fontWeight:600}}>Done</div>
              <div style={{padding:"6px 14px",borderRadius:10,background:C.cream,color:C.t2,...F,fontSize:12,fontWeight:600}}>Save</div>
            </div>
          </div>
        </div>
      );
    }
  },
  {
    icon: function() { return <Calendar size={40} color={C.acc} strokeWidth={1.5}/>; },
    title: "Build routines & journeys",
    subtitle: "Create recurring habits and multi-step plans to reach your goals.",
    render: function() {
      return (
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10,maxWidth:280,margin:"16px auto 0"}}>
          <div style={{background:C.card,border:"1px solid "+C.b1,borderRadius:14,padding:"14px 16px",boxShadow:C.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Sparkles size={14} color="#D97706"/>
              <div style={{...F,fontSize:11,color:"#D97706",fontWeight:600,textTransform:"uppercase"}}>Routine</div>
            </div>
            <div style={{...H,fontSize:14,color:C.t1,marginTop:6}}>Weekly Upper Body Day</div>
            <div style={{...F,fontSize:12,color:C.t3,marginTop:2}}>Every Monday</div>
          </div>
          <div style={{background:C.card,border:"1px solid "+C.b1,borderRadius:14,padding:"14px 16px",boxShadow:C.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Calendar size={14} color={C.teal}/>
              <div style={{...F,fontSize:11,color:C.teal,fontWeight:600,textTransform:"uppercase"}}>Journey</div>
            </div>
            <div style={{...H,fontSize:14,color:C.t1,marginTop:6}}>Florence Getaway</div>
            <div style={{...F,fontSize:12,color:C.t3,marginTop:2}}>3 of 5 tasks done</div>
          </div>
        </div>
      );
    }
  }
];

export default function Walkthrough({ onComplete }) {
  var [slide, setSlide] = useState(0);
  var current = slides[slide];
  var isLast = slide === slides.length - 1;

  function handleNext() {
    if (isLast) {
      onComplete();
    } else {
      setSlide(slide + 1);
    }
  }

  function handleBack() {
    if (slide > 0) {
      setSlide(slide - 1);
    }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:400,background:C.card,borderRadius:28,padding:"36px 28px 28px",boxShadow:C.shadowLg,textAlign:"center",position:"relative"}}>

        <button onClick={onComplete} style={{position:"absolute",top:16,right:20,background:"none",border:"none",color:C.t3,cursor:"pointer",...F,fontSize:13}}>
          Skip
        </button>

        <FadeIn key={slide}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{marginBottom:20}}>{current.icon()}</div>
            <div style={{...H,fontSize:22,color:C.t1,marginBottom:8}}>{current.title}</div>
            <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,maxWidth:300}}>{current.subtitle}</div>
            {current.render()}
          </div>
        </FadeIn>

        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:28,marginBottom:20}}>
          {slides.map(function(_, i) {
            return (
              <div key={i} style={{width: i === slide ? 20 : 6,height:6,borderRadius:3,background: i === slide ? C.acc : C.b2,transition:"all 0.3s ease"}}></div>
            );
          })}
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          {slide > 0 ? (
            <button onClick={handleBack} style={{padding:"12px 24px",borderRadius:14,border:"1px solid "+C.b2,background:"none",color:C.t2,cursor:"pointer",display:"flex",alignItems:"center",gap:6,...F,fontSize:14,fontWeight:600}}>
              <ChevronLeft size={16}/>
              Back
            </button>
          ) : null}
          <button onClick={handleNext} style={{padding:"12px 32px",borderRadius:14,border:"none",background:C.accGrad,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6,...F,fontSize:14,fontWeight:600,boxShadow:"0 2px 8px rgba(212,82,42,0.3)"}}>
            {isLast ? "Get Started" : "Next"}
            {isLast ? <Sparkles size={16}/> : <ChevronRight size={16}/>}
          </button>
        </div>

      </div>
    </div>
  );
}
