import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User, browserLocalPersistence, setPersistence } from "firebase/auth";
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

// Set persistence to LOCAL
console.log('Setting Firebase persistence to LOCAL...');
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Check if popups are allowed
async function checkPopupsAllowed(): Promise<boolean> {
  try {
    const popup = window.open('', '_blank', 'width=1,height=1');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      return false;
    }
    popup.close();
    return true;
  } catch (e) {
    return false;
  }
}

export async function signInWithGoogle(): Promise<User> {
  console.log("Starting Google sign-in process...");

  // Check if popups are allowed first
  const popupsAllowed = await checkPopupsAllowed();
  if (!popupsAllowed) {
    throw new Error("Please enable popups for this site and try again. You can usually do this by clicking the popup blocked icon in your browser's address bar.");
  }

  // Initialize Google Auth Provider with custom parameters
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    console.log("Attempting Google sign-in popup...");
    const result = await signInWithPopup(auth, provider);
    console.log("Google sign in successful:", {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName
    });
    return result.user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'auth/popup-blocked') {
      throw new Error('Please enable popups for this site to use Google sign-in');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`This domain (${currentDomain}) is not authorized for sign-in. Please add it to Firebase Console's Authorized Domains list.`);
    } else if (error.code === 'auth/invalid-action-code') {
      throw new Error('The sign-in link has expired or has already been used. Please try signing in again.');
    }
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
  if (user) {
    // Add Firebase token to all API requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;

      if (typeof resource === 'string' && resource.startsWith('/api')) {
        try {
          const token = await user.getIdToken();
          console.log("Adding auth token to request:", resource);
          const modifiedConfig = {
            ...config,
            headers: {
              ...config?.headers,
              "Authorization": `Bearer ${token}`,
            },
          };
          return originalFetch(resource, modifiedConfig);
        } catch (error) {
          console.error("Error getting Firebase token:", error);
          return originalFetch(resource, config);
        }
      }

      return originalFetch(resource, config);
    };
  }
});

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