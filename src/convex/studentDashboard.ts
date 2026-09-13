import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { deriveAcademicYearFromDate } from "./migration";
import { getSubjectsForClass, isPrimaryClass } from "./results";

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

function calculateGrade(marks?: number, maxMarks: number = 100): string {
  if (marks === undefined || marks === null) return "—";
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return null;
    return student;
  },
});

export const getMyAcademicYears = query({
  args: {},
  handler: async (ctx) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return { years: ["2025-26"], currentYear: "2025-26" };

    const records = await ctx.db
      .query("student_academic_records")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    const marks = await ctx.db
      .query("student_marks")
      .withIndex("by_studentId_and_academicYear", (q) => q.eq("studentId", student._id))
      .collect();

    const studentFees = await ctx.db
      .query("fees")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    const activeSession = await ctx.db
      .query("academic_sessions")
      .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
      .first();

    const currentYear = activeSession?.year || "2025-26";
    const yearSet = new Set<string>();
    records.forEach((r) => yearSet.add(r.academicYear));
    marks.forEach((m) => yearSet.add(m.academicYear));
    studentFees.forEach((f) => {
      if (f.academicYear) yearSet.add(f.academicYear);
    });
    yearSet.add(currentYear);

    const sortedYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
    return {
      years: sortedYears,
      currentYear,
    };
  },
});

export const getMyResultsByYear = query({
  args: { academicYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return null;

    const activeSession = await ctx.db
      .query("academic_sessions")
      .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
      .first();

    const currentYear = activeSession?.year || "2025-26";
    const targetYear = args.academicYear || currentYear;

    // 1. Fetch enrollment record for this year
    const academicRecord = await ctx.db
      .query("student_academic_records")
      .withIndex("by_studentId_and_academicYear", (q) =>
        q.eq("studentId", student._id).eq("academicYear", targetYear)
      )
      .unique();

    const assignedClass = academicRecord?.class || student.class || "1st";
    const applicableSubjects = getSubjectsForClass(assignedClass);
    const applicableKeys = new Set<string>(applicableSubjects.map((s) => s.key));
    const applicableMaxTotal = applicableSubjects.length * 100; // 600

    // 2. Fetch marks
    const marksList = await ctx.db
      .query("student_marks")
      .withIndex("by_studentId_and_academicYear", (q) =>
        q.eq("studentId", student._id).eq("academicYear", targetYear)
      )
      .collect();

    // Format Half Yearly
    const hyMarksRows = marksList.filter((m) => m.examType === "halfYearly");
    const fnMarksRows = marksList.filter((m) => m.examType === "final");

    const hyTotalRow = hyMarksRows.find((m) => m.subject === "total");
    const fnTotalRow = fnMarksRows.find((m) => m.subject === "total");

    const hySubjectRows = hyMarksRows.filter((m) => m.subject !== "total");
    const fnSubjectRows = fnMarksRows.filter((m) => m.subject !== "total");

    let hySubjects: Record<string, number> = {};
    let fnSubjects: Record<string, number> = {};
    let hyTotal: number | undefined = academicRecord?.halfYearlyTotal ?? hyTotalRow?.marks;
    let fnTotal: number | undefined = academicRecord?.finalTotal ?? fnTotalRow?.marks;
    let hyIsTotalOnly = false;
    let fnIsTotalOnly = false;

    if (hySubjectRows.length > 0) {
      hySubjectRows.forEach((r) => {
        if (isPrimaryClass(assignedClass) && r.subject === "science") {
          if (hySubjects.evs === undefined) hySubjects.evs = r.marks;
        } else {
          hySubjects[r.subject] = r.marks;
        }
      });
      hyTotal = Object.entries(hySubjects)
        .filter(([k]) => applicableKeys.has(k))
        .reduce((sum, [_, val]) => sum + val, 0);
    } else if (hyTotal !== undefined) {
      hyIsTotalOnly = true;
    }

    if (fnSubjectRows.length > 0) {
      fnSubjectRows.forEach((r) => {
        if (isPrimaryClass(assignedClass) && r.subject === "science") {
          if (fnSubjects.evs === undefined) fnSubjects.evs = r.marks;
        } else {
          fnSubjects[r.subject] = r.marks;
        }
      });
      fnTotal = Object.entries(fnSubjects)
        .filter(([k]) => applicableKeys.has(k))
        .reduce((sum, [_, val]) => sum + val, 0);
    } else if (fnTotal !== undefined) {
      fnIsTotalOnly = true;
    }

    // Fallback if targetYear is currentYear and no rows exist yet
    if (targetYear === currentYear && marksList.length === 0 && !academicRecord) {
      if (student.subjects?.halfYearly) {
        hySubjects = (student.subjects.halfYearly as any) || {};
        if (isPrimaryClass(assignedClass) && (hySubjects as any).science !== undefined && hySubjects.evs === undefined) {
          hySubjects.evs = (hySubjects as any).science;
        }
      }
      if (student.subjects?.final) {
        fnSubjects = (student.subjects.final as any) || {};
        if (isPrimaryClass(assignedClass) && (fnSubjects as any).science !== undefined && fnSubjects.evs === undefined) {
          fnSubjects.evs = (fnSubjects as any).science;
        }
      }
      hyTotal = student.halfYearlyMarks;
      fnTotal = student.finalMarks;
      hyIsTotalOnly = Object.keys(hySubjects).length === 0 && hyTotal !== undefined;
      fnIsTotalOnly = Object.keys(fnSubjects).length === 0 && fnTotal !== undefined;
    }

    return {
      academicYear: targetYear,
      isCurrentYear: targetYear === currentYear,
      class: assignedClass,
      applicableSubjects: applicableSubjects.map((s) => ({ key: s.key, label: s.label })),
      halfYearly: {
        subjects: hySubjects,
        total: hyTotal,
        maxTotal: hyIsTotalOnly ? (hyTotalRow?.maxMarks || applicableMaxTotal) : applicableMaxTotal,
        isTotalOnly: hyIsTotalOnly,
        grade: hyTotal !== undefined ? calculateGrade(hyTotal, applicableMaxTotal) : undefined,
      },
      final: {
        subjects: fnSubjects,
        total: fnTotal,
        maxTotal: fnIsTotalOnly ? (fnTotalRow?.maxMarks || applicableMaxTotal) : applicableMaxTotal,
        isTotalOnly: fnIsTotalOnly,
        grade: fnTotal !== undefined ? calculateGrade(fnTotal, applicableMaxTotal) : undefined,
      },
    };
  },
});

export const getMyAchievements = query({
  args: {
    academicYearFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return [];

    const rawAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .take(100);

    const enriched = rawAchievements.map((ach) => ({
      ...ach,
      academicYear: ach.academicYear || deriveAcademicYearFromDate(ach.date),
    }));

    // Chronological order (latest first)
    enriched.sort((a, b) => b.date.localeCompare(a.date));

    if (args.academicYearFilter && args.academicYearFilter !== "all") {
      return enriched.filter((ach) => ach.academicYear === args.academicYearFilter);
    }
    return enriched;
  },
});

export const getMyFees = query({
  args: {
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await getAuthenticatedStudent(ctx);
    if (!student) return [];

    const rawFees = await ctx.db
      .query("fees")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .take(100);

    const enriched = rawFees.map((f) => ({
      ...f,
      academicYear: f.academicYear || "2025-26",
    }));

    if (args.academicYear && args.academicYear !== "all") {
      return enriched.filter((f) => f.academicYear === args.academicYear);
    }
    return enriched;
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
