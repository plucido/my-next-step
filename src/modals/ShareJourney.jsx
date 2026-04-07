import React, { useState } from "react";
import { X, Check, Send, Link2 } from "lucide-react";
import { C, F, H } from "../lib/constants.js";

function ShareJourney(props) {
  var journey = props.journey;
  var onClose = props.onClose;

  var _s = React.useState("");
  var email = _s[0], setEmail = _s[1];

  var _m = React.useState("I'm working on " + (journey ? journey.title : "") + " and could use your support!");
  var message = _m[0], setMessage = _m[1];

  var _c = React.useState(false);
  var copied = _c[0], setCopied = _c[1];

  var _sent = React.useState(false);
  var sent = _sent[0], setSent = _sent[1];

  if (!journey) return null;

  var done = (journey.tasks || []).filter(function(t){ return t.done; }).length;
  var total = (journey.tasks || []).length;
  var pct = total > 0 ? Math.round((done / total) * 100) : 0;

  var summaryText = "Journey: " + journey.title
    + (journey.date ? "\nDate: " + journey.date : "")
    + "\nProgress: " + done + "/" + total + " tasks done (" + pct + "%)"
    + "\nTasks:\n" + (journey.tasks || []).map(function(t){ return (t.done ? "[x] " : "[ ] ") + t.title; }).join("\n")
    + "\n\nPlanned with My Next Step";

  var encodedText = encodeURIComponent(summaryText);
  var encodedTitle = encodeURIComponent(journey.title || "My Next Step Journey");

  function handleSendInvite() {
    if (!email) return;
    var subject = encodeURIComponent("Join me on my journey: " + journey.title);
    var body = encodeURIComponent(message + "\n\n--- Journey Details ---\n" + summaryText);
    window.open("mailto:" + encodeURIComponent(email) + "?subject=" + subject + "&body=" + body, "_self");
    setSent(true);
    setTimeout(function(){ setSent(false); }, 3000);
  }

  function copyLink() {
    navigator.clipboard.writeText(summaryText).then(function(){
      setCopied(true);
      setTimeout(function(){ setCopied(false); }, 2000);
    }).catch(function(){});
  }

  var socials = [
    {name:"iMessage",color:"#34C759",icon:"\uD83D\uDCAC",url:"sms:&body="+encodedText},
    {name:"WhatsApp",color:"#25D366",icon:"\uD83D\uDFE2",url:"https://wa.me/?text="+encodedText},
    {name:"X / Twitter",color:"#000",icon:"\u2715",url:"https://twitter.com/intent/tweet?text="+encodedText},
    {name:"Facebook",color:"#1877F2",icon:"f",url:"https://www.facebook.com/sharer/sharer.php?quote="+encodedText},
    {name:"LinkedIn",color:"#0A66C2",icon:"in",url:"https://www.linkedin.com/sharing/share-offsite/?url="+encodeURIComponent("https://mynextstep.app")},
    {name:"Email",color:"#EA4335",icon:"\u2709",url:"mailto:?subject="+encodedTitle+"&body="+encodedText},
  ];

  var overlay = {position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:0};
  var panel = {width:"100%",maxWidth:480,background:C.card,borderRadius:"24px 24px 0 0",padding:"20px 24px 32px",boxShadow:C.shadowLg,maxHeight:"90vh",overflowY:"auto"};
  var handle = {width:36,height:4,borderRadius:2,background:C.b2,margin:"0 auto 16px"};
  var inputStyle = {...F,fontSize:13,padding:"10px 14px",borderRadius:12,border:"1px solid "+C.b2,background:C.bg,color:C.t1,width:"100%",boxSizing:"border-box",outline:"none"};

  return (
    React.createElement("div", {style:overlay, onClick:onClose},
      React.createElement("div", {onClick:function(e){e.stopPropagation();}, style:panel},

        React.createElement("div", {style:handle}, null),

        React.createElement("div", {style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}},
          React.createElement("div", {style:{...H,fontSize:18,fontWeight:600,color:C.t1}}, "Share Journey"),
          React.createElement("button", {onClick:onClose, style:{background:"none",border:"none",color:C.t3,cursor:"pointer",padding:4}},
            React.createElement(X, {size:18})
          )
        ),

        React.createElement("div", {style:{...F,fontSize:14,fontWeight:600,color:C.t1,marginTop:8}}, journey.title),
        journey.date ? React.createElement("div", {style:{...F,fontSize:12,color:C.t3,marginTop:2}}, journey.date) : null,

        React.createElement("div", {style:{display:"flex",alignItems:"center",gap:10,marginTop:10,marginBottom:20}},
          React.createElement("div", {style:{flex:1,height:6,background:C.cream,borderRadius:3}},
            React.createElement("div", {style:{height:"100%",width:pct+"%",background:done===total&&total>0?C.teal:C.accGrad,borderRadius:3,transition:"width 0.4s"}})
          ),
          React.createElement("span", {style:{...F,fontSize:12,fontWeight:600,color:done===total&&total>0?C.teal:C.acc}}, done+"/"+total)
        ),

        React.createElement("div", {style:{...F,fontSize:13,fontWeight:600,color:C.t1,marginBottom:10}}, "Invite an accountability partner"),

        React.createElement("input", {
          type:"email",
          placeholder:"Partner's email address",
          value:email,
          onChange:function(e){setEmail(e.target.value);},
          style:{...inputStyle,marginBottom:8}
        }),

        React.createElement("textarea", {
          value:message,
          onChange:function(e){setMessage(e.target.value);},
          rows:3,
          style:{...inputStyle,resize:"vertical",marginBottom:10,lineHeight:1.4}
        }),

        React.createElement("button", {
          onClick:handleSendInvite,
          disabled:!email,
          style:{...F,width:"100%",padding:"11px 16px",borderRadius:12,border:"none",background:email?C.accGrad:C.cream,color:email?"#fff":C.t3,fontSize:13,fontWeight:600,cursor:email?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:20,opacity:email?1:0.6,transition:"all 0.2s"}
        },
          sent ? React.createElement(Check, {size:15}) : React.createElement(Send, {size:15}),
          sent ? "Email client opened!" : "Send invite"
        ),

        React.createElement("div", {style:{height:1,background:C.b1,margin:"0 0 16px"}}),

        React.createElement("button", {
          onClick:copyLink,
          style:{...F,width:"100%",padding:"11px 16px",borderRadius:12,border:"1px solid "+C.b2,background:copied?C.tealSoft:C.bg,color:copied?C.teal:C.t1,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16,transition:"all 0.2s"}
        },
          copied ? React.createElement(Check, {size:15}) : React.createElement(Link2, {size:15}),
          copied ? "Copied!" : "Copy journey summary"
        ),

        React.createElement("div", {style:{...F,fontSize:13,fontWeight:600,color:C.t1,marginBottom:10}}, "Share via"),

        React.createElement("div", {style:{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:8}},
          socials.map(function(s){
            return React.createElement("a", {
              key:s.name,
              href:s.url,
              target:"_blank",
              rel:"noopener noreferrer",
              style:{textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"}
            },
              React.createElement("div", {style:{width:44,height:44,borderRadius:12,background:s.color+"15",display:"flex",alignItems:"center",justifyContent:"center",...F,fontSize:16,fontWeight:700,color:s.color}}, s.icon),
              React.createElement("span", {style:{...F,fontSize:10,color:C.t2,textAlign:"center"}}, s.name)
            );
          })
        )
      )
    )
  );
}

export default ShareJourney;
