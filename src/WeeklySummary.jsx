import { useState } from "react";
import { X, TrendingUp, Flame, Heart, Calendar, Copy, Check } from "lucide-react";
import { H, F, C, SEGMENTS, SEG_KEYS } from "./constants.js";
import { FadeIn, Logo } from "./utils.jsx";

function getWeekData(allSteps, allPlans, allRoutines) {
  var now = Date.now();
  var weekMs = 7 * 24 * 60 * 60 * 1000;
  var weekAgo = now - weekMs;

  var doneSteps = allSteps.filter(function(s) {
    return s.status === "done" && s.completedAt && new Date(s.completedAt).getTime() > weekAgo;
  });

  var totalWeek = doneSteps.length;

  var bySegment = {};
  SEG_KEYS.forEach(function(k) { bySegment[k] = 0; });
  doneSteps.forEach(function(s) {
    var seg = s.segment || "wellness";
    if (bySegment[seg] !== undefined) {
      bySegment[seg] = bySegment[seg] + 1;
    }
  });

  var journeyTasksDone = 0;
  var activeJourneys = 0;
  allPlans.forEach(function(p) {
    if (!p.tasks) return;
    var done = p.tasks.filter(function(t) { return t.done; }).length;
    if (done > 0) { activeJourneys = activeJourneys + 1; }
    journeyTasksDone = journeyTasksDone + done;
  });

  var routineCompletions = 0;
  allRoutines.forEach(function(r) {
    if (r.lastCompleted && new Date(r.lastCompleted).getTime() > weekAgo) {
      routineCompletions = routineCompletions + (r.completions || 0);
    }
  });

  var loved = allSteps.filter(function(s) { return s.loved; });
  var topLoved = loved.length > 0 ? loved[loved.length - 1] : null;

  var allDone = allSteps.filter(function(s) { return s.status === "done" && s.completedAt; });
  allDone.sort(function(a, b) { return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(); });
  var streak = 0;
  if (allDone.length > 0) {
    var days = {};
    allDone.forEach(function(s) {
      var d = new Date(s.completedAt).toDateString();
      days[d] = true;
    });
    var check = new Date();
    for (var i = 0; i < 365; i++) {
      if (days[check.toDateString()]) {
        streak = streak + 1;
      } else if (i > 0) {
        break;
      }
      check.setDate(check.getDate() - 1);
    }
  }

  var msg = "Keep exploring!";
  if (totalWeek >= 10) { msg = "Unstoppable! You crushed it this week."; }
  else if (totalWeek >= 5) { msg = "Great momentum! You are on fire."; }
  else if (totalWeek >= 3) { msg = "Nice progress! Keep the energy going."; }
  else if (totalWeek >= 1) { msg = "Good start! Every step counts."; }

  return {
    totalWeek: totalWeek,
    bySegment: bySegment,
    journeyTasksDone: journeyTasksDone,
    activeJourneys: activeJourneys,
    routineCompletions: routineCompletions,
    topLoved: topLoved,
    streak: streak,
    msg: msg
  };
}

