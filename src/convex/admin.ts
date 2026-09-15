import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Scrypt } from "lucia";
import { normalizeDOB } from "./utils";

const subjectMarksValidator = v.optional(
  v.object({
    hindi: v.optional(v.number()),
    english: v.optional(v.number()),
    math: v.optional(v.number()),
    evs: v.optional(v.number()),
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

export async function checkAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: Admin authentication required");
  }
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return true;
}

export const seedAdminAccount = internalMutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const adminEmail = "admin@mvvs.in";
    if (!args.password || args.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // 1. Ensure user exists in users table with role: 'admin'
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", adminEmail))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email: adminEmail,
        role: "admin",
        name: "Administrator",
      });
      user = await ctx.db.get(userId);
    } else if (user.role !== "admin") {
      await ctx.db.patch(user._id, { role: "admin" });
      user = await ctx.db.get(user._id);
    }

    if (!user) throw new Error("Failed to initialize admin user record");

    // 2. Hash password with Scrypt (standard Convex Auth pattern)
    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(args.password);

    // 3. Upsert authAccounts entry
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", adminEmail)
      )
      .unique();

    if (existingAccount) {
      await ctx.db.patch(existingAccount._id, {
        secret: hashedPassword,
        userId: user._id,
      });
    } else {
      await ctx.db.insert("authAccounts", {
        userId: user._id,
        provider: "password",
        providerAccountId: adminEmail,
        secret: hashedPassword,
      });
    }

    return {
      success: true,
      message: "Admin account provisioned securely with hashed credentials.",
      email: adminEmail,
      userId: user._id,
    };
  },
});


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

async function syncStudentAuthAccount(ctx: any, student: any) {
  const rollNumber = student.rollNumber.toUpperCase().trim();
  const email = `${rollNumber.toLowerCase()}@mvvs.in`;
  const dob = normalizeDOB(student.dateOfBirth) || "2015-01-01";

  let user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", email))
    .unique();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      email,
      role: "student",
      name: student.name,
      studentId: student._id,
      rollNumber,
    });
    user = await ctx.db.get(userId);
  } else {
    await ctx.db.patch(user._id, {
      studentId: student._id,
      rollNumber,
      role: "student",
    });
  }

  if (user) {
    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(dob);

    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q: any) =>
        q.eq("provider", "password").eq("providerAccountId", email)
      )
      .unique();

    if (existingAccount) {
      await ctx.db.patch(existingAccount._id, {
        secret: hashedPassword,
        userId: user._id,
      });
    } else {
      await ctx.db.insert("authAccounts", {
        userId: user._id,
        provider: "password",
        providerAccountId: email,
        secret: hashedPassword,
      });
    }
  }
}

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
    const dob = normalizeDOB(args.dateOfBirth) || "2015-01-01";
    const studentId = await ctx.db.insert("students", {
      ...args,
      rollNumber: normalizedRoll,
      dateOfBirth: dob,
    });
    const student = await ctx.db.get(studentId);
    if (student) {
      await syncStudentAuthAccount(ctx, student);
    }
    return studentId;
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
    const normalizedRoll = rest.rollNumber.toUpperCase().trim();
    const dob = normalizeDOB(rest.dateOfBirth) || "2015-01-01";
    await ctx.db.patch(id, {
      ...rest,
      rollNumber: normalizedRoll,
      dateOfBirth: dob,
    });
    const updatedStudent = await ctx.db.get(id);
    if (updatedStudent) {
      await syncStudentAuthAccount(ctx, updatedStudent);
    }
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
      let dob = normalizeDOB(student.dateOfBirth) || "2015-01-01";
      if (student.dateOfBirth !== dob) {
        await ctx.db.patch(student._id, { dateOfBirth: dob });
        student.dateOfBirth = dob;
      }
      await syncStudentAuthAccount(ctx, student);
      updatedCount++;
    }
    return { total: students.length, updated: updatedCount };
  },
});

