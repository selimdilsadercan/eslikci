import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { id: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.id);
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const deleteFile = mutation({
  args: { id: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.delete(args.id);
  },
});