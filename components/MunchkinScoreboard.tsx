"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Crown, Plus, Minus } from "@phosphor-icons/react";

interface MunchkinScoreboardProps {
  gameSaveId: Id<"gameSaves">;
}

interface PlayerScore {
  level: number;
  bonus: number;
  gender: "male" | "female";
}

export default function MunchkinScoreboard({
  gameSaveId,
}: MunchkinScoreboardProps) {
  // Fetch game save data
  const gameSave = useQuery(
    api.gameSaves.getGameSaveById,
    gameSaveId ? { id: gameSaveId } : "skip"
  );
  const players = useQuery(
    api.players.getPlayersByIds,
    gameSave?.players ? { playerIds: gameSave.players } : "skip"
  );

  // Initialize player scores from game save or default values
  const [playerScores, setPlayerScores] = useState<{
    [key: string]: PlayerScore;
  }>(() => {
    const initialScores: { [key: string]: PlayerScore } = {};
    if (gameSave?.players) {
      gameSave.players.forEach((playerId) => {
        initialScores[playerId] = {
          level: 1,
          bonus: 0,
          gender: "male",
        };
      });
    }
    return initialScores;
  });

  const gamePlayers = players || [];

  const updatePlayerScore = (
    playerId: string,
    field: keyof PlayerScore,
    value: number | "male" | "female"
  ) => {
    setPlayerScores((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const adjustValue = (playerId: string, field: "level", delta: number) => {
    const currentValue = playerScores[playerId]?.[field] || 1;
    const newValue = Math.max(1, Math.min(10, currentValue + delta));
    updatePlayerScore(playerId, field, newValue);
  };

  if (!gameSave || !players) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {gamePlayers.map((player) => {
          const scores = playerScores[player._id] || {
            level: 1,
            bonus: 0,
            gender: "male",
          };

          return (
            <div
              key={player._id}
              className="bg-white dark:bg-[var(--card-background)] rounded-2xl p-4 border border-gray-200 dark:border-[var(--card-border)] shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Player Header */}
              <div className="flex items-center space-x-3 mb-4">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {player.initial}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 truncate">
                    {player.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Level {scores.level}
                  </p>
                </div>
              </div>

              {/* Level Section */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[var(--card-border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown
                      size={18}
                      className="text-amber-600 dark:text-amber-400"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Level
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => adjustValue(player._id, "level", -1)}
                      disabled={scores.level <= 1}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        scores.level <= 1
                          ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                          : "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700"
                      }`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100 min-w-[2.5rem] text-center">
                      {scores.level}
                    </span>
                    <button
                      onClick={() => adjustValue(player._id, "level", 1)}
                      disabled={scores.level >= 10}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        scores.level >= 10
                          ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                          : "bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700"
                      }`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bonus Section */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[var(--card-border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 dark:text-green-400 font-bold text-base">
                      +
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bonus
                    </span>
                  </div>
                  <input
                    type="number"
                    value={scores.bonus}
                    onChange={(e) =>
                      updatePlayerScore(
                        player._id,
                        "bonus",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 h-8 text-center text-base font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              {/* Gender Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-base">
                    ♂
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gender
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      updatePlayerScore(player._id, "gender", "male")
                    }
                    className={`w-10 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      scores.gender === "male"
                        ? "bg-blue-500 dark:bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-base font-bold">♂</span>
                  </button>
                  <button
                    onClick={() =>
                      updatePlayerScore(player._id, "gender", "female")
                    }
                    className={`w-10 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      scores.gender === "female"
                        ? "bg-pink-500 dark:bg-pink-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-base font-bold">♀</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
