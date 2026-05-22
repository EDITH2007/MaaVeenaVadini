import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
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
    }).index("email", ["email"]),

    students: defineTable({
      name: v.string(),
      rollNumber: v.string(),
      class: v.optional(v.string()),
      halfYearlyMarks: v.optional(v.number()),
      finalMarks: v.optional(v.number()),
      aadharNumber: v.optional(v.string()),
      dkNumber: v.optional(v.string()),
      // Subject-wise marks
      subjects: v.optional(v.object({
        halfYearly: v.optional(v.object({
          hindi: v.optional(v.number()),
          english: v.optional(v.number()),
          math: v.optional(v.number()),
          science: v.optional(v.number()),
          socialScience: v.optional(v.number()),
          sanskrit: v.optional(v.number()),
          computerScience: v.optional(v.number()),
        })),
        final: v.optional(v.object({
          hindi: v.optional(v.number()),
          english: v.optional(v.number()),
          math: v.optional(v.number()),
          science: v.optional(v.number()),
          socialScience: v.optional(v.number()),
          sanskrit: v.optional(v.number()),
          computerScience: v.optional(v.number()),
        })),
      })),
    })
      .index("by_roll", ["rollNumber"])
      .index("by_class", ["class"]),

    notices: defineTable({
      title: v.string(),
      content: v.string(),
      date: v.string(),
      important: v.optional(v.boolean()),
      imageUrl: v.optional(v.string()),
    }),
  },
  {
    schemaValidation: false,
  },
);

export default schema;