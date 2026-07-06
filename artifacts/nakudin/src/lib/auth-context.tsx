import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
  import {
    onAuthStateChanged, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect,
    GoogleAuthProvider, signOut, sendEmailVerification, type User,
  } from 'firebase/auth';
  import { auth } from './firebase';
  import { setAuthTokenGetter } from '@workspace/api-client-react';

  const googleProvider = new GoogleAuthProvider();

  interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setAuthTokenGetter(() => auth.currentUser?.getIdToken() ?? null);
      const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
      return () => {
        unsub();
        setAuthTokenGetter(null);
      };
    }, []);

    const signIn = async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email immediately after signup
      try { await sendEmailVerification(cred.user); } catch { /* non-blocking */ }
    };

    const signInGoogle = async () => {
      // Use redirect on mobile for better compatibility; popup on desktop
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    };

    const logout = async () => { await signOut(auth); };

    const sendVerificationEmail = async () => {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    };

    return (
      <AuthContext.Provider value={{ user, loading, signIn, signUp, signInGoogle, logout, sendVerificationEmail }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
  }

  export { auth };
  