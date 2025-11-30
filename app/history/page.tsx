"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ConfirmModal from "@/components/ConfirmModal";
import AdBanner from "@/components/AdBanner";
import Sidebar from "@/components/Sidebar";
import AppBar from "@/components/AppBar";
import Header from "@/components/Header";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function HistoryPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Id<"gameSaves"> | null>(
    null
  );

  // Fetch game saves and related data - ALWAYS call hooks first
  // Use the user from Firebase Auth to get the Convex user
  const currentUser = useQuery(
    api.users.getUserByFirebaseId,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const gameSaves = useQuery(
    api.gameSaves.getGameSaves,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const players = useQuery(
    api.players.getPlayers,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const games = useQuery(api.games.getGames);
  const deleteGameSave = useMutation(api.gameSaves.deleteGameSave);

  // Get all unique player IDs from game saves
  const allPlayerIds = gameSaves
    ? Array.from(
        new Set(
          gameSaves.flatMap((gs) => [
            ...(gs.players || []),
            ...(gs.redTeam || []),
            ...(gs.blueTeam || []),
          ])
        )
      )
    : [];

  // Get all players from game saves (including those not in contacts)
  const allGamePlayers = useQuery(
    api.players.getPlayersByIds,
    allPlayerIds.length > 0 ? { playerIds: allPlayerIds } : "skip"
  );

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
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
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleDelete = (gameSaveId: Id<"gameSaves">) => {
    setGameToDelete(gameSaveId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (gameToDelete) {
      try {
        await deleteGameSave({ id: gameToDelete });
        setShowConfirmModal(false);
        setGameToDelete(null);
      } catch (error) {
        console.error("Error deleting game save:", error);
      }
    }
  };

  const handleGameClick = (gameSaveId: Id<"gameSaves">) => {
    // Navigate to game session with the game save ID
    router.push(`/game-session?gameSaveId=${gameSaveId}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    return date.toLocaleDateString("tr-TR", options);
  };

  const getDateGroup = (timestamp: number) => {
    const now = new Date();
    const gameDate = new Date(timestamp);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const gameDateOnly = new Date(
      gameDate.getFullYear(),
      gameDate.getMonth(),
      gameDate.getDate()
    );

    if (gameDateOnly.getTime() === today.getTime()) {
      return "Bugün";
    } else if (gameDateOnly.getTime() === yesterday.getTime()) {
      return "Dün";
    } else if (gameDate >= weekAgo) {
      return "Bu Hafta";
    } else if (gameDate >= monthAgo) {
      return "Bu Ay";
    } else {
      return "Daha Önce";
    }
  };

  const groupGameSavesByDate = (gameSaves: any[]) => {
    if (!gameSaves) return {};

    const grouped = gameSaves.reduce(
      (groups, gameSave) => {
        const group = getDateGroup(gameSave.createdTime);
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(gameSave);
        return groups;
      },
      {} as Record<string, any[]>
    );

    // Sort groups in the desired order
    const groupOrder = ["Bugün", "Dün", "Bu Hafta", "Bu Ay", "Daha Önce"];
    const orderedGroups: Record<string, any[]> = {};

    groupOrder.forEach((groupName) => {
      if (grouped[groupName]) {
        orderedGroups[groupName] = grouped[groupName];
      }
    });

    return orderedGroups;
  };

  const getPlayerData = (playerIds: Id<"players">[]) => {
    if (!playerIds || playerIds.length === 0) return [];

    // Combine allGamePlayers and players to ensure we have all players
    const allAvailablePlayers = [...(allGamePlayers || []), ...(players || [])];

    // Remove duplicates by _id
    const uniquePlayers = allAvailablePlayers.filter(
      (player, index, self) =>
        index === self.findIndex((p) => p._id === player._id)
    );

    return playerIds
      .map((id) => {
        const player = uniquePlayers.find((p) => p._id === id);
        return player;
      })
      .filter(Boolean);
  };

  const getGameName = (gameTemplateId: Id<"games">) => {
    if (!games) return "Oyun";
    const game = games.find((g) => g._id === gameTemplateId);
    return game?.name || "Oyun";
  };

  return (
    <div
      className="min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header for mobile screens */}
      <div className="lg:hidden">
        <Header />
      </div>

      {/* Sidebar for wide screens */}
      <Sidebar currentPage="history" />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-20 lg:pt-6">
          {/* Game History List */}
          <div className="space-y-6">
            {gameSaves === undefined ? (
              // Skeleton loading for game history
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 flex items-center justify-between"
                  style={{
                    boxShadow:
                      resolvedTheme === "dark"
                        ? "none"
                        : "0 0 8px 5px #297dff0a",
                  }}
                >
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))
            ) : gameSaves.length > 0 ? (
              (() => {
                const groupedGameSaves = groupGameSavesByDate(gameSaves);
                return Object.entries(groupedGameSaves).map(
                  ([groupName, groupGameSaves]) => (
                    <div key={groupName} className="space-y-3">
                      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 px-2">
                        {groupName}
                      </h2>
                      <div className="space-y-2">
                        {groupGameSaves.map((gameSave) => {
                          const gameName = getGameName(gameSave.gameTemplate);
                          // Get all players from the game save (including teams)
                          const allPlayerIdsInGame = [
                            ...(gameSave.players || []),
                            ...(gameSave.redTeam || []),
                            ...(gameSave.blueTeam || []),
                          ];
                          // Remove duplicates
                          const uniquePlayerIds = Array.from(
                            new Set(allPlayerIdsInGame)
                          );
                          const playerData = getPlayerData(uniquePlayerIds);
                          const formattedDate = formatDate(
                            gameSave.createdTime
                          );

                          return (
                            <div
                              key={gameSave._id}
                              className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 flex items-center justify-between"
                              style={{
                                boxShadow:
                                  resolvedTheme === "dark"
                                    ? "none"
                                    : "0 0 8px 5px #297dff0a",
                              }}
                            >
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => handleGameClick(gameSave._id)}
                              >
                                <h3 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                                  {gameName}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {formattedDate}
                                </p>
                                <div className="flex space-x-1 mt-1">
                                  {playerData.map((player, index) => {
                                    const colors = [
                                      "bg-blue-100 text-blue-600",
                                      "bg-green-100 text-green-600",
                                      "bg-purple-100 text-purple-600",
                                      "bg-orange-100 text-orange-600",
                                      "bg-pink-100 text-pink-600",
                                      "bg-indigo-100 text-indigo-600",
                                    ];
                                    const colorClass =
                                      colors[index % colors.length];

                                    return (
                                      <div
                                        key={player?._id || index}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                                      >
                                        {player?.avatar ? (
                                          <img
                                            src={player.avatar}
                                            alt={player.name}
                                            className="w-6 h-6 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${colorClass}`}
                                          >
                                            {player?.initial ||
                                              player?.name
                                                ?.charAt(0)
                                                .toUpperCase() ||
                                              ""}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(gameSave._id);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash size={20} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                );
              })()
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Henüz oyun geçmişi yok
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  İlk oyununuzu oluşturarak başlayın
                </p>
              </div>
            )}
          </div>

          {/* Banner Ad */}
          <AdBanner position="bottom" className="mx-4 mb-4" />
        </div>
      </div>

      {/* AppBar for mobile screens */}
      <div className="lg:hidden">
        <AppBar currentPage="history" />
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Oyunu Sil"
        message="Bu oyunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDestructive={true}
      />
    </div>
  );
}
