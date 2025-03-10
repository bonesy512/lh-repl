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

// Initialize Firebase with multiple persistence methods to handle storage partitioning
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]
});
export const db = getDatabase(app);

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Set custom parameters for better browser compatibility
  provider.setCustomParameters({
    prompt: 'select_account',
    // Add Replit domain to allowed domains
    hosted_domain: window.location.hostname
  });

  try {
    console.log("Attempting popup sign-in...");
    const result = await signInWithPopup(auth, provider);

    // Get ID token for additional verification
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = credential?.idToken;

    console.log("Popup sign-in successful", { 
      hasIdToken: !!idToken,
      email: result.user.email 
    });

    return result.user;
  } catch (error: any) {
    // Handle popup blocked, storage access issues, or authentication errors
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/cancelled-popup-request' || 
        error.code.includes('storage')) {
      console.log("Popup blocked or storage issue, falling back to redirect...");
      await signInWithRedirect(auth, provider);
      return null;
    }

    // If we have an ID token from the error, try credential-based sign in
    if (error.customData?.idToken) {
      try {
        console.log("Attempting credential-based sign-in...");
        const credential = GoogleAuthProvider.credential(error.customData.idToken);
        const credResult = await signInWithCredential(auth, credential);
        return credResult.user;
      } catch (credError) {
        console.error("Credential sign-in failed:", credError);
        throw credError;
      }
    }

    throw error;
  }
}

export function signOut() {
  return auth.signOut();
}

// Set up auth state observer with additional logging
export function onAuthChange(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", {
      state: user ? "logged_in" : "logged_out",
      email: user?.email,
    });
    callback(user);
  });
}

export { getRedirectResult };