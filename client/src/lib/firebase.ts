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
  User,
  getRedirectResult,
  signInWithCredential
} from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Use the domain that serves the app as authDomain to prevent storage partitioning issues
  authDomain: window.location.hostname,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);


// Initialize auth with persistence
const auth = initializeAuth(app, {
  persistence: [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence
  ]
});

export { auth };
export const db = getDatabase(app);

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Set custom parameters for better browser compatibility
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    console.log("Attempting popup sign-in...");
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    // Handle popup blocked
    if (error.code === 'auth/popup-blocked') {
      console.log("Popup blocked, using redirect...");
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export function signOut() {
  return auth.signOut();
}

export function onAuthChange(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user ? "User logged in" : "No user");
    callback(user);
  });
}

export { getRedirectResult };