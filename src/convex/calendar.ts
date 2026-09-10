import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listPublicEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calendar_events").order("asc").take(200);
  },
});

export const addEvent = mutation({
  args: {
    title: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    category: v.union(
      v.literal("holiday"),
      v.literal("exam"),
      v.literal("event"),
      v.literal("ptm"),
      v.literal("admission"),
      v.literal("notice")
    ),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized: Must be logged in");
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return await ctx.db.insert("calendar_events", args);
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("calendar_events"),
    title: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    category: v.union(
      v.literal("holiday"),
      v.literal("exam"),
      v.literal("event"),
      v.literal("ptm"),
      v.literal("admission"),
      v.literal("notice")
    ),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized: Must be logged in");
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const removeEvent = mutation({
  args: { id: v.id("calendar_events") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized: Must be logged in");
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    await ctx.db.delete(args.id);
  },
});
