import { memo, useEffect, useRef } from "react";
import { Heart, X, Sparkles } from "lucide-react";
import { F, C } from "../lib/constants.js";

// Google AdSense ad unit component
// Requires: <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX" crossorigin="anonymous"></script> in index.html
// Set VITE_ADSENSE_CLIENT in env vars

function GoogleAd({slot, format, style: sx}) {
  const adRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {}
  }, []);

  return (
    <div ref={adRef} style={sx}>
      <ins className="adsbygoogle"
        style={{display:"block",...(sx||{})}}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-0000000000000000"}
        data-ad-slot={slot}
        data-ad-format={format || "auto"}
        data-full-width-responsive="true"
      >{null}</ins>
    </div>
  );
}

// Partner sponsor cards — our direct affiliate partners
// These are clearly marked as partner content and support the app
const SPONSOR_CARDS = [
  {segment:"wellness",title:"Try ClassPass free for a month",desc:"30,000+ studios. Yoga, HIIT, pilates.",link:"https://classpass.com/?utm_source=mynextstep&utm_medium=app",brand:"ClassPass",color:"#00B4D8"},
  {segment:"wellness",title:"Mindvalley: Start meditating today",desc:"Guided programs from world-class teachers.",link:"https://www.mindvalley.com/?utm_source=mynextstep",brand:"Mindvalley",color:"#7C3AED"},
  {segment:"adventure",title:"Save on your next Airbnb",desc:"Find unique stays anywhere in the world.",link:"https://airbnb.com/?utm_source=mynextstep&utm_medium=app",brand:"Airbnb",color:"#FF385C"},
  {segment:"adventure",title:"Compare flights on Kayak",desc:"Hundreds of airlines. Find the cheapest fare.",link:"https://kayak.com/?utm_source=mynextstep&utm_medium=app",brand:"Kayak",color:"#FF690F"},
  {segment:"adventure",title:"Discover events on Eventbrite",desc:"Concerts, food festivals, workshops near you.",link:"https://eventbrite.com/?utm_source=mynextstep&utm_medium=app",brand:"Eventbrite",color:"#F05537"},
  {segment:"career",title:"LinkedIn Learning: Free first month",desc:"16,000+ courses. Tech, business, creative.",link:"https://www.linkedin.com/learning/?utm_source=mynextstep",brand:"LinkedIn Learning",color:"#0A66C2"},
  {segment:"career",title:"Level up with Masterclass",desc:"Learn from the world's best. All access.",link:"https://masterclass.com/?utm_source=mynextstep&utm_medium=app",brand:"Masterclass",color:"#000"},
];

function pickSponsor(segment) {
  const relevant = SPONSOR_CARDS.filter(s => s.segment === segment);
  if (relevant.length === 0) return SPONSOR_CARDS[Math.floor(Math.random() * SPONSOR_CARDS.length)];
  return relevant[Math.floor(Math.random() * relevant.length)];
}

// Sponsor card — clearly marked as ad with support message
// Shows real sponsor if available, otherwise demo placeholder
export const SponsorCard = memo(function SponsorCard({segment, onUpgrade}) {
  const sponsor = pickSponsor(segment);
  const isDemo = !import.meta.env.VITE_ADS_LIVE;
  return (
    <div style={{marginBottom:10}}>
      <div style={{...F,fontSize:10,color:C.t3,marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
        <Heart size={10} color={C.acc}/>
        <span>{isDemo ? "Ad space — partner ads will appear here" : "Clicking supports My Next Step — thank you!"}</span>
        {onUpgrade ? <span onClick={onUpgrade} style={{marginLeft:"auto",color:C.acc,cursor:"pointer",fontWeight:600}}>Go ad-free</span> : null}
      </div>
      <a href={isDemo ? "#" : sponsor.link} target={isDemo ? "_self" : "_blank"} rel="noopener noreferrer" onClick={isDemo ? (e) => e.preventDefault() : undefined} style={{textDecoration:"none",display:"block",padding:"14px 18px",borderRadius:16,background:C.cream,border:"1.5px dashed "+C.b2,opacity:isDemo?0.7:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{...F,fontSize:9,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,background:C.card,padding:"2px 8px",borderRadius:4}}>AD</span>
          <span style={{...F,fontSize:11,fontWeight:600,color:isDemo?C.t3:sponsor.color}}>{isDemo?"Partner Ad":sponsor.brand}</span>
        </div>
        <div style={{...F,fontSize:14,fontWeight:600,color:C.t1,lineHeight:1.4}}>{sponsor.title}</div>
        <div style={{...F,fontSize:12,color:C.t2,marginTop:2}}>{sponsor.desc}</div>
        {isDemo ? <div style={{...F,fontSize:10,color:C.t3,marginTop:6,fontStyle:"italic"}}>Demo — set VITE_ADS_LIVE=true when sponsors are confirmed</div> : null}
      </a>
    </div>
  );
});

// Bottom sticky banner — sits above the chat input, uses dead space
// Shows a Google Ad or partner ad in the bottom bar area
export const BottomBanner = memo(function BottomBanner({tier, onUpgrade}) {
  if (tier === "pro") return null;
  return (
    <div style={{padding:"6px 20px",flexShrink:0,borderTop:"1px solid "+C.b1,background:C.bg}}>
      <div style={{borderRadius:10,overflow:"hidden",background:C.cream,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1,minHeight:50}}>
          <GoogleAd slot="BOTTOM_BANNER_SLOT" format="horizontal" style={{minHeight:50}}/>
        </div>
        <button onClick={onUpgrade} style={{...F,fontSize:10,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>Remove ads</button>
      </div>
    </div>
  );
});

// Calendar sidebar ad — fits next to the mini calendar
export const CalendarAd = memo(function CalendarAd({tier}) {
  if (tier === "pro") return null;
  return (
    <div style={{marginTop:12,borderRadius:14,overflow:"hidden",background:C.cream,padding:8}}>
      <div style={{...F,fontSize:9,color:C.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:4,textAlign:"center"}}>Ad</div>
      <GoogleAd slot="CALENDAR_SIDEBAR_SLOT" format="rectangle" style={{minHeight:200}}/>
    </div>
  );
});

// Inline feed ad — goes between steps
export const InlineFeedAd = memo(function InlineFeedAd({tier}) {
  if (tier === "pro") return null;
  return (
    <div style={{marginBottom:10,borderRadius:14,overflow:"hidden",background:C.cream,padding:8}}>
      <div style={{...F,fontSize:9,color:C.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Ad</div>
      <GoogleAd slot="INLINE_FEED_SLOT" format="fluid" style={{minHeight:100}}/>
    </div>
  );
});

export default SponsorCard;
