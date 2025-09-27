import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      avatar: args.avatar,
      isActive: true,
      createdAt: Date.now(),
    });

    // Create a player for this user
    const playerId = await createPlayerForUser(ctx, userId, args.name);
    
    // Update user with playerId
    await ctx.db.patch(userId, { playerId: playerId });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { clerkId, ...updates } = args;
    return await ctx.db.patch(user._id, updates);
  },
});

// Helper function to create a player for a user
const createPlayerForUser = async (ctx: any, userId: any, name: string) => {
  const initial = name.charAt(0).toUpperCase();
  const playerId = await ctx.db.insert("players", {
    userId: userId,
    name: name,
    initial: initial,
    isActive: true,
    createdAt: Date.now(),
  });
  return playerId;
};

export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find existing user
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      // Create new user if doesn't exist
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        avatar: args.avatar,
        isActive: true,
        createdAt: Date.now(),
      });

      // Create a player for this user
      const playerId = await createPlayerForUser(ctx, userId, args.name);
      
      // Update user with playerId
      await ctx.db.patch(userId, { playerId: playerId });
      
      user = await ctx.db.get(userId);
    }

    return user;
  },
});

export const syncUserWithPlayer = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // If user already has a player, return it
    if (user.playerId) {
      return user.playerId;
    }

    // Create a player for this user
    const playerId = await createPlayerForUser(ctx, user._id, user.name);
    
    // Update user with playerId
    await ctx.db.patch(user._id, { playerId: playerId });

    return playerId;
  },
});