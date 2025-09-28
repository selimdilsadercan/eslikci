import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getGameSaves = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("gameSaves")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("gameSaves")
      .order("desc")
      .collect();
  },
});

export const getGameSaveById = query({
  args: { id: v.id("gameSaves") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createGameSave = mutation({
  args: {
    name: v.string(),
    gameTemplate: v.id("games"),
    players: v.array(v.id("players")),
    redTeam: v.optional(v.array(v.id("players"))),
    blueTeam: v.optional(v.array(v.id("players"))),
    results: v.optional(v.string()),
    laps: v.optional(v.array(v.array(v.number()))),
    settings: v.object({
      gameplay: v.union(v.literal("herkes-tek"), v.literal("takimli")),
      calculationMode: v.union(v.literal("NoPoints"), v.literal("Points")),
      roundWinner: v.union(v.literal("Highest"), v.literal("Lowest")),
      pointsPerRound: v.optional(v.union(v.literal("Single"), v.literal("Multiple"))),
      penaltiesPerRound: v.optional(v.union(v.literal("Single"), v.literal("Multiple"))),
      hideTotalColumn: v.boolean(),
    }),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gameSaves", {
      name: args.name,
      gameTemplate: args.gameTemplate,
      players: args.players,
      redTeam: args.redTeam,
      blueTeam: args.blueTeam,
      results: args.results,
      laps: args.laps,
      settings: args.settings,
      createdTime: Date.now(),
      userId: args.userId,
      isActive: true,
    });
  },
});

export const updateGameSave = mutation({
  args: {
    id: v.id("gameSaves"),
    name: v.optional(v.string()),
    results: v.optional(v.string()),
    laps: v.optional(v.array(v.array(v.number()))),
    settings: v.optional(v.object({
      gameplay: v.union(v.literal("herkes-tek"), v.literal("takimli")),
      calculationMode: v.union(v.literal("NoPoints"), v.literal("Points")),
      roundWinner: v.union(v.literal("Highest"), v.literal("Lowest")),
      pointsPerRound: v.optional(v.union(v.literal("Single"), v.literal("Multiple"))),
      penaltiesPerRound: v.optional(v.union(v.literal("Single"), v.literal("Multiple"))),
      hideTotalColumn: v.boolean(),
    })),
    isTotalHidden: v.optional(v.boolean()),
    isMultipleLapitems: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const addRoundScores = mutation({
  args: {
    id: v.id("gameSaves"),
    roundScores: v.array(v.number()), // Array of scores for current round
  },
  handler: async (ctx, args) => {
    const gameSave = await ctx.db.get(args.id);
    if (!gameSave) throw new Error("Game save not found");

    // Initialize laps if it doesn't exist
    let laps = gameSave.laps || [];
    
    // Ensure we have arrays for all players
    while (laps.length < gameSave.players.length) {
      laps.push([]);
    }
    
    // Add the new round scores to each player's laps
    const updatedLaps = laps.map((playerLaps, index) => {
      const newLaps = [...playerLaps];
      newLaps.push(args.roundScores[index] || 0);
      return newLaps;
    });
    
    return await ctx.db.patch(args.id, { laps: updatedLaps });
  },
});

export const deleteGameSave = mutation({
  args: { id: v.id("gameSaves") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
