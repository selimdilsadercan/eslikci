import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getGames = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Sort by index if available, otherwise by creation time
    return games.sort((a, b) => {
      if (a.index !== undefined && b.index !== undefined) {
        return a.index - b.index;
      }
      if (a.index !== undefined) return -1;
      if (b.index !== undefined) return 1;
      return a.createdAt - b.createdAt;
    });
  },
});

export const getGameById = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createGame = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    rules: v.optional(v.string()),
    banner: v.optional(v.string()),
    category: v.optional(v.string()),
    emoji: v.optional(v.string()),
    settings: v.optional(v.object({
      gameplay: v.optional(v.string()),
      calculationMode: v.optional(v.string()),
      roundWinner: v.optional(v.string()),
      pointsPerRound: v.optional(v.string()),
      hideTotalColumn: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    // Get the highest index to add new game at the end
    const games = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const gamesWithIndex = games.filter(g => g.index !== undefined);
    const maxIndex = gamesWithIndex.length > 0 ? Math.max(...gamesWithIndex.map(g => g.index!)) : -1;
    
    return await ctx.db.insert("games", {
      name: args.name,
      description: args.description,
      rules: args.rules,
      banner: args.banner,
      category: args.category,
      emoji: args.emoji,
      settings: args.settings || {},
      isActive: true,
      index: maxIndex + 1,
      createdAt: Date.now(),
    });
  },
});

export const updateGame = mutation({
  args: {
    id: v.id("games"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    rules: v.optional(v.string()),
    banner: v.optional(v.string()),
    category: v.optional(v.string()),
    emoji: v.optional(v.string()),
    settings: v.optional(v.object({
      gameplay: v.optional(v.string()),
      calculationMode: v.optional(v.string()),
      roundWinner: v.optional(v.string()),
      pointsPerRound: v.optional(v.string()),
      hideTotalColumn: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteGame = mutation({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { isActive: false });
  },
});

export const updateGameIndices = mutation({
  args: { 
    updates: v.array(v.object({
      id: v.id("games"),
      index: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    const promises = args.updates.map(update => 
      ctx.db.patch(update.id, { index: update.index })
    );
    await Promise.all(promises);
  },
});

