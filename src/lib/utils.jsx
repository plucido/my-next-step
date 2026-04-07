import { useState, useEffect } from "react";
import { Briefcase, Heart, Sparkles, Globe, Calendar, Star, Dumbbell, TrendingUp, Zap } from "lucide-react";
import { C, F, SEGMENTS, AFF } from "../lib/constants.js";

// ─── BRAND LOGO ───
export function Logo({size=32,color}){return<svg width={size} height={size} viewBox="0 0 40 40" fill="none"><path d="M20 4C14.5 4 10 7.5 10 12c0 3 1.5 5.5 4 7.5L20 36l6-16.5c2.5-2 4-4.5 4-7.5C30 7.5 25.5 4 20 4z" fill={color||C.acc} opacity="0.9"/><path d="M20 8c-2.8 0-5 1.8-5 4.5 0 1.8 1 3.3 2.5 4.5L20 26l2.5-9c1.5-1.2 2.5-2.7 2.5-4.5C25 9.8 22.8 8 20 8z" fill="#fff" opacity="0.3"/><circle cx="20" cy="13" r="2.5" fill="#fff"/></svg>}

// ─── SEGMENT ICONS ───
export const segIcon=(key,size=18,color)=>{const props={size,strokeWidth:2,color:color||SEGMENTS[key]?.color||C.acc};switch(key){case"career":return<Briefcase {...props}/>;case"wellness":return<Heart {...props}/>;case"adventure":return<Globe {...props}/>;default:return<Calendar {...props}/>;}};
export const catIconMap={fitness:<Dumbbell size={14}/>,wellness:<Heart size={14}/>,career:<Briefcase size={14}/>,learning:<TrendingUp size={14}/>,social:<Sparkles size={14}/>,events:<Calendar size={14}/>,travel:<Globe size={14}/>,products:<Star size={14}/>};
export function catIcon(cat){return catIconMap[cat]||<Zap size={14}/>;}

// Map AI categories to segments
export const catToSeg = c => {
  if (["career", "learning", "products"].includes(c)) return "career";
  if (["fitness", "wellness"].includes(c)) return "wellness";
  if (["social", "events", "travel", "fun"].includes(c)) return "adventure";
  return "wellness"; // default
};

export function getGreeting() { const h = new Date().getHours(); if (h >= 5 && h < 12) return "Good morning"; if (h >= 12 && h < 17) return "Good afternoon"; return "Good evening"; }
export function FadeIn({ children, delay = 0, style: sx }) { const [s, setS] = useState(false); useEffect(() => { const t = setTimeout(() => setS(true), delay); return () => clearTimeout(t); }, []); return <div style={{ opacity: s ? 1 : 0, transform: s ? "translateY(0)" : "translateY(10px)", transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)", ...sx }}>{children}</div>; }
export function ProgressRing({ progress, size = 32, stroke = 3, color }) { const r = (size - stroke) / 2, ci = 2 * Math.PI * r; return <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.cream} strokeWidth={stroke} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color||C.acc} strokeWidth={stroke} strokeDasharray={ci} strokeDashoffset={ci - progress * ci} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} /></svg>; }

// ─── MARKDOWN CLEANER ───
export function clean(text){if(!text)return text;let t=text;
  // Strip markdown
  t=t.replace(/\*\*\*(.*?)\*\*\*/g,"$1");t=t.replace(/\*\*(.*?)\*\*/g,"$1");t=t.replace(/\*(.*?)\*/g,"$1");
  t=t.replace(/^#{1,6}\s+/gm,"");t=t.replace(/`([^`]+)`/g,"$1");t=t.replace(/```[\s\S]*?```/g,"");
  t=t.replace(/_{2}(.*?)_{2}/g,"$1");t=t.replace(/~{2}(.*?)~{2}/g,"$1");t=t.replace(/\[([^\]]+)\]\([^)]+\)/g,"$1");
  // Strip ALL CAPS HEADERS like "FLIGHTS:", "PERFECT TIMING:", "HOTELS:"
  t=t.replace(/^[A-Z][A-Z\s]{2,}:\s*/gm,"");
  // Strip bullets and list markers
  t=t.replace(/^[\u2022\-\*]\s*/gm,"");t=t.replace(/^\d+[.)]\s*/gm,"");
  // Strip orphaned punctuation lines (citation artifacts)
  t=t.replace(/^\s*[.!]\s*$/gm,"");
  // Strip citation markers like [1], [2], 【1†source】 etc
  t=t.replace(/\[\d+\]/g,"");
  t=t.replace(/\u3010[^】]*\u3011/g,"");
  t=t.replace(/\[\d+†[^\]]*\]/g,"");
  // Strip <cite> tags from web search
  t=t.replace(/<cite[^>]*>|<\/cite>/g,"");
  // Strip any remaining HTML tags
  t=t.replace(/<[^>]+>/g,"");
  // Strip orphaned special chars left by citation removal
  t=t.replace(/[†‡§]+/g,"");
  // Fix punctuation artifacts: leading comma/period after newline, double spaces before punctuation
  t=t.replace(/\n\s*,\s*/g," ");
  t=t.replace(/\n\s*\.\s*/g,". ");
  t=t.replace(/\s+([,.])/g,"$1");
  t=t.replace(/([.!?])\s*\n\s*([a-z])/g,"$1 $2");
  // Collapse excessive whitespace
  t=t.replace(/\n{3,}/g,"\n\n");t=t.replace(/^\s+$/gm,"");t=t.replace(/ {2,}/g," ");
  return t.trim();}

export function wrapLink(url,id){if(!url)return url;try{const u=new URL(url);u.searchParams.set("utm_source","mynextstep");u.searchParams.set("utm_medium","app");u.searchParams.set("utm_campaign",`a_${id||"u"}`);const h=u.hostname.replace("www.","");for(const[d,p]of Object.entries(AFF))if(h.includes(d.split("/")[0])){u.searchParams.set("ref",p.tag);break;}return u.toString();}catch{return url;}}
export function trackClick(id,url,cat,title){try{const c=JSON.parse(localStorage.getItem("mns_clicks")||"[]");const h=new URL(url).hostname.replace("www.","");let cm=.1;for(const[d,p]of Object.entries(AFF))if(h.includes(d.split("/")[0])){cm=p.c;break;}c.push({id:id||""+Date.now(),url,category:cat||"other",title:title||"",timestamp:new Date().toISOString(),estimatedCommission:cm});localStorage.setItem("mns_clicks",JSON.stringify(c));}catch{}}
export function TLink({href,actionId,category,title,children,style:sx}){return<a href={wrapLink(href,actionId)} target="_blank" rel="noopener noreferrer" onClick={()=>trackClick(actionId,href,category,title)} style={sx}>{children}</a>;}
