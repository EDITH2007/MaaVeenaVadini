import { useState, useEffect, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";
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

    try {
      // First try signing in
      try {
        await signIn("password", {
          email: formattedEmail,
          password: studentPassword.trim(),
          flow: "signIn",
        });
      } catch (signInErr: any) {
        // If account not created yet, attempt registration with official password
        await signIn("password", {
          email: formattedEmail,
          password: studentPassword.trim(),
          flow: "signUp",
        });
      }

      toast.success("Welcome back! Student logged in successfully.");
      navigate("/student");
    } catch (err: any) {
      console.error("Student Auth Error:", err);
      setError(
        err?.message || "Invalid Roll Number or Password (DOB). Please check your details or contact admin."
      );
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
      // Support existing admin passcode
      if (adminPassword === "MVVS@som145" || adminPassword === "admin123") {
        sessionStorage.setItem("mvvs_admin_authed", "true");
        // Also sign in via convex auth password if account exists
        try {
          await signIn("password", {
            email: "admin@mvvs.in",
            password: adminPassword,
            flow: "signIn",
          });
        } catch {
          // Allow session fallback for existing admin password
        }
        toast.success("Admin login successful.");
        navigate("/admin");
      } else {
        // Try standard admin credentials
        await signIn("password", {
          email: "admin@mvvs.in",
          password: adminPassword,
          flow: "signIn",
        });
        sessionStorage.setItem("mvvs_admin_authed", "true");
        toast.success("Admin login successful.");
        navigate("/admin");
      }
    } catch (err: any) {
      console.error("Admin Auth Error:", err);
      setError("Invalid Admin Password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0a2540_0%,#020617_100%)] z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center p-2 shadow-lg shadow-amber-500/10">
            <GraduationCap className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-amber-300">
              Maa Veena Vadini
            </h1>
            <p className="text-xs text-slate-400">Upper Primary School • Est. 2011</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Back to Home
        </Button>
      </header>

      {/* Auth Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-950/80 border-slate-800 backdrop-blur-xl shadow-2xl text-slate-100 overflow-hidden">
          <CardHeader className="text-center pb-4 pt-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400 shadow-inner">
              {activeTab === "student" ? (
                <GraduationCap className="w-7 h-7" />
              ) : (
                <Shield className="w-7 h-7" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-slate-50">
              {activeTab === "student" ? "Student Portal Login" : "Admin Dashboard Access"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm mt-1">
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
              <TabsList className="grid grid-cols-2 bg-slate-900 p-1 border border-slate-800 rounded-lg">
                <TabsTrigger
                  value="student"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-medium text-sm transition-all"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Student
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-medium text-sm transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </TabsTrigger>
              </TabsList>

              {/* Student Login Tab */}
              <TabsContent value="student" className="space-y-4 pt-4">
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Roll Number or Email
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type="text"
                        placeholder="e.g. 208 or 208@mvvs.in"
                        value={rollOrEmail}
                        onChange={(e) => setRollOrEmail(e.target.value)}
                        className="pl-9 bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Login domain: <code className="text-amber-400 font-mono">@mvvs.in</code>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Password (Date of Birth)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type="password"
                        placeholder="YYYY-MM-DD (e.g. 2015-01-01)"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="pl-9 bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Default password is your Date of Birth on record.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs leading-relaxed">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 transition-all py-5 shadow-lg shadow-amber-500/20"
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
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Admin Email / ID
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type="text"
                        value="admin@mvvs.in"
                        readOnly
                        className="pl-9 bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Admin Passcode
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="pl-9 bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs leading-relaxed">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 transition-all py-5 shadow-lg shadow-amber-500/20"
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

          <CardFooter className="bg-slate-900/60 border-t border-slate-800/80 py-3 px-6 text-center text-xs text-slate-400 justify-center">
            Maa Veena Vadini Upper Primary School Security System
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        © {new Date().getFullYear()} Maa Veena Vadini School. All rights reserved.
      </footer>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center">Loading...</div>}>
      <AuthContent {...props} />
    </Suspense>
  );
}
