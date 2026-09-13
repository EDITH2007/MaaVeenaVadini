import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { emailOtp } from "./auth/emailOtp";
import { DataModel } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { Scrypt } from "lucia";

function CustomPassword() {
  const basePasswordProvider = Password<DataModel>({
    profile(params) {
      const email = (params.email as string)?.toLowerCase().trim();
      return {
        email,
        role: email === "admin@mvvs.in" ? "admin" : "student",
      };
    },
  });

  return ConvexCredentials<DataModel>({
    id: "password",
    authorize: async (params, ctx) => {
      const flow = params.flow as string;
      const email = (params.email as string)?.toLowerCase().trim();
      const password = (params.password as string)?.trim();

      if (!email || !password) {
        throw new Error("Invalid credentials");
      }

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

        const officialDob = student.dateOfBirth?.trim();
        if (!officialDob || password !== officialDob) {
          throw new Error("Invalid credentials");
        }
      } else {
        throw new Error("Invalid credentials");
      }

      return await basePasswordProvider.authorize(params, ctx);
    },
    crypto: {
      async hashSecret(password: string) {
        return await new Scrypt().hash(password);
      },
      async verifySecret(password: string, hash: string) {
        return await new Scrypt().verify(hash, password);
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