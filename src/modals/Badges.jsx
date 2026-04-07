import { X, Award } from "lucide-react";
import { H, F, C, SEG_KEYS } from "../lib/constants.js";
import { FadeIn } from "../lib/utils.jsx";

var BADGE_DEFS = [
  { id: "first_step", emoji: "👣", name: "First Step", desc: "Completed your first step" },
  { id: "getting_started", emoji: "🌱", name: "Getting Started", desc: "Completed 5 steps" },
  { id: "on_a_roll", emoji: "🔥", name: "On a Roll", desc: "Completed 10 steps" },
  { id: "step_master", emoji: "⭐", name: "Step Master", desc: "Completed 25 steps" },
  { id: "legend", emoji: "🏆", name: "Legend", desc: "Completed 50 steps" },
  { id: "explorer", emoji: "🧭", name: "Explorer", desc: "Used all 3 segments" },
  { id: "planner", emoji: "🗺️", name: "Planner", desc: "Created your first journey" },
  { id: "creature_of_habit", emoji: "🔁", name: "Creature of Habit", desc: "Completed a routine 5 times" },
  { id: "streak_3", emoji: "💪", name: "Streak 3", desc: "3-day completion streak" },
  { id: "streak_7", emoji: "🎯", name: "Streak 7", desc: "7-day completion streak" },
  { id: "streak_30", emoji: "👑", name: "Streak 30", desc: "30-day completion streak" }
];

function getStreak(allSteps) {
  var done = allSteps.filter(function(s) { return s.status === "done" && s.completedAt; });
  if (done.length === 0) return 0;
  var days = {};
  done.forEach(function(s) {
    var d = new Date(s.completedAt).toDateString();
    days[d] = true;
  });
  var streak = 0;
  var check = new Date();
  for (var i = 0; i < 365; i++) {
    if (days[check.toDateString()]) {
      streak = streak + 1;
    } else if (i > 0) {
      break;
    }
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export function getBadges(allSteps, allRoutines, allPlans) {
  var done = allSteps.filter(function(s) { return s.status === "done"; });
  var doneCount = done.length;
  var streak = getStreak(allSteps);

  var usedSegments = {};
  allSteps.forEach(function(s) {
    if (s.segment) { usedSegments[s.segment] = true; }
  });
  var segCount = 0;
  SEG_KEYS.forEach(function(k) {
    if (usedSegments[k]) { segCount = segCount + 1; }
  });

  var hasJourney = allPlans.length > 0;

  var maxRoutineCompletions = 0;
  allRoutines.forEach(function(r) {
    if ((r.completions || 0) > maxRoutineCompletions) {
      maxRoutineCompletions = r.completions || 0;
    }
  });

  var results = BADGE_DEFS.map(function(badge) {
    var earned = false;
    switch (badge.id) {
      case "first_step": earned = doneCount >= 1; break;
      case "getting_started": earned = doneCount >= 5; break;
      case "on_a_roll": earned = doneCount >= 10; break;
      case "step_master": earned = doneCount >= 25; break;
      case "legend": earned = doneCount >= 50; break;
      case "explorer": earned = segCount >= 3; break;
      case "planner": earned = hasJourney; break;
      case "creature_of_habit": earned = maxRoutineCompletions >= 5; break;
      case "streak_3": earned = streak >= 3; break;
      case "streak_7": earned = streak >= 7; break;
      case "streak_30": earned = streak >= 30; break;
      default: break;
    }
    return { id: badge.id, emoji: badge.emoji, name: badge.name, desc: badge.desc, earned: earned };
  });

  return results;
}

export default function BadgesModal({ onClose, allSteps, allRoutines, allPlans, profile }) {
  var badges = getBadges(allSteps, allRoutines, allPlans);
  var earnedCount = badges.filter(function(b) { return b.earned; }).length;

  function renderBadge(badge) {
    return (
      <div key={badge.id} style={{
        background: badge.earned ? C.cream : C.bg,
        border: "1px solid " + (badge.earned ? C.b2 : C.b1),
        borderRadius: 16,
        padding: "18px 14px",
        textAlign: "center",
        opacity: badge.earned ? 1 : 0.4,
        transition: "all 0.2s",
        filter: badge.earned ? "none" : "grayscale(0.8)"
      }}>
        <div style={{fontSize:32,marginBottom:8}}>{badge.emoji}</div>
        <div style={{...F,fontSize:13,fontWeight:600,color:C.t1,marginBottom:4}}>{badge.name}</div>
        <div style={{...F,fontSize:11,color:C.t3,lineHeight:1.4}}>{badge.desc}</div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <FadeIn>
        <div onClick={function(e){e.stopPropagation();}} style={{width:"100%",maxWidth:460,maxHeight:"85vh",overflowY:"auto",background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Award size={22} color={C.acc}/>
              <div style={{...H,fontSize:22,color:C.t1}}>Badges</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={18}/></button>
          </div>

          <div style={{background:C.accSoft,borderRadius:14,padding:"14px 18px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{...F,fontSize:14,color:C.t1}}>
              <span style={{...H,fontSize:20,color:C.acc}}>{earnedCount}</span>
              <span style={{color:C.t3}}> / {badges.length}</span>
              <span style={{marginLeft:8}}>earned</span>
            </div>
            <div style={{...F,fontSize:12,color:C.t3}}>
              {earnedCount === badges.length ? "All badges unlocked!" : (badges.length - earnedCount) + " to go"}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10}}>
            {badges.map(function(b) { return renderBadge(b); })}
          </div>

        </div>
      </FadeIn>
    </div>
  );
}
