import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const subjectMarksValidator = v.optional(v.object({
  hindi: v.optional(v.number()),
  english: v.optional(v.number()),
  math: v.optional(v.number()),
  science: v.optional(v.number()),
  socialScience: v.optional(v.number()),
  sanskrit: v.optional(v.number()),
  computerScience: v.optional(v.number()),
}));

const subjectsValidator = v.optional(v.object({
  halfYearly: subjectMarksValidator,
  final: subjectMarksValidator,
}));

export const list = query({
  args: { class: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.class) {
      return await ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("class", args.class))
        .take(500);
    }
    return await ctx.db.query("students").take(500);
  },
});

export const getByRoll = query({
  args: { rollNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_roll", (q) => q.eq("rollNumber", args.rollNumber.toUpperCase().trim()))
      .unique();
  },
});

export const searchByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("students").take(500);
    const lower = args.name.toLowerCase().trim();
    return all.filter((s) => s.name.toLowerCase().includes(lower)).slice(0, 20);
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    rollNumber: v.string(),
    class: v.optional(v.string()),
    halfYearlyMarks: v.optional(v.number()),
    finalMarks: v.optional(v.number()),
    aadharNumber: v.optional(v.string()),
    dkNumber: v.optional(v.string()),
    subjects: subjectsValidator,
  },
  handler: async (ctx, args) => {
    const normalizedRoll = args.rollNumber.toUpperCase().trim();
    const existing = await ctx.db
      .query("students")
      .withIndex("by_roll", (q) => q.eq("rollNumber", normalizedRoll))
      .unique();
    if (existing) {
      throw new Error("A student with this roll number already exists.");
    }
    return await ctx.db.insert("students", { ...args, rollNumber: normalizedRoll });
  },
});

export const update = mutation({
  args: {
    id: v.id("students"),
    name: v.string(),
    rollNumber: v.string(),
    class: v.optional(v.string()),
    halfYearlyMarks: v.optional(v.number()),
    finalMarks: v.optional(v.number()),
    aadharNumber: v.optional(v.string()),
    dkNumber: v.optional(v.string()),
    subjects: subjectsValidator,
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, rollNumber: rest.rollNumber.toUpperCase().trim() });
  },
});

export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});