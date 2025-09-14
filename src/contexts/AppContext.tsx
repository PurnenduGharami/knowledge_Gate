
'use client';

import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '@/firebase';
import * as LStorage from '@/utils/localStorage';
import { STARTING_SPARKS } from '@/lib/credits';
import type { Project, HistoryItem } from '@/types/search';
import type { UserProfile, UserModelPreference, SparkTransaction, TokenUsage } from '@/types/profile';


// --- UNIFIED USER TYPE ---
export interface User {
  uid: string;
  name: string | null;
  email: string | null;
  isGuest: boolean;
}

// --- CONTEXT TYPE ---
type AppContextType = {
  // Auth & User State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth Actions
  signInWithEmailAndPassword: (email: string, password:string) => Promise<void>;
  signUpWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => void;
  logout: () => Promise<void>;

  // User Data (Profile, Projects, History, etc.)
  profile: UserProfile;
  projects: Project[];
  history: HistoryItem[];
  usageLogs: TokenUsage[];
  transactions: SparkTransaction[];
  
  // Active Project State
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  activeProject: Project | null;

  // Data Actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  addProject: (name: string) => void;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id'>>) => void;
  deleteProject: (id:string) => void;
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'projectId'>) => void;
  updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  logUsage: (modelId: string, tokens: number, sparks: number) => void;
  deductSparks: (amount: number) => void;
  logTransactions: (transactions: Omit<SparkTransaction, 'id' | 'timestamp'>[]) => void;
  updateModelPreference: (preference: UserModelPreference) => void;
  updateTheme: (theme: string) => void;
  updateColorMode: (mode: 'light' | 'dark' | 'system') => void;
};


// --- DEFAULT USER DATA ---
const getDefaultUserData = (user: User | null): UserData => ({
  profile: {
    name: user?.isGuest ? "Guest User" : user?.name || "New User",
    email: user?.isGuest ? "" : user?.email || "",
    chaosSparks: STARTING_SPARKS,
    modelPrefs: [
      { mode: 'standard', type: 'automatic', modelIds: [] },
      { mode: 'multi', type: 'automatic', modelIds: [] },
      { mode: 'summary', type: 'automatic', modelIds: [] },
      { mode: 'conflict', type: 'automatic', modelIds: [] },
    ],
    theme: 'slate',
    colorMode: 'system',
    firstLoginUTC: new Date().toISOString(),
    lastRefillUTC: new Date().toISOString(),
    refillsUsed: 1,
  },
  projects: [{
    id: 'default-project',
    name: "Seeker's Curiosity",
    createdAt: Date.now(),
    isDefault: true,
    isArchived: false,
  }],
  history: [],
  usageLogs: [],
  transactions: [],
});


// --- CONTEXT ---
const AppContext = createContext<AppContextType | null>(null);
const GUEST_USER_KEY = 'knowledgeGateGuestUser';


