import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getAuthenticatedStudent(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;

  // If user has a direct studentId link
  if (user.studentId) {
    const s = await ctx.db.get(user.studentId);
    if (s) return s;
  }

  // Fallback: match by rollNumber or email prefix
  if (user.rollNumber) {
    const s = await ctx.db
      .query("students")
      .withIndex("by_roll", (q: any) => q.eq("rollNumber", user.rollNumber))
      .unique();
    if (s) return s;
  }

  if (user.email && user.email.endsWith("@mvvs.in")) {
    const rollFromEmail = user.email.split("@")[0].toUpperCase();
    const s = await ctx.db
      .query("students")
      .withIndex("by_roll", (q: any) => q.eq("rollNumber", rollFromEmail))
      .unique();
    if (s) return s;
  }

  return null;
}

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return null;
    return student;
  },
});

export const getMyAchievements = query({
  args: {},
  handler: async (ctx) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return [];
    return await ctx.db
      .query("achievements")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .take(100);
  },
});

export const getMyFees = query({
  args: {},
  handler: async (ctx) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return [];
    return await ctx.db
      .query("fees")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .take(100);
  },
});

export const getMyAttendance = query({
  args: {},
  handler: async (ctx) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return [];
    return await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .take(365);
  },
});

export const requestProfileChange = mutation({
  args: {
    requestDetails: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) throw new Error("Unauthorized: Student not found");

    return await ctx.db.insert("profile_change_requests", {
      studentId: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      requestDetails: args.requestDetails,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});
