'use client';

import { useAuth } from '@/components/FirebaseAuthProvider';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useUserSync() {
  const { user, isLoaded } = useAuth();
  const createUser = useMutation(api.users.getOrCreateUser);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !hasRedirected.current) {
      // Don't redirect if we're already on onboarding page
      if (window.location.pathname === '/onboarding') {
        return;
      }

      // Wait a bit for Firebase profile to be fully updated
      const timeoutId = setTimeout(() => {
        const userName = user.displayName || user.email || 'User';
        console.log('Syncing user with name:', userName, 'displayName:', user.displayName);
        
        createUser({
          firebaseId: user.uid,
          name: userName,
          email: user.email || '',
          avatar: user.photoURL || undefined,
        }).then((userData) => {
          console.log('User data received:', userData);
          console.log('User onboarding finished:', userData?.isOnboardingFinished);
          console.log('Current pathname:', window.location.pathname);
          
          // Check if user needs onboarding
          if (!userData || !userData.isOnboardingFinished) {
            console.log('User needs onboarding, redirecting to /onboarding');
            hasRedirected.current = true;
            router.push('/onboarding');
          } else {
            // User completed onboarding, redirect to games
            console.log('User completed onboarding, redirecting to /games');
            hasRedirected.current = true;
            router.push('/games');
          }
        }).catch((error) => {
          console.error('Error syncing Firebase user:', error);
        });
      }, 200); // Slightly longer delay to ensure profile is updated

      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, user, createUser, router]);
}
