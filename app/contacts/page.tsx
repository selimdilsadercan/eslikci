"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Users, ArrowRight } from "@phosphor-icons/react";
import Sidebar from "@/components/Sidebar";
import AppBar from "@/components/AppBar";
import Header from "@/components/Header";
import { useTheme } from "@/components/ThemeProvider";

export default function ContactsPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  // Get all groups and players - ALWAYS call hooks first
  const groups = useQuery(
    api.groups.getGroups,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const players = useQuery(
    api.players.getPlayers,
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUser = useQuery(
    api.users.getUserByFirebaseId,
    user?.uid ? { firebaseId: user.uid } : "skip"
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

  const handleGroupClick = (groupId: Id<"groups">) => {
    router.push(`/group?groupId=${groupId}`);
  };

  // Get players for each group
  const getGroupPlayers = (groupId: Id<"groups">) => {
    return players?.filter((player) => player.groupId === groupId) || [];
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
          {/* Groups Grid */}
          {groups === undefined ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-[var(--card-background)] rounded-xl p-4 h-40 animate-pulse"
                >
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => {
                const groupPlayers = getGroupPlayers(group._id);

                return (
                  <button
                    key={group._id}
                    onClick={() => handleGroupClick(group._id)}
                    className="bg-white dark:bg-[var(--card-background)] rounded-xl p-5 text-left hover:shadow-lg dark:hover:shadow-xl transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {groupPlayers.length} oyuncu
                        </p>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-blue-500 flex-shrink-0"
                      />
                    </div>

                    {/* Avatar Stack */}
                    <div className="flex items-center -space-x-3">
                      {groupPlayers.slice(0, 4).map((player) => (
                        <div
                          key={player._id}
                          className="w-10 h-10 rounded-full border-2 border-white dark:border-[var(--card-background)] overflow-hidden flex-shrink-0"
                        >
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 font-semibold text-xs">
                                {player.initial}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {groupPlayers.length > 4 && (
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[var(--card-background)] flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                          +{groupPlayers.length - 4}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // Empty State
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
                  Henüz grup oluşturulmamış
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8">
                  Oyun gruplarını oluşturarak arkadaşlarınızı organize edin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AppBar for mobile screens */}
      <div className="lg:hidden">
        <AppBar currentPage="contacts" />
      </div>
    </div>
  );
}
