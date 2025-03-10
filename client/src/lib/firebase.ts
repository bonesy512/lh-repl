import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { getDatabase, ref, get, set, query, orderByChild, equalTo } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "1062549941272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

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

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google sign in successful:", result.user);
    return result.user;
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw error;
  }
}

export function signOut() {
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