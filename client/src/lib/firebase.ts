import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider, 
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  getRedirectResult,
  User
} from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase with all possible persistence methods
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]
});
export const db = getDatabase(app);

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Set custom parameters for better compatibility
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    console.log("Attempting popup sign-in...");
    const result = await signInWithPopup(auth, provider);
    console.log("Popup sign-in successful", { 
      hasToken: !!GoogleAuthProvider.credentialFromResult(result)?.accessToken,
      email: result.user.email 
    });
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      console.log("Popup blocked or cancelled, falling back to redirect...");
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export function signOut() {
  return auth.signOut();
}

// Set up auth state observer
export function onAuthChange(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user ? "User logged in" : "User logged out");
    callback(user);
  });
}

export { getRedirectResult };