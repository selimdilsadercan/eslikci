"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ConfirmModal from "@/components/ConfirmModal";
import AdBanner from "@/components/AdBanner";
import Sidebar from "@/components/Sidebar";
import AppBar from "@/components/AppBar";
import Header from "@/components/Header";
import GameHistoryCard from "@/components/GameHistoryCard";
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

  const handleDelete = (gameSaveId: Id<"gameSaves">) => {
    setGameToDelete(gameSaveId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (gameToDelete) {
      try {
        await deleteGameSave({ id: gameToDelete });
      } catch (error) {
        console.error("Error deleting game save:", error);
      } finally {
        setShowConfirmModal(false);
        setGameToDelete(null);
      }
    }
  };

  const handleGameClick = (gameSaveId: Id<"gameSaves">) => {
    router.push(`/game-session?gameSaveId=${gameSaveId}`);
  };

  const allPlayerIds = gameSaves
    ? Array.from(
        new Set(
          gameSaves.flatMap((gs: any) => [
            ...(gs.players || []),
            ...(gs.redTeam || []),
            ...(gs.blueTeam || []),
          ])
        )
      )
    : [];

  const allGamePlayers = useQuery(
    api.players.getPlayersByIds,
    allPlayerIds.length > 0 ? { playerIds: allPlayerIds } : "skip"
  );

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
                          // Oyunculara skor/puan ekle
                          const playerData = getPlayerData(uniquePlayerIds).map((player) => {
                            // gameSave'de playerScores, scores, puanlar veya benzeri bir alan varsa buradan çek
                            // Örnek: gameSave.scores = [{playerId, score}]
                            let score = null;
                            if (gameSave.scores && Array.isArray(gameSave.scores)) {
                              const found = gameSave.scores.find((s: any) => s.playerId === player._id);
                              if (found) score = found.score;
                            }
                            // Alternatif olarak gameSave.puanlar veya player.puan/score
                            if (score == null && gameSave.puanlar && Array.isArray(gameSave.puanlar)) {
                              const found = gameSave.puanlar.find((s: any) => s.playerId === player._id);
                              if (found) score = found.puan;
                            }
                            // Eğer player objesinde score/puan varsa onu da kullan
                            score = score ?? player.score ?? player.puan ?? 0;
                            return { ...player, score };
                          });
                          const formattedDate = formatDate(
                            gameSave.createdTime
                          );

                          return (
                            <GameHistoryCard
                              key={gameSave._id}
                              gameSave={gameSave}
                              variant="full"
                              players={playerData}
                              onClick={() => handleGameClick(gameSave._id)}
                              showDelete={true}
                              onDelete={() => handleDelete(gameSave._id)}
                            />
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
