import { useState } from "react";
import { Calendar, Check, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { H, F, C, SEGMENTS } from "./constants.js";
import { FadeIn, catToSeg, catIcon } from "./utils.jsx";
import StepCard from "./StepCard.jsx";
import JourneyCard from "./JourneyCard.jsx";
import RoutineCard from "./RoutineCard.jsx";

export default function TimelineView({
  allSteps, allPlans, allRoutines, doneSteps, calData,
  expandedPlan, setExpandedPlan,
  markStep, deleteStep, loveStep, dislikeStep, handleBooked,
  deletePlan, toggleTask, pauseRoutine, deleteRoutine,
  talkAbout, shareItem, handleAddCal
}) {
  const [calMonth, setCalMonth] = useState(new Date());
  const now = new Date();
  const todayStr = now.toDateString();

  var calByDate = {};
  (calData || []).forEach(function(e) {
    var d = new Date(e.start);
    var key = d.toDateString();
    if (!calByDate[key]) calByDate[key] = [];
    calByDate[key].push(e);
  });

  var stepsByDate = {};
  allSteps.filter(function(s) { return s.status === "active"; }).forEach(function(s) {
    var t = (s.time || "").toLowerCase();
    var key = now.toDateString();
    if (t.includes("tomorrow")) {
      var d = new Date(now);
      d.setDate(d.getDate() + 1);
      key = d.toDateString();
    } else if (t.includes("this week") || t.includes("this weekend")) {
      var d2 = new Date(now);
      d2.setDate(d2.getDate() + ((6 - d2.getDay() + 7) % 7 || 7));
      key = d2.toDateString();
    }
    if (!stepsByDate[key]) stepsByDate[key] = [];
    stepsByDate[key].push(s);
  });

  var scheduledIds = new Set();
  Object.values(stepsByDate).forEach(function(arr) {
    arr.forEach(function(s) { scheduledIds.add(s.id); });
  });
  var unscheduledSteps = allSteps.filter(function(s) {
    return s.status === "active" && !scheduledIds.has(s.id);
  });
  unscheduledSteps.forEach(function(s) {
    var key = now.toDateString();
    if (!stepsByDate[key]) stepsByDate[key] = [];
    stepsByDate[key].push(s);
  });

  var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function getDayLabel(date) {
    if (date.toDateString() === now.toDateString()) return "Today";
    var tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    if (date.toDateString() === tom.toDateString()) return "Tomorrow";
    return dayNames[date.getDay()];
  }

  function getWeekDays() {
    var days = [];
    var tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    var endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    var d = new Date(tom);
    while (d <= endOfWeek) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  function getUpcomingDays() {
    var days = [];
    var endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    var start = new Date(endOfWeek);
    start.setDate(start.getDate() + 1);
    for (var i = 0; i < 14; i++) {
      var d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }

  var sectionHeader = { ...F, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3 };

  function renderCalEvent(e, i) {
    var d = new Date(e.start);
    return (
      <div key={"cal-" + i} style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: "rgba(66,133,244,0.04)", borderLeft: "4px solid #4285F4", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ ...F, fontSize: 11, color: "#4285F4", minWidth: 50, fontWeight: 600 }}>{e.allDay ? "All day" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
        <div style={{ flex: 1 }}>
          <div style={{ ...F, fontSize: 13, color: C.t1 }}>{e.title}</div>
          {e.location ? <div style={{ ...F, fontSize: 11, color: C.t3, marginTop: 2 }}>{e.location}</div> : null}
        </div>
        <span style={{ ...F, fontSize: 10, color: "#4285F4", opacity: 0.6 }}>GCal</span>
      </div>
    );
  }

  function renderToday() {
    var todayCal = calByDate[todayStr] || [];
    var todaySteps = stepsByDate[todayStr] || [];
    var hasContent = todayCal.length > 0 || todaySteps.length > 0;
    var fullDate = dayNames[now.getDay()] + ", " + monthNames[now.getMonth()] + " " + now.getDate();

    return (
      <FadeIn>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: C.acc }}>{null}</div>
            <span style={{ ...H, fontSize: 20, fontWeight: 600, color: C.t1 }}>Today</span>
            <span style={{ ...F, fontSize: 13, color: C.t3 }}>{fullDate}</span>
          </div>
          {todayCal.map(function(e, i) { return renderCalEvent(e, i); })}
          {todaySteps.map(function(s, i) {
            return (
              <StepCard key={s.id} step={s} onDone={function(id) { markStep(id, "done"); }} onBooked={handleBooked} onDislike={dislikeStep} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onShare={shareItem} delay={i * 30} />
            );
          })}
          {!hasContent ? <div style={{ ...F, fontSize: 13, color: C.t3, padding: "12px 0", fontStyle: "italic" }}>Nothing on today's agenda</div> : null}
        </div>
      </FadeIn>
    );
  }

  function renderThisWeek() {
    var weekDays = getWeekDays();
    var hasAnyContent = weekDays.some(function(d) {
      var key = d.toDateString();
      return (calByDate[key] || []).length > 0 || (stepsByDate[key] || []).length > 0;
    });
    if (!hasAnyContent) return null;

    return (
      <FadeIn delay={60}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...sectionHeader, marginBottom: 12 }}>This Week</div>
          {weekDays.map(function(day) {
            var key = day.toDateString();
            var dayCal = calByDate[key] || [];
            var daySteps = stepsByDate[key] || [];
            if (dayCal.length === 0 && daySteps.length === 0) return null;
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ ...F, fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 8 }}>{getDayLabel(day)}</div>
                {dayCal.map(function(e, i) { return renderCalEvent(e, i); })}
                {daySteps.map(function(s, i) {
                  return (
                    <StepCard key={s.id} step={s} onDone={function(id) { markStep(id, "done"); }} onBooked={handleBooked} onDislike={dislikeStep} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onShare={shareItem} delay={i * 30} />
                  );
                })}
              </div>
            );
          })}
        </div>
      </FadeIn>
    );
  }

  function renderCompactStep(s, i) {
    var seg = SEGMENTS[catToSeg(s.category)];
    return (
      <div key={s.id} style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: C.card, boxShadow: C.shadow, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: seg ? seg.color : C.acc, flexShrink: 0 }}>{null}</div>
        <div style={{ flex: 1 }}>
          <div style={{ ...F, fontSize: 13, fontWeight: 500, color: C.t1 }}>{s.title}</div>
        </div>
        {s.time ? <span style={{ ...F, fontSize: 11, color: C.t3 }}>{s.time}</span> : null}
      </div>
    );
  }

  function renderUpcomingAndCalendar() {
    var upcomingDays = getUpcomingDays();
    var upcomingItems = [];
    upcomingDays.forEach(function(day) {
      var key = day.toDateString();
      var dayCal = calByDate[key] || [];
      var daySteps = stepsByDate[key] || [];
      dayCal.forEach(function(e) {
        upcomingItems.push({ type: "cal", data: e, date: day });
      });
      daySteps.forEach(function(s) {
        upcomingItems.push({ type: "step", data: s, date: day });
      });
    });

    return (
      <FadeIn delay={120}>
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...sectionHeader, marginBottom: 12 }}>Coming Up</div>
            {upcomingItems.length > 0 ? upcomingItems.map(function(item, i) {
              if (item.type === "cal") return renderCalEvent(item.data, "up-" + i);
              return renderCompactStep(item.data, i);
            }) : <div style={{ ...F, fontSize: 13, color: C.t3, fontStyle: "italic" }}>Nothing scheduled yet</div>}
          </div>
          {renderMiniCalendar()}
        </div>
      </FadeIn>
    );
  }

  function renderMiniCalendar() {
    var year = calMonth.getFullYear();
    var month = calMonth.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

    var cells = [];
    for (var i = 0; i < firstDay; i++) {
      cells.push({ num: null, key: "empty-" + i });
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var cellDate = new Date(year, month, d);
      var cellKey = cellDate.toDateString();
      var hasSteps = (stepsByDate[cellKey] || []).length > 0;
      var hasCal = (calByDate[cellKey] || []).length > 0;
      var isToday = cellKey === todayStr;
      var isPast = cellDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cells.push({ num: d, key: "d-" + d, hasSteps: hasSteps, hasCal: hasCal, isToday: isToday, isPast: isPast });
    }

    function prevMonth() {
      var m = new Date(calMonth);
      m.setMonth(m.getMonth() - 1);
      setCalMonth(m);
    }
    function nextMonth() {
      var m = new Date(calMonth);
      m.setMonth(m.getMonth() + 1);
      setCalMonth(m);
    }

    return (
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3, padding: 4 }}><ChevronLeft size={16} /></button>
          <span style={{ ...F, fontSize: 13, fontWeight: 600, color: C.t1 }}>{monthNames[month]} {year}</span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3, padding: 4 }}><ChevronRight size={16} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
          {dayLabels.map(function(label, i) {
            return <div key={"lbl-" + i} style={{ ...F, fontSize: 10, fontWeight: 600, color: C.t3, padding: "4px 0" }}>{label}</div>;
          })}
          {cells.map(function(cell) {
            if (cell.num === null) return <div key={cell.key}>{null}</div>;
            return (
              <div key={cell.key} style={{ padding: "4px 0", display: "flex", flexDirection: "column", alignItems: "center", opacity: cell.isPast ? 0.4 : 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: cell.isToday ? C.acc : "transparent", color: cell.isToday ? "#fff" : C.t1, ...F, fontSize: 12, fontWeight: cell.isToday ? 700 : 400 }}>{cell.num}</div>
                <div style={{ display: "flex", gap: 2, marginTop: 2, height: 4 }}>
                  {cell.hasSteps ? <div style={{ width: 4, height: 4, borderRadius: 2, background: C.acc }}>{null}</div> : null}
                  {cell.hasCal ? <div style={{ width: 4, height: 4, borderRadius: 2, background: "#4285F4" }}>{null}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderRoutines() {
    var active = allRoutines.filter(function(r) { return !r.paused; });
    if (active.length === 0) return null;
    return (
      <FadeIn delay={180}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...sectionHeader, marginBottom: 12 }}>Routines ({active.length})</div>
          {active.map(function(r, i) {
            return <RoutineCard key={r.id} routine={r} onPause={pauseRoutine} onDelete={deleteRoutine} onTalk={talkAbout} delay={i * 30} />;
          })}
        </div>
      </FadeIn>
    );
  }

  function renderJourneys() {
    if (allPlans.length === 0) return null;
    return (
      <FadeIn delay={240}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...sectionHeader, marginBottom: 12 }}>Journeys ({allPlans.length})</div>
          {allPlans.map(function(plan, pi) {
            return <JourneyCard key={pi} plan={plan} pi={pi} open={expandedPlan === pi} onToggle={function(i) { setExpandedPlan(expandedPlan === i ? null : i); }} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onShare={shareItem} delay={pi * 30} />;
          })}
        </div>
      </FadeIn>
    );
  }

  function renderCompleted() {
    if (doneSteps.length === 0) return null;
    return (
      <FadeIn delay={300}>
        <div style={{ marginTop: 12 }}>
          <div style={{ ...sectionHeader, marginBottom: 12 }}>Completed ({doneSteps.length})</div>
          {doneSteps.slice(0, 5).map(function(s) {
            return (
              <div key={s.id} style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: s.loved ? "rgba(220,38,38,0.04)" : C.tealSoft, border: "1px solid " + (s.loved ? "rgba(220,38,38,0.1)" : C.tealBorder), display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
                <span style={{ color: s.loved ? "#DC2626" : C.teal }}>{s.loved ? <Heart size={14} fill="#DC2626" color="#DC2626" /> : <Check size={14} />}</span>
                <span style={{ ...F, fontSize: 13, textDecoration: "line-through", color: C.t2, flex: 1 }}>{s.title}</span>
              </div>
            );
          })}
        </div>
      </FadeIn>
    );
  }

  var hasContent = allSteps.filter(function(s) { return s.status === "active"; }).length > 0 || allPlans.length > 0 || allRoutines.length > 0 || (calData || []).length > 0 || doneSteps.length > 0;

  if (!hasContent) {
    return (
      <FadeIn>
        <div style={{ textAlign: "center", padding: "44px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px", background: C.accSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}><Calendar size={20} /></div>
          <div style={{ ...H, fontSize: 20, color: C.t1, marginBottom: 8 }}>Your timeline</div>
          <div style={{ ...F, fontSize: 14, color: C.t2, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>Start chatting in any segment to see your steps, journeys, and calendar events here.</div>
        </div>
      </FadeIn>
    );
  }

  return (
    <div>
      {renderToday()}
      {renderThisWeek()}
      {renderUpcomingAndCalendar()}
      {renderRoutines()}
      {renderJourneys()}
      {renderCompleted()}
    </div>
  );
}
