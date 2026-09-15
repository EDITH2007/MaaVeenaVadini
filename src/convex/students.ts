import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { normalizeDOB } from "./utils";

const subjectMarksValidator = v.optional(v.object({
  hindi: v.optional(v.number()),
  english: v.optional(v.number()),
  math: v.optional(v.number()),
  evs: v.optional(v.number()),
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
    const student = await ctx.db
      .query("students")
      .withIndex("by_roll", (q) => q.eq("rollNumber", args.rollNumber.toUpperCase().trim()))
      .unique();
    if (!student) return null;

    // Public lookup strips confidential identity fields
    const { aadharNumber, samagraId, mobileNumber, dateOfBirth, dkNumber, userId, ...publicData } = student;
    return publicData;
  },
});

export const getByRollInternal = internalQuery({
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
    return all
      .filter((s) => s.name.toLowerCase().includes(lower))
      .slice(0, 20)
      .map(({ aadharNumber, samagraId, mobileNumber, dateOfBirth, dkNumber, userId, ...publicData }) => publicData);
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    rollNumber: v.string(),
    class: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    category: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    samagraId: v.optional(v.string()),
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
    const dob = normalizeDOB(args.dateOfBirth) || "2015-01-01";
    return await ctx.db.insert("students", { ...args, rollNumber: normalizedRoll, dateOfBirth: dob });
  },
});

export const update = mutation({
  args: {
    id: v.id("students"),
    name: v.string(),
    rollNumber: v.string(),
    class: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    category: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    samagraId: v.optional(v.string()),
    halfYearlyMarks: v.optional(v.number()),
    finalMarks: v.optional(v.number()),
    aadharNumber: v.optional(v.string()),
    dkNumber: v.optional(v.string()),
    subjects: subjectsValidator,
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const dob = normalizeDOB(rest.dateOfBirth) || "2015-01-01";
    await ctx.db.patch(id, { ...rest, rollNumber: rest.rollNumber.toUpperCase().trim(), dateOfBirth: dob });
  },
});

export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});