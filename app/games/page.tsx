"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  MagnifyingGlass,
  Star,
  Fire,
  Sparkle,
  Clock,
} from "@phosphor-icons/react";
import AddGameModal from "@/components/AddGameModal";
import AdBanner from "@/components/AdBanner";
import Sidebar from "@/components/Sidebar";
import AppBar from "@/components/AppBar";
import Header from "@/components/Header";
import GameImage from "@/components/GameImage";
import { useTheme } from "@/components/ThemeProvider";

export default function GamesPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const games = useQuery(api.games.getGames);
  const gameLists = useQuery(api.gameLists.getGameLists);
  const createGame = useMutation(api.games.createGame);

  // Get user's game history to determine favorites
  const currentUser = useQuery(
    api.users.getUserByFirebaseId,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const gameSaves = useQuery(
    api.gameSaves.getGameSaves,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const [showModal, setShowModal] = useState(false);

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

  const handleGameSelect = (gameId: string) => {
    router.push(`/create-game?gameId=${gameId}`);
  };

  const handleAddGame = async (gameName: string) => {
    try {
      await createGame({
        name: gameName,
        rules: "",
        settings: {
          gameplay: "herkes-tek",
          calculationMode: "NoPoints",
          roundWinner: "Highest",
          hideTotalColumn: false,
        },
      });
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handleSearchClick = () => {
    router.push("/search");
  };

  // Get user's favorite games based on play frequency
  const getFavoriteGames = () => {
    if (!gameSaves || !games) return [];

    const gamePlayCount = gameSaves.reduce(
      (acc, save) => {
        const gameId = save.gameTemplate;
        acc[gameId] = (acc[gameId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return games
      .filter((game) => gamePlayCount[game._id] > 0)
      .sort((a, b) => (gamePlayCount[b._id] || 0) - (gamePlayCount[a._id] || 0))
      .slice(0, 4);
  };

  // Get games in a specific list
  const getGamesInList = (listId: string) => {
    if (!games) return [];
    const list = gameLists?.find((l) => l._id === listId);
    if (!list) return [];

    return games.filter((game) => list.gameIds.includes(game._id));
  };

  // Get recently played games with fallback to random games
  const getRecentlyPlayedGames = () => {
    if (!games) return [];

    // If no game saves, return random games
    if (!gameSaves || gameSaves.length === 0) {
      const shuffledGames = [...games].sort(() => Math.random() - 0.5);
      return shuffledGames.slice(0, 8);
    }

    // Get unique games from recent saves, sorted by most recent
    const recentGameIds = gameSaves
      .sort((a, b) => b.createdTime - a.createdTime)
      .map((save) => save.gameTemplate)
      .filter((gameId, index, array) => array.indexOf(gameId) === index) // Remove duplicates
      .slice(0, 8); // Get up to 8 games

    const recentGames = games.filter((game) =>
      recentGameIds.includes(game._id)
    );

    // If we have less than 8 recent games, fill with random games
    if (recentGames.length < 8) {
      const remainingSlots = 8 - recentGames.length;
      const usedGameIds = new Set(recentGames.map((game) => game._id));
      const availableGames = games.filter((game) => !usedGameIds.has(game._id));

      // Shuffle and take random games
      const shuffledGames = [...availableGames].sort(() => Math.random() - 0.5);
      const randomGames = shuffledGames.slice(0, remainingSlots);

      return [...recentGames, ...randomGames];
    }

    return recentGames;
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
      <Sidebar currentPage="games" />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-20 lg:pt-6">
          {/* Search Button */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlass
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <button
                onClick={handleSearchClick}
                className="w-full bg-white dark:bg-[var(--card-background)] rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-3 text-left text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[var(--card-background)]/80 transition-colors cursor-pointer"
                style={{
                  boxShadow:
                    resolvedTheme === "dark" ? "none" : "0 0 8px 5px #297dff0a",
                }}
              >
                Oyun ara...
              </button>
            </div>
          </div>

          {/* Game Lists Sections */}
          {games === undefined || gameLists === undefined ? (
            // Skeleton loading for games
            <div className="space-y-8 mb-8">
              {["Loading..."].map((section, index) => (
                <div key={index}>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-4"></div>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, gameIndex) => (
                      <div
                        key={gameIndex}
                        className="bg-white dark:bg-[var(--card-background)] rounded-lg"
                        style={{
                          padding: "16px",
                          height: "100px",
                          boxShadow:
                            resolvedTheme === "dark"
                              ? "none"
                              : "0 0 8px 5px #297dff0a",
                        }}
                      >
                        <div className="flex flex-col justify-center h-full">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                Henüz oyun eklenmemiş
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                İlk oyununuzu ekleyerek başlayın
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
              >
                Oyun Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-8 mb-8">
              {/* Recently Played Games Section */}
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {getRecentlyPlayedGames().map((game) => (
                    <div
                      key={game._id}
                      className="bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        padding: "12px",
                        height: "50px",
                        minHeight: "50px",
                      }}
                      onClick={() => handleGameSelect(game._id)}
                    >
                      <div className="flex items-center h-full">
                        <GameImage
                          game={game}
                          size="md"
                          className="mr-3 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-200 dark:hover:text-gray-200 text-sm leading-tight truncate">
                            {game.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Game Lists */}
              {gameLists && gameLists.length > 0
                ? gameLists.map((list) => {
                    const gamesInList = getGamesInList(list._id);
                    if (gamesInList.length === 0) return null;

                    return (
                      <div key={list._id}>
                        <div className="flex items-center gap-2 mb-4">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                            {list.name}
                          </h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {gamesInList.map((game) => (
                            <div
                              key={game._id}
                              className="bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                              style={{
                                padding: "16px",
                                height: "100px",
                                width: "140px",
                                boxShadow:
                                  resolvedTheme === "dark"
                                    ? "none"
                                    : "0 0 8px 5px #297dff0a",
                              }}
                              onClick={() => handleGameSelect(game._id)}
                            >
                              <div className="flex flex-col justify-center items-center text-center h-full">
                                <GameImage
                                  game={game}
                                  size="lg"
                                  className="mb-1"
                                />
                                <h3 className="font-medium text-gray-900 dark:text-gray-200 dark:hover:text-gray-200 text-sm leading-tight mb-1">
                                  {game.name}
                                </h3>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                : /* Fallback: Your Favorite Games Section */
                  getFavoriteGames().length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Star size={20} className="text-yellow-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                          Favori Oyunlarınız
                        </h2>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {getFavoriteGames().map((game) => (
                          <div
                            key={game._id}
                            className="bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                            style={{
                              padding: "16px",
                              height: "100px",
                              width: "140px",
                              boxShadow: "0 0 8px 5px #297dff0a",
                            }}
                            onClick={() => handleGameSelect(game._id)}
                          >
                            <div className="flex flex-col justify-center items-center text-center h-full">
                              <GameImage
                                game={game}
                                size="lg"
                                className="mb-1"
                              />
                              <h3 className="font-medium text-gray-900 dark:text-gray-200 dark:hover:text-gray-200 text-sm leading-tight mb-1">
                                {game.name}
                              </h3>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

              {/* Show all games if no lists or favorites */}
              {(!gameLists || gameLists.length === 0) &&
                getFavoriteGames().length === 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                        Tüm Oyunlar
                      </h2>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {games?.slice(0, 8).map((game) => (
                        <div
                          key={game._id}
                          className="bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 flex-shrink-0"
                          style={{
                            padding: "16px",
                            height: "100px",
                            width: "140px",
                            boxShadow:
                              resolvedTheme === "dark"
                                ? "none"
                                : "0 0 8px 5px #297dff0a",
                          }}
                          onClick={() => handleGameSelect(game._id)}
                        >
                          <div className="flex flex-col justify-center items-center text-center h-full">
                            <GameImage game={game} size="lg" className="mb-1" />
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm leading-tight mb-1">
                              {game.name}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Tüm Oyunlar - Always show as last section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                    Tüm Oyunlar
                  </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {games?.map((game) => (
                    <div
                      key={game._id}
                      className="bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        padding: "16px",
                        height: "100px",
                        width: "140px",
                        boxShadow:
                          resolvedTheme === "dark"
                            ? "none"
                            : "0 0 8px 5px #297dff0a",
                      }}
                      onClick={() => handleGameSelect(game._id)}
                    >
                      <div className="flex flex-col justify-center items-center text-center h-full">
                        <GameImage game={game} size="lg" className="mb-1" />
                        <h3 className="font-medium text-gray-900 dark:text-gray-200 dark:hover:text-gray-200 text-sm leading-tight mb-1">
                          {game.name}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Banner Ad */}
          <AdBanner position="bottom" className="mx-4 mb-4" />
        </div>
      </div>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddGame={handleAddGame}
      />

      {/* AppBar for mobile screens */}
      <div className="lg:hidden">
        <AppBar currentPage="games" />
      </div>
    </div>
  );
}
