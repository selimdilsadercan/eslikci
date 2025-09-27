import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getGroups = query({
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
      .query("groups")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
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

    return await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});

export const updateGroup = mutation({
  args: {
    id: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deleteGroup = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
