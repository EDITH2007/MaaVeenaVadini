import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./admin";

export const SUBJECTS_CONFIG = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "science", label: "Science" },
  { key: "socialScience", label: "Social Science" },
  { key: "sanskrit", label: "Sanskrit" },
  { key: "computerScience", label: "Computer Science" },
] as const;

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

export const getStudentAcademicYears = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    // 1. Fetch records from student_academic_records
    const records = await ctx.db
      .query("student_academic_records")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    // 2. Fetch marks from student_marks (in case student_marks has years)
    const marks = await ctx.db
      .query("student_marks")
      .withIndex("by_studentId_and_academicYear", (q) => q.eq("studentId", args.studentId))
      .collect();

    const yearSet = new Set<string>();
    records.forEach((r) => yearSet.add(r.academicYear));
    marks.forEach((m) => yearSet.add(m.academicYear));

    // Get current active session
    const activeSession = await ctx.db
      .query("academic_sessions")
      .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
      .first();

    const currentYear = activeSession?.year || "2025-26";
    // Always include current year in options if student exists
    yearSet.add(currentYear);

    const sortedYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
    return {
      years: sortedYears,
      currentYear,
    };
  },
});

export const getStudentResultsForYear = query({
  args: {
    studentId: v.id("students"),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    // 1. Get enrollment record for this year
    const academicRecord = await ctx.db
      .query("student_academic_records")
      .withIndex("by_studentId_and_academicYear", (q) =>
        q.eq("studentId", args.studentId).eq("academicYear", args.academicYear)
      )
      .unique();

    const assignedClass = academicRecord?.class || student.class || "1st";

    // 2. Query marks from student_marks
    const marksList = await ctx.db
      .query("student_marks")
      .withIndex("by_studentId_and_academicYear", (q) =>
        q.eq("studentId", args.studentId).eq("academicYear", args.academicYear)
      )
      .collect();

    // Format Half Yearly
    const hyMarksRows = marksList.filter((m) => m.examType === "halfYearly");
    const fnMarksRows = marksList.filter((m) => m.examType === "final");

    const hyTotalRow = hyMarksRows.find((m) => m.subject === "total");
    const fnTotalRow = fnMarksRows.find((m) => m.subject === "total");

    const hySubjectRows = hyMarksRows.filter((m) => m.subject !== "total");
    const fnSubjectRows = fnMarksRows.filter((m) => m.subject !== "total");

    // Check if we have subject rows or fallback to legacy/total only
    let hySubjects: Record<string, number> = {};
    let fnSubjects: Record<string, number> = {};
    let hyTotal: number | undefined = academicRecord?.halfYearlyTotal ?? hyTotalRow?.marks;
    let fnTotal: number | undefined = academicRecord?.finalTotal ?? fnTotalRow?.marks;
    let hyIsTotalOnly = false;
    let fnIsTotalOnly = false;

    if (hySubjectRows.length > 0) {
      hySubjectRows.forEach((r) => {
        hySubjects[r.subject] = r.marks;
      });
      if (hyTotal === undefined) {
        hyTotal = Object.values(hySubjects).reduce((a, b) => a + b, 0);
      }
    } else if (hyTotal !== undefined) {
      hyIsTotalOnly = true;
    }

    if (fnSubjectRows.length > 0) {
      fnSubjectRows.forEach((r) => {
        fnSubjects[r.subject] = r.marks;
      });
      if (fnTotal === undefined) {
        fnTotal = Object.values(fnSubjects).reduce((a, b) => a + b, 0);
      }
    } else if (fnTotal !== undefined) {
      fnIsTotalOnly = true;
    }

    // Fallback: If this is current session or student's only record, check student.subjects
    const activeSession = await ctx.db
      .query("academic_sessions")
      .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
      .first();

    const isCurrent = activeSession?.year === args.academicYear || (!activeSession && args.academicYear === "2025-26");

    if (isCurrent && marksList.length === 0 && !academicRecord) {
      // Use legacy student fields
      if (student.subjects?.halfYearly) {
        hySubjects = (student.subjects.halfYearly as any) || {};
      }
      if (student.subjects?.final) {
        fnSubjects = (student.subjects.final as any) || {};
      }
      hyTotal = student.halfYearlyMarks;
      fnTotal = student.finalMarks;
      hyIsTotalOnly = Object.keys(hySubjects).length === 0 && hyTotal !== undefined;
      fnIsTotalOnly = Object.keys(fnSubjects).length === 0 && fnTotal !== undefined;
    }

    return {
      academicYear: args.academicYear,
      class: assignedClass,
      studentName: student.name,
      rollNumber: student.rollNumber,
      halfYearly: {
        subjects: hySubjects,
        total: hyTotal,
        maxTotal: hyIsTotalOnly ? (hyTotalRow?.maxMarks || 700) : 700,
        isTotalOnly: hyIsTotalOnly,
        grade: hyTotal !== undefined ? calculateGrade(hyTotal, 700) : undefined,
      },
      final: {
        subjects: fnSubjects,
        total: fnTotal,
        maxTotal: fnIsTotalOnly ? (fnTotalRow?.maxMarks || 700) : 700,
        isTotalOnly: fnIsTotalOnly,
        grade: fnTotal !== undefined ? calculateGrade(fnTotal, 700) : undefined,
      },
    };
  },
});

