import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

type WinnerCount = Record<string, number>;

const calculateWinners = (gs: any): string[] => {
  // Munchkin: scores are stored in specialPoints { [playerId]: { level, bonus, ... } }
  if (gs?.specialPoints && typeof gs.specialPoints === "object") {
    const entries = Object.entries(gs.specialPoints).filter(
      ([_, val]) => typeof val === "object" && val !== null && typeof (val as any).level === "number"
    );

    if (entries.length > 0) {
      let winnerIds: string[] = [];
      let maxLevel = -Infinity;

      for (const [playerId, value] of entries) {
        const level = (value as any).level ?? 0;
        const bonus = typeof (value as any).bonus === "number" ? (value as any).bonus : 0;
        const score = level + bonus; // prioritize level; include bonus if present

        if (score > maxLevel) {
          maxLevel = score;
          winnerIds = [playerId];
        } else if (score === maxLevel) {
          winnerIds.push(playerId);
        }
      }

      return winnerIds;
    }
  }

  // Default: use laps totals (highest score wins)
  if (Array.isArray(gs?.laps) && gs.laps.length > 0 && Array.isArray(gs.players)) {
    const totals: Record<number, number> = {};
    for (let idx = 0; idx < gs.players.length; idx++) {
      let total = 0;
      for (const round of gs.laps) {
        if (Array.isArray(round) && typeof round[idx] === "number") {
          total += round[idx] as number;
        }
      }
      totals[idx] = total;
    }

    let winnerIds: string[] = [];
    let maxScore = -Infinity;
    for (let idx = 0; idx < gs.players.length; idx++) {
      const score = totals[idx];
      if (score > maxScore) {
        maxScore = score;
        winnerIds = [gs.players[idx]];
      } else if (score === maxScore) {
        winnerIds.push(gs.players[idx]);
      }
    }
    return winnerIds;
  }

  return [];
};

// Bir gruptaki en cok oynanan oyunlari ve her oyun icin en cok kazanan oyunculari dondurur
export const getGroupStats = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    // 1. Gruptaki tum gameSave'leri bul
    const allGameSaves = await ctx.db.query("gameSaves").collect();
    const gameSaves = allGameSaves.filter((gs) => gs.groupId === args.groupId);

    // 2. Oyunlari say: {gameTemplateId: count}
    const gameCounts: Record<string, number> = {};
    for (const gs of gameSaves) {
      if (!gs.gameTemplate) continue;
      gameCounts[gs.gameTemplate] = (gameCounts[gs.gameTemplate] || 0) + 1;
    }

    // 3. En cok oynanan oyunlari sirala
    const sortedGames = Object.entries(gameCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([gameTemplateId, count]) => ({ gameTemplateId: gameTemplateId as Id<"games">, count }));

    // 4. Her oyun icin en cok kazanan oyunculari bul
    const winnersByGame: Record<string, { playerId: string; winCount: number }[]> = {};
    for (const { gameTemplateId } of sortedGames) {
      const saves = gameSaves.filter((gs) => gs.gameTemplate === gameTemplateId);
      const winCounts: WinnerCount = {};

      for (const gs of saves) {
        const winners = calculateWinners(gs);
        winners.forEach((winnerId) => {
          winCounts[winnerId] = (winCounts[winnerId] || 0) + 1;
        });
      }

      const sortedWinners = Object.entries(winCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([playerId, winCount]) => ({ playerId, winCount }));
      winnersByGame[gameTemplateId] = sortedWinners;
    }

    return {
      mostPlayedGames: sortedGames, // [{gameTemplateId, count}]
      winnersByGame, // {gameTemplateId: [{playerId, winCount}]}
    };
  },
});
