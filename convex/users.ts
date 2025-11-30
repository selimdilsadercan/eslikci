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

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createUser = mutation({
  args: {
    firebaseId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    isOnboardingFinished: v.optional(v.boolean()),
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
      isActive: true,
      isAdmin: args.isAdmin || false,
      isOnboardingFinished: args.isOnboardingFinished || false,
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
    isOnboardingFinished: v.optional(v.boolean()),
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
    isAdmin: v.optional(v.boolean()),
    isOnboardingFinished: v.optional(v.boolean()),
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
        isActive: true,
        isAdmin: args.isAdmin || false,
        isOnboardingFinished: args.isOnboardingFinished || false,
        createdAt: Date.now(),
      });

      // Create a player for this user
      const playerId = await createPlayerForUser(ctx, userId, args.name);

      // Update user with playerId
      await ctx.db.patch(userId, { playerId: playerId });

      user = await ctx.db.get(userId);
    } else {
      // Update existing user if name has changed (e.g., if displayName was updated)
      if (user.name !== args.name) {
        await ctx.db.patch(user._id, {
          name: args.name,
          email: args.email,
        });

        // Also update the associated player
        if (user.playerId) {
          await ctx.db.patch(user.playerId, { name: args.name });
        }

        user = await ctx.db.get(user._id);
      }
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

export const isUserAdmin = query({
  args: { firebaseId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    return user?.isAdmin || false;
  },
});

export const isUserPro = query({
  args: { firebaseId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) return false;

    // Check if user has pro status and it hasn't expired
    if (user.isPro && user.proExpiresAt) {
      return user.proExpiresAt > Date.now();
    }

    return false;
  },
});

export const upgradeToPro = mutation({
  args: {
    firebaseId: v.string(),
    duration: v.number(), // Duration in milliseconds (e.g., 30 days = 30 * 24 * 60 * 60 * 1000)
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const newExpirationTime =
      user.proExpiresAt && user.proExpiresAt > now
        ? user.proExpiresAt + args.duration
        : now + args.duration;

    await ctx.db.patch(user._id, {
      isPro: true,
      proExpiresAt: newExpirationTime,
    });

    return { success: true, proExpiresAt: newExpirationTime };
  },
});

export const cancelPro = mutation({
  args: { firebaseId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      isPro: false,
      proExpiresAt: undefined,
    });

    return { success: true };
  },
});

export const restartOnboarding = mutation({
  args: { firebaseId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      isOnboardingFinished: false,
    });

    return { success: true };
  },
});
