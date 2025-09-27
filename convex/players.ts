import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPlayers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getCurrentUserAsPlayer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || !user.playerId) {
      return null;
    }

    // Get the player record
    return await ctx.db.get(user.playerId);
  },
});

export const getPlayerById = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPlayersByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const createPlayer = mutation({
  args: {
    name: v.string(),
    initial: v.string(),
    avatar: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("players", {
      userId: user._id,
      name: args.name,
      initial: args.initial,
      avatar: args.avatar,
      groupId: args.groupId,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updatePlayer = mutation({
  args: {
    id: v.id("players"),
    name: v.optional(v.string()),
    initial: v.optional(v.string()),
    avatar: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deletePlayer = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    // Soft delete by setting isActive to false
    return await ctx.db.patch(args.id, { isActive: false });
  },
});

export const hardDeletePlayer = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
