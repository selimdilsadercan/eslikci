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
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Helper component for score cells
  const ScoreCell = ({
    playerId,
    category,
    label,
    icon,
  }: {
    playerId: string;
    category: keyof PlayerScore;
    label: string;
    icon: React.ReactNode;
  }) => {
    const scores = playerScores[playerId] || {
      level: 1,
      bonus: 0,
      gender: "male",
    };
    const value = scores[category];

    if (category === "gender") {
      return (
        <div className="min-w-[120px] py-3 px-3 flex items-center justify-center border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => updatePlayerScore(playerId, "gender", "male")}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                value === "male"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              ♂
            </button>
            <button
              onClick={() => updatePlayerScore(playerId, "gender", "female")}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                value === "female"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              ♀
            </button>
          </div>
        </div>
      );
    }

    if (category === "bonus") {
      return (
        <div className="min-w-[120px] py-3 px-3 flex items-center justify-center border-b border-gray-200">
          <input
            type="number"
            value={value}
            onChange={(e) =>
              updatePlayerScore(
                playerId,
                "bonus",
                parseInt(e.target.value) || 0
              )
            }
            className="w-16 h-8 text-center text-lg font-bold text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            min="0"
          />
        </div>
      );
    }

    const numericValue = value as number;
    return (
      <div className="min-w-[120px] py-3 px-3 flex items-center justify-center border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => adjustValue(playerId, category as "level", -1)}
            disabled={numericValue <= 1}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              numericValue <= 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            <Minus size={12} />
          </button>
          <span className="text-lg font-bold text-gray-800 min-w-[2rem] text-center">
            {numericValue}
          </span>
          <button
            onClick={() => adjustValue(playerId, category as "level", 1)}
            disabled={numericValue >= 10}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              numericValue >= 10
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Define scoring categories
  const scoringCategories = [
    {
      key: "level" as keyof PlayerScore,
      label: "Level",
      icon: <Crown size={16} className="text-amber-600" />,
    },
    {
      key: "bonus" as keyof PlayerScore,
      label: "Bonus",
      icon: <span className="text-green-600 font-bold">+</span>,
    },
    {
      key: "gender" as keyof PlayerScore,
      label: "Gender",
      icon: <span className="text-blue-600 font-bold">♂</span>,
    },
  ];

  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-auto"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="min-w-full">
        {/* Table - Row by Row Rendering */}
        <div className="px-2 py-2 flex flex-col min-h-max">
          {/* Header Row with Player Names */}
          <div className="flex min-w-max">
            {/* Empty cell for category names */}
            <div
              className="w-32 py-4 sticky left-2 z-10"
              style={{ backgroundColor: "var(--background)" }}
            ></div>

            {/* Player Columns */}
            {gamePlayers.map((player) => (
              <div
                key={player._id}
                className="min-w-[120px] py-4 px-3 flex flex-col items-center border-b border-gray-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 font-semibold text-sm">
                        {player.initial}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-medium text-gray-800 text-sm text-center">
                  {player.name}
                </span>
                <div className="mt-2 text-lg font-bold text-gray-800">
                  Level {playerScores[player._id]?.level || 1}
                </div>
              </div>
            ))}
          </div>

          {/* Scoring Category Rows */}
          {scoringCategories.map((category) => (
            <div key={category.key} className="flex min-w-max">
              {/* Category Name Column */}
              <div
                className="w-32 py-3 px-4 flex items-center border-b border-gray-200 sticky left-2 z-10"
                style={{ backgroundColor: "var(--background)" }}
              >
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span className="text-gray-800 font-medium text-sm">
                    {category.label}
                  </span>
                </div>
              </div>

              {/* Player Score Columns */}
              {gamePlayers.map((player) => (
                <ScoreCell
                  key={`${player._id}-${category.key}`}
                  playerId={player._id}
                  category={category.key}
                  label={category.label}
                  icon={category.icon}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
