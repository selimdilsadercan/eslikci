'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import FirebaseAuthButton from '@/components/FirebaseAuthButton';
import { useUserSync } from '@/hooks/useUserSync';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  
  // Sync user with Convex when they sign in
  useUserSync();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Use replace instead of push to avoid back button issues
      router.replace('/games');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Eşlikçi</h1>
          <p className="text-gray-600 mb-6">Your companion app for table games</p>
          <FirebaseAuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
      <div className="text-center">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
