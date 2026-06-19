import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { FirebaseOptions } from 'firebase/app';

// Import our provisioned config
import authConfig from '../../firebase-applet-config.json';

const firebaseConfig = authConfig as FirebaseOptions;

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = getAuth(app);
// Use popup config suitable for iframe environments where necessary
auth.useDeviceLanguage();

const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged };
export type { User };
