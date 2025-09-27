import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find user by Firebase ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", identity.subject))
      .first();

    return user;
  },
});

export const getUserByFirebaseId = query({
  args: { firebaseId: v.string() },
  handler: async (ctx, args) => {
    // First try to find by Firebase ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    // If not found, try to find by Clerk ID (for migration)
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.firebaseId))
        .first();
    }

    return user;
  },
});


export const createUser = mutation({
  args: {
    firebaseId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by Firebase ID
    let existingUser = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    // If not found, check by Clerk ID (for migration)
    if (!existingUser) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.firebaseId))
        .first();
    }

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user with both IDs for compatibility
    const userId = await ctx.db.insert("users", {
      firebaseId: args.firebaseId,
      clerkId: args.firebaseId, // Use Firebase ID as Clerk ID for compatibility
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
    firebaseId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { firebaseId, ...updates } = args;
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
    firebaseId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find existing user
    let user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      // Create new user if doesn't exist
      const userId = await ctx.db.insert("users", {
        firebaseId: args.firebaseId,
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
    firebaseId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
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