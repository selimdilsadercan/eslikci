"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AvatarGenerator from "@/components/AvatarGenerator";

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarName, setAvatarName] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState<string>("");

  // Get current user and player from Convex
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUserAsPlayer = useQuery(api.players.getPlayerByUserId, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  // Mutations
  const updatePlayer = useMutation(api.players.updatePlayer);

  useEffect(() => {
    if (currentUserAsPlayer) {
      setDisplayName(currentUserAsPlayer.name || "");
      setAvatarName(currentUserAsPlayer.name || "");
      setCurrentAvatar(currentUserAsPlayer.avatar || "");
    } else if (user) {
      setDisplayName(user.displayName || "");
      setAvatarName(user.displayName || user.email?.split('@')[0] || "");
    }
  }, [currentUserAsPlayer, user]);

  const handleSave = async () => {
    if (!user || !currentUserAsPlayer) return;
    
    setIsLoading(true);
    try {
      // Update Firebase profile
      await updateProfile(user, {
        displayName: displayName.trim()
      });

      // Update player in Convex database
      await updatePlayer({
        id: currentUserAsPlayer._id,
        name: displayName.trim(),
        avatar: currentAvatar,
        initial: displayName.trim().charAt(0).toUpperCase()
      });

      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  const handleAvatarChange = (avatarUrl: string) => {
    setCurrentAvatar(avatarUrl);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 dark:from-gray-800 via-white dark:via-gray-900 to-green-50 dark:to-gray-800 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white dark:bg-[var(--card-background)] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-[var(--foreground)]">Profili Düzenle</h1>
            <button
              onClick={handleSave}
              disabled={isLoading || !displayName.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 pb-24">
        <div className="max-w-sm mx-auto">
          {/* Avatar Section */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <AvatarGenerator 
                name={avatarName || displayName || 'User'} 
                size={120}
                className="mx-auto"
                initialAvatar={currentAvatar || currentUserAsPlayer?.avatar}
                onAvatarChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            {/* Display Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ad Soyad
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setAvatarName(e.target.value);
                }}
                placeholder="Adınızı ve soyadınızı girin"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                maxLength={50}
              />
            </div>

            {/* Email Display (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-posta
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400">
                {user?.email}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* App Bar */}
    </div>
  );
}
