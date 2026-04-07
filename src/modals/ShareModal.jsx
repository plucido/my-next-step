import { X, Copy, Check, MessageCircle } from "lucide-react";
import { C, F, H } from "../lib/constants.js";
import { useState } from "react";

export default function ShareModal({item, onClose}) {
  const [copied, setCopied] = useState(false);
  if (!item) return null;

  var isJourney = !!item.tasks;
  var text = isJourney
    ? "Check out this journey: " + item.title + (item.date ? "\nDate: " + item.date : "") + "\nTasks:\n" + (item.tasks || []).map(function(t){return "- " + t.title;}).join("\n") + "\n\nPlanned with My Next Step"
    : item.title + (item.why ? " - " + item.why : "") + (item.time ? "\nWhen: " + item.time : "") + (item.link ? "\n" + item.link : "") + "\n\nShared from My Next Step";

  var encodedText = encodeURIComponent(text);
  var encodedTitle = encodeURIComponent(item.title || "My Next Step");
  var encodedUrl = encodeURIComponent(item.link || "https://mynextstep.app");

  function copyText() {
    navigator.clipboard.writeText(text).then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2000);}).catch(function(){});
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({title: item.title, text: text}).catch(function(){});
    }
  }

  var socials = [
    {name:"iMessage",color:"#34C759",icon:"\uD83D\uDCAC",url:"sms:&body="+encodedText},
    {name:"WhatsApp",color:"#25D366",icon:"\uD83D\uDFE2",url:"https://wa.me/?text="+encodedText},
    {name:"X / Twitter",color:"#000",icon:"\u2715",url:"https://twitter.com/intent/tweet?text="+encodedText},
    {name:"Facebook",color:"#1877F2",icon:"f",url:"https://www.facebook.com/sharer/sharer.php?quote="+encodedText},
    {name:"LinkedIn",color:"#0A66C2",icon:"in",url:"https://www.linkedin.com/sharing/share-offsite/?url="+encodedUrl},
    {name:"Email",color:"#EA4335",icon:"\u2709",url:"mailto:?subject="+encodedTitle+"&body="+encodedText},
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:0}} onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}} style={{width:"100%",maxWidth:480,background:C.card,borderRadius:"24px 24px 0 0",padding:"20px 24px 32px",boxShadow:C.shadowLg}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.b2,margin:"0 auto 16px"}}>{null}</div>
        <div style={{...F,fontSize:16,fontWeight:600,color:C.t1,marginBottom:4}}>Share</div>
        <div style={{...F,fontSize:13,color:C.t3,marginBottom:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:20}}>
          {socials.map(function(s){
            return (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" onClick={function(e){if(s.url.startsWith("sms:")){return;}}} style={{textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"}}>
                <div style={{width:48,height:48,borderRadius:14,background:s.color+"15",display:"flex",alignItems:"center",justifyContent:"center",...F,fontSize:18,fontWeight:700,color:s.color}}>{s.icon}</div>
                <span style={{...F,fontSize:10,color:C.t2,textAlign:"center"}}>{s.name}</span>
              </a>
            );
          })}
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={copyText} style={{...F,flex:1,padding:"12px 16px",borderRadius:14,border:"1px solid "+C.b2,background:copied?C.tealSoft:C.bg,color:copied?C.teal:C.t1,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}>
            {copied ? <Check size={16}/> : <Copy size={16}/>}
            {copied ? "Copied!" : "Copy text"}
          </button>
          {navigator.share ? <button onClick={nativeShare} style={{...F,flex:1,padding:"12px 16px",borderRadius:14,border:"none",background:C.accGrad,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <MessageCircle size={16}/> More options
          </button> : null}
        </div>
      </div>
    </div>
  );
}
