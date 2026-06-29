import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
// Request Drive and Email/Profile scopes
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Force select account if clicked
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem('google_drive_access_token');
  } catch (e) {
    return null;
  }
})();
let isSigningIn = false;

export const initFirebaseAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Since Firebase doesn't persist the Google access token,
        // we will need the user to re-authenticate or we call signInWithPopup
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem('google_drive_access_token');
      } catch (e) {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGooglePopup = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google');
    }
    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem('google_drive_access_token', cachedAccessToken);
    } catch (e) {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Core Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem('google_drive_access_token', token);
    } else {
      localStorage.removeItem('google_drive_access_token');
    }
  } catch (e) {}
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem('google_drive_access_token');
  } catch (e) {}
};
