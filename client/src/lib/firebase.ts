import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "landhacker-9a7c1.firebaseapp.com",
  databaseURL: "https://landhacker-9a7c1-default-rtdb.firebaseio.com",
  projectId: "landhacker-9a7c1",
  storageBucket: "landhacker-9a7c1.firebasestorage.app",
  messagingSenderId: "1062549941272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function signOut() {
  return auth.signOut();
}