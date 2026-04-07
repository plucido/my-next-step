import { useState, useMemo } from "react";
import { Calendar, Check, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { H, F, C, SEGMENTS } from "../lib/constants.js";
import { FadeIn, catToSeg, catIcon } from "../lib/utils.jsx";
import StepCard from "../components/StepCard.jsx";
import JourneyCard from "../components/JourneyCard.jsx";
import RoutineCard from "../components/RoutineCard.jsx";
import { CalendarAd } from "../components/AdBanner.jsx";

const CARD_STYLE = { padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: C.card, boxShadow: C.shadow, display: "flex", alignItems: "center", gap: 10 };

export default function TimelineView({
  allSteps, allPlans, allRoutines, doneSteps, calData,
  expandedPlan, setExpandedPlan,
  markStep, deleteStep, loveStep, dislikeStep, handleBooked,
  deletePlan, toggleTask, pauseRoutine, deleteRoutine, completeRoutine,
  talkAbout, shareItem, handleAddCal, snoozeStep, userTier
}) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const now = new Date();
  const todayStr = now.toDateString();

  const dayNameMap = {sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};

  const routinesByDate = useMemo(() => {
    const map = {};
    allRoutines.filter((r) => !r.paused).forEach((r) => {
      let days = r.days || [];
      if(days.length===0 && r.schedule==="daily") days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      days.forEach((dayName) => {
        const dayNum = dayNameMap[dayName.toLowerCase()];
        if(dayNum===undefined) return;
        const start = new Date(now);
        while(start.getDay()!==dayNum) start.setDate(start.getDate()+1);
        for(let d=new Date(start);d-now<60*864e5;d.setDate(d.getDate()+7)){
          const key=d.toDateString();
          if(!map[key])map[key]=[];
          map[key].push(r);
        }
      });
    });
    return map;
  }, [allRoutines]);

  const {calByDate, stepsByDate, unscheduledSteps} = useMemo(() => {
    const cMap = {};
    (calData || []).forEach((e) => {
      const d = new Date(e.start);
      const key = d.toDateString();
      if (!cMap[key]) cMap[key] = [];
      cMap[key].push(e);
    });

    const sMap = {};
    const scheduled = new Set();
    allSteps.filter((s) => s.status === "active").forEach((s) => {
      const t = (s.time || "").toLowerCase();
      let key = now.toDateString();
      if (t.includes("tomorrow")) {
        const d = new Date(now); d.setDate(d.getDate() + 1); key = d.toDateString();
      } else if (t.includes("this week") || t.includes("this weekend")) {
        const d2 = new Date(now); d2.setDate(d2.getDate() + ((6 - d2.getDay() + 7) % 7 || 7)); key = d2.toDateString();
      }
      if (!sMap[key]) sMap[key] = [];
      sMap[key].push(s);
      scheduled.add(s.id);
    });

    const unsched = allSteps.filter((s) => s.status === "active" && !scheduled.has(s.id));
    unsched.forEach((s) => {
      const key = now.toDateString();
      if (!sMap[key]) sMap[key] = [];
      sMap[key].push(s);
    });

    return {calByDate: cMap, stepsByDate: sMap, unscheduledSteps: unsched};
  }, [allSteps, calData]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDayLabel = (date) => {
    if (date.toDateString() === now.toDateString()) return "Today";
    const tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    if (date.toDateString() === tom.toDateString()) return "Tomorrow";
    return dayNames[date.getDay()];
  };

  const getWeekDays = () => {
    const days = [];
    const tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const d = new Date(tom);
    while (d <= endOfWeek) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const getUpcomingDays = () => {
    const days = [];
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const start = new Date(endOfWeek);
    start.setDate(start.getDate() + 1);
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const sectionHeader = { ...F, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.t3 };

  function renderCalEvent(e, i) {
    const d = new Date(e.start);
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
    const todayCal = calByDate[todayStr] || [];
    const todaySteps = stepsByDate[todayStr] || [];
    const hasContent = todayCal.length > 0 || todaySteps.length > 0;
    const fullDate = dayNames[now.getDay()] + ", " + monthNames[now.getMonth()] + " " + now.getDate();

    return (
      <FadeIn>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: C.acc }}>{null}</div>
            <span style={{ ...H, fontSize: 20, fontWeight: 600, color: C.t1 }}>Today</span>
            <span style={{ ...F, fontSize: 13, color: C.t3 }}>{fullDate}</span>
          </div>
          {todayCal.map((e, i) => renderCalEvent(e, i))}
          {todaySteps.map((s, i) => (
            <StepCard key={s.id} step={s} onDone={(id) => { markStep(id, "done"); }} onBooked={handleBooked} onDislike={dislikeStep} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onSnooze={snoozeStep} onShare={shareItem} delay={i * 30} />
          ))}
          {!hasContent ? <div style={{ ...F, fontSize: 13, color: C.t3, padding: "12px 0", fontStyle: "italic" }}>Nothing on today's agenda</div> : null}
        </div>
      </FadeIn>
    );
  }

  function renderThisWeek() {
    const weekDays = getWeekDays();
    const hasAnyContent = weekDays.some((d) => {
      const key = d.toDateString();
      return (calByDate[key] || []).length > 0 || (stepsByDate[key] || []).length > 0;
    });
    if (!hasAnyContent) return null;

    return (
      <FadeIn delay={60}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...sectionHeader, marginBottom: 12 }}>This Week</div>
          {weekDays.map((day) => {
            const key = day.toDateString();
            const dayCal = calByDate[key] || [];
            const daySteps = stepsByDate[key] || [];
            if (dayCal.length === 0 && daySteps.length === 0) return null;
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ ...F, fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 8 }}>{getDayLabel(day)}</div>
                {dayCal.map((e, i) => renderCalEvent(e, i))}
                {daySteps.map((s, i) => (
                  <StepCard key={s.id} step={s} onDone={(id) => { markStep(id, "done"); }} onBooked={handleBooked} onDislike={dislikeStep} onDelete={deleteStep} onLove={loveStep} onTalk={talkAbout} onAddCal={handleAddCal} onSnooze={snoozeStep} onShare={shareItem} delay={i * 30} />
                ))}
              </div>
            );
          })}
        </div>
      </FadeIn>
    );
  }

  function renderCompactStep(s, i) {
    const seg = SEGMENTS[catToSeg(s.category)];
    return (
      <div key={s.id} style={{ ...CARD_STYLE }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: seg ? seg.color : C.acc, flexShrink: 0 }}>{null}</div>
        <div style={{ flex: 1 }}>
          <div style={{ ...F, fontSize: 13, fontWeight: 500, color: C.t1 }}>{s.title}</div>
        </div>
        {s.time ? <span style={{ ...F, fontSize: 11, color: C.t3 }}>{s.time}</span> : null}
      </div>
    );
  }

  function renderUpcomingAndCalendar() {
    const upcomingDays = getUpcomingDays();
    const upcomingItems = [];
    upcomingDays.forEach((day) => {
      const key = day.toDateString();
      const dayCal = calByDate[key] || [];
      const daySteps = stepsByDate[key] || [];
      dayCal.forEach((e) => {
        upcomingItems.push({ type: "cal", data: e, date: day });
      });
      daySteps.forEach((s) => {
        upcomingItems.push({ type: "step", data: s, date: day });
      });
    });

    return (
      <FadeIn delay={120}>
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            {upcomingItems.length > 0 ? <div>
              <div style={{ ...sectionHeader, marginBottom: 10 }}>Coming Up</div>
              {upcomingItems.slice(0,5).map((item, i) => {
                if (item.type === "cal") return renderCalEvent(item.data, "up-" + i);
                return renderCompactStep(item.data, i);
              })}
            </div> : null}
            {unscheduledSteps.length > 0 ? <div style={{marginTop: upcomingItems.length>0 ? 16 : 0}}>
              <div style={{ ...sectionHeader, marginBottom: 10 }}>Anytime</div>
              {unscheduledSteps.slice(0,5).map((s, i) => renderCompactStep(s, i))}
            </div> : null}
            {allPlans.length > 0 ? <div style={{marginTop:16}}>
              <div style={{ ...sectionHeader, marginBottom: 10 }}>Journeys ({allPlans.length})</div>
              {allPlans.slice(0,3).map((p, i) => {
                const done = (p.tasks||[]).filter((t) => t.done).length;
                const total = (p.tasks||[]).length;
                return <div key={i} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,background:C.card,boxShadow:C.shadow}}>
                  <div style={{...F,fontSize:13,fontWeight:600,color:C.t1}}>{p.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                    <div style={{flex:1,height:3,background:C.cream,borderRadius:2}}><div style={{height:"100%",width:total?(done/total*100)+"%":"0%",background:done===total?C.teal:C.accGrad,borderRadius:2}}>{null}</div></div>
                    <span style={{...F,fontSize:10,color:C.t3}}>{done}/{total}</span>
                  </div>
                </div>;
              })}
            </div> : null}
            {upcomingItems.length===0 && unscheduledSteps.length===0 && allPlans.length===0 ? <div>
              <div style={{ ...sectionHeader, marginBottom: 10 }}>Coming Up</div>
              <div style={{ ...F, fontSize: 13, color: C.t3, fontStyle: "italic" }}>Nothing scheduled yet</div>
            </div> : null}
          </div>
          <div>
            {renderMiniCalendar()}
            <CalendarAd tier={userTier}/>
          </div>
</div>
      </FadeIn>
    );
  }

  function renderMiniCalendar() {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ num: null, key: "empty-" + i });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const cellKey = cellDate.toDateString();
      const daySteps = stepsByDate[cellKey] || [];
      const dayRoutines = routinesByDate[cellKey] || [];
      const hasCal = (calByDate[cellKey] || []).length > 0;
      const isToday = cellKey === todayStr;
      const isSelected = selectedDate && cellKey === selectedDate.toDateString();
      const isPast = cellDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const segColors = {};
      daySteps.forEach((s) => {const seg=catToSeg(s.category);segColors[seg]=SEGMENTS[seg]?.color||C.acc;});
      dayRoutines.forEach((r) => {const seg=catToSeg(r.category);segColors[seg]=SEGMENTS[seg]?.color||C.acc;});
      const dots = Object.values(segColors);
      if(hasCal) dots.push("#4285F4");
      cells.push({ num: d, key: "d-" + d, date: cellDate, dateKey: cellKey, dots: dots, isToday: isToday, isSelected: isSelected, isPast: isPast });
    }

    const prevMonth = () => {
      const m = new Date(calMonth); m.setMonth(m.getMonth() - 1); setCalMonth(m); setSelectedDate(null);
    };
    const nextMonth = () => {
      const m = new Date(calMonth); m.setMonth(m.getMonth() + 1); setCalMonth(m); setSelectedDate(null);
    };
    const selectDay = (cell) => {
      if (cell.isSelected) { setSelectedDate(null); return; }
      setSelectedDate(cell.date);
    };

    const sel = selectedDate ? selectedDate.toDateString() : null;
    const selSteps = sel ? (stepsByDate[sel] || []) : [];
    const selCal = sel ? (calByDate[sel] || []) : [];
    const selRoutines = sel ? (routinesByDate[sel] || []) : [];
    const selUnscheduled = sel && sel === todayStr ? unscheduledSteps : [];

    return (
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ padding: 16, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3, padding: 4 }}><ChevronLeft size={16} /></button>
            <span style={{ ...F, fontSize: 13, fontWeight: 600, color: C.t1 }}>{monthNames[month]} {year}</span>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3, padding: 4 }}><ChevronRight size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
            {dayLabels.map((label, i) => (
              <div key={"lbl-" + i} style={{ ...F, fontSize: 10, fontWeight: 600, color: C.t3, padding: "4px 0" }}>{label}</div>
            ))}
            {cells.map((cell) => {
              if (cell.num === null) return <div key={cell.key}>{null}</div>;
              const bg = cell.isSelected ? C.acc : cell.isToday ? C.accSoft : "transparent";
              const fg = cell.isSelected ? "#fff" : cell.isToday ? C.acc : C.t1;
              return (
                <div key={cell.key} onClick={() => {selectDay(cell);}} style={{ padding: "3px 0", display: "flex", flexDirection: "column", alignItems: "center", opacity: cell.isPast && !cell.isToday ? 0.35 : 1, cursor: "pointer" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: fg, ...F, fontSize: 12, fontWeight: cell.isToday || cell.isSelected ? 700 : 400, transition: "all 0.15s" }}>{cell.num}</div>
                  <div style={{ display: "flex", gap: 2, marginTop: 2, height: 4 }}>
                    {cell.dots.slice(0,4).map((clr,di) => <div key={di} style={{ width: 4, height: 4, borderRadius: 2, background: clr }}>{null}</div>)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, padding: "8px 0 0", borderTop: "1px solid " + C.b1 }}>
            {Object.keys(SEGMENTS).map((s) => <div key={s} style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: SEGMENTS[s].color }}>{null}</div><span style={{ ...F, fontSize: 9, color: C.t3 }}>{SEGMENTS[s].label}</span></div>)}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: "#4285F4" }}>{null}</div><span style={{ ...F, fontSize: 9, color: C.t3 }}>Synced</span></div>
          </div>
        </div>
        {selectedDate ? renderSelectedDay(selectedDate, selSteps, selCal, selRoutines, selUnscheduled) : null}
      </div>
    );
  }

  function renderSelectedDay(date, steps, calEvents, routines, unsched) {
    const label = date.toDateString() === todayStr ? "Today" : date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    const allItems = steps.length + calEvents.length + routines.length + unsched.length;
    return (
      <div style={{ marginTop: 12, padding: 16, borderRadius: 16, background: C.card, boxShadow: C.shadow }}>
        <div style={{ ...F, fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 10 }}>{label}</div>
        {allItems === 0 ? <div style={{ ...F, fontSize: 13, color: C.t3, fontStyle: "italic" }}>Nothing scheduled</div> : null}
        {calEvents.map((e, i) => renderCalEvent(e, "ce-" + i))}
        {routines.map((r, i) => {
          const seg = SEGMENTS[catToSeg(r.category)];
          const segColor = seg ? seg.color : C.acc;
          return <div key={"rt-" + i} style={{ padding: "8px 12px", borderRadius: 10, marginBottom: 6, background: (seg?.soft||C.accSoft), borderLeft: "3px solid " + segColor, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...F, fontSize: 11, color: segColor, fontWeight: 600, minWidth: 50 }}>{r.time || r.schedule}</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...F, fontSize: 13, fontWeight: 500, color: C.t1 }}>{r.title}</div>
              <div style={{ ...F, fontSize: 11, color: C.t3 }}>{r.schedule} routine</div>
            </div>
          </div>;
        })}
        {steps.map((s) => {
          const seg = SEGMENTS[catToSeg(s.category)];
          return <div key={s.id} style={{ padding: "8px 12px", borderRadius: 10, marginBottom: 6, background: s.booked ? C.tealSoft : C.cream, borderLeft: "3px solid " + (s.booked ? C.teal : (seg ? seg.color : C.acc)), display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...F, fontSize: 11, color: seg ? seg.color : C.acc, fontWeight: 600, minWidth: 50 }}>{s.time || "Anytime"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...F, fontSize: 13, fontWeight: 500, color: C.t1 }}>{s.title}</div>
              {s.booked ? <span style={{ ...F, fontSize: 10, color: C.teal }}>Booked</span> : null}
            </div>
          </div>;
        })}
        {unsched.map((s) => {
          const seg = SEGMENTS[catToSeg(s.category)];
          return <div key={s.id} style={{ padding: "8px 12px", borderRadius: 10, marginBottom: 6, background: C.cream, borderLeft: "3px solid " + (seg ? seg.color : C.acc), display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12 }}>{catIcon(s.category)}</span>
            <div style={{ ...F, fontSize: 13, fontWeight: 500, color: C.t1, flex: 1 }}>{s.title}</div>
          </div>;
        })}
      </div>
    );
  }

  function renderRoutines() {
    const active = allRoutines.filter((r) => !r.paused);
    if (active.length === 0) return null;
    return (
      <FadeIn delay={180}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...sectionHeader, marginBottom: 12 }}>Routines ({active.length})</div>
          {active.map((r, i) => (
            <RoutineCard key={r.id} routine={r} onPause={pauseRoutine} onDelete={deleteRoutine} onComplete={completeRoutine} onTalk={talkAbout} delay={i * 30} />
          ))}
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
          {allPlans.map((plan, pi) => (
            <JourneyCard key={pi} plan={plan} pi={pi} open={expandedPlan === pi} onToggle={(i) => { setExpandedPlan(expandedPlan === i ? null : i); }} onDelete={deletePlan} onTalk={talkAbout} onToggleTask={toggleTask} onSnooze={snoozeStep} onShare={shareItem} delay={pi * 30} />
          ))}
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
          {doneSteps.slice(0, 5).map((s) => (
            <div key={s.id} style={{ ...CARD_STYLE, background: s.loved ? "rgba(220,38,38,0.04)" : C.tealSoft, border: "1px solid " + (s.loved ? "rgba(220,38,38,0.1)" : C.tealBorder), opacity: 0.5 }}>
              <span style={{ color: s.loved ? "#DC2626" : C.teal }}>{s.loved ? <Heart size={14} fill="#DC2626" color="#DC2626" /> : <Check size={14} />}</span>
              <span style={{ ...F, fontSize: 13, textDecoration: "line-through", color: C.t2, flex: 1 }}>{s.title}</span>
            </div>
          ))}
        </div>
      </FadeIn>
    );
  }

  const hasContent = allSteps.filter((s) => s.status === "active").length > 0 || allPlans.length > 0 || allRoutines.length > 0 || (calData || []).length > 0 || doneSteps.length > 0;

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

  function renderUpNext() {
    const items = [];
    (calData || []).forEach((e) => {
      const d = new Date(e.start);
      if (d > now) items.push({title:e.title,time:d,type:"cal",location:e.location});
    });
    allSteps.filter((s) => s.status==="active").forEach((s) => {
      const t = (s.time || "").toLowerCase();
      let d = new Date();
      if (t.includes("tonight") || t.includes("pm")) {const m=t.match(/(\d{1,2})\s*pm/);d.setHours(m?parseInt(m[1])+12:19,0,0);}
      else if (t.includes("am")) {const m2=t.match(/(\d{1,2})\s*am/);if(m2)d.setHours(parseInt(m2[1]),0,0);}
      else if (t.includes("tomorrow")) {d.setDate(d.getDate()+1);d.setHours(9,0,0);}
      else {d = null;}
      if (d && d > now) items.push({title:s.title,time:d,type:"step",cat:s.category});
    });
    allRoutines.filter((r) => !r.paused).forEach((r) => {
      const rDays = r.days || [];
      if (rDays.length === 0) return;
      for (let i = 0; i < 7; i++) {
        const d = new Date(now); d.setDate(d.getDate()+i);
        const dayName = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][d.getDay()];
        if (rDays.map((x) => x.toLowerCase()).includes(dayName)) {
          const rt = new Date(d);
          const tp = (r.time||"").toLowerCase();
          const pm=tp.match(/(\d{1,2})\s*pm/);const am=tp.match(/(\d{1,2})\s*am/);
          if(pm)rt.setHours(parseInt(pm[1])+(parseInt(pm[1])===12?0:12),0,0);
          else if(am)rt.setHours(parseInt(am[1])===12?0:parseInt(am[1]),0,0);
          else rt.setHours(9,0,0);
          if (rt > now) {items.push({title:r.title,time:rt,type:"routine",cat:r.category}); break;}
        }
      }
    });
    items.sort((a,b) => a.time-b.time);
    const next = items.slice(0,2);
    if (next.length === 0) return null;

    const timeLabel = (d) => {
      const diff = d - now;
      const mins = Math.floor(diff/6e4);
      if (mins < 60) return "in " + mins + " min";
      const hrs = Math.floor(mins/60);
      if (hrs < 24) return "in " + hrs + "h";
      const days = Math.floor(hrs/24);
      if (days === 1) return "Tomorrow";
      return d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"});
    };

    return (
      <div style={{position:"sticky",top:0,zIndex:10,padding:"0 0 8px",background:C.bg}}>
        <div style={{...F,fontSize:10,fontWeight:600,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:3,background:C.acc,animation:"pulse 2s ease infinite"}}>{null}</div>
          Up next
        </div>
        <div style={{display:"flex",gap:8}}>
          {next.map((item,i) => {
            const color = item.type==="cal"?"#4285F4":(item.cat?SEGMENTS[catToSeg(item.cat)]?.color:null)||C.acc;
            const typeLabel = item.type==="cal"?"Synced":item.type==="routine"?"Routine":"Step";
            return (
              <div key={i} style={{flex:1,padding:"10px 14px",borderRadius:14,background:C.card,boxShadow:C.shadow,borderLeft:"3px solid "+color,minWidth:0}}>
                <div style={{...F,fontSize:10,fontWeight:600,color:color,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{typeLabel}</div>
                <div style={{...F,fontSize:13,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                <div style={{...F,fontSize:11,color:C.t3,marginTop:2}}>{timeLabel(item.time)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{flex:1,overflowY:"auto",padding:"8px 20px 200px"}}>
      {renderUpNext()}
      {renderToday()}
      {renderThisWeek()}
      {renderUpcomingAndCalendar()}
      {renderRoutines()}
      {renderJourneys()}
      {renderCompleted()}
      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}"}</style>
    </div>
  );
}
