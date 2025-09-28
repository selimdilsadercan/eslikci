import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getGames = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
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
    settings: v.optional(v.object({
      gameplay: v.optional(v.string()),
      calculationMode: v.optional(v.string()),
      roundWinner: v.optional(v.string()),
      pointsPerRound: v.optional(v.string()),
      hideTotalColumn: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      name: args.name,
      description: args.description,
      rules: args.rules,
      banner: args.banner,
      settings: args.settings || {},
      isActive: true,
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