export const saveStudentYearMarks = mutation({
  args: {
    studentId: v.id("students"),
    academicYear: v.string(),
    class: v.string(),
    halfYearlySubjects: v.optional(v.any()), // key-value pairs of marks
    finalSubjects: v.optional(v.any()),
    halfYearlyTotal: v.optional(v.number()),
    finalTotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);

    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    // 1. Calculate sums
    const parseSubjects = (subMap: any): Record<string, number> => {
      if (!subMap || typeof subMap !== "object") return {};
      const res: Record<string, number> = {};
      for (const [k, v] of Object.entries(subMap)) {
        if (v !== "" && v !== undefined && v !== null && !isNaN(Number(v))) {
          res[k] = Number(v);
        }
      }
      return res;
    };

    const hySubClean = parseSubjects(args.halfYearlySubjects);
    const fnSubClean = parseSubjects(args.finalSubjects);

    const hyCalculatedSum =
      Object.keys(hySubClean).length > 0
        ? Object.values(hySubClean).reduce((a, b) => a + b, 0)
        : undefined;
    const fnCalculatedSum =
      Object.keys(fnSubClean).length > 0
        ? Object.values(fnSubClean).reduce((a, b) => a + b, 0)
        : undefined;

    const hyFinalTotal = hyCalculatedSum !== undefined ? hyCalculatedSum : args.halfYearlyTotal;
    const fnFinalTotal = fnCalculatedSum !== undefined ? fnCalculatedSum : args.finalTotal;

    // 2. Upsert student_academic_records
    const existingRecord = await ctx.db
      .query("student_academic_records")
      .withIndex("by_studentId_and_academicYear", (q) =>
        q.eq("studentId", args.studentId).eq("academicYear", args.academicYear)
      )
      .unique();

    if (existingRecord) {
      await ctx.db.patch(existingRecord._id, {
        class: args.class,
        halfYearlyTotal: hyFinalTotal,
        finalTotal: fnFinalTotal,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("student_academic_records", {
        studentId: args.studentId,
        academicYear: args.academicYear,
        class: args.class,
        halfYearlyTotal: hyFinalTotal,
        finalTotal: fnFinalTotal,
        updatedAt: Date.now(),
      });
    }

    // 3. Clear existing student_marks for this {studentId, academicYear}
    const existingMarks = await ctx.db
      .query("student_marks")
      .withIndex("by_studentId_and_academicYear", (q) =>
        q.eq("studentId", args.studentId).eq("academicYear", args.academicYear)
      )
      .collect();

    for (const em of existingMarks) {
      await ctx.db.delete(em._id);
    }

    // 4. Insert new student_marks rows
    // Half Yearly subject marks
    if (Object.keys(hySubClean).length > 0) {
      for (const [subKey, val] of Object.entries(hySubClean)) {
        await ctx.db.insert("student_marks", {
          studentId: args.studentId,
          academicYear: args.academicYear,
          class: args.class,
          examType: "halfYearly",
          subject: subKey,
          marks: val,
          maxMarks: 100,
          grade: calculateGrade(val, 100),
        });
      }
    } else if (hyFinalTotal !== undefined) {
      // Legacy or total-only
      await ctx.db.insert("student_marks", {
        studentId: args.studentId,
        academicYear: args.academicYear,
        class: args.class,
        examType: "halfYearly",
        subject: "total",
        marks: hyFinalTotal,
        maxMarks: 700,
        grade: calculateGrade(hyFinalTotal, 700),
      });
    }

    // Final subject marks
    if (Object.keys(fnSubClean).length > 0) {
      for (const [subKey, val] of Object.entries(fnSubClean)) {
        await ctx.db.insert("student_marks", {
          studentId: args.studentId,
          academicYear: args.academicYear,
          class: args.class,
          examType: "final",
          subject: subKey,
          marks: val,
          maxMarks: 100,
          grade: calculateGrade(val, 100),
        });
      }
    } else if (fnFinalTotal !== undefined) {
      // Legacy or total-only
      await ctx.db.insert("student_marks", {
        studentId: args.studentId,
        academicYear: args.academicYear,
        class: args.class,
        examType: "final",
        subject: "total",
        marks: fnFinalTotal,
        maxMarks: 700,
        grade: calculateGrade(fnFinalTotal, 700),
      });
    }

    // 5. If this is the active session, mirror onto students table for backwards compatibility
    const activeSession = await ctx.db
      .query("academic_sessions")
      .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
      .first();

    const isCurrent = activeSession?.year === args.academicYear || (!activeSession && args.academicYear === "2025-26");

    if (isCurrent) {
      const mirrorSubjects: any = {};
      if (Object.keys(hySubClean).length > 0) mirrorSubjects.halfYearly = hySubClean;
      if (Object.keys(fnSubClean).length > 0) mirrorSubjects.final = fnSubClean;

      await ctx.db.patch(args.studentId, {
        class: args.class,
        halfYearlyMarks: hyFinalTotal,
        finalMarks: fnFinalTotal,
        subjects: Object.keys(mirrorSubjects).length > 0 ? mirrorSubjects : undefined,
      });
    }

    return { success: true };
  },
});
