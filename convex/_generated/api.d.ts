/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as gameLists from "../gameLists.js";
import type * as gameSaves from "../gameSaves.js";
import type * as games from "../games.js";
import type * as groups from "../groups.js";
import type * as players from "../players.js";
import type * as recentSearches from "../recentSearches.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  gameLists: typeof gameLists;
  gameSaves: typeof gameSaves;
  games: typeof games;
  groups: typeof groups;
  players: typeof players;
  recentSearches: typeof recentSearches;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
