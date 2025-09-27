'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useEffect } from 'react';

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const createUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    if (isLoaded && user) {
      createUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || 'User',
        email: user.primaryEmailAddress?.emailAddress,
        avatar: user.imageUrl,
      }).catch((error) => {
        console.error('Error syncing user:', error);
      });
    }
  }, [isLoaded, user, createUser]);
}
