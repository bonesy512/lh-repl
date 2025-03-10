// Update the initialization and auth flow handling
import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, User, browserLocalPersistence, setPersistence, getRedirectResult } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";

// Verify Firebase configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const currentDomain = window.location.hostname;
console.log("Current domain:", currentDomain);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "1062549941272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("Initializing Firebase with config:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentDomain
});

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

export const auth = getAuth(app);
export const db = getDatabase(app);

// Set persistence to LOCAL only if not in webview
console.log('Setting Firebase persistence to LOCAL...');
try {
  const isWebView = window.parent !== window;

  if (!isWebView) {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Firebase persistence set successfully");
        // Check for redirect result on page load
        return handleRedirectResult();
      })
      .catch((error) => {
        console.error('Firebase persistence error:', error.message, error.stack);
      });
  } else {
    console.log("Skipping persistence setup in webview context");
    handleRedirectResult().catch(error => {
      console.error('Redirect result error in webview:', error);
    });
  }
} catch (error) {
  console.error('Failed to set persistence:', error);
}

// Handle redirect result
async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Redirect sign-in successful:", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      return result.user;
    }
  } catch (error: any) {
    console.error('Redirect sign-in error:', error.message, error.stack);
    handleAuthError(error);
  }
}

function handleAuthError(error: any) {
  if (error.code === 'auth/unauthorized-domain') {
    const errorMessage = `The domain "${currentDomain}" is not authorized for Firebase Authentication. Please check the authorized domains list in your Firebase Console:\n1. Go to Firebase Console\n2. Select your project\n3. Go to Authentication > Settings > Authorized domains\n4. Verify "${currentDomain}" is in the list`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  } else if (error.code === 'auth/invalid-action-code') {
    throw new Error('The sign-in link has expired or has already been used. Please try signing in again.');
  } else {
    console.error('Authentication error:', error.code, error.message);
    throw error;
  }
}

export async function signInWithGoogle(): Promise<User> {
  console.log("Starting Google sign-in process...");

  // Initialize Google Auth Provider with custom parameters
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    console.log("Initiating Google sign-in redirect...");
    await signInWithRedirect(auth, provider);
    // The page will redirect to Google at this point
    return {} as User; // This line won't actually execute due to the redirect
  } catch (error: any) {
    console.error('Google sign in error:', error.message, error.stack);
    handleAuthError(error);
    throw error;
  }
}

export function signOut() {
  console.log("Signing out user...");
  return auth.signOut();
}

// Set up Firebase auth state observer
auth.onAuthStateChanged((user) => {
  console.log("Auth state changed:", user ? "User logged in" : "User logged out");
});