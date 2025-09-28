'use client';

import { useAuth } from '@/components/FirebaseAuthProvider';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect } from 'react';

export function useUserSync() {
  const { user, isLoaded } = useAuth();
  const createUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    if (isLoaded && user) {
      // Wait a bit for Firebase profile to be fully updated
      const timeoutId = setTimeout(() => {
        const userName = user.displayName || user.email || 'User';
        console.log('Syncing user with name:', userName, 'displayName:', user.displayName);
        
        createUser({
          firebaseId: user.uid,
          name: userName,
          email: user.email || '',
          avatar: user.photoURL || undefined,
        }).catch((error) => {
          console.error('Error syncing Firebase user:', error);
        });
      }, 200); // Slightly longer delay to ensure profile is updated

      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, user, createUser]);
}
