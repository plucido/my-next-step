import { useState, useEffect, useCallback } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { F, C } from "./constants.js";

var toastListeners = [];
var toastId = 0;

export function showToast(message, type) {
  toastId++;
  var t = { id: toastId, message: message, type: type || "success" };
  toastListeners.forEach(function(fn) { fn(t); });
}

export function showConfirm(message, onConfirm) {
  toastId++;
  var t = { id: toastId, message: message, type: "confirm", onConfirm: onConfirm };
  toastListeners.forEach(function(fn) { fn(t); });
}

export default function ToastContainer() {
  var [toasts, setToasts] = useState([]);

  useEffect(function() {
    function handler(t) {
      setToasts(function(prev) { return [...prev, t]; });
      if (t.type !== "confirm") {
        setTimeout(function() {
          setToasts(function(prev) { return prev.filter(function(x) { return x.id !== t.id; }); });
        }, 3000);
      }
    }
    toastListeners.push(handler);
    return function() { toastListeners = toastListeners.filter(function(fn) { return fn !== handler; }); };
  }, []);

  function dismiss(id) {
    setToasts(function(prev) { return prev.filter(function(x) { return x.id !== id; }); });
  }

  if (toasts.length === 0) return null;

  var icons = {
    success: <Check size={16} color="#fff"/>,
    error: <AlertTriangle size={16} color="#fff"/>,
    info: <Info size={16} color="#fff"/>,
    confirm: <AlertTriangle size={16} color="#fff"/>,
  };
  var colors = {
    success: C.teal,
    error: "#DC3C3C",
    info: C.acc,
    confirm: "#B45309",
  };

  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:400,display:"flex",flexDirection:"column",gap:8,maxWidth:400,width:"calc(100% - 40px)"}}>
      {toasts.map(function(t) {
        var bg = colors[t.type] || C.teal;
        return (
          <div key={t.id} style={{padding:"12px 16px",borderRadius:14,background:bg,color:"#fff",boxShadow:"0 8px 32px rgba(0,0,0,0.15)",display:"flex",alignItems:"center",gap:10,animation:"fadeDown 0.3s ease",...F,fontSize:14}}>
            <div style={{flexShrink:0}}>{icons[t.type]}</div>
            <div style={{flex:1,fontWeight:500}}>{t.message}</div>
            {t.type === "confirm" ? <div style={{display:"flex",gap:6}}>
              <button onClick={function(){if(t.onConfirm)t.onConfirm();dismiss(t.id);}} style={{...F,padding:"5px 14px",borderRadius:8,border:"none",background:"rgba(255,255,255,0.25)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Yes</button>
              <button onClick={function(){dismiss(t.id);}} style={{...F,padding:"5px 14px",borderRadius:8,border:"none",background:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.8)",fontSize:12,cursor:"pointer"}}>No</button>
            </div> : <button onClick={function(){dismiss(t.id);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",padding:2}}><X size={14}/></button>}
          </div>
        );
      })}
    </div>
  );
}
