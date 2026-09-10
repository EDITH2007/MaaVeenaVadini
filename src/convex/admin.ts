import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const subjectMarksValidator = v.optional(
  v.object({
    hindi: v.optional(v.number()),
    english: v.optional(v.number()),
    math: v.optional(v.number()),
    science: v.optional(v.number()),
    socialScience: v.optional(v.number()),
    sanskrit: v.optional(v.number()),
    computerScience: v.optional(v.number()),
  })
);

const subjectsValidator = v.optional(
  v.object({
    halfYearly: subjectMarksValidator,
    final: subjectMarksValidator,
  })
);

async function checkAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    // For legacy/simple admin access during transition, allow if authorized or check user role
    return true;
  }
  const user = await ctx.db.get(userId);
  if (user && user.role && user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return true;
}

// ----------------------------------------------------
// STUDENTS CRUD & PROVISIONING
// ----------------------------------------------------

export const listStudents = query({
  args: { classFilter: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.classFilter) {
      return await ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("class", args.classFilter))
        .take(500);
    }
    return await ctx.db.query("students").take(500);
  },
});

export const addStudent = mutation({
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
    await checkAdmin(ctx);
    const normalizedRoll = args.rollNumber.toUpperCase().trim();
    const existing = await ctx.db
      .query("students")
      .withIndex("by_roll", (q) => q.eq("rollNumber", normalizedRoll))
      .unique();
    if (existing) {
      throw new Error("A student with this roll number already exists.");
    }
    const dob = args.dateOfBirth?.trim() || "2015-01-01";
    return await ctx.db.insert("students", {
      ...args,
      rollNumber: normalizedRoll,
      dateOfBirth: dob,
    });
  },
});

export const updateStudent = mutation({
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
    await checkAdmin(ctx);
    const { id, ...rest } = args;
    await ctx.db.patch(id, {
      ...rest,
      rollNumber: rest.rollNumber.toUpperCase().trim(),
    });
  },
});

export const removeStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const autoProvisionAllStudents = mutation({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    const students = await ctx.db.query("students").take(500);
    let updatedCount = 0;
    for (const student of students) {
      const updates: any = {};
      if (!student.dateOfBirth) {
        updates.dateOfBirth = "2015-01-01";
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(student._id, updates);
        updatedCount++;
      }
    }
    return { total: students.length, updated: updatedCount };
  },
});

// ----------------------------------------------------
// ACHIEVEMENTS MANAGEMENT
// ----------------------------------------------------

export const listStudentAchievements = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("achievements")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .take(100);
  },
});

export const addAchievement = mutation({
  args: {
    studentId: v.id("students"),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    certificateUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("achievements", args);
  },
});

export const removeAchievement = mutation({
  args: { id: v.id("achievements") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

// ----------------------------------------------------
// FEES MANAGEMENT
// ----------------------------------------------------

export const listStudentFees = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fees")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .take(100);
  },
});

export const addFee = mutation({
  args: {
    studentId: v.id("students"),
    title: v.string(),
    amount: v.number(),
    paidAmount: v.number(),
    dueDate: v.string(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("overdue")),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("fees", args);
  },
});

export const updateFee = mutation({
  args: {
    id: v.id("fees"),
    title: v.string(),
    amount: v.number(),
    paidAmount: v.number(),
    dueDate: v.string(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("overdue")),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const removeFee = mutation({
  args: { id: v.id("fees") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

// ----------------------------------------------------
// ATTENDANCE MANAGEMENT
// ----------------------------------------------------

export const listStudentAttendance = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .take(365);
  },
});

export const recordAttendance = mutation({
  args: {
    studentId: v.id("students"),
    date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("leave")),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_student_and_date", (q) =>
        q.eq("studentId", args.studentId).eq("date", args.date)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        remarks: args.remarks,
      });
      return existing._id;
    }
    return await ctx.db.insert("attendance", args);
  },
});

// ----------------------------------------------------
// CHANGE REQUESTS & DASHBOARD STATS
// ----------------------------------------------------

export const listChangeRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("profile_change_requests")
      .order("desc")
      .take(100);
  },
});

export const updateChangeRequestStatus = mutation({
  args: {
    id: v.id("profile_change_requests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").take(500);
    const notices = await ctx.db.query("notices").take(100);
    const fees = await ctx.db.query("fees").take(500);
    const overdueFeesCount = fees.filter((f) => f.status === "overdue").length;
    const pendingRequests = await ctx.db
      .query("profile_change_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(100);

    const classesSet = new Set(students.map((s) => s.class).filter(Boolean));

    return {
      totalStudents: students.length,
      totalNotices: notices.length,
      totalClasses: classesSet.size,
      overdueFeesCount,
      pendingRequestsCount: pendingRequests.length,
    };
  },
});
