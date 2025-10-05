'use client';

import { useState } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AppBar from '@/components/AppBar';
import Header from '@/components/Header';
import ConfirmModal from '@/components/ConfirmModal';
import { ArrowLeft, ArrowClockwise } from '@phosphor-icons/react';

export default function SettingsPage() {
  const { user, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Get current user from Convex
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const restartOnboarding = useMutation(api.users.restartOnboarding);

  const handleRestartOnboarding = async () => {
    if (!user) return;

    setIsRestarting(true);
    try {
      await restartOnboarding({
        firebaseId: user.uid,
      });
      
      // Redirect to onboarding
      router.push('/onboarding');
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    } finally {
      setIsRestarting(false);
      setShowRestartConfirm(false);
    }
  };

  if (!isLoaded || !isSignedIn || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="pt-8 px-6 pb-24">
        <div className="max-w-sm mx-auto">
          {/* Settings Sections */}
          <div className="space-y-3">
            
            {/* Onboarding Section */}
            <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <ArrowClockwise className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Onboarding</h3>
                  <p className="text-sm text-gray-500">Profil kurulumunu yeniden başlat</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowRestartConfirm(true)}
                disabled={isRestarting}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isRestarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Yeniden Başlatılıyor...</span>
                  </>
                ) : (
                  <>
                    <ArrowClockwise size={16} />
                    <span>Onboarding'i Yeniden Başlat</span>
                  </>
                )}
              </button>
            </div>

            {/* Account Info */}
            <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Hesap Bilgileri</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ad:</span>
                  <span className="text-gray-800">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">E-posta:</span>
                  <span className="text-gray-800">{currentUser.email || 'Belirtilmemiş'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Onboarding:</span>
                  <span className={`font-medium ${currentUser.isOnboardingFinished ? 'text-green-600' : 'text-orange-600'}`}>
                    {currentUser.isOnboardingFinished ? 'Tamamlandı' : 'Tamamlanmadı'}
                  </span>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
              <button
                onClick={() => router.back()}
                className="w-full flex items-center gap-3 text-gray-700 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Geri Dön</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Restart Onboarding Confirmation Modal */}
      <ConfirmModal
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        onConfirm={handleRestartOnboarding}
        title="Onboarding'i Yeniden Başlat"
        message="Profil kurulumunu yeniden başlatmak istediğinizden emin misiniz? Bu işlem avatar seçiminizi sıfırlayacaktır."
        confirmText="Yeniden Başlat"
        cancelText="İptal"
        isDestructive={false}
      />
    </div>
  );
}
