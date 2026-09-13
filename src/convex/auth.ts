import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { emailOtp } from "./auth/emailOtp";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = (params.email as string)?.toLowerCase().trim();
        if (params.flow === "signUp" && email === "admin@mvvs.in") {
          throw new Error("Admin registration via public sign up is disabled.");
        }
        return {
          email,
          role: email === "admin@mvvs.in" ? "admin" : "student",
        };
      },
    }),
    emailOtp,
    Anonymous,
  ],
});