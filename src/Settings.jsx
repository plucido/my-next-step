import { X, ChevronDown, MessageCircle, Plus, Heart, Dumbbell, UtensilsCrossed, Building2, TrendingUp, Calendar, Briefcase, Sparkles, Star, Shield, Globe } from "lucide-react";
import { H, F, C } from "./constants.js";
import { catIcon, Logo } from "./utils.jsx";
import { getUserId, saveFB, deleteFB } from "./firebase.js";
import { connectStrava, connectGCal, fetchGCal } from "./auth.js";
import LegalModal from "./LegalModal.jsx";

export default function Settings({
  setShowSettings,
  profile, setProfile,
  settingsTab, setSettingsTab,
  editField, setEditField, editVal, setEditVal,
  genderEdit, setGenderEdit, genderOtherEdit, setGenderOtherEdit,
  healthSection, setHealthSection,
  petType, setPetType, petBreed, setPetBreed, petAge, setPetAge,
  deleteConfirm, setDeleteConfirm, deleteText, setDeleteText,
  legalModal, setLegalModal,
  stravaData, setStravaData, calData, setCalData, calToken, setCalToken,
  allSteps, allPlans, chats, preferences, allRoutines,
  persist, resetAll, setScreen,
  doneSteps, totalCompleted, thisWeekDone, completedByCategory,
  showSettings
}) {

  const saveTravel=(key,val)=>{const t={...(profile?.travel||{}),[key]:val};const p={...profile,travel:t};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);};

  function renderTravelPrefRow(label,key,options,current) {
    return (<div style={{marginBottom:14}}>
      <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>{label}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{options.map(o=>(<button key={o} onClick={()=>saveTravel(key,o)} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:current===o?C.accSoft:C.cream,border:`1.5px solid ${current===o?C.acc:C.b2}`,color:current===o?C.acc:C.t2,fontWeight:current===o?600:400}}>{o}</button>))}</div>
    </div>);
  }

  function renderProfileTab() {
    return (<div>
      {[{k:"name",l:"Name",i:null,v:profile?.name},{k:"age",l:"Age",i:null,v:profile?.setup?.age},{k:"gender",l:"Gender",i:null,v:profile?.setup?.gender},{k:"location",l:"Location",i:null,v:profile?.setup?.location}].map(f=>(
        <div key={f.k} style={{padding:"16px 18px",borderRadius:16,background:C.card,boxShadow:C.shadow,marginBottom:8}}>
          {editField===f.k?(<div>
            <label style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:8}}>{f.l}</label>
            {f.k==="gender"?<div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Male","Female","Other","Prefer not to say"].map(g=><button key={g} onClick={()=>setGenderEdit(g)} style={{...F,padding:"7px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:genderEdit===g?C.accSoft:C.card,border:`1.5px solid ${genderEdit===g?C.acc:C.b2}`,color:genderEdit===g?C.acc:C.t2}}>{g}</button>)}</div>{genderEdit==="Other"&&<input value={genderOtherEdit} onChange={e=>setGenderOtherEdit(e.target.value)} placeholder="How do you identify?" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:10,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box",marginTop:8}}/>}</div>
            :<input value={editVal} onChange={e=>setEditVal(e.target.value)} style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/>}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={()=>setEditField(null)} style={{...F,flex:1,padding:9,borderRadius:12,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{const p={...profile};if(f.k==="name")p.name=editVal.trim();else if(f.k==="age")p.setup={...p.setup,age:editVal.trim()};else if(f.k==="gender")p.setup={...p.setup,gender:genderEdit==="Other"?genderOtherEdit:genderEdit};else if(f.k==="location")p.setup={...p.setup,location:editVal.trim()};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,flex:1,padding:9,borderRadius:12,border:"none",background:C.accGrad,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button>
            </div>
          </div>):(<div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            {f.i&&<span style={{fontSize:16,marginTop:2}}>{f.i}</span>}
            <div style={{flex:1}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{f.l}</div><div style={{...F,fontSize:15,color:C.t1}}>{f.v||"Not set"}</div></div>
            <button onClick={()=>{setEditField(f.k);setEditVal(f.v||"");if(f.k==="gender")setGenderEdit(f.v||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button>
          </div>)}
        </div>
      ))}
      <button onClick={()=>{setShowSettings(false);setScreen("deepprofile");}} style={{...F,width:"100%",padding:"16px 18px",borderRadius:16,background:C.accSoft,border:`1px solid ${C.accBorder}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",marginTop:8}}><span style={{fontSize:18}}><MessageCircle size={18}/></span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.acc}}>Go deeper with guide</div><div style={{fontSize:12,color:C.t3}}>{profile?.insights?.length||0} insights</div></div></button>
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow,marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5}}>My Favorites ({(profile?.favorites||[]).length})</div>
          {editField!=="add_fav"&&<button onClick={()=>{setEditField("add_fav");setEditVal("");}} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>+ Add</button>}
        </div>
        {editField==="add_fav"&&<div style={{marginBottom:12}}>
          <input value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&editVal.trim()){const fav={title:editVal.trim(),category:"general",addedAt:new Date().toISOString(),manual:true};const favs=[fav,...(profile?.favorites||[])].slice(0,30);const p={...profile,favorites:favs};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);setEditVal("");}}} placeholder="Restaurant, class, place, etc." style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setEditField(null)} style={{...F,flex:1,padding:8,borderRadius:10,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:12,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{if(editVal.trim()){const fav={title:editVal.trim(),category:"general",addedAt:new Date().toISOString(),manual:true};const favs=[fav,...(profile?.favorites||[])].slice(0,30);const p={...profile,favorites:favs};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);setEditVal("");}}} style={{...F,flex:1,padding:8,borderRadius:10,border:"none",background:C.accGrad,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Add</button>
          </div>
        </div>}{null}
        {(profile?.favorites||[]).length===0&&editField!=="add_fav"&&<div style={{...F,fontSize:13,color:C.t3,padding:"8px 0",lineHeight:1.5}}>Heart a step to add it here, or tap + Add to save your favorite spots manually.</div>}{null}
        {(profile?.favorites||[]).map((fav,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<(profile.favorites.length-1)?`1px solid ${C.b1}`:"none"}}>
          <span style={{fontSize:14}}>{catIcon(fav.category)}</span>
          <div style={{flex:1}}>
            <div style={{...F,fontSize:14,fontWeight:500,color:C.t1}}>{fav.title}</div>
            <div style={{...F,fontSize:11,color:C.t3}}>{fav.manual?"Added manually":"From loved step"} {"\u00B7"} {fav.category}</div>
          </div>
          <button onClick={()=>{const favs=(profile?.favorites||[]).filter((_,j)=>j!==i);const p={...profile,favorites:favs};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:13}}><X size={16}/></button>
        </div>))}{null}
      </div>
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow,marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5}}>My Pets ({(profile?.pets||[]).length})</div>
          {editField!=="add_pet"&&<button onClick={()=>{setEditField("add_pet");setEditVal("");}} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}><Plus size={12}/> Add</button>}
        </div>
        {editField==="add_pet"&&<div style={{marginBottom:12,padding:14,borderRadius:14,background:C.bg}}>
          <div style={{marginBottom:10}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Name</div><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Pet's name" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"}}/></div>
          <div style={{marginBottom:10}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Type</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Dog","Cat","Bird","Fish","Rabbit","Reptile","Other"].map(t=>(<button key={t} onClick={()=>setPetType(t)} style={{...F,padding:"6px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:petType===t?C.accSoft:C.cream,border:`1.5px solid ${petType===t?C.acc:C.b2}`,color:petType===t?C.acc:C.t2,fontWeight:petType===t?600:400}}>{t}</button>))}</div></div>
          <div style={{marginBottom:10}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Breed (optional)</div><input value={petBreed} onChange={e=>setPetBreed(e.target.value)} placeholder="e.g. Golden Retriever" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"}}/></div>
          <div style={{marginBottom:10}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Age (optional)</div><input value={petAge} onChange={e=>setPetAge(e.target.value)} placeholder="e.g. 3 years, 6 months" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box"}}/></div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>{setEditField(null);setPetType("Dog");setPetBreed("");}} style={{...F,flex:1,padding:8,borderRadius:10,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:12,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{if(editVal.trim()){const pet={name:editVal.trim(),type:petType,breed:petBreed.trim(),age:petAge.trim(),addedAt:new Date().toISOString()};const pets=[...(profile?.pets||[]),pet];const p={...profile,pets};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);setEditVal("");setPetType("Dog");setPetBreed("");setPetAge("");}}} style={{...F,flex:1,padding:8,borderRadius:10,border:"none",background:C.accGrad,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Add pet</button>
          </div>
        </div>}{null}
        {(profile?.pets||[]).length===0&&editField!=="add_pet"&&<div style={{...F,fontSize:13,color:C.t3,padding:"8px 0",lineHeight:1.5}}>Add your pets so your guide can suggest pet-friendly restaurants, parks, travel, and activities.</div>}{null}
        {(profile?.pets||[]).map((pet,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<(profile.pets.length-1)?`1px solid ${C.b1}`:"none"}}>
          <div style={{width:36,height:36,borderRadius:12,background:C.cream,display:"flex",alignItems:"center",justifyContent:"center"}}><Heart size={16} color={C.teal}/></div>
          <div style={{flex:1}}>
            <div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>{pet.name}</div>
            <div style={{...F,fontSize:12,color:C.t3}}>{pet.type}{pet.breed?` \u00B7 ${pet.breed}`:""}{pet.age?` \u00B7 ${pet.age}`:""}</div>
          </div>
          <button onClick={()=>{const pets=(profile?.pets||[]).filter((_,j)=>j!==i);const p={...profile,pets};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={14}/></button>
        </div>))}{null}
      </div>

      <div style={{borderRadius:18,background:C.card,boxShadow:C.shadow,marginTop:12,overflow:"hidden"}}>
        <button onClick={()=>setHealthSection(p=>({...p,travel:!p.travel}))} style={{...F,width:"100%",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}><span style={{fontSize:20}}><Globe size={20}/></span><div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:C.t1}}>Travel Preferences</div><div style={{fontSize:12,color:C.t3,marginTop:2}}>Flights, hotels, style</div></div><span style={{color:C.t3,transition:"transform 0.2s",transform:healthSection.travel?"rotate(180deg)":"rotate(0)"}}><ChevronDown size={16}/></span></button>
        {healthSection.travel?<div style={{padding:"0 20px 20px"}}>
          <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.5,marginBottom:14}}>Your guide uses these to find flights and hotels that match your style.</div>
          {renderTravelPrefRow("Cabin class","flightClass",["Economy","Premium Economy","Business","First"],profile?.travel?.flightClass)}
          {renderTravelPrefRow("Stops","flightStops",["Nonstop only","1 stop max","Any"],profile?.travel?.flightStops)}
          {renderTravelPrefRow("Seat preference","flightSeat",["Window","Aisle","No preference"],profile?.travel?.flightSeat)}
          {renderTravelPrefRow("Room type","hotelRoom",["Standard","Suite","Studio / Apartment"],profile?.travel?.hotelRoom)}
          {renderTravelPrefRow("Hotel budget","hotelBudget",["Budget ($)","Mid-range ($$)","Upscale ($$$)","Luxury ($$$$)"],profile?.travel?.hotelBudget)}
          {renderTravelPrefRow("Hotel style","hotelStyle",["Chain / Brand","Boutique","Resort","Hostel / Airbnb","No preference"],profile?.travel?.hotelStyle)}
          {profile?.travel?.hotelStyle==="Chain / Brand"?<div style={{marginBottom:14}}>
            <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Preferred brand(s)</div>
            {editField==="hotelBrand"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. Marriott, Hilton, Hyatt" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{saveTravel("hotelBrand",editVal.trim());setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button></div>
            :<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.travel?.hotelBrand||"Not set"}</div><button onClick={()=>{setEditField("hotelBrand");setEditVal(profile?.travel?.hotelBrand||"");}} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}{null}
          </div>:null}
        </div>:null}{null}
      </div>

      <button onClick={resetAll} style={{...F,width:"100%",padding:"14px",borderRadius:14,marginTop:12,background:"rgba(220,60,60,0.04)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",fontSize:14,cursor:"pointer"}}>Sign out</button>
    </div>);
  }

  function renderHealthTab() {
    return (<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{borderRadius:18,background:C.card,boxShadow:C.shadow,overflow:"hidden"}}>
        <button onClick={()=>setHealthSection(p=>({...p,fitness:!p.fitness}))} style={{...F,width:"100%",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}><span style={{fontSize:20}}><Dumbbell size={20}/></span><div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:C.t1}}>Fitness</div><div style={{fontSize:12,color:C.t3,marginTop:2}}>Level, goals, preferences, injuries</div></div><span style={{color:C.t3,transition:"transform 0.2s",transform:healthSection.fitness?"rotate(180deg)":"rotate(0)"}}><ChevronDown size={16}/></span></button>
        {healthSection.fitness&&<div style={{padding:"0 20px 20px"}}>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <div style={{flex:1}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Height</div>{editField==="height"?<div style={{display:"flex",gap:6}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder={'e.g. 5\'10" or 178cm'} style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...(profile?.health||{}),height:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 12px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button></div>:<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1}}>{profile?.health?.height||"Not set"}</div><button onClick={()=>{setEditField("height");setEditVal(profile?.health?.height||"");}} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}</div>
            <div style={{flex:1}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Weight</div>{editField==="weight"?<div style={{display:"flex",gap:6}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. 170lbs or 77kg" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...(profile?.health||{}),weight:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 12px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button></div>:<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1}}>{profile?.health?.weight||"Not set"}</div><button onClick={()=>{setEditField("weight");setEditVal(profile?.health?.weight||"");}} style={{...F,fontSize:12,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}</div>
          </div>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Fitness level</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Beginner","Intermediate","Advanced"].map(t=>(<button key={t} onClick={()=>{const p={...profile,health:{...(profile?.health||{}),fitnessLevel:t}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"8px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:profile?.health?.fitnessLevel===t?C.tealSoft:C.cream,border:`1.5px solid ${profile?.health?.fitnessLevel===t?C.teal:C.b2}`,color:profile?.health?.fitnessLevel===t?C.teal:C.t2,fontWeight:profile?.health?.fitnessLevel===t?600:400}}>{t}</button>))}</div></div>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Goals</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Lose weight","Build muscle","Get toned","Improve cardio","Flexibility","Stress relief","General health","Train for event"].map(g=>{const gl=profile?.health?.fitnessGoals||[];const on=gl.includes(g);return(<button key={g} onClick={()=>{const p={...profile,health:{...(profile?.health||{}),fitnessGoals:on?gl.filter(x=>x!==g):[...gl,g]}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?C.accSoft:C.cream,border:`1.5px solid ${on?C.acc:C.b2}`,color:on?C.acc:C.t2,fontWeight:on?600:400}}>{g}</button>);})}</div></div>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Workout preferences</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Gym","Home workouts","Outdoor","Classes","Yoga","Running","Swimming","Sports","HIIT","Weight training"].map(g=>{const wp=profile?.health?.workoutPrefs||[];const on=wp.includes(g);return(<button key={g} onClick={()=>{const p={...profile,health:{...(profile?.health||{}),workoutPrefs:on?wp.filter(x=>x!==g):[...wp,g]}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?"#E6F7F5":C.cream,border:`1.5px solid ${on?C.teal:C.b2}`,color:on?C.teal:C.t2,fontWeight:on?600:400}}>{g}</button>);})}</div></div>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Frequency</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["1-2x/week","3-4x/week","5-6x/week","Daily"].map(t=>(<button key={t} onClick={()=>{const p={...profile,health:{...(profile?.health||{}),workoutFreq:t}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"8px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:profile?.health?.workoutFreq===t?C.accSoft:C.cream,border:`1.5px solid ${profile?.health?.workoutFreq===t?C.acc:C.b2}`,color:profile?.health?.workoutFreq===t?C.acc:C.t2,fontWeight:profile?.health?.workoutFreq===t?600:400}}>{t}</button>))}</div></div>
          <div><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Injuries or limitations</div>{editField==="injuries"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. bad knee, lower back" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...(profile?.health||{}),injuries:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>:<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.injuries||"None"}</div><button onClick={()=>{setEditField("injuries");setEditVal(profile?.health?.injuries||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}</div>
        </div>}{null}
      </div>
      <div style={{borderRadius:18,background:C.card,boxShadow:C.shadow,overflow:"hidden"}}>
        <button onClick={()=>setHealthSection(p=>({...p,food:!p.food}))} style={{...F,width:"100%",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}><span style={{fontSize:20}}><UtensilsCrossed size={20}/></span><div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:C.t1}}>Food & Allergies</div><div style={{fontSize:12,color:C.t3,marginTop:2}}>Allergens, dietary preferences{(profile?.health?.allergies||[]).length>0?` \u00B7 ${profile.health.allergies.length} set`:""}</div></div><span style={{color:C.t3,transition:"transform 0.2s",transform:healthSection.food?"rotate(180deg)":"rotate(0)"}}><ChevronDown size={16}/></span></button>
        {healthSection.food&&<div style={{padding:"0 20px 20px"}}>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:"#DC3C3C",fontWeight:600,marginBottom:8}}>Allergens</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Gluten-free / Celiac","Dairy","Eggs","Peanuts","Tree nuts","Soy","Fish","Crustaceans (shrimp, crab, lobster)","Molluscs (clams, oysters, squid)","Wheat","Sesame","Legumes","Mustard","Sulfites","Corn","Nightshades"].map(a=>{const al=profile?.health?.allergies||[];const on=al.includes(a);return(<button key={a} onClick={()=>{const p={...profile,health:{...(profile?.health||{}),allergies:on?al.filter(x=>x!==a):[...al,a]}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?"rgba(220,60,60,0.06)":C.cream,border:`1.5px solid ${on?"#DC3C3C":C.b2}`,color:on?"#DC3C3C":C.t2,fontWeight:on?600:400}}>{on?"\u26A0\uFE0F ":""}{a}</button>);})}</div></div>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:C.teal,fontWeight:600,marginBottom:8}}>Dietary preferences</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Vegetarian","Vegan","Pescatarian","Keto","Paleo","Halal","Kosher","Low sodium","Low sugar","Lactose-free"].map(d=>{const di=profile?.health?.diets||[];const on=di.includes(d);return(<button key={d} onClick={()=>{const p={...profile,health:{...(profile?.health||{}),diets:on?di.filter(x=>x!==d):[...di,d]}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",background:on?C.tealSoft:C.cream,border:`1.5px solid ${on?C.teal:C.b2}`,color:on?C.teal:C.t2,fontWeight:on?600:400}}>{d}</button>);})}</div></div>
          <div><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Other allergies</div>{editField==="other_allergies"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. kiwi, latex, medications" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...(profile?.health||{}),otherAllergies:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>:<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.otherAllergies||"None"}</div><button onClick={()=>{setEditField("other_allergies");setEditVal(profile?.health?.otherAllergies||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}</div>
        </div>}{null}
      </div>
      <div style={{borderRadius:18,background:C.card,boxShadow:C.shadow,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}><Building2 size={20}/></span>
          <div style={{flex:1}}><div style={{...F,fontSize:15,fontWeight:600,color:C.t1}}>Medical & Insurance</div><div style={{...F,fontSize:12,color:C.t3,marginTop:2}}>{profile?.health?.medicalEnabled?"Find in-network doctors, manage referrals":"Optional \u2014 help finding doctors & understanding insurance"}</div></div>
          <button onClick={()=>{const p={...profile,health:{...(profile?.health||{}),medicalEnabled:!profile?.health?.medicalEnabled}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{width:48,height:28,borderRadius:14,border:"none",cursor:"pointer",background:profile?.health?.medicalEnabled?C.teal:"#D4D4D4",position:"relative",transition:"all 0.2s"}}><div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,left:profile?.health?.medicalEnabled?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/></button>
        </div>
        {profile?.health?.medicalEnabled&&<div style={{padding:"0 20px 20px"}}>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Insurance Provider</div>{editField==="insurance_provider"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="e.g. Blue Cross, Aetna, Cigna" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...profile.health,provider:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>:<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.provider||"Not set"}</div><button onClick={()=>{setEditField("insurance_provider");setEditVal(profile?.health?.provider||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}</div>
          <div style={{marginBottom:14}}><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Plan Type</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["HMO","PPO","EPO","POS","Not sure"].map(t=>(<button key={t} onClick={()=>{const p={...profile,health:{...profile.health,planType:t}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);}} style={{...F,padding:"8px 14px",borderRadius:10,fontSize:13,cursor:"pointer",background:profile?.health?.planType===t?C.tealSoft:C.cream,border:`1.5px solid ${profile?.health?.planType===t?C.teal:C.b2}`,color:profile?.health?.planType===t?C.teal:C.t2,fontWeight:profile?.health?.planType===t?600:400}}>{t}</button>))}</div>{profile?.health?.planType==="HMO"&&<div style={{...F,fontSize:12,color:C.gold,marginTop:8,padding:"8px 12px",background:C.goldSoft,borderRadius:10}}>HMO plans require a PCP referral before seeing specialists.</div>}</div>
          <div><div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Primary Care Physician</div>{editField==="pcp"?<div style={{display:"flex",gap:8}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Doctor's name or clinic" style={{...F,flex:1,padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.acc}`,background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box"}}/><button onClick={()=>{const p={...profile,health:{...profile.health,pcp:editVal.trim()}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);setEditField(null);}} style={{...F,padding:"10px 14px",borderRadius:12,background:C.accGrad,color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save</button></div>:<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...F,fontSize:14,color:C.t1,flex:1}}>{profile?.health?.pcp||"Not set"}</div><button onClick={()=>{setEditField("pcp");setEditVal(profile?.health?.pcp||"");}} style={{...F,fontSize:13,color:C.acc,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Edit</button></div>}</div>
        </div>}{null}
      </div>
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Health apps</div>{[{icon:<Heart size={18} color="#FF2D55"/>,l:"Apple Health",d:"Steps, heart rate, sleep"},{icon:<Dumbbell size={18} color="#0073CF"/>,l:"MyFitnessPal",d:"Nutrition, calories"},{icon:<Heart size={18} color="#00B0B9"/>,l:"Fitbit",d:"Activity, sleep"},{icon:<Sparkles size={18} color="#F47D31"/>,l:"Headspace",d:"Meditation"}].map(s=>(<div key={s.l} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.b1}`,opacity:.4}}><span style={{width:24,display:"flex",justifyContent:"center"}}>{s.icon}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500,color:C.t1}}>{s.l}</div><div style={{...F,fontSize:12,color:C.t3}}>{s.d} {"·"} Coming soon</div></div></div>))}</div>
      <div style={{...F,fontSize:12,color:C.t3,lineHeight:1.6,padding:"14px 16px",background:C.cream,borderRadius:14}}>Your guide is not a medical professional. Always consult a licensed physician for medical concerns.</div>
    </div>);
  }

  function renderConnectionsTab() {
    const travel=profile?.travel||{};
    const loyaltyPrograms=travel.loyalty||[];
    const saveLoyalty=(programs)=>{const p={...profile,travel:{...travel,loyalty:programs}};setProfile(p);persist(p,allSteps,allPlans,chats,preferences);};
    const sectionLabel=(text)=>(<div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginTop:16,marginBottom:8}}>{text}</div>);
    const comingSoon=(items)=>items.map(s=>(<div key={s.l} style={{padding:14,borderRadius:14,background:C.card,boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12,opacity:.4}}><span style={{width:24,display:"flex",justifyContent:"center"}}>{s.icon}</span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:500,color:C.t1}}>{s.l}</div><div style={{...F,fontSize:12,color:C.t3}}>{s.d} \u00B7 Coming soon</div></div></div>));
    return (<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {sectionLabel("Calendar")}
      <div style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}><Calendar size={20}/></span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>Google Calendar</div><div style={{...F,fontSize:12,color:calData?"#4285F4":C.t3}}>{calData?`Connected \u00B7 ${calData.length} events`:"Not connected"}</div></div>{calData?<button onClick={async()=>{deleteFB(getUserId(profile),"calendar");setCalData(null);setCalToken(null);}} style={{...F,fontSize:12,padding:"6px 14px",borderRadius:10,background:"rgba(220,60,60,0.04)",color:"#DC3C3C",border:"1px solid rgba(220,60,60,0.1)",cursor:"pointer"}}>Disconnect</button>:<button onClick={()=>connectGCal(async r=>{setCalToken(r.access_token);const ev=await fetchGCal(r.access_token);setCalData(ev);saveFB(getUserId(profile),"calendar",{token:r.access_token,events:ev});})} style={{...F,fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,background:"rgba(66,133,244,0.06)",color:"#4285F4",border:"1px solid rgba(66,133,244,0.1)",cursor:"pointer"}}>Connect</button>}</div>
        {calData?.length>0&&<div style={{marginTop:10}}>{calData.slice(0,4).map((e,i)=>{const d=new Date(e.start);return<div key={i} style={{display:"flex",gap:8,padding:"6px 14px",borderRadius:10,background:C.bg,marginBottom:4,alignItems:"center"}}><span style={{...F,fontSize:11,fontWeight:600,color:"#4285F4",minWidth:55}}>{d.toLocaleDateString([],{month:"short",day:"numeric"})}</span><span style={{...F,fontSize:12,color:C.t2,flex:1}}>{e.title}</span></div>;})}{calData.length>4&&<div style={{...F,fontSize:11,color:C.t3,textAlign:"center",marginTop:4}}>+{calData.length-4} more</div>}</div>}{null}
      </div>
      {comingSoon([
        {icon:<Calendar size={20} color="#FF3B30"/>,l:"Apple Calendar",d:"Sync your iCloud calendar"},
        {icon:<Calendar size={20} color="#0078D4"/>,l:"Outlook Calendar",d:"Microsoft 365 calendar"},
      ])}

      {sectionLabel("Fitness")}
      <div style={{padding:16,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}><TrendingUp size={20}/></span><div style={{flex:1}}><div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>Strava</div><div style={{...F,fontSize:12,color:stravaData?"#FC4C02":C.t3}}>{stravaData?"Connected":"Not connected"}</div></div>{stravaData?<button onClick={async()=>{deleteFB(getUserId(profile),"strava");setStravaData(null);}} style={{...F,fontSize:12,padding:"6px 14px",borderRadius:10,background:"rgba(220,60,60,0.04)",color:"#DC3C3C",border:"1px solid rgba(220,60,60,0.1)",cursor:"pointer"}}>Disconnect</button>:<button onClick={connectStrava} style={{...F,fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,background:C.accSoft,color:C.acc,border:`1px solid ${C.accBorder}`,cursor:"pointer"}}>Connect</button>}</div>
        {stravaData?.profile&&<div style={{padding:"10px 14px",borderRadius:12,background:C.bg,marginTop:10,display:"flex",gap:16}}><div><div style={{...F,fontSize:18,fontWeight:700,color:"#FC4C02"}}>{stravaData.profile.allTimeRuns}</div><div style={{...F,fontSize:10,color:C.t3}}>Runs</div></div><div><div style={{...F,fontSize:18,fontWeight:700,color:"#FC4C02"}}>{stravaData.profile.allTimeRunDistance}</div><div style={{...F,fontSize:10,color:C.t3}}>Distance</div></div><div><div style={{...F,fontSize:18,fontWeight:700,color:"#FC4C02"}}>{stravaData.profile.allTimeRides}</div><div style={{...F,fontSize:10,color:C.t3}}>Rides</div></div></div>}{null}
      </div>
      {comingSoon([
        {icon:<Heart size={20} color="#FF2D55"/>,l:"Apple Health",d:"Steps, workouts & vitals"},
        {icon:<TrendingUp size={20} color="#4285F4"/>,l:"Google Fit",d:"Activity & health data"},
      ])}

      {sectionLabel("Travel & Loyalty Programs")}
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.5,marginBottom:12}}>Add your preferred airlines, hotels, and loyalty numbers so your guide can book smarter.</div>
        {loyaltyPrograms.map((lp,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<loyaltyPrograms.length-1?`1px solid ${C.b1}`:"none"}}>
          <div style={{width:36,height:36,borderRadius:10,background:lp.type==="airline"?C.accSoft:lp.type==="hotel"?"#EDE9FE":C.tealSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>{lp.type==="airline"?<Globe size={16} color={C.acc}/>:lp.type==="hotel"?<Building2 size={16} color="#6D28D9"/>:<Star size={16} color={C.teal}/>}</div>
          <div style={{flex:1}}>
            <div style={{...F,fontSize:14,fontWeight:600,color:C.t1}}>{lp.name}</div>
            <div style={{...F,fontSize:12,color:C.t3}}>{lp.type==="airline"?"Airline":lp.type==="hotel"?"Hotel":lp.type==="car"?"Car rental":"Other"}{lp.number?` \u00B7 ${lp.number}`:""}</div>
          </div>
          <button onClick={()=>{saveLoyalty(loyaltyPrograms.filter((_,j)=>j!==i));}} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}><X size={14}/></button>
        </div>))}
        {editField==="add_loyalty"?(<div style={{padding:14,borderRadius:14,background:C.bg,marginTop:8}}>
          <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Type</div>
          <div style={{display:"flex",gap:6,marginBottom:10}}>{["airline","hotel","car","other"].map(t=>(<button key={t} onClick={()=>setGenderEdit(t)} style={{...F,padding:"6px 12px",borderRadius:10,fontSize:12,cursor:"pointer",textTransform:"capitalize",background:genderEdit===t?C.accSoft:C.cream,border:`1.5px solid ${genderEdit===t?C.acc:C.b2}`,color:genderEdit===t?C.acc:C.t2,fontWeight:genderEdit===t?600:400}}>{t}</button>))}</div>
          <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Name (e.g. United, Marriott, Hertz)</div>
          <input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Program name" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          <div style={{...F,fontSize:12,color:C.t3,marginBottom:6}}>Membership / frequent flyer number (optional)</div>
          <input value={genderOtherEdit} onChange={e=>setGenderOtherEdit(e.target.value)} placeholder="e.g. FF123456789" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:`1.5px solid ${C.b2}`,background:C.card,color:C.t1,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setEditField(null);setEditVal("");setGenderEdit("");setGenderOtherEdit("");}} style={{...F,flex:1,padding:8,borderRadius:10,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:12,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{if(editVal.trim()){saveLoyalty([...loyaltyPrograms,{name:editVal.trim(),type:genderEdit||"airline",number:genderOtherEdit.trim()}]);setEditField(null);setEditVal("");setGenderEdit("");setGenderOtherEdit("");}}} style={{...F,flex:1,padding:8,borderRadius:10,border:"none",background:C.accGrad,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Add</button>
          </div>
        </div>):(<button onClick={()=>{setEditField("add_loyalty");setEditVal("");setGenderEdit("airline");setGenderOtherEdit("");}} style={{...F,width:"100%",padding:"12px",borderRadius:12,background:C.bg,border:`1.5px dashed ${C.b2}`,color:C.acc,fontSize:13,fontWeight:600,cursor:"pointer",marginTop:8}}><Plus size={14}/> Add airline, hotel, or program</button>)}{null}
      </div>

      {sectionLabel("Dining")}
      {comingSoon([
        {icon:<UtensilsCrossed size={20} color="#DA3743"/>,l:"OpenTable",d:"Restaurant reservations"},
        {icon:<UtensilsCrossed size={20} color="#1A1A1A"/>,l:"Resy",d:"Restaurant reservations"},
      ])}

      {sectionLabel("Social")}
      {comingSoon([
        {icon:<Briefcase size={20} color="#1877F2"/>,l:"Facebook",d:"Events & social"},
        {icon:<Briefcase size={20} color="#0A66C2"/>,l:"LinkedIn",d:"Professional network"},
        {icon:<Sparkles size={20} color="#E4405F"/>,l:"Instagram",d:"Photos & social"},
      ])}

      {sectionLabel("Entertainment")}
      {comingSoon([
        {icon:<Star size={20} color="#1DB954"/>,l:"Spotify",d:"Music & podcasts"},
      ])}
    </div>);
  }

  function renderInsightsTab() {
    return (<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Your activity</div>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1,padding:14,borderRadius:12,background:C.accSoft,textAlign:"center"}}><div style={{...H,fontSize:24,color:C.acc}}>{totalCompleted}</div><div style={{...F,fontSize:11,color:C.t2,marginTop:2}}>Completed</div></div>
          <div style={{flex:1,padding:14,borderRadius:12,background:C.tealSoft,textAlign:"center"}}><div style={{...H,fontSize:24,color:C.teal}}>{thisWeekDone}</div><div style={{...F,fontSize:11,color:C.t2,marginTop:2}}>This week</div></div>
          <div style={{flex:1,padding:14,borderRadius:12,background:C.cream,textAlign:"center"}}><div style={{...H,fontSize:24,color:C.gold}}>{allSteps.filter(s=>s.loved).length}</div><div style={{...F,fontSize:11,color:C.t2,marginTop:2}}>Loved</div></div>
        </div>
      </div>
      {Object.keys(completedByCategory).length>0&&<div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>What you do most</div>
        {Object.entries(completedByCategory).sort((a,b)=>b[1]-a[1]).map(([cat,count])=>{const pct=totalCompleted>0?count/totalCompleted*100:0;return(
          <div key={cat} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{...F,fontSize:13,fontWeight:500,color:C.t1,textTransform:"capitalize"}}>{catIcon(cat)} {cat}</span><span style={{...F,fontSize:12,color:C.t3}}>{count} done</span></div>
            <div style={{height:6,background:C.cream,borderRadius:3}}><div style={{height:"100%",width:`${pct}%`,background:C.accGrad,borderRadius:3,transition:"width 0.5s"}}/></div>
          </div>
        );})}
      </div>}{null}
      {profile?.insights?.length>0&&<div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Profile insights ({profile.insights.length})</div>{profile.insights.map((ins,i)=>(<div key={i} style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,padding:"8px 0",borderBottom:i<profile.insights.length-1?`1px solid ${C.b1}`:"none"}}>{ins.text}</div>))}</div>}{null}
      {preferences.length>0&&<div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}><div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Learned preferences</div>{preferences.map((p,i)=>(<div key={i} style={{...F,fontSize:14,color:C.t2,lineHeight:1.6,padding:"8px 0",borderBottom:i<preferences.length-1?`1px solid ${C.b1}`:"none"}}><span style={{fontWeight:600,color:C.t1,textTransform:"capitalize"}}>{p.key?.replace(/_/g," ")}:</span> {p.value}</div>))}</div>}{null}
      {totalCompleted===0&&!profile?.insights?.length&&!preferences.length&&<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:28,marginBottom:8}}><Sparkles size={18} color="#F47D31"/></div><div style={{...F,fontSize:14,color:C.t2}}>Complete some steps to see your patterns here.</div></div>}{null}
    </div>);
  }

  function renderAboutTab() {
    return (<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><div style={{width:40,height:40,borderRadius:12,background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><Logo size={24} color="#fff"/></div><div><div style={{...H,fontSize:16,color:C.t1}}>My Next Step</div><div style={{...F,fontSize:12,color:C.t3}}>v1.0 Beta</div></div></div>
        <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.6}}>Your AI guide that turns goals into actionable steps.</div>
      </div>
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Legal</div>
        <div onClick={()=>setLegalModal("terms")} style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"5px 0"}}>Terms of Service</div>
        <div onClick={()=>setLegalModal("privacy")} style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"5px 0"}}>Privacy Policy</div>
        <div onClick={()=>setLegalModal("affiliate")} style={{...F,fontSize:14,color:C.acc,cursor:"pointer",padding:"5px 0"}}>Affiliate Disclosure</div>
        <div style={{...F,fontSize:13,color:C.t3,marginTop:8,lineHeight:1.5,padding:"10px 14px",background:C.cream,borderRadius:10}}>Some links may earn us a small commission at no extra cost to you. This helps keep My Next Step free.</div>
      </div>
      <div style={{padding:18,borderRadius:16,background:C.card,boxShadow:C.shadow}}>
        <div style={{...F,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Data & Privacy</div>
        <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.6,marginBottom:14,padding:"10px 14px",background:C.cream,borderRadius:12}}>Your data is stored securely and never shared with third parties. We do not sell, rent, or trade your personal information.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>setLegalModal("dnsmpi")} style={{...F,width:"100%",padding:"12px 16px",borderRadius:12,background:C.bg,border:`1px solid ${C.b2}`,color:C.t1,fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}><Shield size={16} color={C.teal}/> Don't sell my personal information</button>
          {!deleteConfirm?<button onClick={()=>{setDeleteConfirm(true);setDeleteText("");}} style={{...F,width:"100%",padding:"12px 16px",borderRadius:12,background:"rgba(220,60,60,0.04)",border:"1px solid rgba(220,60,60,0.1)",color:"#DC3C3C",fontSize:13,cursor:"pointer",textAlign:"left"}}>Delete my account and all data</button>
          :<div>
            <div style={{...F,fontSize:14,color:"#DC3C3C",fontWeight:600,marginBottom:8}}>This is permanent</div>
            <div style={{...F,fontSize:13,color:C.t2,lineHeight:1.6,marginBottom:12}}>Your profile, all steps, journeys, routines, chat history, and connected accounts will be permanently deleted. This cannot be undone.</div>
            <div style={{...F,fontSize:12,color:C.t3,marginBottom:8}}>Type <span style={{fontWeight:700,color:"#DC3C3C"}}>delete my account</span> to confirm:</div>
            <input value={deleteText} onChange={e=>setDeleteText(e.target.value)} placeholder="delete my account" style={{...F,width:"100%",padding:"10px 14px",fontSize:14,borderRadius:12,border:"1.5px solid rgba(220,60,60,0.3)",background:C.bg,color:C.t1,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setDeleteConfirm(false);setDeleteText("");}} style={{...F,flex:1,padding:10,borderRadius:12,border:`1px solid ${C.b1}`,background:C.card,color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{if(deleteText.toLowerCase().trim()==="delete my account"){const uid=getUserId(profile);if(uid){deleteFB(uid,"appdata");deleteFB(uid,"strava");deleteFB(uid,"calendar");}resetAll();}}} disabled={deleteText.toLowerCase().trim()!=="delete my account"} style={{...F,flex:1,padding:10,borderRadius:12,border:"none",background:deleteText.toLowerCase().trim()==="delete my account"?"#DC3C3C":"rgba(220,60,60,0.1)",color:deleteText.toLowerCase().trim()==="delete my account"?"#fff":"rgba(220,60,60,0.3)",fontSize:13,fontWeight:600,cursor:deleteText.toLowerCase().trim()==="delete my account"?"pointer":"default"}}>Delete permanently</button>
            </div>
          </div>}
        </div>
      </div>
    </div>);
  }

  // showSettings guard removed - parent controls visibility with && in JSX

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:C.bg,overflowY:"auto",padding:20}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h2 style={{...H,fontSize:26,color:C.t1,margin:0}}>Settings</h2><button onClick={()=>setShowSettings(false)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.b1}`,boxShadow:C.shadow,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:C.t3}}><X size={16}/></button></div>

        <div style={{padding:20,borderRadius:18,background:C.card,boxShadow:C.shadow,marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:52,height:52,borderRadius:16,background:C.accGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",fontWeight:700}}>{profile?.name?.charAt(0)?.toUpperCase()}</div>
          <div><div style={{...H,fontSize:18,color:C.t1}}>{profile?.name}</div><div style={{...F,fontSize:13,color:C.t3}}>{profile?.email}</div></div>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {[{id:"profile",l:"Profile"},{id:"health",l:"Health & Fitness"},{id:"connections",l:"Connected"},{id:"insights",l:"AI Insights"},{id:"about",l:"About"}].map(t=>(<button key={t.id} onClick={()=>setSettingsTab(t.id)} style={{...F,flex:1,padding:"9px 4px",background:settingsTab===t.id?C.card:"transparent",border:settingsTab===t.id?`1.5px solid ${C.b2}`:"1.5px solid transparent",borderRadius:12,cursor:"pointer",fontSize:10,fontWeight:settingsTab===t.id?600:400,color:settingsTab===t.id?C.t1:C.t3,boxShadow:settingsTab===t.id?C.shadow:"none"}}>{t.l}</button>))}
        </div>

        {settingsTab==="profile" && renderProfileTab()}
        {settingsTab==="health" && renderHealthTab()}
        {settingsTab==="connections" && renderConnectionsTab()}
        {settingsTab==="insights" && renderInsightsTab()}
        {settingsTab==="about" && renderAboutTab()}

      </div>
    </div>
  );
}
