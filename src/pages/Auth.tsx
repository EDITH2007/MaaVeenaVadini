import { useState, useEffect, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, GraduationCap, Lock, User, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function AuthContent({ redirectAfterAuth }: AuthProps) {
  const convex = useConvex();
  const { signIn } = useAuthActions();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("role") === "admin" ? "admin" : "student";

  const [activeTab, setActiveTab] = useState<"student" | "admin">(defaultTab);
  const [rollOrEmail, setRollOrEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (activeTab === "admin" || searchParams.get("role") === "admin") {
        navigate("/admin");
      } else {
        navigate(redirectAfterAuth || "/student");
      }
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth, activeTab, searchParams]);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollOrEmail || !studentPassword) {
      setError("Please enter your Roll Number / Email and Date of Birth.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Format email correctly to match {rollnumber}@mvvs.in
    let formattedEmail = rollOrEmail.trim().toLowerCase();
    if (!formattedEmail.includes("@")) {
      formattedEmail = `${formattedEmail}@mvvs.in`;
    }
    const rollNumber = formattedEmail.split("@")[0].toUpperCase().trim();
    const trimmedPassword = studentPassword.trim();

    // 1. Pre-authenticate check against student database record
    try {
      const check = await convex.query(api.students.validateStudentCredentials, {
        rollNumber,
        password: trimmedPassword,
      });
      if (!check.valid) {
        setError(check.reason || "Invalid Roll Number or Date of Birth.");
        setIsLoading(false);
        return;
      }
    } catch (checkErr: any) {
      console.warn("Pre-auth check warning:", checkErr);
    }

    // 2. Perform Convex Auth flow using flow: "signUp" (auto-creates auth account for 1st time students, verifies password for returning students)
    try {
      try {
        await signIn("password", {
          email: formattedEmail,
          password: trimmedPassword,
          flow: "signUp",
        });
      } catch (signUpErr: any) {
        const rawSignUpErr = String(signUpErr?.message || signUpErr || "");
        if (rawSignUpErr.includes("already exists") || rawSignUpErr.includes("InvalidSecret")) {
          try {
            await convex.mutation(api.students.syncStudentAuthPassword, {
              rollNumber,
              password: trimmedPassword,
            });
            await signIn("password", {
              email: formattedEmail,
              password: trimmedPassword,
              flow: "signUp",
            });
          } catch (syncErr) {
            await signIn("password", {
              email: formattedEmail,
              password: trimmedPassword,
              flow: "signIn",
            });
          }
        } else {
          await signIn("password", {
            email: formattedEmail,
            password: trimmedPassword,
            flow: "signIn",
          });
        }
      }

      toast.success("Welcome back! Student logged in successfully.");
      navigate("/student");
    } catch (err: any) {
      console.error("Student Auth Error:", err);
      let userFriendlyMsg = "Incorrect Password / Date of Birth. Please ensure your Date of Birth is entered in YYYY-MM-DD format (e.g. 2015-01-01).";
      const rawMsg = String(err?.message || err || "");

      if (rawMsg.includes("Invalid password") || rawMsg.includes("at least 8 characters")) {
        userFriendlyMsg = "Password must be at least 8 characters long. Please enter your Date of Birth in YYYY-MM-DD format (e.g. 2015-01-01).";
      }

      setError(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      setError("Please enter the Admin passcode.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn("password", {
        email: "admin@mvvs.in",
        password: adminPassword,
        flow: "signIn",
      });
      sessionStorage.setItem("mvvs_admin_authed", "true");
      toast.success("Admin login successful.");
      navigate("/admin");
    } catch (err: any) {
      console.error("Admin Auth Error:", err);
      setError("Invalid Admin Password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900 flex flex-col justify-between font-sans">
      {/* Header - Navy Navbar matching Public Site & Dashboards */}
      <header className="bg-[#0a2540] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate("/")}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-1.5 sm:p-2 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-xs sm:text-base leading-tight truncate sm:whitespace-normal">
                Maa Veena Vadini School
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-300 truncate">Student & Admin Portal</p>
            </div>
          </div>
          <Button
            variant="outlineWhite"
            size="sm"
            onClick={() => navigate("/")}
            className="font-medium shrink-0 text-xs sm:text-sm min-h-[36px] px-2.5 sm:px-3"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Auth Card Container */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 my-4 sm:my-6">
        <Card className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl text-slate-900 overflow-hidden">
          <CardHeader className="text-center pb-3 pt-5 px-4 sm:px-6">
            <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 sm:mb-3 text-amber-600 shadow-sm">
              {activeTab === "student" ? (
                <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
              ) : (
                <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-[#0a2540]">
              {activeTab === "student" ? "Student Portal Login" : "Admin Dashboard Access"}
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs sm:text-sm mt-1">
              {activeTab === "student"
                ? "Enter your Roll Number and Date of Birth to view profile & results"
                : "Sign in with administrator credentials to manage school portal"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as "student" | "admin");
                setError(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 bg-slate-100 p-1 border border-slate-200 rounded-xl min-h-[46px]">
                <TabsTrigger
                  value="student"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold text-xs sm:text-sm transition-all text-slate-600 min-h-[38px]"
                >
                  <GraduationCap className="w-4 h-4 mr-1.5" />
                  Student
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold text-xs sm:text-sm transition-all text-slate-600 min-h-[38px]"
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  Admin
                </TabsTrigger>
              </TabsList>

              {/* Student Login Tab */}
              <TabsContent value="student" className="space-y-4 pt-4">
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Roll Number or Email
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="e.g. 208 or 208@mvvs.in"
                        value={rollOrEmail}
                        onChange={(e) => setRollOrEmail(e.target.value)}
                        className="pl-9 h-11 bg-white border-slate-300 text-slate-900 text-base sm:text-sm placeholder:text-slate-400 focus:border-amber-500"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Login domain: <code className="text-amber-700 font-mono font-semibold">@mvvs.in</code>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Password (Date of Birth)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="password"
                        placeholder="YYYY-MM-DD (e.g. 2015-01-01)"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="pl-9 h-11 bg-white border-slate-300 text-slate-900 text-base sm:text-sm placeholder:text-slate-400 focus:border-amber-500"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Default password is your Date of Birth on record.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 transition-all py-5 shadow-md shadow-amber-500/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In to Student Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Admin Login Tab */}
              <TabsContent value="admin" className="space-y-4 pt-4">
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Admin Email / ID
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value="admin@mvvs.in"
                        readOnly
                        className="pl-9 bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Admin Passcode
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="pl-9 h-11 bg-white border-slate-300 text-slate-900 text-base sm:text-sm placeholder:text-slate-400 focus:border-amber-500"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 transition-all py-5 shadow-md shadow-amber-500/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying Admin...
                      </>
                    ) : (
                      <>
                        Access Admin Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="bg-slate-50 border-t border-slate-100 py-3 px-6 text-center text-xs text-slate-500 justify-center">
            Maa Veena Vadini Upper Primary School Security System
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} Maa Veena Vadini School. All rights reserved.
      </footer>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fa] text-slate-600 flex items-center justify-center">Loading...</div>}>
      <AuthContent {...props} />
    </Suspense>
  );
}
