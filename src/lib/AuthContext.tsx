import React, { createContext, useContext, useEffect, useState } from 'react';

// Simple representation of user profile info for standard client-side usage
export interface MockUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Give the app a robust offline custom default user immediately so they never encounter login gates or popups on Render
  const [user, setUser] = useState<MockUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('local_guest_session');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      console.error(e);
    }
    return {
      uid: 'offline_user_id',
      displayName: 'Operator User',
      email: 'operator@local.system',
      photoURL: null,
    };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('local_guest_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('local_guest_session');
    }
  }, [user]);

  const signInWithGoogle = async () => {
    // Graceful offline mock login
    setUser({
      uid: 'offline_user_id',
      displayName: 'Operator User',
      email: 'operator@local.system',
      photoURL: null,
    });
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
