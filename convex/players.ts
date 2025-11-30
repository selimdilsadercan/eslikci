import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getPlayers = query({
  args: { firebaseId: v.string() },
  handler: async (ctx, args) => {
    // Get current user by Firebase ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      return [];
    }

    // Get players created by this user (userId)
    const ownPlayers = await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get players linked to this user (linkedUserId)
    const linkedPlayers = await ctx.db
      .query("players")
      .withIndex("by_linked_user", (q) => q.eq("linkedUserId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get reciprocal players: If this user's player is linked to another user,
    // get that user's player
    const reciprocalPlayers: any[] = [];
    if (user.playerId) {
      const thisUserPlayer = await ctx.db.get(user.playerId);
      if (thisUserPlayer && thisUserPlayer.linkedUserId) {
        // Get the user that this player is linked to
        const linkedToUser = await ctx.db.get(thisUserPlayer.linkedUserId);
        if (linkedToUser && linkedToUser.playerId) {
          // Get that user's player
          const reciprocalPlayer = await ctx.db.get(linkedToUser.playerId);
          if (reciprocalPlayer && reciprocalPlayer.isActive) {
            // Check if already in the list
            const exists = [
              ...ownPlayers,
              ...linkedPlayers,
              ...reciprocalPlayers,
            ].some((p) => p._id === reciprocalPlayer._id);
            if (!exists) {
              reciprocalPlayers.push(reciprocalPlayer);
            }
          }
        }
      }
    }

    // Get all game saves for this user (including linked players' games)
    const allGameSaves = await ctx.db
      .query("gameSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Get linked players' game saves
    const linkedPlayerIds = linkedPlayers.map((p) => p._id);
    const allGameSavesForLinked = await ctx.db
      .query("gameSaves")
      .order("desc")
      .collect();

    const linkedGameSaves = allGameSavesForLinked.filter((gameSave) => {
      // Check if any linked player is in the game save
      if (
        gameSave.players?.some((playerId) => linkedPlayerIds.includes(playerId))
      ) {
        return true;
      }
      if (
        gameSave.redTeam?.some((playerId) => linkedPlayerIds.includes(playerId))
      ) {
        return true;
      }
      if (
        gameSave.blueTeam?.some((playerId) =>
          linkedPlayerIds.includes(playerId)
        )
      ) {
        return true;
      }
      return false;
    });

    // Combine all game saves
    const combinedGameSaves = [...allGameSaves, ...linkedGameSaves];
    const uniqueGameSaves = combinedGameSaves.filter(
      (gameSave, index, self) =>
        index === self.findIndex((gs) => gs._id === gameSave._id)
    );

    // Get all player IDs from game saves
    const allPlayerIdsFromGames = new Set<Id<"players">>();
    uniqueGameSaves.forEach((gameSave) => {
      gameSave.players?.forEach((playerId) =>
        allPlayerIdsFromGames.add(playerId)
      );
      gameSave.redTeam?.forEach((playerId) =>
        allPlayerIdsFromGames.add(playerId)
      );
      gameSave.blueTeam?.forEach((playerId) =>
        allPlayerIdsFromGames.add(playerId)
      );
    });

    // Get all players from game saves
    const gamePlayers: any[] = [];
    for (const playerId of allPlayerIdsFromGames) {
      const player = await ctx.db.get(playerId);
      // Type guard: check if it's a player (has isActive property)
      if (player && "isActive" in player && player.isActive) {
        // Check if already in the list
        const exists = [
          ...ownPlayers,
          ...linkedPlayers,
          ...reciprocalPlayers,
          ...gamePlayers,
        ].some((p) => p._id === player._id);
        if (!exists) {
          gamePlayers.push(player);
        }
      }
    }

    // Combine all players and remove duplicates
    const allPlayers = [
      ...ownPlayers,
      ...linkedPlayers,
      ...reciprocalPlayers,
      ...gamePlayers,
    ];
    const uniquePlayers = allPlayers.filter(
      (player, index, self) =>
        index === self.findIndex((p) => p._id === player._id)
    );

    return uniquePlayers;
  },
});

export const getPlayersByIds = query({
  args: { playerIds: v.array(v.id("players")) },
  handler: async (ctx, args) => {
    // Get players by their IDs directly (no auth required)
    const players = await Promise.all(
      args.playerIds.map((id) => ctx.db.get(id))
    );

    // Filter out any null results and return only active players
    return players.filter(
      (player): player is NonNullable<typeof player> =>
        player !== null && player.isActive
    );
  },
});

export const getCurrentUserAsPlayer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", identity.subject))
      .first();

    if (!user || !user.playerId) {
      return null;
    }

    // Get the player record
    return await ctx.db.get(user.playerId);
  },
});

export const getPlayerByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get player by user ID directly (no auth required)
    const player = await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return player;
  },
});

export const getPlayerById = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPlayersByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const createPlayer = mutation({
  args: {
    name: v.string(),
    initial: v.string(),
    avatar: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
    firebaseId: v.string(), // Add firebaseId as a parameter
  },
  handler: async (ctx, args) => {
    // Get current user by Firebase ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("players", {
      userId: user._id,
      name: args.name,
      initial: args.initial,
      avatar: args.avatar,
      groupId: args.groupId,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updatePlayer = mutation({
  args: {
    id: v.id("players"),
    name: v.optional(v.string()),
    initial: v.optional(v.string()),
    avatar: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const deletePlayer = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    // Soft delete by setting isActive to false
    return await ctx.db.patch(args.id, { isActive: false });
  },
});

export const hardDeletePlayer = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const linkPlayerToUser = mutation({
  args: {
    playerId: v.id("players"),
    firebaseId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user by Firebase ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_id", (q) => q.eq("firebaseId", args.firebaseId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get player
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Check if player is already linked to another user
    if (player.linkedUserId && player.linkedUserId !== user._id) {
      throw new Error("Player is already linked to another user");
    }

    // Link player to user
    await ctx.db.patch(args.playerId, {
      linkedUserId: user._id,
    });

    // Create reciprocal connection: Link this user's player to the player's owner
    // If player has an owner (userId), link this user's player to the owner
    if (player.userId && user.playerId) {
      // Get the owner user
      const ownerUser = await ctx.db.get(player.userId);
      if (ownerUser) {
        // Get this user's player
        const thisUserPlayer = await ctx.db.get(user.playerId);
        if (thisUserPlayer) {
          // Link this user's player to the owner (reciprocal connection)
          await ctx.db.patch(thisUserPlayer._id, {
            linkedUserId: ownerUser._id,
          });
        }
      }
    }

    return { success: true };
  },
});
