import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// Read config from NEXT_PUBLIC_* envs, but don't assert non-null at module load.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
} as const;

function ensureClient(): void {
  if (typeof window === "undefined") {
    throw new Error("Firebase Web SDK should only be used in the client.");
  }
}

function getOrInitApp(): FirebaseApp {
  ensureClient();
  if (!getApps().length) {
    if (!firebaseConfig.apiKey) {
      throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY. Set your Firebase web config envs.");
    }
    return initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      measurementId: firebaseConfig.measurementId
    });
  }
  return getApp();
}

export function getDb(): Firestore {
  const app = getOrInitApp();
  return getFirestore(app);
}

export function getAuthInstance(): Auth {
  const app = getOrInitApp();
  return getAuth(app);
}