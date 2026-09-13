import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./admin";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("academic_sessions").take(100);
    // Sort descending by year / creation time
    return sessions.sort((a, b) => b.year.localeCompare(a.year));
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const current = await ctx.db
      .query("academic_sessions")
      .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
      .first();
    if (current) return current;

    // Fallback: get the most recent session if none explicitly marked current
    const all = await ctx.db.query("academic_sessions").take(100);
    if (all.length === 0) return null;
    return all.sort((a, b) => b.year.localeCompare(a.year))[0];
  },
});

export const create = mutation({
  args: {
    year: v.string(), // e.g. "2025-26"
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isCurrent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const normalizedYear = args.year.trim();

    const existing = await ctx.db
      .query("academic_sessions")
      .withIndex("by_year", (q) => q.eq("year", normalizedYear))
      .unique();

    if (existing) {
      throw new Error(`Academic session '${normalizedYear}' already exists.`);
    }

    const setAsCurrent = args.isCurrent ?? false;

    if (setAsCurrent) {
      // Unset any existing active sessions
      const existingActive = await ctx.db
        .query("academic_sessions")
        .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
        .collect();
      for (const s of existingActive) {
        await ctx.db.patch(s._id, { isCurrent: false });
      }
    }

    return await ctx.db.insert("academic_sessions", {
      year: normalizedYear,
      startDate: args.startDate,
      endDate: args.endDate,
      isCurrent: setAsCurrent,
      createdAt: Date.now(),
    });
  },
});

export const setCurrent = mutation({
  args: {
    id: v.id("academic_sessions"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("Academic session not found");

    // Unset all currently active sessions
    const activeSessions = await ctx.db
      .query("academic_sessions")
      .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
      .collect();
    for (const s of activeSessions) {
      if (s._id !== args.id) {
        await ctx.db.patch(s._id, { isCurrent: false });
      }
    }

    await ctx.db.patch(args.id, { isCurrent: true });
    return target.year;
  },
});

export const deleteSession = mutation({
  args: {
    id: v.id("academic_sessions"),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) return;

    // Check if marks exist for this session
    const marks = await ctx.db
      .query("student_marks")
      .take(1);

    await ctx.db.delete(args.id);
  },
});
