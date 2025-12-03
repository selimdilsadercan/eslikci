import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

type WinnerCount = Record<string, number>;

const calculateWinners = (gs: any): string[] => {
  // Carcassonne
  if (
    gs.gameTemplate === "j977k8t8rhgtxyzvwyafvk0nc17wkqh3" &&
    gs.specialPoints
  ) {
    let winnerIds: string[] = [];
    let maxScore = -1; // Start at -1 to ensure we only count positive scores or 0

    const sp = gs.specialPoints as Record<string, { entries?: { points: number }[] }>;

    for (const playerId in sp) {
      const playerData = sp[playerId];
      if (playerData && Array.isArray(playerData.entries)) {
        const totalScore = playerData.entries.reduce(
          (sum, entry) => sum + (entry.points || 0),
          0
        );

        if (totalScore > maxScore) {
          maxScore = totalScore;
          winnerIds = [playerId];
        } else if (totalScore === maxScore) {
          winnerIds.push(playerId);
        }
      }
    }
    
    // If maxScore is still -1, it means no one scored anything (or no entries). 
    // In Carcassonne, 0 points is possible, so maybe we should allow 0?
    // If everyone has 0, everyone wins? Or no one?
    // Let's assume if maxScore >= 0, we have winners.
    return maxScore >= 0 ? winnerIds : [];
  }

  // Munchkin: scores are stored in specialPoints { [playerId]: { level, bonus, ... } }
  if (gs?.specialPoints && typeof gs.specialPoints === "object") {
    const entries = Object.entries(gs.specialPoints).filter(
      ([_, val]) =>
        typeof val === "object" &&
        val !== null &&
        typeof (val as any).level === "number"
    );

    if (entries.length > 0) {
      let winnerIds: string[] = [];
      let maxLevel = -Infinity;

      for (const [playerId, value] of entries) {
        const level = (value as any).level ?? 0;
        const bonus =
          typeof (value as any).bonus === "number" ? (value as any).bonus : 0;
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

  const isLowScoreWins = gs?.settings?.roundWinner === "Lowest";

  // Team Games
  if (
    gs?.settings?.gameplay === "takimli" &&
    Array.isArray(gs?.teamLaps) &&
    gs.teamLaps.length > 0
  ) {
    // teamLaps is [roundIndex][teamIndex]
    // teamIndex 0 = Red, 1 = Blue
    const teamTotals: Record<number, number> = { 0: 0, 1: 0 };

    for (const round of gs.teamLaps) {
      if (Array.isArray(round)) {
        // Red Team (0)
        if (typeof round[0] === "number") teamTotals[0] += round[0];
        else if (Array.isArray(round[0]))
          teamTotals[0] += round[0].reduce((a: number, b: number) => a + b, 0);

        // Blue Team (1)
        if (typeof round[1] === "number") teamTotals[1] += round[1];
        else if (Array.isArray(round[1]))
          teamTotals[1] += round[1].reduce((a: number, b: number) => a + b, 0);
      }
    }

    let winningTeamIndex = -1;
    if (isLowScoreWins) {
      if (teamTotals[0] < teamTotals[1]) winningTeamIndex = 0;
      else if (teamTotals[1] < teamTotals[0]) winningTeamIndex = 1;
      // Draw: winningTeamIndex = -1 (or maybe both? let's assume no winner for now or handle draw)
      else if (teamTotals[0] === teamTotals[1]) return []; // Draw
    } else {
      if (teamTotals[0] > teamTotals[1]) winningTeamIndex = 0;
      else if (teamTotals[1] > teamTotals[0]) winningTeamIndex = 1;
      else if (teamTotals[0] === teamTotals[1]) return []; // Draw
    }

    if (winningTeamIndex === 0) return gs.redTeam || [];
    if (winningTeamIndex === 1) return gs.blueTeam || [];
    return [];
  }

  // Individual Games: use laps totals
  // laps is [playerIndex][roundIndex]
  if (
    Array.isArray(gs?.laps) &&
    gs.laps.length > 0 &&
    Array.isArray(gs.players)
  ) {
    const totals: Record<number, number> = {};
    
    // Iterate over players
    for (let idx = 0; idx < gs.players.length; idx++) {
      const playerLaps = gs.laps[idx];
      let total = 0;
      
      if (Array.isArray(playerLaps)) {
        for (const score of playerLaps) {
           if (typeof score === "number") {
             total += score;
           } else if (Array.isArray(score)) {
             total += score.reduce((a, b) => a + b, 0);
           }
        }
      }
      totals[idx] = total;
    }

    let winnerIds: string[] = [];
    let bestScore = isLowScoreWins ? Infinity : -Infinity;

    for (let idx = 0; idx < gs.players.length; idx++) {
      const score = totals[idx];
      // Skip if score is NaN (e.g. player has no laps) - though total starts at 0
      
      if (isLowScoreWins) {
        if (score < bestScore) {
          bestScore = score;
          winnerIds = [gs.players[idx]];
        } else if (score === bestScore) {
          winnerIds.push(gs.players[idx]);
        }
      } else {
        if (score > bestScore) {
          bestScore = score;
          winnerIds = [gs.players[idx]];
        } else if (score === bestScore) {
          winnerIds.push(gs.players[idx]);
        }
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
