/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academicSessions from "../academicSessions.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as calendar from "../calendar.js";
import type * as http from "../http.js";
import type * as migration from "../migration.js";
import type * as notices from "../notices.js";
import type * as results from "../results.js";
import type * as studentDashboard from "../studentDashboard.js";
import type * as students from "../students.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academicSessions: typeof academicSessions;
  admin: typeof admin;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  calendar: typeof calendar;
  http: typeof http;
  migration: typeof migration;
  notices: typeof notices;
  results: typeof results;
  studentDashboard: typeof studentDashboard;
  students: typeof students;
  users: typeof users;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
