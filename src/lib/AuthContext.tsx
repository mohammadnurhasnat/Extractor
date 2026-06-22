import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { signInWithGooglePopup, logoutGoogle, auth, getCachedAccessToken, setCachedAccessToken } from './firebase';

export interface GoogleSessionUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: GoogleSessionUser | null;
  accessToken: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleSessionUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('local_google_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Error loading google user from localstorage', e);
    }
    return null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // We only keep it in session/memory or cache
    return getCachedAccessToken();
  });

  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const u: GoogleSessionUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        };
        setUser(u);
        localStorage.setItem('local_google_user', JSON.stringify(u));
        
        // Also persist their email in localStorage for older usecases
        localStorage.setItem('local_guest_session', JSON.stringify(u));
      } else {
        setUser(null);
        setAccessToken(null);
        setCachedAccessToken(null);
        localStorage.removeItem('local_google_user');
        localStorage.removeItem('local_guest_session');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithGooglePopup();
      if (result) {
        const { user: firebaseUser, accessToken: token } = result;
        const u: GoogleSessionUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        };
        setUser(u);
        setAccessToken(token);
        localStorage.setItem('local_google_user', JSON.stringify(u));
        localStorage.setItem('local_guest_session', JSON.stringify(u));
      }
    } catch (error) {
      console.error('Core Google Sign-In Popup Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutGoogle();
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('local_google_user');
      localStorage.removeItem('local_guest_session');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      signInWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