export default function WeeklySummary({ onClose, allSteps, allPlans, allRoutines, profile }) {
  var data = getWeekData(allSteps, allPlans, allRoutines);
  var [copied, setCopied] = useState(false);

  function handleShare() {
    var name = (profile && profile.name) ? profile.name : "I";
    var lines = [
      "My Week in Review - My Next Step",
      "",
      name + " completed " + data.totalWeek + " steps this week!"
    ];
    SEG_KEYS.forEach(function(k) {
      if (data.bySegment[k] > 0) {
        lines.push("  " + SEGMENTS[k].label + ": " + data.bySegment[k] + " steps");
      }
    });
    if (data.journeyTasksDone > 0) {
      lines.push(data.journeyTasksDone + " journey tasks across " + data.activeJourneys + " journeys");
    }
    if (data.streak > 0) {
      lines.push("Current streak: " + data.streak + " days");
    }
    lines.push("", data.msg);
    var text = lines.join("\n");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  function renderStatCard(icon, label, value, color) {
    return (
      <div style={{background:C.cream,borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:40,height:40,borderRadius:12,background:color || C.accSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
        <div>
          <div style={{...H,fontSize:22,color:C.t1}}>{value}</div>
          <div style={{...F,fontSize:12,color:C.t3,marginTop:2}}>{label}</div>
        </div>
      </div>
    );
  }

  function renderSegmentBar(key) {
    var count = data.bySegment[key];
    if (count === 0) return null;
    var max = Math.max.apply(null, SEG_KEYS.map(function(k) { return data.bySegment[k]; }));
    var pct = max > 0 ? (count / max) * 100 : 0;
    return (
      <div key={key} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
        <div style={{...F,fontSize:13,color:C.t2,width:80}}>{SEGMENTS[key].label}</div>
        <div style={{flex:1,height:8,borderRadius:4,background:C.b1,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:4,background:SEGMENTS[key].color,width:pct+"%",transition:"width 0.5s ease"}}></div>
        </div>
        <div style={{...F,fontSize:13,fontWeight:600,color:SEGMENTS[key].color,minWidth:24,textAlign:"right"}}>{count}</div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <FadeIn>
        <div onClick={function(e){e.stopPropagation();}} style={{width:"100%",maxWidth:440,maxHeight:"85vh",overflowY:"auto",background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Logo size={28} />
              <div style={{...H,fontSize:22,color:C.t1}}>Your Week in Review</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={18}/></button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22}}>
            {renderStatCard(<TrendingUp size={18} color={C.acc}/>, "Steps this week", data.totalWeek, C.accSoft)}
            {renderStatCard(<Flame size={18} color="#D97706"/>, "Day streak", data.streak, C.goldSoft)}
          </div>

          <div style={{marginBottom:22}}>
            <div style={{...F,fontSize:13,fontWeight:600,color:C.t2,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5}}>By segment</div>
            {SEG_KEYS.map(function(k) { return renderSegmentBar(k); })}
            {SEG_KEYS.every(function(k) { return data.bySegment[k] === 0; }) ? (
              <div style={{...F,fontSize:13,color:C.t3,textAlign:"center",padding:10}}>No steps completed yet this week</div>
            ) : null}
          </div>

          {data.journeyTasksDone > 0 ? (
            <div style={{background:C.cream,borderRadius:14,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
              <Calendar size={16} color={C.teal}/>
              <div style={{...F,fontSize:14,color:C.t1}}>
                <span style={{fontWeight:600}}>{data.journeyTasksDone}</span> tasks completed across <span style={{fontWeight:600}}>{data.activeJourneys}</span> {data.activeJourneys === 1 ? "journey" : "journeys"}
              </div>
            </div>
          ) : null}

          {data.routineCompletions > 0 ? (
            <div style={{background:C.cream,borderRadius:14,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
              <Flame size={16} color="#D97706"/>
              <div style={{...F,fontSize:14,color:C.t1}}>
                <span style={{fontWeight:600}}>{data.routineCompletions}</span> routine {data.routineCompletions === 1 ? "completion" : "completions"} this week
              </div>
            </div>
          ) : null}

          {data.topLoved ? (
            <div style={{background:C.accSoft,borderRadius:14,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
              <Heart size={16} color={C.acc} fill={C.acc}/>
              <div>
                <div style={{...F,fontSize:11,color:C.acc,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Top loved step</div>
                <div style={{...F,fontSize:14,color:C.t1,marginTop:2}}>{data.topLoved.title}</div>
              </div>
            </div>
          ) : null}

          <div style={{background:"linear-gradient(135deg, "+C.acc+" 0%, "+C.acc2+" 100%)",borderRadius:14,padding:"16px 18px",marginBottom:20}}>
            <div style={{...H,fontSize:16,color:"#fff"}}>{data.msg}</div>
          </div>

          <button onClick={handleShare} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:copied?C.tealSoft:C.cream,color:copied?C.teal:C.t1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,...F,fontSize:14,fontWeight:600,transition:"all 0.2s"}}>
            {copied ? <Check size={16}/> : <Copy size={16}/>}
            {copied ? "Copied!" : "Share my week"}
          </button>

        </div>
      </FadeIn>
    </div>
  );
}
