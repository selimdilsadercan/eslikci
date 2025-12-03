"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowLeft, Clock, TrendUp, Users as UsersIcon, PencilSimple } from "@phosphor-icons/react";
import GameHistoryCard from "@/components/GameHistoryCard";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import GameImage from "@/components/GameImage";

export default function GroupDetailPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId") as string;
  const [activeTab, setActiveTab] = useState<"istatistik" | "history" | "players">("istatistik");

  // Get group, players and game saves - ALWAYS call hooks first
  const currentUser = useQuery(
    api.users.getUserByFirebaseId,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const group = useQuery(
    api.groups.getGroupById,
    groupId ? { id: groupId as Id<"groups"> } : "skip"
  );
  const allPlayers = useQuery(
    api.players.getPlayers,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const gameSaves = useQuery(
    api.gameSaves.getGameSaves,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const groupStats = useQuery(
    api.groupStats.getGroupStats,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const games = useQuery(api.games.getGames);

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
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Get players in this group
  const groupPlayers = allPlayers?.filter((player) => player.groupId === groupId) || [];

  // Get game saves for this group
  const groupGameSaves = gameSaves?.filter((save) => save.groupId === groupId) || [];

  const handleBack = () => {
    router.back();
  };

  const playerLookup = Object.fromEntries(groupPlayers.map((player) => [player._id, player]));
  const gameLookup = new Map((games || []).map((game) => [game._id, game]));

  const renderHistory = () => (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Oyun Gecmisi
      </h2>
      {gameSaves === undefined ? (
        // Skeleton Loading for game history
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : groupGameSaves && groupGameSaves.length > 0 ? (
        <div className="space-y-3">
          {groupGameSaves.map((gameSave) => {
            const allPlayerIdsInGame = [
              ...(gameSave.players || []),
              ...(gameSave.redTeam || []),
              ...(gameSave.blueTeam || []),
            ];
            const uniquePlayerIds = Array.from(new Set(allPlayerIdsInGame));
            const playerData = allPlayers
              ? uniquePlayerIds
                  .map((id) => allPlayers.find((p) => p._id === id))
                  .filter(Boolean)
              : [];

            return (
              <GameHistoryCard
                key={gameSave._id}
                gameSave={gameSave}
                variant="full"
                players={playerData}
                playerIds={uniquePlayerIds}
                onClick={() => {
                  router.push(`/game-session?gameSaveId=${gameSave._id}`);
                }}
                showDelete={false}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Bu grupla henuz oyun oynanmadi</p>
        </div>
      )}
    </div>
  );

  const renderPlayers = () => (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Grup Oyunculari
      </h2>
      {allPlayers === undefined ? (
        // Skeleton Loading for players
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : groupPlayers && groupPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupPlayers.map((player) => (
            <div
              key={player._id}
              className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/profile/${player._id}`)}
                  title="Oyuncu profiline git"
                >
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {player.initial}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    {player.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {player.isActive ? "Aktif" : "Pasif"}
                  </p>
                  <button
                    className="mt-1 text-xs text-blue-500 underline hover:text-blue-700"
                    onClick={() => router.push(`/history?playerId=${player._id}`)}
                  >
                    Oyun Gecmisi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Bu grupta henuz oyuncu yok</p>
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Grup Istatistikleri
      </h2>
      {groupStats === undefined || games === undefined ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : groupStats?.mostPlayedGames?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">En cok oynanan oyunlar</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Oyun sayilari</p>
              </div>
              <TrendUp size={22} className="text-blue-500" />
            </div>
            <div className="space-y-3">
              {groupStats.mostPlayedGames.map(({ gameTemplateId, count }) => {
                const game = gameLookup.get(gameTemplateId);
                return (
                  <div
                    key={gameTemplateId}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {game?.name || "Bilinmeyen oyun"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{count} kez oynandi</p>
                    </div>
                    <div className="flex-shrink-0">
                      {game && <GameImage game={game} size="md" className="w-10 h-10 rounded-lg" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">En cok kazananlar</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Oyun bazinda</p>
              </div>
              <UsersIcon size={22} className="text-blue-500" />
            </div>
            <div className="space-y-4">
              {groupStats.mostPlayedGames.map(({ gameTemplateId }) => {
                const winners = groupStats.winnersByGame?.[gameTemplateId] || [];
                const game = gameLookup.get(gameTemplateId);
                return (
                  <div
                    key={gameTemplateId}
                    className="border-t border-gray-100 dark:border-gray-700 pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {game?.name || "Bilinmeyen oyun"}
                      </p>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {winners.length ? "Kazananlar" : "Kayit yok"}
                      </span>
                    </div>
                    {winners.length ? (
                      <div className="space-y-2">
                        {winners.slice(0, 3).map(({ playerId, winCount }) => {
                          const player = playerLookup[playerId];
                          return (
                            <div
                              key={playerId}
                              className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 rounded-md px-3 py-2"
                            >
                              <div className="flex items-center gap-3">
                                {player?.avatar ? (
                                  <img
                                    src={player.avatar}
                                    alt={player.name}
                                    className="w-9 h-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                    {player?.initial || "?"}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {player?.name || "Bilinmeyen oyuncu"}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {winCount} galibiyet
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Bu oyun icin galibiyet bilgisi yok
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Bu grup icin istatistik bulunamadi</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="contacts" />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-6 pb-6">
          {/* Back Button and Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-800 dark:text-gray-200" />
            </button>
            <div className="flex-1">
              {group === undefined ? (
                <>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {group?.name || "Yukleniyor..."}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {groupPlayers.length} oyuncu
                      {groupGameSaves.length > 0 && ` • ${groupGameSaves.length} oyun oynandi`}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/group/edit?groupId=${groupId}`)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    title="Grubu Duzenle"
                  >
                    <PencilSimple size={24} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("istatistik")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "istatistik"
                  ? "text-blue-500 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendUp size={18} />
                <span>Istatistik</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "text-blue-500 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>Gecmis</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("players")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "players"
                  ? "text-blue-500 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <UsersIcon size={18} />
                <span>Oyuncular</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "history"
            ? renderHistory()
            : activeTab === "players"
            ? renderPlayers()
            : renderStats()}
        </div>
      </div>
    </div>
  );
}
