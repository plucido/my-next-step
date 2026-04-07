import { useState, useRef, useEffect } from "react";
import { Search, X, Footprints, Map, RotateCcw, Check, Heart } from "lucide-react";
import { H, F, C, SEGMENTS } from "../lib/constants.js";
import { catToSeg, catIcon } from "../lib/utils.jsx";

export default function SearchModal({allSteps, allPlans, allRoutines, onClose, onNavigate}) {
  var [query, setQuery] = useState("");
  var inputRef = useRef(null);

  useEffect(function() {
    setTimeout(function(){ if(inputRef.current) inputRef.current.focus(); }, 100);
  }, []);

  var q = query.toLowerCase().trim();
  var results = [];

  if (q.length >= 2) {
    allSteps.forEach(function(s) {
      var match = (s.title||"").toLowerCase().includes(q) || (s.why||"").toLowerCase().includes(q) || (s.category||"").toLowerCase().includes(q);
      if (match) results.push({type:"step", item:s, title:s.title, sub:s.why||s.category||"", status:s.status, seg:catToSeg(s.category)});
    });
    allPlans.forEach(function(p) {
      var match = (p.title||"").toLowerCase().includes(q) || (p.tasks||[]).some(function(t){return (t.title||"").toLowerCase().includes(q);});
      if (match) {
        var done = (p.tasks||[]).filter(function(t){return t.done;}).length;
        var total = (p.tasks||[]).length;
        results.push({type:"journey", item:p, title:p.title, sub:p.date||(done+"/"+total+" tasks"), seg:"adventure"});
      }
    });
    allRoutines.forEach(function(r) {
      var match = (r.title||"").toLowerCase().includes(q) || (r.description||"").toLowerCase().includes(q) || (r.category||"").toLowerCase().includes(q);
      if (match) results.push({type:"routine", item:r, title:r.title, sub:r.schedule+(r.paused?" (paused)":""), seg:catToSeg(r.category)});
    });
  }

  function renderIcon(type) {
    if (type === "step") return <Footprints size={14}/>;
    if (type === "journey") return <Map size={14}/>;
    return <RotateCcw size={14}/>;
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60,padding:"60px 20px 20px"}} onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}} style={{width:"100%",maxWidth:480,background:C.card,borderRadius:20,boxShadow:C.shadowLg,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:"1px solid "+C.b1}}>
          <Search size={18} color={C.t3}/>
          <input ref={inputRef} value={query} onChange={function(e){setQuery(e.target.value);}} placeholder="Search steps, journeys, routines..." style={{...F,flex:1,fontSize:16,border:"none",outline:"none",background:"transparent",color:C.t1}}/>
          {query?<button onClick={function(){setQuery("");}} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={16}/></button>:null}
        </div>
        <div style={{maxHeight:400,overflowY:"auto"}}>
          {q.length < 2 ? <div style={{padding:24,textAlign:"center",...F,fontSize:14,color:C.t3}}>Type to search...</div>
          : results.length === 0 ? <div style={{padding:24,textAlign:"center",...F,fontSize:14,color:C.t3}}>No results for "{query}"</div>
          : results.slice(0,20).map(function(r, i) {
            var seg = SEGMENTS[r.seg];
            var color = seg ? seg.color : C.acc;
            return (
              <button key={r.type+"-"+i} onClick={function(){if(onNavigate)onNavigate(r);onClose();}} style={{...F,width:"100%",padding:"12px 18px",background:"transparent",border:"none",borderBottom:"1px solid "+C.b1,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                <div style={{width:32,height:32,borderRadius:10,background:seg?seg.soft:C.accSoft,display:"flex",alignItems:"center",justifyContent:"center",color:color,flexShrink:0}}>{renderIcon(r.type)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</div>
                  <div style={{fontSize:12,color:C.t3,marginTop:1,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{textTransform:"capitalize"}}>{r.type}</span>
                    {r.status==="done"?<span style={{color:C.teal}}><Check size={12}/> Done</span>:null}
                    {r.item?.loved?<span style={{color:"#DC2626"}}><Heart size={12}/></span>:null}
                    {r.sub?<span>{r.sub}</span>:null}
                  </div>
                </div>
                <div style={{width:8,height:8,borderRadius:4,background:color,flexShrink:0}}>{null}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
