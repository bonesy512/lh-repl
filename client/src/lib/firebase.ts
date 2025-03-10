import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, signOut as firebaseSignOut, getRedirectResult } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "1062549941272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
console.log('Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Property query functions
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

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    console.log('Attempting sign in with popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('Google sign in successful:', {
      email: result.user.email,
      displayName: result.user.displayName
    });
    return result;
  } catch (error: any) {
    console.error("signInWithPopup failed:", error);
    console.log('Falling back to redirect sign in...');
    try {
      await signInWithRedirect(auth, provider);
    } catch (redirectError: any) {
      console.error("signInWithRedirect failed:", redirectError);
      throw new Error(`Authentication failed: ${redirectError.message}`);
    }
  }
}

export function signOut() {
  console.log('Signing out user...');
  return firebaseSignOut(auth);
}

// Handle redirect result
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Redirect result successful:", {
        email: result.user.email,
        displayName: result.user.displayName
      });
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
}

// Set up Firebase auth state observer with enhanced logging
auth.onAuthStateChanged((user) => {
  console.log("Auth state changed:", user ? {
    email: user.email,
    displayName: user.displayName,
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    emailVerified: user.emailVerified
  } : "User logged out");
});