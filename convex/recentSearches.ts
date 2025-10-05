import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get recent searches for a user
export const getRecentSearches = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const recentSearches = await ctx.db
      .query("recentSearches")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5); // Get only the 5 most recent searches

    return recentSearches;
  },
});

// Save a recent search
export const saveRecentSearch = mutation({
  args: {
    userId: v.id("users"),
    gameId: v.id("games"),
    gameName: v.string(),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if this exact search already exists
    const existingSearch = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (existingSearch) {
      // Update the existing search with new timestamp
      await ctx.db.patch(existingSearch._id, {
        createdAt: Date.now(),
        searchQuery: args.searchQuery,
      });
      return existingSearch._id;
    }

    // Create new recent search
    const recentSearchId = await ctx.db.insert("recentSearches", {
      userId: args.userId,
      gameId: args.gameId,
      gameName: args.gameName,
      searchQuery: args.searchQuery,
      createdAt: Date.now(),
    });

    // Keep only the 10 most recent searches per user
    const allRecentSearches = await ctx.db
      .query("recentSearches")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (allRecentSearches.length > 10) {
      // Delete the oldest searches beyond 10
      const toDelete = allRecentSearches.slice(10);
      for (const search of toDelete) {
        await ctx.db.delete(search._id);
      }
    }

    return recentSearchId;
  },
});

// Clear all recent searches for a user
export const clearRecentSearches = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const recentSearches = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const search of recentSearches) {
      await ctx.db.delete(search._id);
    }

    return { success: true, deletedCount: recentSearches.length };
  },
});

// Remove a specific recent search
export const removeRecentSearch = mutation({
  args: { searchId: v.id("recentSearches") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.searchId);
    return { success: true };
  },
});
