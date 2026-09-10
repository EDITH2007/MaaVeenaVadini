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
  Check,
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
  if (marks >= 90) return { grade: "A+", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  if (marks >= 80) return { grade: "A", color: "bg-green-100 text-green-800 border-green-300" };
  if (marks >= 70) return { grade: "B+", color: "bg-blue-100 text-blue-800 border-blue-300" };
  if (marks >= 60) return { grade: "B", color: "bg-sky-100 text-sky-800 border-sky-300" };
  if (marks >= 50) return { grade: "C", color: "bg-amber-100 text-amber-800 border-amber-300" };
  if (marks >= 33) return { grade: "D", color: "bg-orange-100 text-orange-800 border-orange-300" };
  return { grade: "F", color: "bg-red-100 text-red-800 border-red-300" };
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

  // If user is unauthenticated, show public result lookup option or login prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] text-slate-900 flex flex-col font-sans">
        {/* Navbar */}
        <header className="bg-[#0a2540] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base">Maa Veena Vadini Upper Primary School</h1>
                <p className="text-xs text-slate-300">Student Portal & Result Lookup</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Home
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
              >
                Sign In
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-6 flex flex-col justify-center">
          <Card className="bg-white border-slate-200 text-slate-900 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mb-2">
                <Search className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-[#0a2540]">Public Result Lookup</CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Enter your Roll Number to view examination results. For full profile, fee status, and attendance, please sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setQueriedRoll(searchRoll.trim());
                }}
                className="flex gap-2 max-w-md mx-auto"
              >
                <Input
                  type="text"
                  placeholder="Enter Roll Number (e.g. 101)"
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900"
                />
                <Button type="submit" className="bg-[#0a2540] text-white font-bold hover:bg-[#0f3256]">
                  Search
                </Button>
              </form>

              {publicStudent === null && queriedRoll && (
                <p className="text-center text-red-600 text-sm mt-4">
                  No student record found for roll number <strong>{queriedRoll}</strong>.
                </p>
              )}

              {publicStudent && (
                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="font-bold text-lg text-[#0a2540]">{publicStudent.name}</h3>
                      <p className="text-xs text-slate-500">Class {publicStudent.class || "N/A"} • Roll No: {publicStudent.rollNumber}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-50">
                      Public Lookup View
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-sm">
                      <p className="text-xs text-slate-500">Half Yearly Total Marks</p>
                      <p className="text-xl font-bold text-amber-600">{publicStudent.halfYearlyMarks ?? "N/A"}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-sm">
                      <p className="text-xs text-slate-500">Final Total Marks</p>
                      <p className="text-xl font-bold text-amber-600">{publicStudent.finalMarks ?? "N/A"}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center pt-2">
                    🔒 Confidential identity fields (Aadhar, Samagra ID, Mobile) are hidden in public lookup. Please sign in to view your complete dashboard.
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
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900 flex flex-col font-sans">
      {/* Top Banner Header - Navy Bar matching public site */}
      <header className="bg-[#0a2540] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-2">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">
                Maa Veena Vadini Upper Primary School
              </h1>
              <p className="text-xs text-slate-300">Authenticated Student Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                signOut();
                navigate("/");
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Welcome Student Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#0a2540]">Welcome, {s?.name || "Student"}!</h2>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                Active Student
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Class <span className="font-semibold text-slate-800">{s?.class || "N/A"}</span> • Roll Number:{" "}
              <span className="font-mono font-bold text-amber-700">{s?.rollNumber || "N/A"}</span>
            </p>
          </div>

          <Button
            onClick={() => setChangeModalOpen(true)}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm"
          >
            <Send className="w-4 h-4 mr-1.5 text-amber-600" /> Request Profile Correction
          </Button>
        </div>

        {/* Tabbed Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1.5 rounded-xl grid grid-cols-3 sm:grid-cols-6 gap-1 shadow-sm">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <User className="w-4 h-4 mr-1.5 hidden sm:inline" /> Profile
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 mr-1.5 hidden sm:inline" /> Results
            </TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 mr-1.5 hidden sm:inline" /> Fees
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <CalendarIcon className="w-4 h-4 mr-1.5 hidden sm:inline" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <Award className="w-4 h-4 mr-1.5 hidden sm:inline" /> Achievements
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <Clock className="w-4 h-4 mr-1.5 hidden sm:inline" /> Calendar
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROFILE DETAILS */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  Official Student Identity Profile
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Your registered details on school records. Contact admin if updates are needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Personal Details */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-sm text-[#0a2540] border-b border-slate-200 pb-2">
                      Personal Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Full Name</span>
                        <span className="font-bold text-slate-900">{s?.name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Roll Number</span>
                        <span className="font-mono font-bold text-amber-700">{s?.rollNumber || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Class</span>
                        <span className="font-bold text-slate-900">Class {s?.class || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Category</span>
                        <Badge variant="outline" className="text-xs bg-white text-slate-800">
                          {s?.category || "General"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Date of Birth</span>
                        <span className="font-semibold text-slate-900">{s?.dateOfBirth || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Mobile Number</span>
                        <span className="font-semibold text-slate-900">{s?.mobileNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Government & Identity Numbers */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-sm text-[#0a2540] border-b border-slate-200 pb-2">
                      Government Identity Cards
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                        <span className="text-slate-500">Samagra ID</span>
                        <span className="font-mono font-bold text-slate-900">{s?.samagraId || "N/A"}</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                        <span className="text-slate-500">DK Number</span>
                        <span className="font-mono font-bold text-slate-900">{s?.dkNumber || "N/A"}</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                        <span className="text-slate-500">Aadhar Card Number</span>
                        <span className="font-mono font-bold text-slate-900">{s?.aadharNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ACADEMIC EXAMINATION RESULTS */}
          <TabsContent value="results" className="space-y-6">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  Academic Examination Results
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Detailed subject-wise breakdown for Half Yearly and Final Examinations displayed as separate tables.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-8">
                {/* 1. HALF YEARLY EXAMINATION TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#0a2540] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      1. Half Yearly Examination Results
                    </h3>
                    {s?.halfYearlyMarks !== undefined && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">
                        Total Marks: {s.halfYearlyMarks}
                      </Badge>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-3">Subject Name</th>
                          <th className="p-3 text-right">Max Marks</th>
                          <th className="p-3 text-right">Marks Obtained</th>
                          <th className="p-3 text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {SUBJECTS.map((sub) => {
                          const val = s?.subjects?.halfYearly?.[sub.key as keyof typeof s.subjects.halfYearly];
                          const g = getGrade(val);
                          return (
                            <tr key={sub.key} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-slate-800">{sub.label}</td>
                              <td className="p-3 text-right text-slate-500 font-mono">100</td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                {val !== undefined ? val : "—"}
                              </td>
                              <td className="p-3 text-right">
                                {g ? (
                                  <Badge className={g.color}>{g.grade}</Badge>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Total Row */}
                        <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                          <td className="p-3 text-slate-900">Half Yearly Total Score</td>
                          <td className="p-3 text-right font-mono text-slate-600">700</td>
                          <td className="p-3 text-right font-bold text-amber-700 text-base">
                            {s?.halfYearlyMarks !== undefined ? s.halfYearlyMarks : "N/A"}
                          </td>
                          <td className="p-3 text-right">
                            {s?.halfYearlyMarks !== undefined && (
                              <Badge className={getGrade(Math.round(s.halfYearlyMarks / 7))?.color || ""}>
                                {getGrade(Math.round(s.halfYearlyMarks / 7))?.grade} Overall
                              </Badge>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. FINAL EXAMINATION TABLE */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#0a2540] flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      2. Final Examination Results
                    </h3>
                    {s?.finalMarks !== undefined && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                        Total Marks: {s.finalMarks}
                      </Badge>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-3">Subject Name</th>
                          <th className="p-3 text-right">Max Marks</th>
                          <th className="p-3 text-right">Marks Obtained</th>
                          <th className="p-3 text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {SUBJECTS.map((sub) => {
                          const val = s?.subjects?.final?.[sub.key as keyof typeof s.subjects.final];
                          const g = getGrade(val);
                          return (
                            <tr key={sub.key} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-slate-800">{sub.label}</td>
                              <td className="p-3 text-right text-slate-500 font-mono">100</td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                {val !== undefined ? val : "—"}
                              </td>
                              <td className="p-3 text-right">
                                {g ? (
                                  <Badge className={g.color}>{g.grade}</Badge>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Total Row */}
                        <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                          <td className="p-3 text-slate-900">Final Examination Total Score</td>
                          <td className="p-3 text-right font-mono text-slate-600">700</td>
                          <td className="p-3 text-right font-bold text-emerald-700 text-base">
                            {s?.finalMarks !== undefined ? s.finalMarks : "N/A"}
                          </td>
                          <td className="p-3 text-right">
                            {s?.finalMarks !== undefined && (
                              <Badge className={getGrade(Math.round(s.finalMarks / 7))?.color || ""}>
                                {getGrade(Math.round(s.finalMarks / 7))?.grade} Overall
                              </Badge>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: FEES STATUS */}
          <TabsContent value="fees" className="space-y-6">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  Fees Structure & Payment Ledger
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Real-time summary of fee installments, payments logged, and due balances.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Fees Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Total Assigned Fee</p>
                    <p className="text-2xl font-bold text-slate-900">₹{totalFeeAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-sm">
                    <p className="text-xs font-medium text-emerald-700">Total Amount Paid</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{totalPaidAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 shadow-sm">
                    <p className="text-xs font-medium text-amber-800">Outstanding Due</p>
                    <p className="text-2xl font-bold text-amber-800">₹{totalDueAmount}</p>
                  </div>
                </div>

                {/* Fees Installment List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-[#0a2540]">Installment Records</h4>
                  {fees && fees.length > 0 ? (
                    <div className="space-y-3">
                      {fees.map((fee: any) => {
                        const due = Math.max(0, fee.amount - fee.paidAmount);
                        return (
                          <div
                            key={fee._id}
                            className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow transition-shadow"
                          >
                            <div>
                              <h5 className="font-bold text-slate-900 text-base">{fee.title}</h5>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Due Date: <span className="font-semibold text-slate-700">{fee.dueDate}</span>
                                {fee.paymentMode && ` • Paid via ${fee.paymentMode} on ${fee.paymentDate}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-right">
                                <p className="font-bold text-slate-900 text-sm">₹{fee.paidAmount} / ₹{fee.amount}</p>
                                <p className="text-xs font-semibold text-slate-500">
                                  {due > 0 ? <span className="text-red-600">₹{due} due</span> : <span className="text-emerald-600">Fully Cleared</span>}
                                </p>
                              </div>
                              <Badge
                                className={
                                  fee.status === "paid"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                                    : fee.status === "overdue"
                                    ? "bg-red-100 text-red-800 border-red-300 font-bold"
                                    : "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                                }
                              >
                                {fee.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                      <CreditCard className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm">No fee records logged for this session yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ATTENDANCE */}
          <TabsContent value="attendance" className="space-y-6">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-600" />
                  Attendance Summary & Log
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Track your monthly attendance percentage and daily attendance records.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-500">Total Recorded Days</p>
                    <p className="text-2xl font-bold text-slate-900">{totalAttendanceDays}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-xs text-emerald-700">Present</p>
                    <p className="text-2xl font-bold text-emerald-700">{presentDays}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700">Absent</p>
                    <p className="text-2xl font-bold text-red-700">{absentDays}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-800">Leave</p>
                    <p className="text-2xl font-bold text-amber-800">{leaveDays}</p>
                  </div>
                </div>

                {/* Progress Gauge */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Overall Attendance Rate</span>
                    <span className="text-amber-700 font-bold">{attendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-500"
                      style={{ width: `${attendancePercentage}%` }}
                    />
                  </div>
                </div>

                {/* Date-by-Date Daily Attendance Log */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-sm text-[#0a2540]">Daily Attendance Log</h4>
                  {attendance && attendance.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Remarks / Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {attendance.map((att: any) => (
                            <tr key={att._id} className="hover:bg-slate-50/80">
                              <td className="p-3 font-mono font-medium text-slate-900">{att.date}</td>
                              <td className="p-3">
                                <Badge
                                  className={
                                    att.status === "present"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold capitalize"
                                      : att.status === "absent"
                                      ? "bg-red-100 text-red-800 border-red-300 font-bold capitalize"
                                      : "bg-amber-100 text-amber-800 border-amber-300 font-bold capitalize"
                                  }
                                >
                                  {att.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-slate-600">
                                {att.remarks ? att.remarks : <span className="text-slate-400">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                      <CalendarIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm">No daily attendance entries recorded yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: ACHIEVEMENTS */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Student Achievements & Honors
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Academic, sports, and co-curricular milestones recognized by the school.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {achievements && achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((ach: any) => {
                      const img = ach.certificateUrl || ach.imageUrl;
                      return (
                        <div key={ach._id} className="p-5 rounded-xl bg-white border border-amber-200 space-y-3 shadow-sm flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-base text-[#0a2540]">{ach.title}</h4>
                              <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-xs shrink-0">
                                {ach.date}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{ach.description}</p>
                          </div>
                          {img && (
                            <div className="pt-2 border-t border-slate-100">
                              {img.match(/\.(jpeg|jpg|gif|png|webp)/i) || img.startsWith("data:image") ? (
                                <img
                                  src={img}
                                  alt={ach.title}
                                  className="w-full h-36 object-cover rounded-lg border border-slate-200"
                                />
                              ) : (
                                <a
                                  href={img}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-amber-700 font-semibold underline flex items-center gap-1 hover:text-amber-800"
                                >
                                  View Attached Certificate / Document
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                    <Award className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm">No achievements posted yet for this profile.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: SCHOOL CALENDAR */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  School Calendar & Event Timeline
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Upcoming holidays, examination schedules, PTMs, and school events.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {calendarEvents && calendarEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calendarEvents.map((event: any) => (
                      <div key={event._id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{event.title}</h4>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 capitalize text-xs">
                            {event.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-amber-700 font-mono">📅 Date: {event.startDate}</p>
                        {event.description && (
                          <p className="text-xs text-slate-600">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                    <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
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
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#0a2540] flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-600" />
              Request Profile Data Correction
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Notice a discrepancy in your official profile? Submit a correction request to the admin team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestChange} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Correction Details / Reason *</label>
              <Textarea
                required
                rows={4}
                placeholder="Explain what information needs correction (e.g., Update Date of Birth or spelling of Name)..."
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setChangeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0a2540] text-white hover:bg-[#0f3256] font-bold"
              >
                {isSubmitting ? "Submitting..." : "Submit Correction Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
