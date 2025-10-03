'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './FirebaseAuthProvider';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  proExpiresAt: number | null;
  upgradeToPro: (duration: number) => Promise<{ success: boolean; proExpiresAt: number }>;
  cancelPro: () => Promise<{ success: boolean }>;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<number | null>(null);

  // Query pro status from Convex
  const proStatus = useQuery(api.users.isUserPro, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );

  useEffect(() => {
    if (!isSignedIn || !user) {
      setIsPro(false);
      setProExpiresAt(null);
      setIsLoading(false);
      return;
    }

    if (proStatus !== undefined) {
      setIsPro(proStatus);
      setIsLoading(false);
    }
  }, [isSignedIn, user, proStatus]);

  const upgradeToPro = async (duration: number) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      // This would typically call a Convex mutation
      // For now, we'll simulate the upgrade
      const newExpirationTime = Date.now() + duration;
      setIsPro(true);
      setProExpiresAt(newExpirationTime);
      
      return { success: true, proExpiresAt: newExpirationTime };
    } catch (error) {
      console.error('Failed to upgrade to pro:', error);
      throw error;
    }
  };

  const cancelPro = async () => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      // This would typically call a Convex mutation
      // For now, we'll simulate the cancellation
      setIsPro(false);
      setProExpiresAt(null);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel pro:', error);
      throw error;
    }
  };

  const value: ProContextType = {
    isPro,
    isLoading,
    proExpiresAt,
    upgradeToPro,
    cancelPro,
  };

  return (
    <ProContext.Provider value={value}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return context;
}
