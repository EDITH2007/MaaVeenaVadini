import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

export const getCounts = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("authSessions").collect();
    const accounts = await ctx.db.query("authAccounts").collect();
    const users = await ctx.db.query("users").collect();
    return {
      env_CONVEX_SITE_URL: process.env.CONVEX_SITE_URL ?? "NOT_SET",
      env_SITE_URL: process.env.SITE_URL ?? "NOT_SET",
      sessionCount: sessions.length,
      accountCount: accounts.length,
      userCount: users.length,
      sessions: sessions.map((s) => ({
        id: s._id,
        userId: s.userId,
        expirationTime: s.expirationTime,
      })),
      accounts: accounts.map((a) => ({
        id: a._id,
        userId: a.userId,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
      })),
      users: users.map((u) => ({
        id: u._id,
        email: u.email,
        role: u.role,
        rollNumber: u.rollNumber,
      })),
    };
  },
});


