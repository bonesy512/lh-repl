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

// Handle auth state persistence
const isWebView = window.parent !== window;
console.log('Environment check:', { 
  isWebView, 
  userAgent: window.navigator.userAgent,
  parentLocation: isWebView ? 'Different from window' : 'Same as window'
});

// Only set persistence if not in webview
if (!isWebView) {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase persistence set successfully");
    })
    .catch((error) => {
      console.error('Firebase persistence error:', error.message, error.stack);
    });
}

// Handle redirect result
async function handleRedirectResult() {
  console.log("Checking for redirect result...");
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
    console.log("No redirect result found");
    return null;
  } catch (error: any) {
    console.error('Redirect sign-in error:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      domain: currentDomain
    });
    throw error;
  }
}

// Check for redirect result on page load
handleRedirectResult().catch(console.error);

export async function signInWithGoogle(): Promise<User> {
  console.log("Starting Google sign-in process...");

  // Initialize Google Auth Provider
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Set login hint to force account picker
  provider.setCustomParameters({
    prompt: 'select_account',
    login_hint: 'user@example.com'
  });

  try {
    if (isWebView) {
      // In webview, open auth in new window
      const newTabUrl = `${window.location.origin}/auth`;
      console.log("Opening auth in new tab:", newTabUrl);
      window.open(newTabUrl, '_blank');
      return {} as User;
    } else {
      // Normal redirect flow
      console.log("Initiating Google sign-in redirect...");
      await signInWithRedirect(auth, provider);
      return {} as User; // This line won't execute due to redirect
    }
  } catch (error: any) {
    console.error('Google sign in error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export function signOut() {
  console.log("Signing out user...");
  return auth.signOut();
}

// Set up auth state observer
auth.onAuthStateChanged((user) => {
  console.log("Auth state changed:", {
    status: user ? "User logged in" : "User logged out",
    userId: user?.uid,
    email: user?.email,
    displayName: user?.displayName
  });
});