import { memo } from "react";
import { X, Heart } from "lucide-react";
import { F, C } from "../lib/constants.js";

// Sponsor cards that blend into the step feed
// These look like regular cards but are from partners
const SPONSOR_CARDS = [
  {segment:"wellness",title:"Try ClassPass free for a month",desc:"Access 30,000+ studios worldwide. Yoga, HIIT, pilates and more.",link:"https://classpass.com/?utm_source=mynextstep&utm_medium=app",brand:"ClassPass",color:"#00B4D8"},
  {segment:"wellness",title:"Mindvalley: 30-day meditation challenge",desc:"Guided programs from world-class teachers. Start free.",link:"https://www.mindvalley.com/?utm_source=mynextstep",brand:"Mindvalley",color:"#7C3AED"},
  {segment:"adventure",title:"Save 15% on your next Airbnb",desc:"Find unique stays anywhere in the world.",link:"https://airbnb.com/?utm_source=mynextstep&utm_medium=app",brand:"Airbnb",color:"#FF385C"},
  {segment:"adventure",title:"Book flights from $49 on Kayak",desc:"Compare hundreds of airlines. Find the cheapest fare.",link:"https://kayak.com/?utm_source=mynextstep&utm_medium=app",brand:"Kayak",color:"#FF690F"},
  {segment:"adventure",title:"Eventbrite: Discover events near you",desc:"Concerts, food festivals, workshops and more.",link:"https://eventbrite.com/?utm_source=mynextstep&utm_medium=app",brand:"Eventbrite",color:"#F05537"},
  {segment:"career",title:"LinkedIn Learning: Free first month",desc:"Build skills with 16,000+ courses. Tech, business, creative.",link:"https://www.linkedin.com/learning/?utm_source=mynextstep",brand:"LinkedIn Learning",color:"#0A66C2"},
  {segment:"career",title:"Udemy: Top courses from $9.99",desc:"Learn anything. Programming, marketing, design and more.",link:"https://udemy.com/?utm_source=mynextstep&utm_medium=app",brand:"Udemy",color:"#A435F0"},
];

// Pick a relevant sponsor card for the current segment
function pickSponsor(segment) {
  const relevant = SPONSOR_CARDS.filter(s => s.segment === segment);
  if (relevant.length === 0) return SPONSOR_CARDS[Math.floor(Math.random() * SPONSOR_CARDS.length)];
  return relevant[Math.floor(Math.random() * relevant.length)];
}

// Sponsor card that looks like a step card
export const SponsorCard = memo(function SponsorCard({segment}) {
  const sponsor = pickSponsor(segment);
  return (
    <a href={sponsor.link} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block",padding:"16px 20px",borderRadius:18,marginBottom:10,background:C.card,boxShadow:C.shadow,borderLeft:"4px solid "+sponsor.color}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{...F,fontSize:9,fontWeight:700,color:sponsor.color,textTransform:"uppercase",letterSpacing:1.5}}>Sponsored</span>
        <span style={{...F,fontSize:10,color:C.t3}}>{sponsor.brand}</span>
      </div>
      <div style={{...F,fontSize:15,fontWeight:600,color:C.t1,lineHeight:1.4,marginBottom:4}}>{sponsor.title}</div>
      <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.55}}>{sponsor.desc}</div>
    </a>
  );
});

// Small banner ad between sections
export const AdBanner = memo(function AdBanner({tier}) {
  if (tier === "pro") return null;
  return (
    <div style={{padding:"10px 16px",borderRadius:12,marginBottom:12,background:C.cream,border:"1px solid "+C.b1,textAlign:"center"}}>
      <div style={{...F,fontSize:11,color:C.t3,marginBottom:4}}>Support My Next Step</div>
      <a href="https://mynextstep.app/pro" style={{...F,fontSize:13,fontWeight:600,color:C.acc,textDecoration:"none"}}>Go Pro for ad-free experience</a>
    </div>
  );
});

// "Why ads?" explainer component
export const AdExplainer = memo(function AdExplainer({onClose}) {
  return (
    <div style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow,marginBottom:12,border:"1px solid "+C.b1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{...F,fontSize:14,fontWeight:600,color:C.t1,marginBottom:6}}>Why am I seeing this?</div>
        {onClose ? <button onClick={onClose} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={14}/></button> : null}
      </div>
      <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.6}}>
        My Next Step is free because of our partners. These recommendations are from brands we trust. Going Pro removes all ads and gives you access to our most powerful AI.
      </div>
    </div>
  );
});

export default SponsorCard;
