'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed:', user ? user.uid : 'No user');
      setUser(user);
      setIsLoaded(true);
    });

    // Handle redirect result for mobile apps
    if (Capacitor.isNativePlatform()) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('Redirect result:', result);
            console.log('User signed in via redirect:', result.user?.email);
            // User signed in via redirect - the onAuthStateChanged will handle the state update
          } else {
            console.log('No redirect result found - user may not have completed sign-in');
          }
        })
        .catch((error) => {
          console.error('Redirect result error:', error);
          // Don't throw the error, just log it as it might be expected in some cases
        });
    }

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Configure provider for better mobile experience
      provider.addScope('email');
      provider.addScope('profile');
      
      if (Capacitor.isNativePlatform()) {
        // For mobile apps, use redirect (more reliable for mobile)
        console.log('Starting Google sign-in redirect for mobile...');
        
        // Set custom parameters for mobile
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        // Use redirect for mobile (works better than popup)
        await signInWithRedirect(auth, provider);
        // Note: The redirect will take the user away from the app
        // The getRedirectResult in useEffect will handle the return
      } else {
        // For web, use popup to avoid redirect issues
        console.log('Starting Google sign-in popup for web...');
        
        // Set custom parameters for web
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const getToken = async () => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    isLoaded,
    isSignedIn: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
