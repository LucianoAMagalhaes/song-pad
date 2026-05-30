import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

/**
 * Firebase web app configuration, read from `NEXT_PUBLIC_FIREBASE_*` env vars
 * (see `.env.example`). These values are public by design — Firebase web
 * config is embedded in the client bundle; data access is secured by Firestore
 * security rules (per uid), not by hiding these keys.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Returns the singleton Firebase app, initializing it on first use. Guards
 * against double initialization during Fast Refresh / client navigation.
 */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Returns the Firestore instance, enabling offline persistence (IndexedDB-backed
 * cache) with multi-tab support on first initialization. Persistence is what
 * makes the app offline-first: reads are served from the local cache and writes
 * queue until the device is back online.
 *
 * `initializeFirestore` may only run once per app; on subsequent calls (e.g.
 * Fast Refresh) it throws, so we fall back to the already-initialized instance.
 */
export function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}
