
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import type { UserProfile } from '@/types/profile';

// --- Types ---
interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true); // Assume configured

  useEffect(() => {
    const { auth, firestore } = getFirebaseServices();
    if (!auth || !firestore) {
      setConfigured(false);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          setUser(user);
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
            setUserProfile(userSnap.data() as UserProfile);
          } else {
            console.warn("No user profile found for authenticated user, cannot proceed.");
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error during auth state change:", error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { auth } = getFirebaseServices();
    if (!auth) throw new Error("Firebase not configured.");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { auth, firestore } = getFirebaseServices();
    if (!auth || !firestore) throw new Error("Firebase not configured.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(firestore, 'users', user.uid);
    const preferencesRef = doc(firestore, 'users', user.uid, 'preferences', 'default');

    await setDoc(userRef, {
      email: user.email,
      displayName: "", // Or allow user input
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      emailVerified: user.emailVerified,
      chaosSparkBalance: 500, // Default spark balance
      totalSparksUsed: 0,
      subscriptionTier: "free",
    });

     await setDoc(preferencesRef, {
       aiModelPreferences: {
        standard: [],
        multiSource: [],
        summary: [],
        conflict: []
      },
      theme: {
        colorPalette: "slate",
        mode: "dark"
      },
      defaultSearchMode: "standard",
      notifications: {
        email: true,
        push: false,
        searchComplete: true,
        creditLow: true
      }
    });
  }, []);

  const handleSignOut = async () => {
    const { auth } = getFirebaseServices();
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.href = '/'; // This forces a reload to the home page.
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const value = { user, userProfile, loading, configured, signIn, signUp, signOut: handleSignOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- Hook ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
