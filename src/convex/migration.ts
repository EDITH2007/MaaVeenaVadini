import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./admin";

export function deriveAcademicYearFromDate(dateStr?: string): string {
  if (!dateStr) return "2025-26";
  try {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) {
        if (m >= 4) {
          // April onwards belongs to y-(y+1)
          const nextTwoDigits = String((y + 1) % 100).padStart(2, "0");
          return `${y}-${nextTwoDigits}`;
        } else {
          // Jan-Mar belongs to (y-1)-y
          const thisTwoDigits = String(y % 100).padStart(2, "0");
          return `${y - 1}-${thisTwoDigits}`;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return "2025-26";
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

export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("academic_sessions").take(100);
    const activeSession = sessions.find((s) => s.isCurrent) || sessions[0];
    const totalStudents = (await ctx.db.query("students").take(500)).length;
    const recordsCount = (await ctx.db.query("student_academic_records").take(500)).length;
    const marksCount = (await ctx.db.query("student_marks").take(5000)).length;
    const achievementsCount = (await ctx.db.query("achievements").take(500)).length;

    const isMigrated = Boolean(activeSession && recordsCount >= totalStudents && totalStudents > 0);

    return {
      isMigrated,
      activeSessionYear: activeSession?.year || "None",
      totalStudents,
      recordsCount,
      marksCount,
      achievementsCount,
    };
  },
});

export const migrateToMultiYear = mutation({
  args: {
    targetYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);

    const targetYear = (args.targetYear || "2025-26").trim();

    // 1. Ensure academic_sessions record exists and is set to current
    const existingSession = await ctx.db
      .query("academic_sessions")
      .withIndex("by_year", (q) => q.eq("year", targetYear))
      .unique();

    if (!existingSession) {
      // Unset previous active
      const activeSessions = await ctx.db
        .query("academic_sessions")
        .withIndex("by_isCurrent", (q) => q.eq("isCurrent", true))
        .collect();
      for (const s of activeSessions) {
        await ctx.db.patch(s._id, { isCurrent: false });
      }

      await ctx.db.insert("academic_sessions", {
        year: targetYear,
        startDate: "2025-04-01",
        endDate: "2026-03-31",
        isCurrent: true,
        createdAt: Date.now(),
      });
    } else if (!existingSession.isCurrent) {
      await ctx.db.patch(existingSession._id, { isCurrent: true });
    }

    // 2. Fetch all students
    const students = await ctx.db.query("students").take(500);
    let migratedStudents = 0;
    let createdMarksRows = 0;

    for (const student of students) {
      const studentClass = student.class || "1st";

      // 2a. Upsert student_academic_records
      const existingRecord = await ctx.db
        .query("student_academic_records")
        .withIndex("by_studentId_and_academicYear", (q) =>
          q.eq("studentId", student._id).eq("academicYear", targetYear)
        )
        .unique();

      if (!existingRecord) {
        await ctx.db.insert("student_academic_records", {
          studentId: student._id,
          academicYear: targetYear,
          class: studentClass,
          halfYearlyTotal: student.halfYearlyMarks,
          finalTotal: student.finalMarks,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.patch(existingRecord._id, {
          class: studentClass,
          halfYearlyTotal: student.halfYearlyMarks ?? existingRecord.halfYearlyTotal,
          finalTotal: student.finalMarks ?? existingRecord.finalTotal,
          updatedAt: Date.now(),
        });
      }
      migratedStudents++;

      // 2b. Check student_marks
      const existingMarks = await ctx.db
        .query("student_marks")
        .withIndex("by_studentId_and_academicYear", (q) =>
          q.eq("studentId", student._id).eq("academicYear", targetYear)
        )
        .take(1);

      if (existingMarks.length === 0) {
        // Half Yearly
        const hySubjects = (student.subjects?.halfYearly as Record<string, number | undefined>) || {};
        const hyEntries = Object.entries(hySubjects).filter(([_, v]) => v !== undefined && v !== null);

        if (hyEntries.length > 0) {
          for (const [sub, marksVal] of hyEntries) {
            await ctx.db.insert("student_marks", {
              studentId: student._id,
              academicYear: targetYear,
              class: studentClass,
              examType: "halfYearly",
              subject: sub,
              marks: Number(marksVal),
              maxMarks: 100,
              grade: calculateGrade(Number(marksVal), 100),
            });
            createdMarksRows++;
          }
        } else if (student.halfYearlyMarks !== undefined) {
          // Legacy total-only
          await ctx.db.insert("student_marks", {
            studentId: student._id,
            academicYear: targetYear,
            class: studentClass,
            examType: "halfYearly",
            subject: "total",
            marks: student.halfYearlyMarks,
            maxMarks: 700,
            grade: calculateGrade(student.halfYearlyMarks, 700),
          });
          createdMarksRows++;
        }

        // Final
        const fnSubjects = (student.subjects?.final as Record<string, number | undefined>) || {};
        const fnEntries = Object.entries(fnSubjects).filter(([_, v]) => v !== undefined && v !== null);

        if (fnEntries.length > 0) {
          for (const [sub, marksVal] of fnEntries) {
            await ctx.db.insert("student_marks", {
              studentId: student._id,
              academicYear: targetYear,
              class: studentClass,
              examType: "final",
              subject: sub,
              marks: Number(marksVal),
              maxMarks: 100,
              grade: calculateGrade(Number(marksVal), 100),
            });
            createdMarksRows++;
          }
        } else if (student.finalMarks !== undefined) {
          // Legacy total-only
          await ctx.db.insert("student_marks", {
            studentId: student._id,
            academicYear: targetYear,
            class: studentClass,
            examType: "final",
            subject: "total",
            marks: student.finalMarks,
            maxMarks: 700,
            grade: calculateGrade(student.finalMarks, 700),
          });
          createdMarksRows++;
        }
      }
    }

    // 3. Migrate achievements
    const achievements = await ctx.db.query("achievements").take(500);
    let taggedAchievements = 0;
    for (const ach of achievements) {
      if (!ach.academicYear) {
        const derivedYear = deriveAcademicYearFromDate(ach.date);
        await ctx.db.patch(ach._id, { academicYear: derivedYear });
        taggedAchievements++;
      }
    }

    return {
      success: true,
      targetYear,
      migratedStudents,
      createdMarksRows,
      taggedAchievements,
      totalStudents: students.length,
    };
  },
});
