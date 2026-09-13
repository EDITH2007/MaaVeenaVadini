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

export const PRIMARY_SUBJECTS = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "evs", label: "EVS" },
  { key: "socialScience", label: "Social Science" },
  { key: "computerScience", label: "Computer Science" },
] as const;

export const MIDDLE_SUBJECTS = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "science", label: "Science" },
  { key: "socialScience", label: "Social Science" },
  { key: "sanskrit", label: "Sanskrit" },
] as const;

export function isPrimaryClass(className?: string): boolean {
  if (!className) return true;
  const c = className.toLowerCase().trim();
  return c.startsWith("1") || c.startsWith("2") || c.startsWith("3") || c.startsWith("4");
}

export function getSubjectsForClass(className?: string) {
  return isPrimaryClass(className) ? PRIMARY_SUBJECTS : MIDDLE_SUBJECTS;
}

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
  const [achievementSessionFilter, setAchievementSessionFilter] = useState("all");
  const achievements = useQuery(api.studentDashboard.getMyAchievements, {
    academicYearFilter: achievementSessionFilter !== "all" ? achievementSessionFilter : undefined,
  });
  // Multi-Year Results & Fees Queries
  const academicYearsData = useQuery(api.studentDashboard.getMyAcademicYears);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
  const activeYear = selectedAcademicYear || academicYearsData?.currentYear || "2025-26";
  const yearResults = useQuery(api.studentDashboard.getMyResultsByYear, { academicYear: activeYear });

  const [selectedFeeAcademicYear, setSelectedFeeAcademicYear] = useState<string | null>(null);
  const activeFeeYear = selectedFeeAcademicYear || academicYearsData?.currentYear || "2025-26";
  const fees = useQuery(api.studentDashboard.getMyFees, { academicYear: activeFeeYear });

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
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate("/")}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-xs sm:text-base leading-tight truncate sm:whitespace-normal">
                  Maa Veena Vadini School
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-300 truncate">Student Portal & Result Lookup</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="outlineWhite"
                size="sm"
                onClick={() => navigate("/")}
                className="font-medium text-xs sm:text-sm px-2.5 sm:px-3 min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Home
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 text-xs sm:text-sm px-2.5 sm:px-3 min-h-[36px]"
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate("/")}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-1.5 sm:p-2 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-xs sm:text-base leading-tight truncate sm:whitespace-normal">
                Maa Veena Vadini School
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-300 truncate">Authenticated Student Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outlineWhite"
              size="sm"
              onClick={() => {
                signOut();
                navigate("/");
              }}
              className="font-medium text-xs sm:text-sm px-2.5 sm:px-3 min-h-[36px]"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
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
          <TabsList className="bg-white border border-slate-200 p-1.5 rounded-xl flex overflow-x-auto no-scrollbar gap-1.5 shadow-sm sm:grid sm:grid-cols-6 min-h-[48px] w-full">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 shrink-0 sm:shrink min-h-[40px] whitespace-nowrap">
              <User className="w-4 h-4 shrink-0" /> <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 shrink-0 sm:shrink min-h-[40px] whitespace-nowrap">
              <BookOpen className="w-4 h-4 shrink-0" /> <span>Results</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 shrink-0 sm:shrink min-h-[40px] whitespace-nowrap">
              <CreditCard className="w-4 h-4 shrink-0" /> <span>Fees</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 shrink-0 sm:shrink min-h-[40px] whitespace-nowrap">
              <CalendarIcon className="w-4 h-4 shrink-0" /> <span>Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 shrink-0 sm:shrink min-h-[40px] whitespace-nowrap">
              <Award className="w-4 h-4 shrink-0" /> <span>Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 shrink-0 sm:shrink min-h-[40px] whitespace-nowrap">
              <Clock className="w-4 h-4 shrink-0" /> <span>Calendar</span>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-600" />
                      Academic Examination Results
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Subject-wise breakdown for Half Yearly and Final Examinations across all enrolled academic sessions.
                    </CardDescription>
                  </div>

                  {/* Enrolled Class Tag */}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-amber-800 font-medium">Session Enrolled Class:</span>
                    <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                      Class {yearResults?.class || s?.class || "1st"}
                    </Badge>
                  </div>
                </div>

                {/* Academic Session Selector Pills */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">
                    Academic Session:
                  </span>
                  {(academicYearsData?.years || ["2025-26"]).map((yr) => {
                    const isSelected = activeYear === yr;
                    const isLive = yr === (academicYearsData?.currentYear || "2025-26");
                    return (
                      <button
                        key={yr}
                        onClick={() => setSelectedAcademicYear(yr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#0a2540] text-white shadow-sm ring-2 ring-amber-500/50"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <span>Session {yr}</span>
                        {isLive && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-amber-400 text-slate-950" : "bg-emerald-100 text-emerald-800"}`}>
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-8">
                {(() => {
                  const s = studentProfile;
                  const studentClass = yearResults?.class || s?.class || "1st";
                  const activeSubjects =
                    (yearResults as any)?.applicableSubjects && (yearResults as any).applicableSubjects.length > 0
                      ? (yearResults as any).applicableSubjects
                      : getSubjectsForClass(studentClass);
                  const totalMaxMarks = activeSubjects.length * 100; // 600

                  const hyData = yearResults?.halfYearly ?? {
                    subjects: (s?.subjects?.halfYearly as any) || {},
                    total: s?.halfYearlyMarks,
                    maxTotal: totalMaxMarks,
                    isTotalOnly: !s?.subjects?.halfYearly && s?.halfYearlyMarks !== undefined,
                    grade: s?.halfYearlyMarks !== undefined ? getGrade(Math.round((s.halfYearlyMarks / totalMaxMarks) * 100))?.grade : undefined,
                  };

                  const fnData = yearResults?.final ?? {
                    subjects: (s?.subjects?.final as any) || {},
                    total: s?.finalMarks,
                    maxTotal: totalMaxMarks,
                    isTotalOnly: !s?.subjects?.final && s?.finalMarks !== undefined,
                    grade: s?.finalMarks !== undefined ? getGrade(Math.round((s.finalMarks / totalMaxMarks) * 100))?.grade : undefined,
                  };

                  const hasHy = hyData.total !== undefined || Object.keys(hyData.subjects || {}).length > 0;
                  const hasFn = fnData.total !== undefined || Object.keys(fnData.subjects || {}).length > 0;

                  if (!hasHy && !hasFn) {
                    return (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                        <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <p className="font-semibold text-slate-800">No examination records logged for session {activeYear}.</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Marks will appear here once recorded by the school administration for this session.
                        </p>
                      </div>
                    );
                  }

                  const hyMax = hyData.maxTotal || totalMaxMarks;
                  const fnMax = fnData.maxTotal || totalMaxMarks;

                  return (
                    <>
                      {/* 1. HALF YEARLY EXAMINATION TABLE */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-base text-[#0a2540] flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                              1. Half Yearly Examination Results ({activeYear})
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {isPrimaryClass(studentClass) ? "Primary Level (Class 1–4): 6 Subjects" : "Middle School (Class 5–8): 6 Subjects"}
                            </p>
                          </div>
                          {hyData.total !== undefined && (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
                              Total Marks: {hyData.total} / {hyMax}
                            </Badge>
                          )}
                        </div>

                        {hyData.isTotalOnly && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                            <span>Historical Total-Only Record (Subject-level breakdown not entered for this session)</span>
                            <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-800">
                              Total Only
                            </Badge>
                          </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
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
                              {activeSubjects.map((sub: any) => {
                                const val = hyData.subjects?.[sub.key];
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
                                <td className="p-3 text-right font-mono text-slate-600">{hyMax}</td>
                                <td className="p-3 text-right font-bold text-amber-700 text-base">
                                  {hyData.total !== undefined ? hyData.total : "N/A"}
                                </td>
                                <td className="p-3 text-right">
                                  {hyData.total !== undefined && (
                                    <Badge className={getGrade(Math.round((hyData.total / hyMax) * 100))?.color || ""}>
                                      {getGrade(Math.round((hyData.total / hyMax) * 100))?.grade} Overall
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="sm:hidden space-y-2.5">
                          {activeSubjects.map((sub: any) => {
                            const val = hyData.subjects?.[sub.key];
                            const g = getGrade(val);
                            return (
                              <div key={sub.key} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm text-slate-900">{sub.label}</p>
                                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Max Marks: 100</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="text-right">
                                    <span className="font-bold text-sm text-slate-900 font-mono">{val !== undefined ? val : "—"}</span>
                                    <span className="text-[10px] text-slate-400">/100</span>
                                  </div>
                                  {g ? (
                                    <Badge className={`${g.color} text-xs font-bold`}>{g.grade}</Badge>
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 shadow-xs flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-slate-700 uppercase">Half Yearly Total</p>
                              <p className="text-[11px] text-slate-500 font-mono">Max: {hyMax}</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-base text-amber-700 font-mono">
                                {hyData.total !== undefined ? hyData.total : "N/A"}
                              </span>
                              {hyData.total !== undefined && (
                                <Badge className={`${getGrade(Math.round((hyData.total / hyMax) * 100))?.color || ""} text-xs`}>
                                  {getGrade(Math.round((hyData.total / hyMax) * 100))?.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. FINAL EXAMINATION TABLE */}
                      <div className="space-y-3 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-base text-[#0a2540] flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-emerald-600" />
                              2. Final Examination Results ({activeYear})
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {isPrimaryClass(studentClass) ? "Primary Level (Class 1–4): 6 Subjects" : "Middle School (Class 5–8): 6 Subjects"}
                            </p>
                          </div>
                          {fnData.total !== undefined && (
                            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold">
                              Total Marks: {fnData.total} / {fnMax}
                            </Badge>
                          )}
                        </div>

                        {fnData.isTotalOnly && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                            <span>Historical Total-Only Record (Subject-level breakdown not entered for this session)</span>
                            <Badge variant="outline" className="text-[10px] bg-white border-emerald-300 text-emerald-800">
                              Total Only
                            </Badge>
                          </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
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
                              {activeSubjects.map((sub: any) => {
                                const val = fnData.subjects?.[sub.key];
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
                                <td className="p-3 text-right font-mono text-slate-600">{fnMax}</td>
                                <td className="p-3 text-right font-bold text-emerald-700 text-base">
                                  {fnData.total !== undefined ? fnData.total : "N/A"}
                                </td>
                                <td className="p-3 text-right">
                                  {fnData.total !== undefined && (
                                    <Badge className={getGrade(Math.round((fnData.total / fnMax) * 100))?.color || ""}>
                                      {getGrade(Math.round((fnData.total / fnMax) * 100))?.grade} Overall
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="sm:hidden space-y-2.5">
                          {activeSubjects.map((sub: any) => {
                            const val = fnData.subjects?.[sub.key];
                            const g = getGrade(val);
                            return (
                              <div key={sub.key} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm text-slate-900">{sub.label}</p>
                                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Max Marks: 100</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="text-right">
                                    <span className="font-bold text-sm text-slate-900 font-mono">{val !== undefined ? val : "—"}</span>
                                    <span className="text-[10px] text-slate-400">/100</span>
                                  </div>
                                  {g ? (
                                    <Badge className={`${g.color} text-xs font-bold`}>{g.grade}</Badge>
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 shadow-xs flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-slate-700 uppercase">Final Total</p>
                              <p className="text-[11px] text-slate-500 font-mono">Max: {fnMax}</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-base text-emerald-700 font-mono">
                                {fnData.total !== undefined ? fnData.total : "N/A"}
                              </span>
                              {fnData.total !== undefined && (
                                <Badge className={`${getGrade(Math.round((fnData.total / fnMax) * 100))?.color || ""} text-xs`}>
                                  {getGrade(Math.round((fnData.total / fnMax) * 100))?.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: FEES STATUS */}
          <TabsContent value="fees" className="space-y-6">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                      Fees Structure & Payment Ledger
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Real-time summary of fee installments, payments logged, and due balances.
                    </CardDescription>
                  </div>
                </div>

                {/* Academic Session Selector Pills for Fees */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">
                    Academic Session:
                  </span>
                  {(academicYearsData?.years || ["2025-26"]).map((yr) => {
                    const isSelected = activeFeeYear === yr;
                    const isLive = yr === (academicYearsData?.currentYear || "2025-26");
                    return (
                      <button
                        key={yr}
                        onClick={() => setSelectedFeeAcademicYear(yr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#0a2540] text-white shadow-sm ring-2 ring-amber-500/50"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <span>Session {yr}</span>
                        {isLive && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-amber-400 text-slate-950" : "bg-emerald-100 text-emerald-800"}`}>
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
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
                      <p className="text-sm">No fee records logged for session {activeFeeYear} yet.</p>
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
                    <>
                      {/* Desktop Table */}
                      <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
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

                      {/* Mobile Cards */}
                      <div className="sm:hidden space-y-2">
                        {attendance.map((att: any) => (
                          <div key={att._id} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                            <div>
                              <p className="font-mono font-bold text-xs text-slate-900">{att.date}</p>
                              {att.remarks && <p className="text-[11px] text-slate-500 mt-0.5">{att.remarks}</p>}
                            </div>
                            <Badge
                              className={
                                att.status === "present"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold capitalize text-xs"
                                  : att.status === "absent"
                                  ? "bg-red-100 text-red-800 border-red-300 font-bold capitalize text-xs"
                                  : "bg-amber-100 text-amber-800 border-amber-300 font-bold capitalize text-xs"
                              }
                            >
                              {att.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl text-[#0a2540] flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-600" />
                      Student Achievements & Honors
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Academic, sports, and co-curricular milestones recognized across all enrolled school sessions.
                    </CardDescription>
                  </div>

                  {/* Academic Session Filter (Full History by default) */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-bold text-slate-600">Filter Session:</span>
                    <select
                      value={achievementSessionFilter}
                      onChange={(e) => setAchievementSessionFilter(e.target.value)}
                      className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 font-semibold focus:outline-none"
                    >
                      <option value="all">All Sessions (Full History)</option>
                      {(academicYearsData?.years || ["2025-26"]).map((yr) => (
                        <option key={yr} value={yr}>Session {yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-xs font-bold">
                                  Session {ach.academicYear || "2025-26"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                                  {ach.date}
                                </Badge>
                              </div>
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
                    <p className="text-sm font-semibold text-slate-800">No achievements recorded for the selected filter.</p>
                    {achievementSessionFilter !== "all" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAchievementSessionFilter("all")}
                        className="mt-2 text-xs text-amber-700 hover:text-amber-800"
                      >
                        Reset filter to view All Sessions
                      </Button>
                    )}
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
        <DialogContent className="bg-white border-slate-200 text-slate-900 w-[94vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
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
                className="bg-white border-slate-300 text-slate-900 text-base sm:text-sm"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setChangeModalOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0a2540] text-white hover:bg-[#0f3256] font-bold w-full sm:w-auto"
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
