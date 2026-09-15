import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { emailOtp } from "./auth/emailOtp";
import { DataModel } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { Scrypt } from "lucia";
import { normalizeDOB } from "./utils";

function CustomPassword() {
  const basePasswordProvider = Password<DataModel>({
    profile(params) {
      const email = (params.email as string)?.toLowerCase().trim();
      const isStudent = email !== "admin@mvvs.in" && email?.endsWith("@mvvs.in");
      const rollNumber = isStudent ? email.split("@")[0].toUpperCase().trim() : undefined;
      return {
        email,
        role: email === "admin@mvvs.in" ? "admin" : "student",
        ...(rollNumber ? { rollNumber } : {}),
      };
    },
  });

  return ConvexCredentials<DataModel>({
    id: "password",
    authorize: async (params, ctx) => {
      const flow = params.flow as string;
      const email = (params.email as string)?.toLowerCase().trim();
      const rawPassword = (params.password as string)?.trim();

      if (!email || !rawPassword) {
        throw new Error("Invalid credentials");
      }

      let activeParams = params;

      if (email === "admin@mvvs.in") {
        if (flow === "signUp") {
          throw new Error("Admin registration via public sign up is disabled.");
        }
      } else if (email.endsWith("@mvvs.in")) {
        const rollNumber = email.split("@")[0].toUpperCase().trim();
        if (!rollNumber) {
          throw new Error("Invalid credentials");
        }

        const student = await ctx.runQuery(internal.students.getByRollInternal, {
          rollNumber,
        });

        if (!student) {
          throw new Error("Invalid credentials");
        }

        const normalizedTyped = normalizeDOB(rawPassword);
        const officialDob = normalizeDOB(student.dateOfBirth);

        if (!normalizedTyped || !officialDob || normalizedTyped !== officialDob) {
          throw new Error("Invalid credentials");
        }

        activeParams = {
          ...params,
          password: normalizedTyped,
        };
      } else {
        throw new Error("Invalid credentials");
      }

      console.log("[CustomPassword authorize] params:", params);
      return await basePasswordProvider.authorize(activeParams, ctx);
    },
    crypto: {
      async hashSecret(password: string) {
        console.log("[hashSecret] password len:", password.length);
        return await new Scrypt().hash(password);
      },
      async verifySecret(password: string, hash: string) {
        console.log("[verifySecret] password:", password, "hash starts with:", hash?.substring(0, 15));
        const res = await new Scrypt().verify(hash, password);
        console.log("[verifySecret] result:", res);
        return res;
      },
    },
  });
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    CustomPassword(),
    emailOtp,
    Anonymous,
  ],
});