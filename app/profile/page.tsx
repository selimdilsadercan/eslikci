"use client";

import AppBar from "@/components/AppBar";
import Header from "@/components/Header";
import ConfirmModal from "@/components/ConfirmModal";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { usePro } from "@/components/ProProvider";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Crown, Star } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { isPro, isLoading: proLoading } = usePro();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();
  
  // Get current user from Convex
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUserAsPlayer = useQuery(api.players.getPlayerByUserId, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  return (
      <div className="min-h-screen w-full" style={{ backgroundColor: '#f4f6f9' }}>
        {/* Header */}
        <Header />
        
        {/* Main Content with bottom padding for fixed bottom navigation */}
        <div className="pt-8 px-6 pb-24">
          <div className="max-w-sm mx-auto">
            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                {!currentUserAsPlayer ? (
                  // Skeleton loading
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                ) : currentUserAsPlayer.avatar ? (
                  <img
                    src={currentUserAsPlayer.avatar}
                    alt={currentUserAsPlayer.name}
                    className="w-24 h-24 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {currentUserAsPlayer.initial || currentUserAsPlayer.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {!currentUserAsPlayer ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-32"></div>
                ) : (
                  currentUserAsPlayer.name || currentUser?.name || user?.displayName || user?.email?.split('@')[0] || 'Kullanıcı'
                )}
              </h2>
              <p className="text-gray-500 text-sm">
                {user?.email}
              </p>
            </div>


            {/* Profile Sections */}
            <div className="space-y-3">

              {/* Pro Status */}
              <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <Link href="/pro" className="flex items-center gap-3 text-gray-700">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPro 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                      : 'bg-gradient-to-br from-purple-400 to-pink-500'
                  }`}>
                    {isPro ? (
                      <Crown className="w-5 h-5 text-white" />
                    ) : (
                      <Star className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {isPro ? 'Pro Aktif' : 'Pro Özellikler'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {isPro ? 'Reklamsız deneyim' : 'Pro\'ya yükselt'}
                    </p>
                  </div>
                  <div className="text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Edit Profile */}
              <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <Link href="/profile/edit" className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Profili Düzenle</h3>
                  </div>
                  <div className="text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Feedback */}
              <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <button
                  onClick={() => router.push('/feedback')}
                  className="w-full flex items-center gap-3 text-gray-700"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">Geri Bildirim Gönder</h3>
                  </div>
                  <div className="text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Settings Button */}
              <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full flex items-center gap-3 text-gray-700"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">Ayarlar</h3>
                  </div>
                  <div className="text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* About Button */}
              <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <button
                  onClick={() => router.push('/about')}
                  className="w-full flex items-center gap-3 text-gray-700"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">Hakkımızda</h3>
                  </div>
                  <div className="text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Logout Button */}
              <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">Çıkış Yap</h3>
                  </div>
                  <div className="text-red-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* App Bar */}
        <AppBar currentPage="profile" />
        
        {/* Logout Confirmation Modal */}
        <ConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={async () => {
            await signOut();
            router.push('/');
          }}
          title="Çıkış Yap"
          message="Hesabınızdan çıkış yapmak istediğinizden emin misiniz?"
          confirmText="Çıkış Yap"
          cancelText="İptal"
          isDestructive={true}
        />
      </div>
    );
  }
