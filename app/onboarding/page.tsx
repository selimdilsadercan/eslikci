"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AvatarGenerator from "@/components/AvatarGenerator";
import {
  ArrowRight,
  Check,
  ArrowLeft,
  GameController,
  ChartBar,
  Users,
  CrownSimple,
  ListBullets,
  ChatCircle,
  Plus,
  Minus,
  Gear,
  Star,
} from "@phosphor-icons/react";

export default function OnboardingPage() {
  const { user, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [demoScores, setDemoScores] = useState<{ [key: string]: number }>({
    player1: 15,
    player2: 8,
    player3: 22,
  });

  // Get current user from Convex
  const currentUser = useQuery(
    api.users.getUserByFirebaseId,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const player = useQuery(
    api.players.getPlayerById,
    currentUser?.playerId ? { id: currentUser.playerId } : "skip"
  );
  const updateUser = useMutation(api.users.updateUser);
  const updatePlayer = useMutation(api.players.updatePlayer);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Redirect if user is already onboarded
  useEffect(() => {
    if (currentUser && currentUser.isOnboardingFinished) {
      router.replace("/games");
    }
  }, [currentUser, router]);

  // Set existing avatar if user has one
  useEffect(() => {
    if (player && player.avatar && !selectedAvatar) {
      setSelectedAvatar(player.avatar);
    }
  }, [player, selectedAvatar]);

  const handleCompleteOnboarding = async () => {
    if (!user || !currentUser || !selectedAvatar) return;

    setIsCompleting(true);
    try {
      // Update user to mark onboarding as finished
      await updateUser({
        firebaseId: user.uid,
        isOnboardingFinished: true,
      });

      // Update player with avatar if exists
      if (currentUser.playerId) {
        await updatePlayer({
          id: currentUser.playerId,
          avatar: selectedAvatar,
        });
      }

      // Redirect to games page
      router.replace("/games");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGoBack = () => {
    if (currentStep === 1) {
      // If on first step, go back to home/login
      router.replace("/");
    } else {
      // Go back to previous step
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (!isLoaded || !isSignedIn || !currentUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full pb-24"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step ? <Check size={16} /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-8 h-1 ${currentStep >= step + 1 ? "bg-blue-500" : "bg-gray-200"}`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-[var(--foreground)] text-center">
            {currentStep === 1 && "Hoş Geldiniz!"}
            {currentStep === 2 && "Oyun Özellikleri"}
            {currentStep === 3 && "Puan Takibi"}
            {currentStep === 4 && "Avatar Seçin"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            {currentStep === 1 &&
              "Eşlikçi'ye hoş geldiniz! Uygulamanın özelliklerini keşfedelim."}
            {currentStep === 2 && "Oyun oturumlarınızı yönetin ve takip edin"}
            {currentStep === 3 && "Gerçek zamanlı puan takibi ve yönetimi"}
            {currentStep === 4 && "Kendinizi temsil eden bir avatar seçin"}
          </p>
        </div>

        {/* Step 1: Welcome & App Introduction */}
        {currentStep === 1 && (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <GameController size={48} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4">
              Merhaba {currentUser.name}!
            </h2>
            <p className="text-gray-600 mb-6">
              Eşlikçi ile masa oyunlarınızı daha eğlenceli hale getirin. Puan
              takibi, oyuncu yönetimi ve daha fazlası!
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white dark:bg-[var(--card-background)] p-4 rounded-lg shadow-sm dark:shadow-none">
                <ChartBar size={24} className="text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--foreground)]">Puan Takibi</p>
              </div>
              <div className="bg-white dark:bg-[var(--card-background)] p-4 rounded-lg shadow-sm dark:shadow-none">
                <Users size={24} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--foreground)]">Takım Modu</p>
              </div>
              <div className="bg-white dark:bg-[var(--card-background)] p-4 rounded-lg shadow-sm dark:shadow-none">
                <CrownSimple
                  size={24}
                  className="text-yellow-500 mx-auto mb-2"
                />
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--foreground)]">Kral Modu</p>
              </div>
              <div className="bg-white dark:bg-[var(--card-background)] p-4 rounded-lg shadow-sm dark:shadow-none">
                <ListBullets
                  size={24}
                  className="text-purple-500 mx-auto mb-2"
                />
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--foreground)]">
                  Oyun Kuralları
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Game Session Features Demo */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-[var(--foreground)]">Oyun Oturumu</h3>
                <div className="flex space-x-2">
                  <button className="p-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <ChartBar size={16} />
                  </button>
                  <button className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                    <ListBullets size={16} />
                  </button>
                  <button className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                    <ChatCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Demo score table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Oyuncular</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Toplam</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-500/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                        A
                      </span>
                    </div>
                    <span className="text-sm dark:text-gray-300">Ahmet</span>
                  </div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">45</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-500/30 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
                        E
                      </span>
                    </div>
                    <span className="text-sm dark:text-gray-300">Elif</span>
                  </div>
                  <span className="font-medium text-green-600 dark:text-green-400">38</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-500/30 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">
                        M
                      </span>
                    </div>
                    <span className="text-sm dark:text-gray-300">Mehmet</span>
                  </div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">52</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Oyun oturumlarınızı oluşturun, oyuncuları ekleyin ve puanları
                takip edin
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Score Tracking & Management */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 shadow-sm dark:shadow-none">
              <h3 className="font-semibold text-gray-800 dark:text-[var(--foreground)] mb-4">Puan Girişi</h3>

              {/* Demo score input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-500/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                        A
                      </span>
                    </div>
                    <span className="text-sm font-medium dark:text-gray-300">Ahmet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <input
                      type="text"
                      value="15"
                      readOnly
                      className="w-16 h-8 bg-white dark:bg-gray-700 border-2 rounded text-center font-medium text-gray-800 dark:text-gray-300"
                      style={{ borderColor: "rgba(134, 189, 255, 0.4)" }}
                    />
                    <button className="w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-500/30 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
                        E
                      </span>
                    </div>
                    <span className="text-sm font-medium dark:text-gray-300">Elif</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <input
                      type="text"
                      value="8"
                      readOnly
                      className="w-16 h-8 bg-white dark:bg-gray-700 border-2 rounded text-center font-medium text-gray-800 dark:text-gray-300"
                      style={{ borderColor: "rgba(134, 189, 255, 0.4)" }}
                    />
                    <button className="w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium">
                  3. Turu Bitir
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[var(--card-background)] p-4 rounded-lg shadow-sm dark:shadow-none text-center">
                <CrownSimple
                  size={24}
                  className="text-yellow-500 mx-auto mb-2"
                />
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--foreground)]">Kral Modu</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Kazanan belirle</p>
              </div>
              <div className="bg-white dark:bg-[var(--card-background)] p-4 rounded-lg shadow-sm dark:shadow-none text-center">
                <Gear size={24} className="text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--foreground)]">Ayarlar</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Özelleştir</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Gerçek zamanlı puan takibi, çoklu puan modu ve gelişmiş yönetim
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Avatar Selection */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <AvatarGenerator
                name={currentUser.name || "User"}
                size={120}
                onAvatarChange={setSelectedAvatar}
                initialAvatar={player?.avatar}
                className="mb-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[var(--card-background)] border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-md mx-auto">
          {currentStep === 4 ? (
            <div className="flex space-x-3">
              <button
                onClick={handleGoBack}
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft size={16} />
                <span>Geri Dön</span>
              </button>

              <button
                onClick={handleCompleteOnboarding}
                disabled={!selectedAvatar || isCompleting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCompleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Tamamlanıyor...</span>
                  </>
                ) : (
                  <>
                    <span>Tamamla</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={handleGoBack}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>Geri Dön</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className={`${currentStep === 1 ? "w-full" : "flex-1"} bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2`}
              >
                <span>Devam Et</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
