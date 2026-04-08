import { X, Footprints, Map, RotateCcw, MessageCircle, Calendar, Heart, ThumbsDown, Share2 } from "lucide-react";
import { H, F, C } from "../lib/constants.js";

export default function HelpModal({onClose}) {

  function renderSection(icon, title, desc, items) {
    return (
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:36,height:36,borderRadius:12,background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
          <div style={{...H,fontSize:18,color:C.t1}}>{title}</div>
        </div>
        <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,marginBottom:10}}>{desc}</div>
        {items ? <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {items.map(function(item,i){
            return <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:12,background:C.cream}}>
              <div style={{flexShrink:0,marginTop:2}}>{item.icon}</div>
              <div><div style={{...F,fontSize:13,fontWeight:600,color:C.t1}}>{item.label}</div><div style={{...F,fontSize:12,color:C.t3,marginTop:2}}>{item.desc}</div></div>
            </div>;
          })}
        </div> : null}
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}} style={{width:"100%",maxWidth:500,maxHeight:"85vh",overflowY:"auto",background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{...H,fontSize:24,color:C.t1}}>How it works</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={18}/></button>
        </div>

        <div style={{...F,fontSize:15,color:C.t2,lineHeight:1.7,marginBottom:28}}>
          My Next Step is your AI-powered life guide. Tell it what you want to do and it creates actionable cards you can act on right away.
        </div>

        {renderSection(
          <Footprints size={18} color={C.acc}/>,
          "Steps",
          "A step is a single, specific action you can take. It has a title, a reason why, and usually a link to get it done. Steps are the building blocks of your progress.",
          [
            {icon:<Heart size={14} color="#DC2626"/>,label:"Heart",desc:"Love a step to save it to favorites and get more like it"},
            {icon:<ThumbsDown size={14} color={C.t3}/>,label:"Not my thing",desc:"Tells the AI to avoid recommending similar items"},
            {icon:<Calendar size={14} color="#4285F4"/>,label:"Book it",desc:"Adds to your calendar and marks it as booked"},
            {icon:<Share2 size={14} color={C.t2}/>,label:"Share",desc:"Send to friends via text, social media, or copy link"},
          ]
        )}

        {renderSection(
          <Map size={18} color={C.acc}/>,
          "Paths",
          "A path is a multi-step plan with a timeline. Think trip itineraries, workout programs, or project plans. Each path has tasks you can check off as you go.",
          null
        )}

        {renderSection(
          <RotateCcw size={18} color={C.acc}/>,
          "Habits",
          "A habit is a recurring activity — weekly workouts, Saturday adventures, daily meditation. The AI generates fresh content for each occurrence and can add them to your calendar automatically.",
          null
        )}

        <div style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:12,background:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><MessageCircle size={18} color={C.acc}/></div>
            <div style={{...H,fontSize:18,color:C.t1}}>The Guide</div>
          </div>
          <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6}}>
            Your AI guide lives in the Guide tab. Just tell it what you want — "plan a trip to Florence", "find a restaurant tonight", "build me a workout plan" — and it creates steps, paths, or habits for you. It searches the web for real options with prices and booking links.
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <div style={{...H,fontSize:18,color:C.t1,marginBottom:10}}>3 segments</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{padding:"12px 16px",borderRadius:12,borderLeft:"4px solid #6D28D9",background:"#EDE9FE"}}>
              <div style={{...F,fontSize:14,fontWeight:600,color:"#6D28D9"}}>Career</div>
              <div style={{...F,fontSize:12,color:C.t2}}>Work, professional growth, courses, networking</div>
            </div>
            <div style={{padding:"12px 16px",borderRadius:12,borderLeft:"4px solid #0F766E",background:"#E6F7F5"}}>
              <div style={{...F,fontSize:14,fontWeight:600,color:"#0F766E"}}>Wellness</div>
              <div style={{...F,fontSize:12,color:C.t2}}>Fitness, nutrition, self-care, doctors, mental health</div>
            </div>
            <div style={{padding:"12px 16px",borderRadius:12,borderLeft:"4px solid #D97706",background:"#FEF3C7"}}>
              <div style={{...F,fontSize:14,fontWeight:600,color:"#D97706"}}>Adventure</div>
              <div style={{...F,fontSize:12,color:C.t2}}>Travel, friends, events, dining, hobbies, fun</div>
            </div>
          </div>
        </div>

        <div style={{padding:16,borderRadius:14,background:C.cream}}>
          <div style={{...F,fontSize:13,fontWeight:600,color:C.t1,marginBottom:6}}>Tips</div>
          <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.7}}>
            Be specific — "find me a sushi restaurant near downtown for tonight under $50" works better than "dinner ideas".
            {"\n\n"}
            Say "I don't like these" to get fresh options. Say "make it better" to upgrade a step.
            {"\n\n"}
            Fill out your profile in Settings for more personalized recommendations.
          </div>
        </div>
      </div>
    </div>
  );
}
