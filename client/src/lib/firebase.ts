import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithCredential,
  GoogleAuthProvider, 
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  User,
  getRedirectResult
} from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: window.location.hostname,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize auth with persistence
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]
});

export { auth };
export const db = getDatabase(app);

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  try {
    // Get Google credentials.  This is incomplete in the edited snippet and needs a way to obtain the id_token.  This will require a backend server to handle the Google auth flow securely.
    //  For this example, we'll simulate obtaining the id_token.  In a real application, this should be replaced with the actual method of obtaining the id_token from the backend.
    const idToken = await getGoogleIdToken();// Placeholder - replace with actual id_token retrieval
    const credential = await GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw error;
  }
}

//Helper function -  This is entirely added to make the code compile.  A real implementation will handle this differently.
async function getGoogleIdToken(){
    //In a real application, this would involve a server-side flow to exchange an auth code for an ID token.
    // This is a placeholder that simulates success for compilation purposes only.  It should be replaced with real backend code.
    return new Promise((resolve) => {
        setTimeout(() => resolve("simulated-id-token"), 500);
    })
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