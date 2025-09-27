import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get current user by Firebase ID
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
    // Find user by Firebase ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      firebaseId: args.firebaseId,
      name: args.name,
      email: args.email,
      avatar: args.avatar,
      isActive: true,
      createdAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});
