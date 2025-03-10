import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider, 
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  getRedirectResult
} from "firebase/auth";
import { getDatabase } from "firebase/database";

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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with fallback persistence
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]
});

export const db = getDatabase(app);

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Set custom parameters for better compatibility
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    // Try popup first
    const result = await signInWithPopup(auth, provider);
    console.log('Google sign-in successful', { 
      hasToken: !!GoogleAuthProvider.credentialFromResult(result)?.accessToken,
      email: result.user.email
    });
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.log('Popup blocked, trying redirect...');
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export function signOut() {
  return auth.signOut();
}

export { getRedirectResult };

// Set up auth state observer
auth.onAuthStateChanged((user) => {
  console.log("Auth state changed:", {
    status: user ? "User logged in" : "User logged out",
    uid: user?.uid,
    email: user?.email,
    displayName: user?.displayName
  });
});