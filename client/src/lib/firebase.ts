import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { getDatabase, ref, get, set, query, orderByChild, equalTo } from "firebase/database";
import type { PropertyDetailsResponse } from "types";

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

// Property query functions
export async function savePropertyQuery(userId: string, property: PropertyDetailsResponse) {
  const queryRef = ref(db, `queries/${userId}/${property.id}`);
  await set(queryRef, {
    ...property,
    timestamp: Date.now()
  });
  return property;
}

export async function getPropertyQuery(userId: string, propertyId: string) {
  const queryRef = ref(db, `queries/${userId}/${propertyId}`);
  const snapshot = await get(queryRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export async function getSavedQueries(userId: string) {
  const queriesRef = ref(db, `queries/${userId}`);
  const snapshot = await get(queriesRef);
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
}

// AI analysis cache helpers
export async function getCachedAnalysis(propertyId: string) {
  const analysisRef = ref(db, `analyses/${propertyId}`);
  const snapshot = await get(analysisRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export async function cacheAnalysis(propertyId: string, analysis: any) {
  const analysisRef = ref(db, `analyses/${propertyId}`);
  await set(analysisRef, {
    ...analysis,
    timestamp: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Cache for 24 hours
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