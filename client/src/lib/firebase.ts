
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  getRedirectResult,
  browserLocalPersistence, 
  browserSessionPersistence,
  setPersistence,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
// Replace with your own Firebase config if needed
const firebaseConfig = {
  apiKey: "AIzaSyA8r5GLzlroj3PD0KJlS20YQr8jxoL_NHA",
  authDomain: "landhacker-9a7c1.firebaseapp.com",
  projectId: "landhacker-9a7c1",
  storageBucket: "landhacker-9a7c1.appspot.com",
  messagingSenderId: "844456245603",
  appId: "1:844456245603:web:9d5a9c1affd2e49c4158ca",
  measurementId: "G-6DJTQ4J7RF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configure persistent session
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence set successfully");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

/**
 * Signs in with Google using Firebase
 * Attempts popup first, falls back to redirect
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  // Add scopes for additional permissions
  provider.addScope('email');
  provider.addScope('profile');
  
  // Set custom parameters
  provider.setCustomParameters({
    'prompt': 'select_account'
  });
  
  try {
    console.log("Initiating Google sign-in popup...");
    const result = await signInWithPopup(auth, provider);
    
    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    // The signed-in user info
    const user = result.user;
    console.log("Google sign-in successful:", user.email);
    
    return { user, token };
  } catch (error: any) {
    // Handle popup blocked error by falling back to redirect
    if (error.code === 'auth/popup-blocked') {
      console.log("Popup blocked, trying redirect...");
      await signInWithRedirect(auth, provider);
      return null;
    }
    
    console.error("Google sign-in error:", error.code, error.message);
    throw error;
  }
}

/**
 * Processes the redirect result after a redirect sign-in
 */
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info
      const user = result.user;
      console.log("Redirect sign-in successful:", user.email);
      
      return { user, token };
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
}

/**
 * Signs out the current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

/**
 * Sets up an auth state observer
 * @param callback Function to call when auth state changes
 */
export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

export { auth, db };
