"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, PencilSimple, Users } from "@phosphor-icons/react";
import CreateModal from "@/components/CreateModal";
import EditPlayerModal from "@/components/EditPlayerModal";
import Sidebar from "@/components/Sidebar";
import AppBar from "@/components/AppBar";
import Header from "@/components/Header";
import { useTheme } from "@/components/ThemeProvider";

export default function ContactsPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Id<"players"> | null>(
    null
  );

  // Get all players and groups - ALWAYS call hooks first
  const players = useQuery(
    api.players.getPlayers,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const groups = useQuery(
    api.groups.getGroups,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUser = useQuery(
    api.users.getUserByFirebaseId,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUserAsPlayer = useQuery(
    api.players.getPlayerByUserId,
    currentUser ? { userId: currentUser._id } : "skip"
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
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Group players by their group, excluding the current user's player
  const groupedPlayers =
    players?.reduce(
      (acc, player) => {
        // Skip the current user's player since it's shown in the "Ben" section
        if (currentUserAsPlayer && player._id === currentUserAsPlayer._id) {
          return acc;
        }

        const groupId = player.groupId || "ungrouped";
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(player);
        return acc;
      },
      {} as Record<string, typeof players>
    ) || {};

  const handlePlayerClick = (playerId: Id<"players">) => {
    // If clicking on own player, go to profile page
    if (currentUserAsPlayer && currentUserAsPlayer._id === playerId) {
      router.push("/profile");
    } else {
      router.push(`/player?playerId=${playerId}`);
    }
  };

  const handleEditPlayer = (playerId: Id<"players">, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPlayer(playerId);
    setShowEditModal(true);
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
      <Sidebar currentPage="contacts" />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-20 lg:pt-6">
          {/* Current User */}
          {currentUserAsPlayer === undefined ? (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Ben
              </h2>
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between py-2 bg-white dark:bg-[var(--card-background)] rounded-lg px-3"
                  style={{
                    boxShadow:
                      resolvedTheme === "dark"
                        ? "none"
                        : "0 0 8px 5px #297dff0a",
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : currentUserAsPlayer ? (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Ben
              </h2>
              <div className="space-y-2">
                <div
                  onClick={() => handlePlayerClick(currentUserAsPlayer._id)}
                  className="flex items-center justify-between py-2 bg-white dark:bg-[var(--card-background)] rounded-lg px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--card-background)]/80 transition-colors"
                  style={{
                    boxShadow:
                      resolvedTheme === "dark"
                        ? "none"
                        : "0 0 8px 5px #297dff0a",
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {currentUserAsPlayer.avatar ? (
                      <img
                        src={currentUserAsPlayer.avatar}
                        alt={currentUserAsPlayer.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center relative">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {currentUserAsPlayer.initial}
                        </span>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">+</span>
                        </div>
                      </div>
                    )}
                    <span className="font-medium text-black dark:text-[var(--foreground)] truncate max-w-[200px]">
                      {currentUserAsPlayer.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPlayer(currentUserAsPlayer._id, e);
                    }}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <PencilSimple size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Ungrouped Players */}
          {players === undefined ? (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Gruplandırılmamış
              </h2>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 bg-white dark:bg-[var(--card-background)] rounded-lg px-3"
                    style={{
                      boxShadow:
                        resolvedTheme === "dark"
                          ? "none"
                          : "0 0 8px 5px #297dff0a",
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : groupedPlayers.ungrouped &&
            groupedPlayers.ungrouped.length > 0 ? (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Gruplandırılmamış
              </h2>
              <div className="space-y-2">
                {groupedPlayers.ungrouped.map((player: typeof players[number]) => (
                  <div
                    key={player._id}
                    onClick={() => handlePlayerClick(player._id)}
                    className="flex items-center justify-between py-2 bg-white dark:bg-[var(--card-background)] rounded-lg px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--card-background)]/80 transition-colors"
                    style={{
                      boxShadow:
                        resolvedTheme === "dark"
                          ? "none"
                          : "0 0 8px 5px #297dff0a",
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center relative">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            {player.initial}
                          </span>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">+</span>
                          </div>
                        </div>
                      )}
                      <span className="font-medium text-black dark:text-[var(--foreground)] truncate max-w-[200px]">
                        {player.name}
                      </span>
                    </div>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleEditPlayer(player._id, e);
                      }}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      <PencilSimple size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Grouped Players */}
          {groups === undefined ? (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Gruplar
              </h2>
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 bg-white dark:bg-[var(--card-background)] rounded-lg px-3"
                    style={{
                      boxShadow:
                        resolvedTheme === "dark"
                          ? "none"
                          : "0 0 8px 5px #297dff0a",
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : groups.length > 0 ? (
            groups.map((group) => {
              const groupPlayers = groupedPlayers[group._id] || [];

              return (
                <div key={group._id} className="mb-6">
                  <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    {group.name}
                  </h2>
                  <div className="space-y-2">
                    {groupPlayers.length > 0 ? (
                      groupPlayers.map((player: any) => (
                        <div
                          key={player._id}
                          onClick={() => handlePlayerClick(player._id)}
                          className="flex items-center justify-between py-2 bg-white dark:bg-[var(--card-background)] rounded-lg px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--card-background)]/80 transition-colors"
                          style={{
                            boxShadow:
                              resolvedTheme === "dark"
                                ? "none"
                                : "0 0 8px 5px #297dff0a",
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            {player.avatar ? (
                              <img
                                src={player.avatar}
                                alt={player.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center relative">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                  {player.initial}
                                </span>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">+</span>
                                </div>
                              </div>
                            )}
                            <span className="font-medium text-black dark:text-[var(--foreground)] truncate max-w-[200px]">
                              {player.name}
                            </span>
                          </div>
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleEditPlayer(player._id);
                            }}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                          >
                            <PencilSimple size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-gray-600 dark:text-gray-400 text-sm">
                        Bu grupta henüz kişi yok
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : null}

          {/* Empty State - Show when there are no players besides the current user */}
          {players !== undefined &&
            Object.keys(groupedPlayers).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                {/* Decorative background circle */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <Users size={28} className="text-white" />
                    </div>
                  </div>
                  {/* Floating dots decoration */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
                  <div
                    className="absolute -bottom-1 -left-3 w-3 h-3 bg-green-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>

                {/* Content */}
                <div className="text-center max-w-sm">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-[var(--foreground)] mb-3">
                    Henüz kişi eklenmemiş
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8">
                    Oyun arkadaşlarınızı ekleyerek başlayın. Gruplar oluşturun
                    ve oyun deneyiminizi paylaşın.
                  </p>

                  {/* Call to action button */}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <Plus size={20} />
                    <span>İlk Kişiyi Ekle</span>
                  </button>
                </div>

                {/* Subtle hint */}
                <div className="mt-8 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Sağ üstteki "Ekle" butonunu da kullanabilirsiniz
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          groups={groups || []}
        />
      )}

      {showEditModal && selectedPlayer && (
        <EditPlayerModal
          playerId={selectedPlayer}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPlayer(null);
          }}
          groups={groups || []}
        />
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 z-50 px-4 py-3.5 space-x-2"
        style={{ backgroundColor: "var(--secondary-color)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#2a3f5a")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--secondary-color)")
        }
        aria-label="Add new contact"
      >
        <Plus size={20} weight="bold" />
        <span className="font-medium text-sm">Ekle</span>
      </button>

      {/* AppBar for mobile screens */}
      <div className="lg:hidden">
        <AppBar currentPage="contacts" />
      </div>
    </div>
  );
}
