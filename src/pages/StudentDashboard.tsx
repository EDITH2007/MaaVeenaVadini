import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  GraduationCap,
  Award,
  CreditCard,
  Calendar as CalendarIcon,
  BookOpen,
  Hash,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  LogOut,
  Send,
  Sparkles,
  ChevronRight,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";

const SUBJECTS = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "science", label: "Science" },
  { key: "socialScience", label: "Social Science" },
  { key: "sanskrit", label: "Sanskrit" },
  { key: "computerScience", label: "Computer Science" },
] as const;

function getGrade(marks?: number) {
  if (marks === undefined || marks === null) return null;
  if (marks >= 90) return { grade: "A+", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
  if (marks >= 80) return { grade: "A", color: "bg-green-500/20 text-green-300 border-green-500/30" };
  if (marks >= 70) return { grade: "B+", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
  if (marks >= 60) return { grade: "B", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" };
  if (marks >= 50) return { grade: "C", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  if (marks >= 33) return { grade: "D", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
  return { grade: "F", color: "bg-red-500/20 text-red-300 border-red-500/30" };
}

export default function StudentDashboard() {
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const studentProfile = useQuery(api.studentDashboard.getMyProfile);
  const achievements = useQuery(api.studentDashboard.getMyAchievements);
  const fees = useQuery(api.studentDashboard.getMyFees);
  const attendance = useQuery(api.studentDashboard.getMyAttendance);
  const calendarEvents = useQuery(api.calendar.listPublicEvents);

  const requestProfileChange = useMutation(api.studentDashboard.requestProfileChange);

  const [activeTab, setActiveTab] = useState("profile");
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [requestDetails, setRequestDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unauthenticated fallback query support
  const [searchRoll, setSearchRoll] = useState("");
  const [queriedRoll, setQueriedRoll] = useState("");
  const publicStudent = useQuery(api.students.getByRoll, queriedRoll ? { rollNumber: queriedRoll } : "skip");

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDetails.trim()) return;
    setIsSubmitting(true);
    try {
      await requestProfileChange({ requestDetails: requestDetails.trim() });
      toast.success("Profile correction request submitted to school administration.");
      setRequestDetails("");
      setChangeModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.info("Logged out of Student Dashboard.");
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-400">Loading Student Dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, provide login CTA or public result lookup
  if (!isAuthenticated && !studentProfile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Navy Header */}
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="font-bold text-amber-300">Maa Veena Vadini Upper Primary School</h1>
                <p className="text-xs text-slate-400">Student Portal</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/auth?role=student")}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Sign In to Full Student Portal
            </Button>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Search className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-slate-50">Public Result Lookup</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your Roll Number to view examination results. For full profile, fee status, and attendance, please sign in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setQueriedRoll(searchRoll.trim());
                }}
                className="flex gap-2 max-w-md mx-auto"
              >
                <Input
                  type="text"
                  placeholder="Enter Roll Number (e.g. 208)"
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
                <Button type="submit" className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                  Search
                </Button>
              </form>

              {publicStudent === null && queriedRoll && (
                <p className="text-center text-red-400 text-sm mt-4">
                  No student record found for roll number <strong>{queriedRoll}</strong>.
                </p>
              )}

              {publicStudent && (
                <div className="mt-6 p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-lg text-amber-300">{publicStudent.name}</h3>
                      <p className="text-xs text-slate-400">Class {publicStudent.class || "N/A"} • Roll No: {publicStudent.rollNumber}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                      Public Lookup View
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center">
                      <p className="text-xs text-slate-400">Half Yearly Marks</p>
                      <p className="text-xl font-bold text-amber-400">{publicStudent.halfYearlyMarks ?? "N/A"}</p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center">
                      <p className="text-xs text-slate-400">Final Marks</p>
                      <p className="text-xl font-bold text-amber-400">{publicStudent.finalMarks ?? "N/A"}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center pt-2">
                    🔒 Confidential identity fields (Aadhar, Samagra ID, Mobile) are hidden in public lookup. Please sign in to view complete dashboard.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Logged-in Student View
  const s = studentProfile;

  // Calculate fee stats
  const totalFeeAmount = fees?.reduce((acc: number, f: any) => acc + (f.amount || 0), 0) || 0;
  const totalPaidAmount = fees?.reduce((acc: number, f: any) => acc + (f.paidAmount || 0), 0) || 0;
  const totalDueAmount = Math.max(0, totalFeeAmount - totalPaidAmount);

  // Calculate attendance stats
  const totalAttendanceDays = attendance?.length || 0;
  const presentDays = attendance?.filter((a: any) => a.status === "present").length || 0;
  const absentDays = attendance?.filter((a: any) => a.status === "absent").length || 0;
  const leaveDays = attendance?.filter((a: any) => a.status === "leave").length || 0;
  const attendancePercentage = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center p-2 shadow-md shadow-amber-500/10">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="font-bold text-amber-300 text-base leading-tight">
                Maa Veena Vadini Upper Primary School
              </h1>
              <p className="text-xs text-slate-400">Authenticated Student Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Student Profile Card Header */}
        <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-amber-500/30 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-3xl shadow-xl shadow-amber-500/10">
                  {s?.name?.charAt(0).toUpperCase() || "S"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-slate-50">{s?.name || "Student"}</h2>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                      Class {s?.class || "N/A"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-3">
                    <span>Roll No: <strong className="text-slate-200">{s?.rollNumber}</strong></span>
                    <span>•</span>
                    <span>School ID: <strong className="text-amber-400">{s?.rollNumber}@mvvs.in</strong></span>
                  </p>
                </div>
              </div>

              {/* Quick Stat Pill Highlights */}
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400 font-medium uppercase">Attendance</p>
                  <p className="text-lg font-bold text-emerald-400">{attendancePercentage}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400 font-medium uppercase">Fees Status</p>
                  <p className={`text-lg font-bold ${totalDueAmount === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    {totalDueAmount === 0 ? "Paid" : `₹${totalDueAmount}`}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400 font-medium uppercase">Final Score</p>
                  <p className="text-lg font-bold text-amber-400">{s?.finalMarks ?? s?.halfYearlyMarks ?? "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Sections Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl grid grid-cols-3 sm:grid-cols-6 gap-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm py-2.5 transition-all"
            >
              <User className="w-4 h-4 mr-1.5 hidden sm:inline" />
              My Profile
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm py-2.5 transition-all"
            >
              <BookOpen className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Results
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm py-2.5 transition-all"
            >
              <CreditCard className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Fees Status
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm py-2.5 transition-all"
            >
              <CalendarIcon className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm py-2.5 transition-all"
            >
              <Award className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm py-2.5 transition-all"
            >
              <Clock className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Calendar
            </TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------- */}
          {/* TAB 1: MY PROFILE */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-xl text-slate-50 flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-400" />
                    Official Student Profile
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs mt-1">
                    Your official school record. Confidential fields are fully visible in your personal account.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setChangeModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Request Profile Correction
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Full Name</p>
                    <p className="font-bold text-slate-100 text-base">{s?.name || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Roll Number</p>
                    <p className="font-bold text-slate-100 text-base">{s?.rollNumber || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Class</p>
                    <p className="font-bold text-slate-100 text-base">Class {s?.class || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Date of Birth</p>
                    <p className="font-bold text-slate-100 text-base">{s?.dateOfBirth || "2015-01-01"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Category</p>
                    <p className="font-bold text-slate-100 text-base">{s?.category || "General"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Mobile Number</p>
                    <p className="font-bold text-slate-100 text-base">{s?.mobileNumber || "Not Provided"}</p>
                  </div>

                  {/* Fully Exposed Confidential Fields */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        Aadhar Number (Fully Exposed)
                      </p>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                        Verified
                      </Badge>
                    </div>
                    <p className="font-mono font-bold text-slate-100 text-lg tracking-wider">
                      {s?.aadharNumber || "Not Provided"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        Samagra ID (Fully Exposed)
                      </p>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                        Verified
                      </Badge>
                    </div>
                    <p className="font-mono font-bold text-slate-100 text-lg tracking-wider">
                      {s?.samagraId || s?.dkNumber || "Not Provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 2: RESULTS */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="results" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl text-slate-50 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  Academic Examination Results
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Detailed subject-wise breakdown for Half Yearly and Final Examinations.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Examination Totals Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400">Half Yearly Exam Total</p>
                      <p className="text-2xl font-bold text-amber-400">{s?.halfYearlyMarks ?? "N/A"}</p>
                    </div>
                    {s?.halfYearlyMarks && (
                      <Badge className={getGrade(s.halfYearlyMarks)?.color || ""}>
                        Grade {getGrade(s.halfYearlyMarks)?.grade}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400">Final Exam Total</p>
                      <p className="text-2xl font-bold text-amber-400">{s?.finalMarks ?? "N/A"}</p>
                    </div>
                    {s?.finalMarks && (
                      <Badge className={getGrade(s.finalMarks)?.color || ""}>
                        Grade {getGrade(s.finalMarks)?.grade}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Subject-Wise Marks Breakdown Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <div className="p-4 bg-slate-900/80 border-b border-slate-800 font-semibold text-sm text-slate-200">
                    Subject-wise Score Breakdown
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs">
                          <th className="text-left py-3 px-4">Subject</th>
                          <th className="text-right py-3 px-4">Half Yearly</th>
                          <th className="text-right py-3 px-4">Final Exam</th>
                          <th className="text-right py-3 px-4">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SUBJECTS.map((subj) => {
                          const hy = s?.subjects?.halfYearly?.[subj.key as keyof typeof s.subjects.halfYearly];
                          const fn = s?.subjects?.final?.[subj.key as keyof typeof s.subjects.final];
                          const gradeInfo = getGrade(fn ?? hy);
                          return (
                            <tr key={subj.key} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                              <td className="py-3 px-4 font-medium text-slate-200">{subj.label}</td>
                              <td className="py-3 px-4 text-right text-slate-300">{hy ?? "N/A"}</td>
                              <td className="py-3 px-4 text-right font-bold text-amber-400">{fn ?? "N/A"}</td>
                              <td className="py-3 px-4 text-right">
                                {gradeInfo ? (
                                  <Badge className={`text-xs ${gradeInfo.color}`}>{gradeInfo.grade}</Badge>
                                ) : (
                                  <span className="text-slate-500 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 3: FEES STATUS */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="fees" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl text-slate-50 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  Fees Structure & Payment Status
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Overview of fee installments, payments, and due dates.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Fees Stats Summary Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400">Total Assigned Fee</p>
                    <p className="text-2xl font-bold text-slate-100">₹{totalFeeAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                    <p className="text-xs text-emerald-400">Total Paid</p>
                    <p className="text-2xl font-bold text-emerald-400">₹{totalPaidAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
                    <p className="text-xs text-amber-400">Total Outstanding Due</p>
                    <p className="text-2xl font-bold text-amber-400">₹{totalDueAmount}</p>
                  </div>
                </div>

                {/* Fees Installment List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-200">Installments & Records</h4>
                  {fees && fees.length > 0 ? (
                    <div className="space-y-3">
                      {fees.map((fee: any) => (
                        <div
                          key={fee._id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div>
                            <h5 className="font-bold text-slate-100 text-base">{fee.title}</h5>
                            <p className="text-xs text-slate-400 mt-1">Due Date: {fee.dueDate}</p>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="font-bold text-slate-200">₹{fee.paidAmount} / ₹{fee.amount}</p>
                              <p className="text-[11px] text-slate-400">
                                {fee.amount > fee.paidAmount ? `₹${fee.amount - fee.paidAmount} due` : "Fully Paid"}
                              </p>
                            </div>
                            <Badge
                              className={
                                fee.status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : fee.status === "overdue"
                                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }
                            >
                              {fee.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm">No fee records logged for this session yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 4: ATTENDANCE */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="attendance" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl text-slate-50 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-400" />
                  Attendance Summary & Log
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Track your monthly attendance percentage and daily attendance records.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400">Total Recorded Days</p>
                    <p className="text-2xl font-bold text-slate-100">{totalAttendanceDays}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                    <p className="text-xs text-emerald-400">Present</p>
                    <p className="text-2xl font-bold text-emerald-400">{presentDays}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-red-500/30">
                    <p className="text-xs text-red-400">Absent</p>
                    <p className="text-2xl font-bold text-red-400">{absentDays}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
                    <p className="text-xs text-amber-400">Leave</p>
                    <p className="text-2xl font-bold text-amber-400">{leaveDays}</p>
                  </div>
                </div>

                {/* Progress Gauge */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Overall Attendance Rate</span>
                    <span className="text-amber-400">{attendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${attendancePercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 5: ACHIEVEMENTS */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl text-slate-50 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Student Achievements & Honors
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Academic, sports, and co-curricular milestones recognized by the school.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {achievements && achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((ach: any) => (
                      <div key={ach._id} className="p-5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-base text-amber-300">{ach.title}</h4>
                          <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                            {ach.date}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{ach.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                    <Award className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm">No achievements posted yet for this profile.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 6: SCHOOL CALENDAR */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl text-slate-50 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  School Calendar & Event Timeline
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Upcoming holidays, examination schedules, PTMs, and school events.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {calendarEvents && calendarEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calendarEvents.map((event: any) => (
                      <div key={event._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-100 text-base">{event.title}</h4>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 capitalize text-xs">
                            {event.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-amber-400 font-mono">📅 Date: {event.startDate}</p>
                        {event.description && (
                          <p className="text-xs text-slate-400">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm">No upcoming calendar events scheduled.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Profile Change Request Modal */}
      <Dialog open={changeModalOpen} onOpenChange={setChangeModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-slate-50 flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              Request Profile Data Correction
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Notice a discrepancy in your official profile? Submit a correction request to the admin team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestChange} className="space-y-4 pt-2">
            <Textarea
              placeholder="Specify the fields that require update (e.g. Correct Date of Birth, Mobile number change, Aadhar typo)..."
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              className="bg-slate-900 border-slate-800 text-slate-100 min-h-[100px]"
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setChangeModalOpen(false)}
                className="text-slate-400 hover:bg-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
