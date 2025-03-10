import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, signOut as firebaseSignOut, getRedirectResult, browserLocalPersistence, setPersistence } from "firebase/auth";
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

// Initialize Firebase
console.log('Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentDomain
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

console.log('Firebase initialized successfully');

// Set up persistence - important for auth state maintenance
console.log('Setting Firebase persistence to LOCAL...');
try {
  // Check if we're in a webview/iframe context
  const isEmbedded = window.parent !== window;
  const userAgent = navigator.userAgent;

  if (isEmbedded) {
    console.log('Skipping persistence setup in webview context');
    
    // Log additional info for debugging
    console.log('Webview detection:', {
      isEmbedded,
      userAgent
    });
  } else {
    // Not in webview, so set persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('Firebase persistence set to LOCAL'))
      .catch(error => console.error('Error setting persistence:', error));
  }
} catch (e) {
  console.error('Error during persistence setup:', e);
}

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
  
  // Check if we're in a webview/iframe context
  const isEmbedded = window.parent !== window;
  
  // Log auth environment for debugging
  console.log('Auth environment:', {
    isWebView: isEmbedded,
    href: window.location.href,
    origin: window.location.origin,
    parent: !!window.parent
  });
  
  if (isEmbedded) {
    // In webview/iframe, open in a new window/tab
    const authUrl = `${window.location.origin}/auth`;
    console.log('Opening auth in new tab:', authUrl);
    window.open(authUrl, '_blank');
    return null;
  } else {
    // Regular flow for non-webview
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