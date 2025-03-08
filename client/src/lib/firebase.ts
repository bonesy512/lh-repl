import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "landhacker-9a7c1.firebaseapp.com",
  databaseURL: "https://landhacker-9a7c1-default-rtdb.firebaseio.com",
  projectId: "landhacker-9a7c1",
  storageBucket: "landhacker-9a7c1.firebasestorage.app",
  messagingSenderId: "1062549941272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Cache helpers for AI analysis results
export async function getCachedAnalysis(parcelId: string) {
  const analysisRef = ref(db, `analyses/${parcelId}`);
  const snapshot = await get(analysisRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export async function cacheAnalysis(parcelId: string, analysis: any) {
  const analysisRef = ref(db, `analyses/${parcelId}`);
  await set(analysisRef, {
    ...analysis,
    timestamp: Date.now(),
    // Cache for 24 hours
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  });
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function signOut() {
  return auth.signOut();
}