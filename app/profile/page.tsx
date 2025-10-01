'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { User, Gear, SignOut, PencilSimple, Shield } from '@phosphor-icons/react';
import { useUserSync } from '@/hooks/useUserSync';
import AppBar from '@/components/AppBar';
import Header from '@/components/Header';

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  // Sync user with Convex when they sign in
  useUserSync();
  
  // Get current user and their player data
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUserAsPlayer = useQuery(api.players.getPlayerByUserId, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  // Check if user is admin
  const isAdmin = useQuery(api.users.isUserAdmin, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking authentication
  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (user) {
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Note: User profile updates would need to be handled through Clerk's API
      // For now, we'll just close the editing mode
      console.log('Profile update:', { firstName, lastName });
      setIsEditing(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Player Avatar Section */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center">
              {!isLoaded || !currentUserAsPlayer ? (
                <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
              ) : currentUserAsPlayer.avatar ? (
                <img
                  src={currentUserAsPlayer.avatar}
                  alt={currentUserAsPlayer.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {currentUserAsPlayer.initial}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              {!isLoaded || !currentUserAsPlayer ? (  
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {currentUserAsPlayer.name}
                  </h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Kişisel Bilgiler</h3>
            {isLoaded && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
              >
                <PencilSimple size={16} weight="regular" />
                <span className="text-sm font-medium">
                  {isEditing ? 'İptal' : 'Düzenle'}
                </span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad
              </label>
              {!isLoaded ? (
                <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
              ) : isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-800">{user?.displayName || user?.email || 'Belirtilmemiş'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              {!isLoaded ? (
                <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
              ) : (
                <p className="text-gray-800">{user?.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Üyelik Tarihi
              </label>
              {!isLoaded ? (
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              ) : (
                <p className="text-gray-800">
                  {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600"
              >
                Kaydet
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          )}
        </div>

            {/* Admin Dashboard Button - Only show for admin users */}
            {isAdmin && (
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
                {!isLoaded ? (
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                ) : (
                  <button
                    onClick={() => router.push('/admin')}
                    className="w-full flex items-center justify-center space-x-2 bg-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600"
                  >
                    <Gear size={20} weight="regular" />
                    <span>Admin Dashboard</span>
                  </button>
                )}
              </div>
            )}

            {/* Privacy Policy Link */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              {!isLoaded ? (
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : (
                <button
                  onClick={() => router.push('/privacy')}
                  className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 py-3"
                >
                  <Shield size={20} weight="regular" />
                  <span className="font-medium">Gizlilik Politikası</span>
                </button>
              )}
            </div>

            {/* Sign Out Button */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {!isLoaded ? (
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 text-red-500 hover:text-red-600 py-3"
                >
                  <SignOut size={20} weight="regular" />
                  <span className="font-medium">Çıkış Yap</span>
                </button>
              )}
            </div>

      </div>

      {/* App Bar */}
      <AppBar currentPage="profile" />
    </div>
  );
}
