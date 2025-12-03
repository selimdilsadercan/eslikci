"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  ChartBar,
  ListBullets,
  ChatCircle,
  Spade,
} from "@phosphor-icons/react";
import GameRulesTab from "@/components/GameRulesTab";
import GameAskTab from "@/components/GameAskTab";
import PokerAssistantTab from "@/components/PokerAssistantTab";
import PokerGame from "@/components/PokerGame";
import PuanlarTab from "@/components/PuanlarTab";
import WyrmspanHorizontalScorepad from "@/components/WyrmspanHorizontalScorepad";
import CatanHorizontalScorepad from "@/components/CatanHorizontalScorepad";
import CarcassoneScoreboard from "@/components/CarcassoneScoreboard";
import { useInterstitialAd } from "@/components/InterstitialAd";

function GameSessionContent() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameSaveId = searchParams.get("gameSaveId");

  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [activeTab, setActiveTab] = useState("puan-tablosu");

  // Initialize interstitial ad
  const { showInterstitial, isAdReady } = useInterstitialAd({
    onAdClosed: () => {
      console.log("Interstitial ad closed");
    },
    onAdFailedToLoad: (error) => {
      console.log("Interstitial ad failed to load:", error);
    },
  });

  // Get current user first to ensure Convex auth works
  const currentUser = useQuery(
    api.users.getUserByFirebaseId,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );

  // Fetch game save data from Convex - ALWAYS call hooks first
  const gameSave = useQuery(
    api.gameSaves.getGameSaveById,
    gameSaveId ? { id: gameSaveId as Id<"gameSaves"> } : "skip"
  );

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking authentication
  if (!isLoaded || (isLoaded && !isSignedIn)) {
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

  // Handle static generation
  if (typeof window === "undefined") {
    return <div>Loading...</div>;
  }

  // Show loading state while Convex data is loading
  if (gameSave === undefined || currentUser === undefined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game data...</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {gameSave === undefined && "Loading game save..."}
            {currentUser === undefined && "Loading user..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if game save not found
  if (gameSave === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Game Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The game session you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/games")}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const gameName = gameSave?.name || "Oyun";

  // Check if this is a Wyrmspan game
  const isWyrmspanGame =
    gameSave?.gameTemplate === "j977daz379q5h1d266v0gkfq1h7swdvp";

  // Check if this is a Catan game
  const isCatanGame =
    gameSave?.gameTemplate === "j97468qwc0r8f3n0a04bhpgtz57sww2t";

  // Check if this is a Carcassonne game
  const isCarcassonneGame =
    gameSave?.gameTemplate === "j977k8t8rhgtxyzvwyafvk0nc17wkqh3";

  // Check if this is a Poker game
  const isPokerGame =
    gameSave?.gameTemplate === "j973hj02fpn4jjr9txpb84fy717rfekq";

  const handleBack = () => {
    // Show interstitial ad when navigating back (if ad is ready)
    if (isAdReady) {
      showInterstitial().then(() => {
        // Navigate after ad is shown
        router.push("/history");
      });
    } else {
      // Navigate immediately if ad is not ready
      router.push("/history");
    }
  };

  const getTimeAgo = () => {
    if (!gameSave?.createdTime) return "Bilinmiyor";

    const now = Date.now();
    const gameTime = gameSave.createdTime;
    const diffInMinutes = Math.floor((now - gameTime) / (1000 * 60));

    if (diffInMinutes < 1) {
      return "Az önce";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} dakika önce`;
    } else if (diffInMinutes < 1440) {
      // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} saat önce`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} gün önce`;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#100D16] shadow-sm"
        style={{ opacity: 1 }}
      >
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {gameName}
            </h1>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getTimeAgo()}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-[var(--card-border)]">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("puan-tablosu")}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 rounded-lg transition-colors ${
                activeTab === "puan-tablosu"
                  ? "text-white bg-blue-500 dark:bg-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <ChartBar size={16} />
              <span>
                {isWyrmspanGame || isCatanGame ? "Puanlama" : "Puanlar"}
              </span>
            </button>
            {gameSave?.gameTemplate === "j973hj02fpn4jjr9txpb84fy717rfekq" && (
              <button
                onClick={() => setActiveTab("poker-helper")}
                className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 rounded-lg transition-colors ${
                  activeTab === "poker-helper"
                    ? "text-white bg-blue-500 dark:bg-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Spade size={16} />
                <span>Poker</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab("kural-sor")}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 rounded-lg transition-colors ${
                activeTab === "kural-sor"
                  ? "text-white bg-blue-500 dark:bg-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <ChatCircle size={16} />
              <span>Sor</span>
            </button>
            <button
              onClick={() => setActiveTab("tum-kurallar")}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 rounded-lg transition-colors ${
                activeTab === "tum-kurallar"
                  ? "text-white bg-blue-500 dark:bg-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <ListBullets size={16} />
              <span>Kurallar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col pt-32 pb-6"
        style={{ minHeight: "calc(100vh - 140px)" }}
      >
        {activeTab === "puan-tablosu" ? (
          isPokerGame ? (
            <PokerGame gameSaveId={gameSaveId as Id<"gameSaves">} />
          ) : isWyrmspanGame ? (
            <WyrmspanHorizontalScorepad
              gameSaveId={gameSaveId as Id<"gameSaves">}
            />
          ) : isCatanGame ? (
            <CatanHorizontalScorepad
              gameSaveId={gameSaveId as Id<"gameSaves">}
            />
          ) : isCarcassonneGame ? (
            <CarcassoneScoreboard
              gameSaveId={gameSaveId as Id<"gameSaves">}
            />
          ) : (
            <PuanlarTab
              gameSaveId={gameSaveId as Id<"gameSaves">}
              isAdReady={isAdReady}
              showInterstitial={async () => {
                await showInterstitial();
              }}
            />
          )
        ) : activeTab === "tum-kurallar" ? (
          <GameRulesTab gameId={gameSave.gameTemplate} />
        ) : activeTab === "kural-sor" ? (
          <GameAskTab gameId={gameSave.gameTemplate} />
        ) : activeTab === "poker-helper" ? (
          <PokerAssistantTab />
        ) : null}
      </div>
    </div>
  );
}

export default function GameSessionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameSessionContent />
    </Suspense>
  );
}
