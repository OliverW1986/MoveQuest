import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "movequest-dev.firebaseapp.com",
  projectId: "movequest-dev",
  storageBucket: "movequest-dev.firebasestorage.app",
  messagingSenderId: "669397140848",
  appId: "1:669397140848:web:961a5e9844f4d48b833bb5",
  measurementId: "G-Y3S2LYDKMP"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);