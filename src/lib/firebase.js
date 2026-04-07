// Firebase client — direct Firestore access + API proxy fallback
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBzV5b0K5bGjZZEXfC8Jqxus_PvH4oeXBc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "my-next-step-492323.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "my-next-step-492323",
  storageBucket: "my-next-step-492323.firebasestorage.app",
  messagingSenderId: "468026107222",
  appId: "1:468026107222:web:5544bb25aadc07c234e2f7",
};

export const fbApp = initializeApp(firebaseConfig);
export const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

export function getUserId(p) {
  return p?.email ? p.email.replace(/[^a-zA-Z0-9]/g, "_") : null;
}

export async function saveFB(uid, key, data) {
  if (!uid) return;
  try {
    await setDoc(doc(db, "users", uid, "data", key), {
      value: JSON.stringify(data),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("FB save:", e);
  }
}

export async function loadFB(uid, key) {
  if (!uid) return null;
  try {
    const s = await getDoc(doc(db, "users", uid, "data", key));
    if (s.exists()) return JSON.parse(s.data().value);
  } catch (e) {
    console.error("FB load:", e);
  }
  return null;
}

export async function deleteFB(uid, key) {
  if (!uid) return;
  try {
    await deleteDoc(doc(db, "users", uid, "data", key));
  } catch (e) {}
}
