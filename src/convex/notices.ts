import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("notices").order("desc").take(50);
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    date: v.string(),
    important: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notices", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("notices"),
    title: v.string(),
    content: v.string(),
    date: v.string(),
    important: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("notices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});