import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firebaseId: v.optional(v.string()), // Make optional for migration
    clerkId: v.optional(v.string()), // Keep for backward compatibility
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    playerId: v.optional(v.id("players")),
    isActive: v.boolean(),
    isAdmin: v.optional(v.boolean()),
    createdAt: v.number(),
    lastSeen: v.optional(v.number()),
  }).index("by_email", ["email"])
    .index("by_firebase_id", ["firebaseId"])
    .index("by_clerk_id", ["clerkId"]) // Keep for backward compatibility
    .index("by_player", ["playerId"]),

  players: defineTable({
    userId: v.id("users"),
    name: v.string(),
    initial: v.string(),
    avatar: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_group", ["groupId"]),

  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  games: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    rules: v.optional(v.string()),
    banner: v.optional(v.string()),
    category: v.optional(v.string()),
    settings: v.object({
      gameplay: v.optional(v.string()),
      calculationMode: v.optional(v.string()),
      roundWinner: v.optional(v.string()),
      pointsPerRound: v.optional(v.string()),
      hideTotalColumn: v.optional(v.boolean()),
    }),
    isActive: v.boolean(),
    index: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_name", ["name"])
    .index("by_index", ["index"])
    .index("by_category", ["category"]),

  gameSaves: defineTable({
    name: v.string(),
    gameTemplate: v.id("games"),
    players: v.array(v.id("players")),
    redTeam: v.optional(v.array(v.id("players"))),
    blueTeam: v.optional(v.array(v.id("players"))),
    results: v.optional(v.string()),
    laps: v.optional(v.array(v.array(v.union(v.number(), v.array(v.number()))))), // Two-dimensional matrix: [playerIndex][roundIndex] = score or array of scores
    teamLaps: v.optional(v.array(v.array(v.union(v.number(), v.array(v.number()))))), // For team mode: [roundIndex][teamIndex] = team score or array of team scores
    settings: v.object({
      gameplay: v.union(v.literal("herkes-tek"), v.literal("takimli")),
      calculationMode: v.union(v.literal("NoPoints"), v.literal("Points")),
      roundWinner: v.union(v.literal("Highest"), v.literal("Lowest")),
      pointsPerRound: v.optional(v.union(v.literal("Single"), v.literal("Multiple"))),
      penaltiesPerRound: v.optional(v.union(v.literal("Single"), v.literal("Multiple"))),
      hideTotalColumn: v.boolean(),
    }),
    createdTime: v.number(),
    userId: v.id("users"),
    isActive: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_game", ["gameTemplate"])
    .index("by_created_time", ["createdTime"]),
});
