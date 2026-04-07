import { X } from "lucide-react";
import { C, F, H } from "../lib/constants.js";

export default function LegalModal({legalModal,setLegalModal,profile,setProfile,persist,allSteps,allPlans,chats,preferences}){
  if(!legalModal)return null;

  function renderContent() {
    if(legalModal==="terms") return (<div>
      <p>Last updated: April 2026</p>
      <p>Welcome to My Next Step. By using this app, you agree to these terms.</p>
      <p>My Next Step provides AI-powered life guidance including step and journey recommendations, fitness suggestions, and healthcare provider search. The app is not a substitute for professional medical, financial, or legal advice.</p>
      <p>We use third-party AI (Anthropic Claude) to generate recommendations. While we strive for accuracy, recommendations may not always be perfect. Always verify important details independently.</p>
      <p>You retain ownership of all personal data you provide. We store your data securely using Firebase/Firestore. You can delete your account and all associated data at any time from Settings.</p>
      <p>We reserve the right to modify these terms. Continued use of the app constitutes acceptance of updated terms.</p>
    </div>);
    if(legalModal==="privacy") return (<div>
      <p>Last updated: April 2026</p>
      <p>Your privacy matters to us. Here is how we handle your data:</p>
      <p>We collect: your name, email, age, gender, location, fitness preferences, insurance information (if opted in), chat history, and step/journey data.</p>
      <p>We use this data to: personalize AI recommendations, sync your data across devices, improve the app experience, and share with selected third-party partners for marketing and personalization purposes.</p>
      <p>Third-party services: We use Firebase (Google) for data storage, Anthropic Claude for AI, and optionally connect to Strava and Google Calendar with your explicit permission. We may share data with advertising and analytics partners.</p>
      <p>Data deletion: You can delete all your data at any time from Settings. When you delete your account, all data is permanently removed from our servers.</p>
      <p>Health data: Health and fitness information is only collected when you explicitly opt in. It is used to personalize recommendations and may be shared with wellness partners.</p>
      <p>Opt-out: You can opt out of the sale of your personal information at any time from Settings under Data and Privacy.</p>
    </div>);
    if(legalModal==="affiliate") return (<div>
      <p>Last updated: April 2026</p>
      <p>My Next Step may include links to third-party products and services. Some of these links are affiliate links, meaning we may earn a small commission if you make a purchase or booking through them.</p>
      <p>This comes at no additional cost to you. Affiliate relationships do not influence which products or services we recommend {"\u2014"} recommendations are based on your personal preferences, location, and goals.</p>
      <p>Our affiliate partners may include: ClassPass, Eventbrite, Udemy, Skillshare, Mindbody, Meetup, Amazon, LinkedIn Learning, Airbnb, Kayak, Booking.com, VRBO, and others.</p>
      <p>Revenue from affiliate links helps keep My Next Step free for all users.</p>
    </div>);
    if(legalModal==="dnsmpi") {
      var optedOut = profile?.privacyOptOut || false;
      return (<div>
        <p>Last updated: April 2026</p>
        <p>Under the California Consumer Privacy Act (CCPA) and similar state privacy laws, you have the right to opt out of the sale of your personal information.</p>
        <p>My Next Step may share your personal information {"\u2014"} including your profile, preferences, fitness data, and activity data {"\u2014"} with third-party partners for marketing, analytics, and personalization purposes.</p>
        <p>You can opt out of this at any time using the toggle below. When opted out, your data will only be used to provide the My Next Step service and will not be shared with third parties for their marketing purposes.</p>
        <div style={{padding:16,borderRadius:14,background:C.cream,marginTop:16,display:"flex",alignItems:"center",gap:14}}>
          <div style={{flex:1}}>
            <div style={{...F,fontSize:15,fontWeight:600,color:C.t1}}>{optedOut?"Opted out":"Data sharing active"}</div>
            <div style={{...F,fontSize:12,color:C.t3,marginTop:2}}>{optedOut?"Your data is not being sold or shared for marketing":"Your data may be shared with third-party partners"}</div>
          </div>
          <button onClick={function(){var p={...profile,privacyOptOut:!optedOut};setProfile(p);if(persist)persist(p,allSteps,allPlans,chats,preferences);}} style={{width:50,height:28,borderRadius:14,border:"none",cursor:"pointer",background:optedOut?C.teal:"rgba(0,0,0,0.15)",position:"relative",transition:"background 0.2s"}}>
            <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,left:optedOut?25:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}>{null}</div>
          </button>
        </div>
        <p style={{fontSize:12,color:C.t3,marginTop:12}}>Changes take effect immediately. You can change this setting at any time.</p>
      </div>);
    }
    return null;
  }

  var title = legalModal==="terms"?"Terms of Service":legalModal==="privacy"?"Privacy Policy":legalModal==="dnsmpi"?"Do Not Sell My Personal Information":"Affiliate Disclosure";

  return(<div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(){setLegalModal(null);}}>
    <div onClick={function(e){e.stopPropagation();}} style={{width:"100%",maxWidth:480,maxHeight:"80vh",overflowY:"auto",background:C.card,borderRadius:24,padding:28,boxShadow:C.shadowLg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{...H,fontSize:20,color:C.t1}}>{title}</div>
        <button onClick={function(){setLegalModal(null);}} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:18}}><X size={16}/></button>
      </div>
      <div style={{...F,fontSize:14,color:C.t2,lineHeight:1.8}}>
        {renderContent()}
      </div>
    </div>
  </div>);
}
