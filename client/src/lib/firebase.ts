import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";

// Get current domain for improved debugging
const currentDomain = window.location.hostname;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "1062549941272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase but don't set up auto-login
console.log('Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentDomain
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

console.log('Firebase initialized without auto-login');

// Basic auth functions without auto-login
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    console.log('Attempting sign in with popup...');
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    console.error("Authentication failed:", error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

export function signOut() {
  console.log('Signing out user...');
  return firebaseSignOut(auth);
}

// Property query functions without auto-login
export async function savePropertyQuery(userId: string, property: any) {
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