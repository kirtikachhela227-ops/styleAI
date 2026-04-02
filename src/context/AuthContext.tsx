import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  db,
  doc,
  setDoc,
  updateDoc,
  onSnapshot
} from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  User
} from 'firebase/auth';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const handleDemoLogin = (email: string) => {
    setIsDemo(true);
    const demoUser = {
      uid: 'demo-user-123',
      email: email,
      displayName: 'Demo Stylist',
      photoURL: 'https://picsum.photos/seed/stylist/200',
    } as User;
    
    const demoProfile: UserProfile = {
      uid: 'demo-user-123',
      displayName: 'Demo Stylist',
      email: email || '',
      darkMode: false,
    };

    setUser(demoUser);
    setUserProfile(demoProfile);
    setLoading(false);
    localStorage.setItem('styleai_demo_user', JSON.stringify({ user: demoUser, profile: demoProfile }));
  };

  useEffect(() => {
    const savedDemo = localStorage.getItem('styleai_demo_user');
    if (savedDemo) {
      const { user: u, profile: p } = JSON.parse(savedDemo);
      setUser(u);
      setUserProfile(p);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Listen to user profile changes in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Create initial profile if it doesn't exist
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Stylist',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || undefined,
              darkMode: false,
            };
            setDoc(userDocRef, initialProfile);
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile snapshot error:", err);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        console.warn("Firebase Email/Password auth is disabled. Falling back to Demo Mode.");
        handleDemoLogin(email);
        return;
      }
      throw err;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName: 'Stylist' });
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        console.warn("Firebase Email/Password auth is disabled. Falling back to Demo Mode.");
        handleDemoLogin(email);
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    localStorage.removeItem('styleai_demo_user');
    setIsDemo(false);
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    if (isDemo) {
      const newProfile = { ...userProfile, ...updates } as UserProfile;
      setUserProfile(newProfile);
      const savedDemo = JSON.parse(localStorage.getItem('styleai_demo_user') || '{}');
      savedDemo.profile = newProfile;
      localStorage.setItem('styleai_demo_user', JSON.stringify(savedDemo));
    } else {
      await updateDoc(doc(db, 'users', user.uid), updates);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isDemo, login, signup, loginWithGoogle, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
