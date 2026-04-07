import { useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { H, F, C, INTEREST_OPTIONS, BUDGET_OPTIONS, DIET_OPTIONS, ALLERGY_OPTIONS, FITNESS_OPTIONS, RELATIONSHIP_OPTIONS, WORK_OPTIONS } from "../lib/constants.js";
import { FadeIn } from "../lib/utils.jsx";

export default function QuickProfile({ profile, onComplete }) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState([]);
  const [budget, setBudget] = useState("");
  const [diet, setDiet] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [otherAllergies, setOtherAllergies] = useState("");
  const [fitness, setFitness] = useState("");
  const [relationship, setRelationship] = useState("");
  const [work, setWork] = useState("");
  const [done, setDone] = useState(false);

  const totalSteps = 6;

  function next() {
    if (step < totalSteps - 1) { setStep(step + 1); }
    else { setDone(true); }
  }
  function back() { if (step > 0) setStep(step - 1); }

  function toggleArr(arr, setArr, val) {
    if (arr.includes(val)) { setArr(arr.filter(function(v){ return v !== val; })); }
    else { setArr([].concat(arr, [val])); }
  }

  function toggleDiet(val) {
    if (val === "No restrictions") { setDiet(["No restrictions"]); setAllergies([]); return; }
    var next2 = diet.filter(function(v){ return v !== "No restrictions"; });
    if (next2.includes(val)) { next2 = next2.filter(function(v){ return v !== val; }); }
    else { next2 = [].concat(next2, [val]); }
    setDiet(next2);
  }

  function toggleAllergy(val) {
    setDiet(function(prev){ return prev.filter(function(v){ return v !== "No restrictions"; }); });
    toggleArr(allergies, setAllergies, val);
  }

  function handleComplete(mode) {
    onComplete({
      interests: interests,
      budget: budget,
      diet: diet,
      allergies: allergies,
      otherAllergies: otherAllergies,
      fitness: fitness,
      relationship: relationship,
      work: work,
      deepProfile: mode === "deep"
    });
  }

  var chipBase = {
    ...F, padding: "8px 12px", borderRadius: 12, fontSize: 14, cursor: "pointer",
    border: "1.5px solid transparent", transition: "all 0.15s", fontWeight: 500,
    minHeight: 36
  };
  var chipOff = { ...chipBase, background: C.cream, color: C.t2 };
  var chipOn = { ...chipBase, background: C.accSoft, color: C.acc, borderColor: C.acc, fontWeight: 600 };

  var cardBase = {
    ...F, width: "100%", padding: "16px 20px", borderRadius: 16, fontSize: 15,
    cursor: "pointer", background: C.card, boxShadow: C.shadow,
    border: "1.5px solid transparent", transition: "all 0.15s", textAlign: "left",
    boxSizing: "border-box"
  };
  var cardOn = { ...cardBase, borderColor: C.acc };

  function renderDots() {
    return (
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
        {Array.from({ length: totalSteps }).map(function(_, i) {
          return (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              background: i === step ? C.acc : C.b2,
              transition: "background 0.2s"
            }} />
          );
        })}
      </div>
    );
  }

  function renderHeader(title, subtitle) {
    return (
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ ...H, fontSize: 28, color: C.t1, margin: 0, marginBottom: 6 }}>{title}</h2>
        <p style={{ ...F, fontSize: 14, color: C.t2, margin: 0 }}>{subtitle}</p>
      </div>
    );
  }

  function renderNav(label) {
    return (
      <div style={{ marginTop: 32 }}>
        <button onClick={next} style={{
          ...F, width: "100%", padding: "16px", borderRadius: 16, fontSize: 16,
          fontWeight: 600, border: "none", cursor: "pointer",
          background: C.accGrad, color: "#fff", minHeight: 44
        }}>
          {label || "Next"}
        </button>
      </div>
    );
  }

  function renderTopBar() {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ width: 40 }}>
          {step > 0 && (
            <button onClick={back} style={{
              background: "none", border: "none", cursor: "pointer", padding: 4,
              color: C.t2, display: "flex", alignItems: "center", minWidth: 44, minHeight: 44, justifyContent: "center"
            }}>
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
        <button onClick={next} style={{
          ...F, background: "none", border: "none", cursor: "pointer",
          fontSize: 13, color: C.t3, fontWeight: 500
        }}>Skip</button>
      </div>
    );
  }

  function renderInterests() {
    return (
      <div>
        {renderHeader("What are you into?", "Tap all that apply")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {INTEREST_OPTIONS.map(function(item) {
            var on = interests.includes(item);
            return (
              <button key={item} onClick={function(){ toggleArr(interests, setInterests, item); }} style={on ? chipOn : chipOff}>{item}</button>
            );
          })}
        </div>
        {renderNav("Next")}
      </div>
    );
  }

  function renderBudget() {
    return (
      <div>
        {renderHeader("Monthly fun budget?", "For activities, dining, entertainment")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BUDGET_OPTIONS.map(function(item) {
            var on = budget === item;
            return (
              <button key={item} onClick={function(){ setBudget(item); }} style={on ? cardOn : cardBase}>
                <span style={{ fontWeight: on ? 600 : 500, color: on ? C.acc : C.t1 }}>{item}</span>
              </button>
            );
          })}
        </div>
        {renderNav("Next")}
      </div>
    );
  }

  function renderDietAllergies() {
    return (
      <div>
        {renderHeader("Any dietary needs?", "We\u2019ll filter recommendations for you")}
        <p style={{ ...F, fontSize: 12, color: C.t3, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>Diet</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {DIET_OPTIONS.map(function(item) {
            var on = diet.includes(item);
            return (
              <button key={item} onClick={function(){ toggleDiet(item); }} style={on ? chipOn : chipOff}>{item}</button>
            );
          })}
        </div>
        <p style={{ ...F, fontSize: 12, color: "#DC3C3C", fontWeight: 600, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>Allergens</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {ALLERGY_OPTIONS.map(function(item) {
            var on = allergies.includes(item);
            return (
              <button key={item} onClick={function(){ toggleAllergy(item); }} style={on ? {...chipOn, background:"rgba(220,60,60,0.06)", borderColor:"#DC3C3C", color:"#DC3C3C"} : chipOff}>{on ? "\u26A0\uFE0F " : ""}{item}</button>
            );
          })}
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ ...F, fontSize: 12, color: C.t3, margin: "0 0 6px 0" }}>Other allergies</p>
          <input value={otherAllergies} onChange={function(e){setOtherAllergies(e.target.value);}} placeholder="e.g. kiwi, latex, medications" style={{ ...F, width: "100%", padding: "10px 14px", fontSize: 16, borderRadius: 12, border: "1.5px solid " + C.b2, background: C.card, color: C.t1, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={function(){ toggleDiet("No restrictions"); }} style={diet.includes("No restrictions") ? chipOn : chipOff}>No restrictions</button>
        {renderNav("Next")}
      </div>
    );
  }

  function renderFitness() {
    return (
      <div>
        {renderHeader("Fitness level?", "Helps us find the right activities")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FITNESS_OPTIONS.map(function(item) {
            var on = fitness === item.label;
            return (
              <button key={item.label} onClick={function(){ setFitness(item.label); }} style={on ? cardOn : cardBase}>
                <div style={{ fontWeight: on ? 600 : 500, color: on ? C.acc : C.t1, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: C.t3 }}>{item.desc}</div>
              </button>
            );
          })}
        </div>
        {renderNav("Next")}
      </div>
    );
  }

  function renderRelationship() {
    return (
      <div>
        {renderHeader("Who are you planning for?", "Helps with recommendations")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RELATIONSHIP_OPTIONS.map(function(item) {
            var on = relationship === item;
            return (
              <button key={item} onClick={function(){ setRelationship(item); }} style={on ? cardOn : cardBase}>
                <span style={{ fontWeight: on ? 600 : 500, color: on ? C.acc : C.t1 }}>{item}</span>
              </button>
            );
          })}
        </div>
        {renderNav("Next")}
      </div>
    );
  }

  function renderWork() {
    return (
      <div>
        {renderHeader("What\u2019s your work situation?", "For scheduling and career suggestions")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {WORK_OPTIONS.map(function(item) {
            var on = work === item;
            return (
              <button key={item} onClick={function(){ setWork(item); }} style={on ? cardOn : cardBase}>
                <span style={{ fontWeight: on ? 600 : 500, color: on ? C.acc : C.t1 }}>{item}</span>
              </button>
            );
          })}
        </div>
        {renderNav("Continue")}
      </div>
    );
  }

  function renderDone() {
    return (
      <FadeIn>
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32, background: C.accSoft,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <Check size={28} color={C.acc} />
          </div>
          <h2 style={{ ...H, fontSize: 30, color: C.t1, margin: "0 0 8px" }}>Nice!</h2>
          <p style={{ ...F, fontSize: 15, color: C.t2, margin: "0 0 32px", lineHeight: 1.5 }}>
            Your quick profile is set. Want to go deeper so we can really personalize things?
          </p>
          <button onClick={function(){ handleComplete("deep"); }} style={{
            ...F, width: "100%", padding: "16px", borderRadius: 16, fontSize: 16,
            fontWeight: 600, border: "none", cursor: "pointer",
            background: C.accGrad, color: "#fff", marginBottom: 12
          }}>Go deeper with AI</button>
          <button onClick={function(){ handleComplete("skip"); }} style={{
            ...F, width: "100%", padding: "14px", borderRadius: 16, fontSize: 15,
            fontWeight: 500, border: "none", cursor: "pointer",
            background: "none", color: C.t2
          }}>Start exploring</button>
        </div>
      </FadeIn>
    );
  }

  function renderStepContent() {
    if (step === 0) return renderInterests();
    if (step === 1) return renderBudget();
    if (step === 2) return renderDietAllergies();
    if (step === 3) return renderFitness();
    if (step === 4) return renderRelationship();
    if (step === 5) return renderWork();
    return null;
  }

  if (done) {
    return (
      <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {renderDone()}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...F, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {renderTopBar()}
        {renderDots()}
        <FadeIn key={step}>
          {renderStepContent()}
        </FadeIn>
      </div>
    </div>
  );
}
