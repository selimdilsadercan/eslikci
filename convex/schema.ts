import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    playerId: v.optional(v.id("players")),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastSeen: v.optional(v.number()),
  }).index("by_email", ["email"])
    .index("by_clerk_id", ["clerkId"])
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
    settings: v.object({
      gameplay: v.optional(v.string()),
      calculationMode: v.optional(v.string()),
      roundWinner: v.optional(v.string()),
      hideTotalColumn: v.optional(v.boolean()),
    }),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  gameSaves: defineTable({
    name: v.string(),
    gameTemplate: v.id("games"),
    players: v.array(v.id("players")),
    redTeam: v.optional(v.array(v.id("players"))),
    blueTeam: v.optional(v.array(v.id("players"))),
    results: v.optional(v.string()),
    laps: v.optional(v.array(v.array(v.number()))), // Two-dimensional matrix: [playerIndex][roundIndex] = score
    settings: v.object({
      gameplay: v.union(v.literal("herkes-tek"), v.literal("takimli")),
      calculationMode: v.union(v.literal("NoPoints"), v.literal("Points"), v.literal("Penalized")),
      roundWinner: v.union(v.literal("OnePoint"), v.literal("ZeroPoint"), v.literal("Highest"), v.literal("Lowest")),
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