export const autoProvisionAllStudentsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").take(500);
    let updatedCount = 0;
    for (const student of students) {
      let dob = normalizeDOB(student.dateOfBirth) || "2015-01-01";
      if (student.dateOfBirth !== dob) {
        await ctx.db.patch(student._id, { dateOfBirth: dob });
        student.dateOfBirth = dob;
      }
      await syncStudentAuthAccount(ctx, student);
      updatedCount++;
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

export const listAllAchievements = query({
  args: {
    classFilter: v.optional(v.string()),
    academicYearFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const achievements = await ctx.db.query("achievements").take(500);
    const students = await ctx.db.query("students").take(500);
    const studentMap = new Map(students.map((s) => [s._id, s]));

    let combined = achievements.map((ach) => {
      const s = studentMap.get(ach.studentId);
      const year = ach.academicYear || (ach.date ? ach.date.split("-")[0] + "-" + String((parseInt(ach.date.split("-")[0], 10) + 1) % 100).padStart(2, "0") : "2025-26");
      return {
        ...ach,
        academicYear: year,
        studentName: s?.name || "Unknown Student",
        rollNumber: s?.rollNumber || "N/A",
        class: s?.class || "N/A",
      };
    });

    if (args.classFilter && args.classFilter !== "all") {
      combined = combined.filter((ach) => ach.class === args.classFilter);
    }
    if (args.academicYearFilter && args.academicYearFilter !== "all") {
      combined = combined.filter((ach) => ach.academicYear === args.academicYearFilter);
    }
    return combined;
  },
});

export const addAchievement = mutation({
  args: {
    studentId: v.id("students"),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    certificateUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("achievements", args);
  },
});

export const updateAchievement = mutation({
  args: {
    id: v.id("achievements"),
    studentId: v.id("students"),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    certificateUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
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
  args: {
    studentId: v.id("students"),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fees = await ctx.db
      .query("fees")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .take(100);

    if (args.academicYear && args.academicYear !== "all") {
      return fees.filter((f) => (f.academicYear || "2025-26") === args.academicYear);
    }
    return fees;
  },
});

export const listAllFees = query({
  args: {
    classFilter: v.optional(v.string()),
    academicYearFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fees = await ctx.db.query("fees").take(500);
    const students = await ctx.db.query("students").take(500);
    const studentMap = new Map(students.map((s) => [s._id, s]));

    let combined = fees.map((fee) => {
      const s = studentMap.get(fee.studentId);
      const year = fee.academicYear || "2025-26";
      return {
        ...fee,
        academicYear: year,
        studentName: s?.name || "Unknown Student",
        rollNumber: s?.rollNumber || "N/A",
        class: s?.class || "N/A",
      };
    });

    if (args.classFilter && args.classFilter !== "all") {
      combined = combined.filter((f) => f.class === args.classFilter);
    }
    if (args.academicYearFilter && args.academicYearFilter !== "all") {
      combined = combined.filter((f) => f.academicYear === args.academicYearFilter);
    }
    return combined;
  },
});

export const addFee = mutation({
  args: {
    studentId: v.id("students"),
    academicYear: v.optional(v.string()),
    title: v.string(),
    amount: v.number(),
    paidAmount: v.number(),
    dueDate: v.string(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("overdue")),
    paymentDate: v.optional(v.string()),
    paymentMode: v.optional(v.string()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    let targetYear = args.academicYear;
    if (!targetYear) {
      const current = await ctx.db
        .query("academic_sessions")
        .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
        .first();
      targetYear = current?.year || "2025-26";
    }
    return await ctx.db.insert("fees", { ...args, academicYear: targetYear });
  },
});

export const assignFeeStructure = mutation({
  args: {
    target: v.union(v.literal("all"), v.literal("class"), v.literal("student")),
    targetClass: v.optional(v.string()),
    studentId: v.optional(v.id("students")),
    academicYear: v.optional(v.string()),
    title: v.string(),
    amount: v.number(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    let targetYear = args.academicYear;
    if (!targetYear) {
      const current = await ctx.db
        .query("academic_sessions")
        .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
        .first();
      targetYear = current?.year || "2025-26";
    }

    let targetStudents: Array<any> = [];
    if (args.target === "student" && args.studentId) {
      const s = await ctx.db.get(args.studentId);
      if (s) targetStudents = [s];
    } else if (args.target === "class" && args.targetClass) {
      targetStudents = await ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("class", args.targetClass))
        .take(500);
    } else {
      targetStudents = await ctx.db.query("students").take(500);
    }

    let createdCount = 0;
    const now = new Date().toISOString().split("T")[0];
    for (const student of targetStudents) {
      const isPastDue = args.dueDate < now;
      await ctx.db.insert("fees", {
        studentId: student._id,
        academicYear: targetYear,
        title: args.title.trim(),
        amount: args.amount,
        paidAmount: 0,
        dueDate: args.dueDate,
        status: isPastDue ? "overdue" : "pending",
      });
      createdCount++;
    }
    return { count: createdCount, academicYear: targetYear };
  },
});

export const recordFeePayment = mutation({
  args: {
    id: v.id("fees"),
    paidAmount: v.number(),
    paymentDate: v.optional(v.string()),
    paymentMode: v.optional(v.string()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const fee = await ctx.db.get(args.id);
    if (!fee) throw new Error("Fee record not found");

    const newPaid = Math.min(fee.amount, Math.max(0, args.paidAmount));
    let newStatus: "paid" | "pending" | "overdue" = "pending";
    if (newPaid >= fee.amount) {
      newStatus = "paid";
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (fee.dueDate < today) {
        newStatus = "overdue";
      } else {
        newStatus = "pending";
      }
    }

    await ctx.db.patch(args.id, {
      paidAmount: newPaid,
      status: newStatus,
      paymentDate: args.paymentDate || new Date().toISOString().split("T")[0],
      paymentMode: args.paymentMode,
      remarks: args.remarks,
    });
  },
});

export const updateFee = mutation({
  args: {
    id: v.id("fees"),
    academicYear: v.optional(v.string()),
    title: v.string(),
    amount: v.number(),
    paidAmount: v.number(),
    dueDate: v.string(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("overdue")),
    paymentDate: v.optional(v.string()),
    paymentMode: v.optional(v.string()),
    remarks: v.optional(v.string()),
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
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      return null;
    }
    await ctx.db.delete(args.id);
    return true;
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

export const getAttendanceForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .take(500);
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

export const saveClassAttendance = mutation({
  args: {
    date: v.string(),
    records: v.array(
      v.object({
        studentId: v.id("students"),
        status: v.union(v.literal("present"), v.literal("absent"), v.literal("leave")),
        remarks: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    let count = 0;
    for (const rec of args.records) {
      const existing = await ctx.db
        .query("attendance")
        .withIndex("by_student_and_date", (q) =>
          q.eq("studentId", rec.studentId).eq("date", args.date)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: rec.status,
          remarks: rec.remarks,
        });
      } else {
        await ctx.db.insert("attendance", {
          studentId: rec.studentId,
          date: args.date,
          status: rec.status,
          remarks: rec.remarks,
        });
      }
      count++;
    }
    return { count };
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
    const pendingRequests = await ctx.db
      .query("profile_change_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(100);

    const classesSet = new Set(students.map((s) => s.class).filter(Boolean));

    return {
      totalStudents: students.length,
      totalNotices: notices.length,
      totalClasses: classesSet.size,
      pendingRequestsCount: pendingRequests.length,
    };
  },
});

const ADMIN_FEE_SUMMARY_PIN = "1982";

export const getProtectedFeeStats = query({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    if (args.pin.trim() !== ADMIN_FEE_SUMMARY_PIN) {
      return {
        authorized: false,
        totalAssignedFee: 0,
        overdueFeesCount: 0,
      };
    }

    const fees = await ctx.db.query("fees").take(500);
    const overdueFeesCount = fees.filter((f) => f.status === "overdue").length;
    const totalAssignedFee = fees.reduce((acc, f) => acc + (f.amount || 0), 0);
    const totalPaidFee = fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
    const totalDueFee = Math.max(0, totalAssignedFee - totalPaidFee);

    return {
      authorized: true,
      totalAssignedFee,
      overdueFeesCount,
      totalPaidFee,
      totalDueFee,
    };
  },
});

