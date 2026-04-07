import { X, Check, Sparkles, Zap, Shield } from "lucide-react";
import { H, F, C } from "../lib/constants.js";

// Regional pricing based on purchasing power parity
// Stripe handles currency conversion, we just show the right price
const REGIONAL_PRICES = {
  US: {price:"$9.99",currency:"USD"},
  GB: {price:"\u00A37.99",currency:"GBP"},
  EU: {price:"\u20AC8.99",currency:"EUR"},
  CA: {price:"CA$12.99",currency:"CAD"},
  AU: {price:"AU$14.99",currency:"AUD"},
  IN: {price:"\u20B9299",currency:"INR"},
  BR: {price:"R$29.90",currency:"BRL"},
  MX: {price:"MX$149",currency:"MXN"},
  JP: {price:"\u00A5980",currency:"JPY"},
  KR: {price:"\u20A99,900",currency:"KRW"},
  PH: {price:"\u20B1399",currency:"PHP"},
  NG: {price:"\u20A62,999",currency:"NGN"},
  ZA: {price:"R149",currency:"ZAR"},
  DEFAULT: {price:"$9.99",currency:"USD"},
};

function getRegionalPrice() {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("America/New_York") || tz.includes("America/Chicago") || tz.includes("America/Denver") || tz.includes("America/Los_Angeles")) return REGIONAL_PRICES.US;
    if (tz.includes("Europe/London")) return REGIONAL_PRICES.GB;
    if (tz.includes("Europe/")) return REGIONAL_PRICES.EU;
    if (tz.includes("America/Toronto") || tz.includes("America/Vancouver")) return REGIONAL_PRICES.CA;
    if (tz.includes("Australia/")) return REGIONAL_PRICES.AU;
    if (tz.includes("Asia/Kolkata") || tz.includes("Asia/Calcutta")) return REGIONAL_PRICES.IN;
    if (tz.includes("America/Sao_Paulo")) return REGIONAL_PRICES.BR;
    if (tz.includes("America/Mexico_City")) return REGIONAL_PRICES.MX;
    if (tz.includes("Asia/Tokyo")) return REGIONAL_PRICES.JP;
    if (tz.includes("Asia/Seoul")) return REGIONAL_PRICES.KR;
    if (tz.includes("Asia/Manila")) return REGIONAL_PRICES.PH;
    if (tz.includes("Africa/Lagos")) return REGIONAL_PRICES.NG;
    if (tz.includes("Africa/Johannesburg")) return REGIONAL_PRICES.ZA;
  } catch (e) {}
  return REGIONAL_PRICES.DEFAULT;
}

export default function UpgradeModal({onClose, onUpgrade}) {
  var regional = getRegionalPrice();

  var features = [
    {icon: <Zap size={16} color={C.acc}/>, text: "Most powerful AI for better recommendations"},
    {icon: <Shield size={16} color={C.teal}/>, text: "Ad-free experience"},
    {icon: <Sparkles size={16} color="#D97706"/>, text: "Priority web search results"},
    {icon: <Check size={16} color="#6D28D9"/>, text: "Support independent development"},
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}} style={{width:"100%",maxWidth:400,background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg,textAlign:"center"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={18}/></button>

        <div style={{width:56,height:56,borderRadius:18,margin:"0 auto 16px",background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={28} color="#fff"/></div>
        <div style={{...H,fontSize:24,color:C.t1,marginBottom:4}}>Go Pro</div>
        <div style={{...F,fontSize:14,color:C.t2,marginBottom:24}}>Unlock the full My Next Step experience</div>

        <div style={{textAlign:"left",marginBottom:24}}>
          {features.map(function(f, i) {
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i < features.length-1 ? "1px solid "+C.b1 : "none"}}>
                <div style={{width:32,height:32,borderRadius:10,background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{f.icon}</div>
                <span style={{...F,fontSize:14,color:C.t1}}>{f.text}</span>
              </div>
            );
          })}
        </div>

        <div style={{...H,fontSize:32,color:C.t1,marginBottom:4}}>{regional.price}<span style={{...F,fontSize:14,color:C.t3,fontWeight:400}}>/month</span></div>
        <div style={{...F,fontSize:12,color:C.t3,marginBottom:20}}>Cancel anytime.</div>

        <button onClick={function(){if(onUpgrade)onUpgrade(regional.currency);}} style={{...F,width:"100%",padding:"16px",borderRadius:16,border:"none",fontSize:16,fontWeight:600,cursor:"pointer",background:C.accGrad,color:"#fff",boxShadow:"0 4px 16px rgba(212,82,42,0.3)",marginBottom:12}}>Upgrade to Pro</button>
        <button onClick={onClose} style={{...F,fontSize:13,color:C.t3,background:"none",border:"none",cursor:"pointer",padding:8}}>Maybe later</button>
      </div>
    </div>
  );
}
