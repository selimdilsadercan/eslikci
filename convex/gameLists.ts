import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all active game lists ordered by order field
export const getGameLists = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gameLists")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
  },
});

// Get all game lists (including inactive) for admin
export const getAllGameLists = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gameLists")
      .order("asc")
      .collect();
  },
});

// Get a specific game list by ID
export const getGameList = query({
  args: { id: v.id("gameLists") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new game list
export const createGameList = mutation({
  args: {
    name: v.string(),
    emoji: v.optional(v.string()),
    gameIds: v.array(v.id("games")),
  },
  handler: async (ctx, args) => {
    // Get the highest order number
    const existingLists = await ctx.db
      .query("gameLists")
      .order("desc")
      .collect();
    
    const maxOrder = existingLists.length > 0 ? Math.max(...existingLists.map(list => list.order)) : 0;
    
    return await ctx.db.insert("gameLists", {
      name: args.name,
      emoji: args.emoji,
      gameIds: args.gameIds,
      isActive: true,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

// Update a game list
export const updateGameList = mutation({
  args: {
    id: v.id("gameLists"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    gameIds: v.optional(v.array(v.id("games"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

// Delete a game list
export const deleteGameList = mutation({
  args: { id: v.id("gameLists") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Update game list order
export const updateGameListOrder = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("gameLists"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const promises = args.updates.map(update => 
      ctx.db.patch(update.id, { order: update.order })
    );
    await Promise.all(promises);
  },
});

// Add games to a list
export const addGamesToList = mutation({
  args: {
    listId: v.id("gameLists"),
    gameIds: v.array(v.id("games")),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Game list not found");
    
    const updatedGameIds = [...new Set([...list.gameIds, ...args.gameIds])];
    return await ctx.db.patch(args.listId, { gameIds: updatedGameIds });
  },
});

// Remove games from a list
export const removeGamesFromList = mutation({
  args: {
    listId: v.id("gameLists"),
    gameIds: v.array(v.id("games")),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Game list not found");
    
    const updatedGameIds = list.gameIds.filter(id => !args.gameIds.includes(id));
    return await ctx.db.patch(args.listId, { gameIds: updatedGameIds });
  },
});

// Get games in a specific list
export const getGamesInList = query({
  args: { listId: v.id("gameLists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) return [];
    
    const games = await Promise.all(
      list.gameIds.map(gameId => ctx.db.get(gameId))
    );
    
    return games.filter(game => game !== null);
  },
});
