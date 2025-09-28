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
      createUser({
        firebaseId: user.uid,
        name: user.displayName || user.email || 'User',
        email: user.email || '',
        avatar: user.photoURL || undefined,
      }).catch((error) => {
        console.error('Error syncing Firebase user:', error);
      });
    }
  }, [isLoaded, user, createUser]);
}
