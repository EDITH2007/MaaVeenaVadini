import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./admin";

export const PRIMARY_SUBJECTS = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "evs", label: "EVS" },
  { key: "socialScience", label: "Social Science" },
  { key: "computerScience", label: "Computer Science" },
] as const;

export const MIDDLE_SUBJECTS = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "science", label: "Science" },
  { key: "socialScience", label: "Social Science" },
  { key: "sanskrit", label: "Sanskrit" },
] as const;

export const SUBJECTS_CONFIG = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "evs", label: "EVS" },
  { key: "science", label: "Science" },
  { key: "socialScience", label: "Social Science" },
  { key: "sanskrit", label: "Sanskrit" },
  { key: "computerScience", label: "Computer Science" },
] as const;

export function isPrimaryClass(className?: string): boolean {
  if (!className) return true;
  const c = className.toLowerCase().trim();
  return c.startsWith("1") || c.startsWith("2") || c.startsWith("3") || c.startsWith("4");
}

export function getSubjectsForClass(className?: string) {
  return isPrimaryClass(className) ? PRIMARY_SUBJECTS : MIDDLE_SUBJECTS;
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
    const applicableSubjects = getSubjectsForClass(assignedClass);
    const applicableKeys = new Set<string>(applicableSubjects.map((s) => s.key));
    const applicableMaxTotal = applicableSubjects.length * 100; // 600

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
        // Map legacy science to evs for primary classes if evs not already present
        if (isPrimaryClass(assignedClass) && r.subject === "science") {
          if (hySubjects.evs === undefined) hySubjects.evs = r.marks;
        } else {
          hySubjects[r.subject] = r.marks;
        }
      });
      // Sum only applicable subjects for this class
      hyTotal = Object.entries(hySubjects)
        .filter(([k]) => applicableKeys.has(k))
        .reduce((sum, [_, val]) => sum + val, 0);
    } else if (hyTotal !== undefined) {
      hyIsTotalOnly = true;
    }

    if (fnSubjectRows.length > 0) {
      fnSubjectRows.forEach((r) => {
        // Map legacy science to evs for primary classes if evs not already present
        if (isPrimaryClass(assignedClass) && r.subject === "science") {
          if (fnSubjects.evs === undefined) fnSubjects.evs = r.marks;
        } else {
          fnSubjects[r.subject] = r.marks;
        }
      });
      // Sum only applicable subjects for this class
      fnTotal = Object.entries(fnSubjects)
        .filter(([k]) => applicableKeys.has(k))
        .reduce((sum, [_, val]) => sum + val, 0);
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
      academicYear: args.academicYear,
      class: assignedClass,
      studentName: student.name,
      rollNumber: student.rollNumber,
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

    const applicableSubjects = getSubjectsForClass(args.class);
    const applicableKeys = new Set<string>(applicableSubjects.map((s) => s.key));
    const applicableMaxTotal = applicableSubjects.length * 100; // 600

    // 1. Calculate sums (filtering to applicable class subjects)
    const parseSubjects = (subMap: any): Record<string, number> => {
      if (!subMap || typeof subMap !== "object") return {};
      const res: Record<string, number> = {};
      for (const [k, v] of Object.entries(subMap)) {
        if (applicableKeys.has(k) && v !== "" && v !== undefined && v !== null && !isNaN(Number(v))) {
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
        maxMarks: applicableMaxTotal,
        grade: calculateGrade(hyFinalTotal, applicableMaxTotal),
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
        maxMarks: applicableMaxTotal,
        grade: calculateGrade(fnFinalTotal, applicableMaxTotal),
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