// --- PROVIDER ---
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>(getDefaultUserData(null));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // Helper to persist data to localStorage and optionally Firestore
  const writeData = useCallback(async (uid: string, data: UserData, isGuest: boolean) => {
    LStorage.saveToLocalStorage(uid, data);
    
    if (!isGuest && auth && db) {
      try {
        await setDoc(doc(db, 'users', uid), data, { merge: true });
      } catch (err: any) {
        console.warn("Could not sync data to Firestore:", err);
        setError("Data is saved locally but failed to sync to the cloud.");
      }
    }
  }, []);

  // Main effect to handle auth state changes and data loading
  useEffect(() => {
    // If Firebase isn't configured, stop loading and show an error.
    if (!auth || !db) {
      setError("Firebase is not configured. Please copy .env.example to .env and add your API keys.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setError(null);

      let dataToProcess: UserData | null = null;
      let currentUser: User | null = null;
      let guestDataToMigrate: UserData | null = null;

      if (firebaseUser) {
        currentUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          isGuest: false,
        };

        // --- Data Loading Logic ---
        let firestoreData: UserData | null = null;
        let hadFirestoreError = false;
        try {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                firestoreData = docSnap.data() as UserData;
            }
        } catch (err: any) {
            let errorMessage = "Could not read from the database. Please check your internet connection and security rules.";
            
            if (err.message && err.message.toLowerCase().includes('offline')) {
                errorMessage = "Failed to connect to Firestore. Please check that your Project ID in the .env file is correct and that the Firestore API is enabled in your Google Cloud project.";
                console.error("Firestore connection error. This often indicates an incorrect Project ID in the .env file or that the Firestore API is not enabled.", err);
            } else {
                 console.error("Firestore read error.", err);
            }

            setError(errorMessage);
            hadFirestoreError = true;
        }

        // STEP 2: Decide which data to use based on the Firestore result.
        if (firestoreData) {
            // Case A: Existing user with data in the cloud. Use it.
            dataToProcess = firestoreData;
        } else if (!hadFirestoreError) {
            // Case B: Firestore is reachable, but the document doesn't exist.
            // This is a new user or an auth user without a DB entry.
            // Check if we should migrate data from a guest session.
            guestDataToMigrate = LStorage.loadFromLocalStorage<UserData>(GUEST_USER_KEY);
            if (guestDataToMigrate) {
                dataToProcess = guestDataToMigrate;
                LStorage.removeFromLocalStorage(GUEST_USER_KEY);
            }
        } else {
            // Case C: A Firestore error occurred. Fall back to local storage for this user.
            dataToProcess = LStorage.loadFromLocalStorage<UserData>(currentUser.uid);
        }
      } else {
        // No Firebase user. Check for a local guest session.
        const guestUser = LStorage.loadFromLocalStorage<User>(GUEST_USER_KEY);
        if (guestUser && guestUser.isGuest) {
          currentUser = guestUser;
          dataToProcess = LStorage.loadFromLocalStorage<UserData>(currentUser.uid);
        }
      }

      setUser(currentUser);
      
      // If there's no user at all, reset to default and stop.
      if (!currentUser) {
        setUserData(getDefaultUserData(null));
        setIsLoading(false);
        return;
      }
      
      // STEP 3: Process the loaded data and update the application state.
      const defaultData = getDefaultUserData(currentUser);
      let finalData = defaultData;

      if (dataToProcess) {
          // Deep merge loaded data with defaults.
          finalData = {
              profile: { ...defaultData.profile, ...(dataToProcess.profile || {}) },
              projects: dataToProcess.projects && dataToProcess.projects.length > 0 ? dataToProcess.projects : defaultData.projects,
              history: dataToProcess.history || defaultData.history,
              usageLogs: dataToProcess.usageLogs || defaultData.usageLogs,
              transactions: dataToProcess.transactions || defaultData.transactions,
          };
      }
      
      const { profile } = finalData;
      let profileWasUpdated = false;

      // Daily Spark Refill Logic
      if (profile && (profile.refillsUsed ?? 0) < 30) {
          const nowUTC = new Date();
          const lastRefillDate = new Date(profile.lastRefillUTC!);
          const timeSinceLastRefill = nowUTC.getTime() - lastRefillDate.getTime();
          if (timeSinceLastRefill >= 24 * 60 * 60 * 1000) {
              profile.chaosSparks = (profile.chaosSparks || 0) + 100;
              profile.refillsUsed = (profile.refillsUsed ?? 0) + 1;
              profile.lastRefillUTC = nowUTC.toISOString();
              profileWasUpdated = true;
          }
      }
      
      setUserData(finalData);

      // STEP 4: Write data back. This is crucial for new users (to create their document)
      // or if their data was updated (e.g., a spark refill).
      if (!dataToProcess || profileWasUpdated) {
          await writeData(currentUser.uid, finalData, currentUser.isGuest);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [writeData]);

  // Apply theme and color mode based on user profile
  useEffect(() => {
    if (isLoading || !userData.profile) return; // Prevent running on initial default state
    const { theme = 'slate', colorMode = 'system' } = userData.profile;
    const root = document.documentElement;
    root.classList.remove(...['theme-slate', 'theme-zinc', 'theme-rose', 'theme-neutral', 'theme-stone', 'theme-violet', 'theme-green', 'theme-parchment', 'dark']);
    
    if (theme) {
      root.classList.add(theme === 'slate' ? 'theme-slate' : `theme-${theme}`);
    }

    if (colorMode === 'dark' || (colorMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    }
  }, [userData.profile, isLoading]);

  // Sync active project ID with the projects list
  useEffect(() => {
    if (!isLoading && userData.projects) {
        const defaultProject = userData.projects.find(p => p.isDefault);
        const currentActiveExists = activeProjectId && userData.projects.some(p => p.id === activeProjectId && !p.isArchived);
        if (!currentActiveExists) {
            const firstActive = userData.projects.find(p => !p.isArchived);
            setActiveProjectId(firstActive?.id || defaultProject?.id || null);
        }
    }
  }, [isLoading, userData.projects, activeProjectId]);

  // --- ACTIONS (wrapped in useCallback for performance) ---

  const updateUserData = useCallback((newPartialData: Partial<UserData>) => {
    if (!user) return;
    setUserData(prevData => {
      const updatedData = { ...prevData, ...newPartialData };
      writeData(user.uid, updatedData, user.isGuest);
      return updatedData;
    });
  }, [user, writeData]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!userData.profile) return;
    const newName = updates.name?.trim();
    const finalUpdates = newName ? { ...updates, name: newName } : { ...updates };
    updateUserData({ profile: { ...userData.profile, ...finalUpdates } });
  }, [userData.profile, updateUserData]);

  const updateTheme = useCallback((theme: string) => updateProfile({ theme }), [updateProfile]);
  const updateColorMode = useCallback((mode: 'light' | 'dark' | 'system') => updateProfile({ colorMode: mode }), [updateProfile]);

  const updateModelPreference = useCallback((preference: UserModelPreference) => {
    if (!userData.profile) return;
    const newPrefs = userData.profile.modelPrefs.map(p => p.mode === preference.mode ? preference : p);
    updateProfile({ modelPrefs: newPrefs });
  }, [userData.profile, updateProfile]);

  const addProject = (name: string) => {
    const newProject: Project = { id: uuidv4(), name: name.trim(), createdAt: Date.now(), isArchived: false, isDefault: false };
    const updatedProjects = [...userData.projects, newProject];
    updateUserData({ projects: updatedProjects });
    setActiveProjectId(newProject.id);
  };
  
  const updateProject = (id: string, updates: Partial<Omit<Project, 'id'>>) => {
      const finalUpdates = updates.name ? { ...updates, name: updates.name.trim() } : updates;
      const updatedProjects = userData.projects.map(p => p.id === id ? { ...p, ...finalUpdates } : p);
      updateUserData({ projects: updatedProjects });
      if (updates.isArchived && activeProjectId === id) {
        const fallbackProject = userData.projects.find(p => !p.isArchived && p.id !== id) || userData.projects.find(p => p.isDefault);
        setActiveProjectId(fallbackProject?.id || null);
      }
  };
  
  const deleteProject = (id: string) => {
      const projectToDelete = userData.projects.find(p => p.id === id);
      if (projectToDelete?.isDefault) return;
      const updatedProjects = userData.projects.filter(p => p.id !== id);
      const updatedHistory = userData.history.filter(h => h.projectId !== id);
      if (activeProjectId === id) {
        const fallbackProject = updatedProjects.find(p => p.isDefault) || updatedProjects.find(p => !p.isArchived);
        setActiveProjectId(fallbackProject?.id || null);
      }
      updateUserData({ projects: updatedProjects, history: updatedHistory });
  };
  
  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp' | 'projectId'>) => {
    if (!activeProjectId) return;
    const newHistoryItem: HistoryItem = { ...item, id: uuidv4(), timestamp: Date.now(), projectId: activeProjectId, isFavorite: false, notes: '' };
    updateUserData({ history: [newHistoryItem, ...userData.history] });
  };
  
  const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
    updateUserData({ history: userData.history.map(item => item.id === id ? { ...item, ...updates } : item) });
  };
  
  const deleteHistoryItem = (id: string) => updateUserData({ history: userData.history.filter(item => item.id !== id) });
  const clearHistory = () => updateUserData({ history: [] });

  const logUsage = useCallback((modelId: string, tokensUsed: number, sparksSpent: number) => {
    const newLogs = [...userData.usageLogs];
    const existingLog = newLogs.find(log => log.modelId === modelId);
    if (existingLog) {
      existingLog.requests += 1;
      existingLog.tokensUsed += tokensUsed;
      existingLog.lastUsed = Date.now();
    } else {
      newLogs.push({ modelId, requests: 1, tokensUsed, lastUsed: Date.now() });
    }
    updateUserData({ usageLogs: newLogs.sort((a, b) => b.lastUsed - a.lastUsed) });
  }, [userData.usageLogs, updateUserData]);
  
  const deductSparks = useCallback((amountToDeduct: number) => {
    const numericAmount = Number(amountToDeduct);
    if (isNaN(numericAmount) || numericAmount < 0 || !userData.profile) return;
    const currentSparks = Number(userData.profile.chaosSparks);
    updateProfile({ chaosSparks: Math.max(0, currentSparks - numericAmount) });
  }, [userData.profile, updateProfile]);

  const logTransactions = useCallback((transactionsData: Omit<SparkTransaction, 'id' | 'timestamp'>[]) => {
      const newTransactions = transactionsData.map(t => ({ ...t, id: uuidv4(), timestamp: Date.now() }));
      updateUserData({ transactions: [...newTransactions, ...userData.transactions] });
  }, [userData.transactions, updateUserData]);

  // --- Auth Actions ---
  const handleSignInWithEmailAndPassword = useCallback(async (email: string, password: string) => {
    if (!auth) return;
    setIsLoading(true);
    setError(null);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the rest.
    } catch(err: any) {
        console.error("Email/Password Sign-In Error:", err);
        setError(err.message || 'Failed to sign in.');
        setIsLoading(false);
    }
  }, []);

  const signUpWithEmailAndPassword = useCallback(async (email: string, password: string) => {
    if (!auth) return;
    setIsLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener handles all data creation.
    } catch (err: any) {
      console.error("Email/Password Sign-Up Error:", err);
      setError(err.message || 'Failed to create an account.');
      setIsLoading(false);
    }
  }, []);

  const signInAsGuest = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const guestUser: User = { uid: GUEST_USER_KEY, name: 'Guest User', email: null, isGuest: true };
    LStorage.saveToLocalStorage(GUEST_USER_KEY, guestUser);
    setUser(guestUser);
    const guestData = LStorage.loadFromLocalStorage<UserData>(GUEST_USER_KEY) || getDefaultUserData(guestUser);
    setUserData(guestData);
    if (!LStorage.loadFromLocalStorage(GUEST_USER_KEY)) {
        writeData(GUEST_USER_KEY, guestData, true);
    }
    setIsLoading(false);
  }, [writeData]);

  const logout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err: any) {
      console.error("Sign Out Error:", err);
    } finally {
      LStorage.removeFromLocalStorage(GUEST_USER_KEY);
      setUser(null);
      setUserData(getDefaultUserData(null));
      setActiveProjectId(null);
      window.location.href = '/';
    }
  }, []);

  // The value provided to the context consumers
  const contextValue: AppContextType = {
    user,
    isLoading,
    error,
    signInWithEmailAndPassword: handleSignInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInAsGuest,
    logout,
    profile: userData.profile,
    projects: userData.projects,
    history: userData.history,
    usageLogs: userData.usageLogs,
    transactions: userData.transactions,
    activeProjectId,
    setActiveProjectId,
    activeProject: userData.projects.find(p => p.id === activeProjectId) || null,
    updateProfile,
    addProject,
    updateProject,
    deleteProject,
    addHistoryItem,
    updateHistoryItem,
    deleteHistoryItem,
    clearHistory,
    logUsage,
    deductSparks,
    logTransactions,
    updateModelPreference,
    updateTheme,
    updateColorMode,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export interface UserData {
  profile: UserProfile;
  projects: Project[];
  history: HistoryItem[];
  usageLogs: TokenUsage[];
  transactions: SparkTransaction[];
}

// --- Hook to use the context ---
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
