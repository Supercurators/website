import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with settings for better offline support
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Initialize Firebase with error handling
export const initFirebase = async () => {
  try {
    // Enable offline persistence first
    try {
      await enableIndexedDbPersistence(db);
      console.log('Offline persistence enabled');
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          console.warn('Multiple tabs open, persistence enabled in another tab');
        } else if (err.code === 'unimplemented') {
          // The current browser doesn't support persistence
          console.warn('Browser does not support persistence');
        }
      }
      // Continue initialization even if persistence fails
    }

    // Wait for auth to be ready
    await auth.authStateReady();
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

export { auth, db };