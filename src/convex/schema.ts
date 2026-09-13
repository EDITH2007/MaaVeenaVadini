import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  STUDENT: "student",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.STUDENT),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      rollNumber: v.optional(v.string()),
      studentId: v.optional(v.id("students")),
    })
      .index("email", ["email"])
      .index("by_roll", ["rollNumber"]),

    students: defineTable({
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
      userId: v.optional(v.id("users")),
      // Subject-wise marks
      subjects: v.optional(v.object({
        halfYearly: v.optional(v.object({
          hindi: v.optional(v.number()),
          english: v.optional(v.number()),
          math: v.optional(v.number()),
          evs: v.optional(v.number()),
          science: v.optional(v.number()),
          socialScience: v.optional(v.number()),
          sanskrit: v.optional(v.number()),
          computerScience: v.optional(v.number()),
        })),
        final: v.optional(v.object({
          hindi: v.optional(v.number()),
          english: v.optional(v.number()),
          math: v.optional(v.number()),
          evs: v.optional(v.number()),
          science: v.optional(v.number()),
          socialScience: v.optional(v.number()),
          sanskrit: v.optional(v.number()),
          computerScience: v.optional(v.number()),
        })),
      })),
    })
      .index("by_roll", ["rollNumber"])
      .index("by_class", ["class"])
      .index("by_user", ["userId"]),

    notices: defineTable({
      title: v.string(),
      content: v.string(),
      date: v.string(),
      important: v.optional(v.boolean()),
      imageUrl: v.optional(v.string()),
    }),

    achievements: defineTable({
      studentId: v.id("students"),
      title: v.string(),
      description: v.string(),
      date: v.string(),
      certificateUrl: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      academicYear: v.optional(v.string()),
    })
      .index("by_student", ["studentId"])
      .index("by_academicYear", ["academicYear"]),

    academic_sessions: defineTable({
      year: v.string(), // e.g. "2025-26"
      isCurrent: v.boolean(),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_year", ["year"])
      .index("by_isCurrent", ["isCurrent"]),

    student_academic_records: defineTable({
      studentId: v.id("students"),
      academicYear: v.string(), // e.g. "2025-26"
      class: v.string(), // e.g. "1st", "2nd", ..., "8th"
      halfYearlyTotal: v.optional(v.number()),
      finalTotal: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })
      .index("by_studentId", ["studentId"])
      .index("by_studentId_and_academicYear", ["studentId", "academicYear"])
      .index("by_academicYear_and_class", ["academicYear", "class"])
      .index("by_academicYear", ["academicYear"]),

    student_marks: defineTable({
      studentId: v.id("students"),
      academicYear: v.string(), // e.g. "2025-26"
      class: v.string(), // e.g. "5th"
      examType: v.union(v.literal("halfYearly"), v.literal("final")),
      subject: v.string(), // "hindi" | "english" | "math" | "evs" | "science" | "socialScience" | "sanskrit" | "computerScience" | "total"
      marks: v.number(),
      maxMarks: v.number(), // default 100 per subject, 600 for total
      grade: v.optional(v.string()),
    })
      .index("by_studentId_and_academicYear", ["studentId", "academicYear"])
      .index("by_studentId_and_academicYear_and_examType", ["studentId", "academicYear", "examType"])
      .index("by_studentId_and_academicYear_and_examType_and_subject", ["studentId", "academicYear", "examType", "subject"])
      .index("by_academicYear_and_class", ["academicYear", "class"]),

    fees: defineTable({
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
    })
      .index("by_student", ["studentId"])
      .index("by_academicYear", ["academicYear"])
      .index("by_student_and_academicYear", ["studentId", "academicYear"]),

    attendance: defineTable({
      studentId: v.id("students"),
      date: v.string(), // YYYY-MM-DD
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("leave")),
      remarks: v.optional(v.string()),
    })
      .index("by_student", ["studentId"])
      .index("by_date", ["date"])
      .index("by_student_and_date", ["studentId", "date"]),

    calendar_events: defineTable({
      title: v.string(),
      startDate: v.string(), // YYYY-MM-DD
      endDate: v.optional(v.string()),
      category: v.union(
        v.literal("holiday"),
        v.literal("exam"),
        v.literal("event"),
        v.literal("ptm"),
        v.literal("admission"),
        v.literal("notice")
      ),
      description: v.optional(v.string()),
      isPublic: v.optional(v.boolean()),
    }).index("by_startDate", ["startDate"]),

    profile_change_requests: defineTable({
      studentId: v.id("students"),
      studentName: v.string(),
      rollNumber: v.string(),
      requestDetails: v.string(),
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      createdAt: v.number(),
    }).index("by_status", ["status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;