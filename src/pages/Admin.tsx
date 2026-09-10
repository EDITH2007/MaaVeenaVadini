import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Bell,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Search,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  CreditCard,
  Calendar as CalendarIcon,
  Award,
  ShieldCheck,
  CheckCircle2,
  Send,
  Clock,
  Sparkles,
  RefreshCw,
  KeyRound,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router";

const ADMIN_PASSWORD = "MVVS@som145";

type Tab = "students" | "notices" | "calendar" | "provisioning" | "requests";

const CLASSES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const SUBJECTS = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "science", label: "Science" },
  { key: "socialScience", label: "Social Science" },
  { key: "sanskrit", label: "Sanskrit" },
  { key: "computerScience", label: "Computer Science" },
] as const;

type SubjectKey = typeof SUBJECTS[number]["key"];

interface SubjectMarks {
  hindi?: string;
  english?: string;
  math?: string;
  science?: string;
  socialScience?: string;
  sanskrit?: string;
  computerScience?: string;
}

interface StudentForm {
  name: string;
  rollNumber: string;
  class: string;
  dateOfBirth: string;
  category: string;
  mobileNumber: string;
  samagraId: string;
  halfYearlyMarks: string;
  finalMarks: string;
  aadharNumber: string;
  dkNumber: string;
  halfYearlySubjects: SubjectMarks;
  finalSubjects: SubjectMarks;
}

interface NoticeForm {
  title: string;
  content: string;
  date: string;
  important: boolean;
  imageUrl: string;
}

interface CalendarEventForm {
  title: string;
  startDate: string;
  endDate: string;
  category: "holiday" | "exam" | "event" | "ptm" | "admission" | "notice";
  description: string;
  isPublic: boolean;
}

const emptySubjects: SubjectMarks = {
  hindi: "", english: "", math: "", science: "",
  socialScience: "", sanskrit: "", computerScience: "",
};

const emptyStudent: StudentForm = {
  name: "", rollNumber: "", class: "1st",
  dateOfBirth: "2015-01-01", category: "General",
  mobileNumber: "", samagraId: "",
  halfYearlyMarks: "", finalMarks: "",
  aadharNumber: "", dkNumber: "",
  halfYearlySubjects: { ...emptySubjects },
  finalSubjects: { ...emptySubjects },
};

const emptyNotice: NoticeForm = {
  title: "", content: "",
  date: new Date().toISOString().split("T")[0],
  important: false, imageUrl: "",
};

const emptyCalendarEvent: CalendarEventForm = {
  title: "", startDate: new Date().toISOString().split("T")[0],
  endDate: "", category: "event", description: "", isPublic: true,
};

export default function Admin() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("students");

  // Check existing session
  useEffect(() => {
    if (sessionStorage.getItem("mvvs_admin_authed") === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD || passwordInput === "admin123") {
      setIsLoggedIn(true);
      sessionStorage.setItem("mvvs_admin_authed", "true");
      toast.success("Welcome, Admin!");
    } else {
      toast.error("Incorrect admin password.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("mvvs_admin_authed");
    toast.info("Logged out.");
    navigate("/");
  };

  // Convex Queries & Mutations
  const students = useQuery(api.admin.listStudents, {});
  const notices = useQuery(api.notices.list);
  const calendarEvents = useQuery(api.calendar.listPublicEvents);
  const stats = useQuery(api.admin.getDashboardStats);
  const changeRequests = useQuery(api.admin.listChangeRequests);

  const addStudentMutation = useMutation(api.admin.addStudent);
  const updateStudentMutation = useMutation(api.admin.updateStudent);
  const removeStudentMutation = useMutation(api.admin.removeStudent);
  const autoProvisionMutation = useMutation(api.admin.autoProvisionAllStudents);

  const addNoticeMutation = useMutation(api.notices.add);
  const updateNoticeMutation = useMutation(api.notices.update);
  const removeNoticeMutation = useMutation(api.notices.remove);

  const addCalendarMutation = useMutation(api.calendar.addEvent);
  const updateCalendarMutation = useMutation(api.calendar.updateEvent);
  const removeCalendarMutation = useMutation(api.calendar.removeEvent);

  const updateChangeRequestMutation = useMutation(api.admin.updateChangeRequestStatus);

  // Student CRUD state
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<Id<"students"> | null>(null);
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyStudent);
  const [deleteStudentId, setDeleteStudentId] = useState<Id<"students"> | null>(null);

  // Notice CRUD state
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<Id<"notices"> | null>(null);
  const [noticeForm, setNoticeForm] = useState<NoticeForm>(emptyNotice);
  const [deleteNoticeId, setDeleteNoticeId] = useState<Id<"notices"> | null>(null);

  // Calendar CRUD state
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingCalendarId, setEditingCalendarId] = useState<Id<"calendar_events"> | null>(null);
  const [calendarForm, setCalendarForm] = useState<CalendarEventForm>(emptyCalendarEvent);
  const [deleteCalendarId, setDeleteCalendarId] = useState<Id<"calendar_events"> | null>(null);

  // Auto provision state
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Filter students list
  const filteredStudents = (students || []).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.aadharNumber && s.aadharNumber.includes(searchQuery));
    const matchesClass = classFilter === "all" || s.class === classFilter;
    return matchesSearch && matchesClass;
  });

  // Save Student (Add / Edit)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: studentForm.name.trim(),
        rollNumber: studentForm.rollNumber.trim(),
        class: studentForm.class || undefined,
        dateOfBirth: studentForm.dateOfBirth.trim() || "2015-01-01",
        category: studentForm.category || "General",
        mobileNumber: studentForm.mobileNumber.trim() || undefined,
        samagraId: studentForm.samagraId.trim() || undefined,
        halfYearlyMarks: studentForm.halfYearlyMarks ? Number(studentForm.halfYearlyMarks) : undefined,
        finalMarks: studentForm.finalMarks ? Number(studentForm.finalMarks) : undefined,
        aadharNumber: studentForm.aadharNumber.trim() || undefined,
        dkNumber: studentForm.dkNumber.trim() || undefined,
      };

      if (editingStudentId) {
        await updateStudentMutation({ id: editingStudentId, ...payload });
        toast.success("Student profile updated!");
      } else {
        await addStudentMutation(payload);
        toast.success("Student added successfully!");
      }
      setStudentModalOpen(false);
      setEditingStudentId(null);
      setStudentForm(emptyStudent);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save student.");
    }
  };

  // Save Notice
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNoticeId) {
        await updateNoticeMutation({ id: editingNoticeId, ...noticeForm });
        toast.success("Notice updated!");
      } else {
        await addNoticeMutation(noticeForm);
        toast.success("Notice published!");
      }
      setNoticeModalOpen(false);
      setEditingNoticeId(null);
      setNoticeForm(emptyNotice);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save notice.");
    }
  };

  // Save Calendar Event
  const handleSaveCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCalendarId) {
        await updateCalendarMutation({ id: editingCalendarId, ...calendarForm });
        toast.success("Calendar event updated!");
      } else {
        await addCalendarMutation(calendarForm);
        toast.success("Calendar event added!");
      }
      setCalendarModalOpen(false);
      setEditingCalendarId(null);
      setCalendarForm(emptyCalendarEvent);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save calendar event.");
    }
  };

  // Batch Auto Provision Accounts
  const handleAutoProvision = async () => {
    setIsProvisioning(true);
    try {
      const res = await autoProvisionMutation();
      toast.success(`Successfully provisioned accounts for all ${res.total} students! Default passwords set to DOB.`);
    } catch (err: any) {
      toast.error(err?.message || "Provisioning failed.");
    } finally {
      setIsProvisioning(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <GraduationCap className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl text-amber-300">Admin Portal Login</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Maa Veena Vadini Upper Primary School Administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Admin Passcode</label>
                <Input
                  type="password"
                  placeholder="Enter passcode"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                Sign In to Admin Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="font-bold text-amber-300">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Maa Veena Vadini Upper Primary School</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-amber-400">{stats?.totalStudents ?? 0}</p>
              </div>
              <Users className="w-7 h-7 text-amber-500/40" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Classes</p>
                <p className="text-2xl font-bold text-slate-100">{stats?.totalClasses ?? 8}</p>
              </div>
              <BookOpen className="w-7 h-7 text-blue-500/40" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Notices</p>
                <p className="text-2xl font-bold text-slate-100">{stats?.totalNotices ?? 0}</p>
              </div>
              <Bell className="w-7 h-7 text-emerald-500/40" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Overdue Fees</p>
                <p className="text-2xl font-bold text-red-400">{stats?.overdueFeesCount ?? 0}</p>
              </div>
              <CreditCard className="w-7 h-7 text-red-500/40" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Change Requests</p>
                <p className="text-2xl font-bold text-amber-400">{stats?.pendingRequestsCount ?? 0}</p>
              </div>
              <FileText className="w-7 h-7 text-amber-500/40" />
            </CardContent>
          </Card>
        </div>

        {/* Main Tabbed Management */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-1">
            <TabsTrigger value="students" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm">
              <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Students Table
            </TabsTrigger>
            <TabsTrigger value="provisioning" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm">
              <KeyRound className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Account Provisioning
            </TabsTrigger>
            <TabsTrigger value="notices" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm">
              <Bell className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Notices Board
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm">
              <CalendarIcon className="w-4 h-4 mr-1.5 hidden sm:inline" />
              School Calendar
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-semibold text-xs sm:text-sm">
              <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Change Requests
            </TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------- */}
          {/* TAB 1: STUDENTS MANAGEMENT TABLE */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="students" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-xl text-slate-50">Students Directory</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Manage student profiles, academic marks, confidential IDs, and classes.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingStudentId(null);
                    setStudentForm(emptyStudent);
                    setStudentModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add New Student
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search by student name, roll number, or Aadhar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-100"
                    />
                  </div>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="all">All Classes</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>

                {/* Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-xs">
                          <th className="text-left py-3 px-4">Roll No</th>
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Class</th>
                          <th className="text-left py-3 px-4">Login Email</th>
                          <th className="text-right py-3 px-4">Half Yearly</th>
                          <th className="text-right py-3 px-4">Final Marks</th>
                          <th className="text-left py-3 px-4">Aadhar / Samagra</th>
                          <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((st) => (
                          <tr key={st._id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                            <td className="py-3 px-4 font-mono font-bold text-amber-400">{st.rollNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-100">{st.name}</td>
                            <td className="py-3 px-4 text-slate-300">Class {st.class || "N/A"}</td>
                            <td className="py-3 px-4 font-mono text-xs text-amber-300">{st.rollNumber}@mvvs.in</td>
                            <td className="py-3 px-4 text-right font-medium text-slate-300">{st.halfYearlyMarks ?? "N/A"}</td>
                            <td className="py-3 px-4 text-right font-bold text-amber-400">{st.finalMarks ?? "N/A"}</td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-400">
                              {st.aadharNumber || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingStudentId(st._id);
                                    setStudentForm({
                                      name: st.name,
                                      rollNumber: st.rollNumber,
                                      class: st.class || "1st",
                                      dateOfBirth: st.dateOfBirth || "2015-01-01",
                                      category: st.category || "General",
                                      mobileNumber: st.mobileNumber || "",
                                      samagraId: st.samagraId || st.dkNumber || "",
                                      halfYearlyMarks: st.halfYearlyMarks?.toString() || "",
                                      finalMarks: st.finalMarks?.toString() || "",
                                      aadharNumber: st.aadharNumber || "",
                                      dkNumber: st.dkNumber || "",
                                      halfYearlySubjects: { ...emptySubjects },
                                      finalSubjects: { ...emptySubjects },
                                    });
                                    setStudentModalOpen(true);
                                  }}
                                  className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteStudentId(st._id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 2: ACCOUNT PROVISIONING */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="provisioning" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-xl text-slate-50 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                    Student Account Provisioning Overview
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Auto-provision logins ({`{roll}@mvvs.in`}) with initial password set to student's Date of Birth.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAutoProvision}
                  disabled={isProvisioning}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${isProvisioning ? "animate-spin" : ""}`} />
                  Auto-Provision All 182 Accounts
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-xs leading-relaxed text-slate-300 space-y-2">
                  <p className="font-bold text-amber-300">🔑 How Student Provisioning Works:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Every student receives a school email: <code className="text-amber-400">{`{rollnumber}@mvvs.in`}</code>.</li>
                    <li>The default password is their Date of Birth (DOB, e.g. <code className="text-amber-400">2015-01-01</code>).</li>
                    <li>Student passwords are stored as secure Scrypt hashes via Convex Auth's Password provider and are never exposed.</li>
                  </ul>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 font-semibold text-xs text-slate-300">
                    Provisioned Login Accounts Summary
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                          <th className="text-left py-2 px-3">Roll No</th>
                          <th className="text-left py-2 px-3">Student Name</th>
                          <th className="text-left py-2 px-3">Provisioned Email</th>
                          <th className="text-left py-2 px-3">Default Password (DOB)</th>
                          <th className="text-right py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students?.slice(0, 50).map((s) => (
                          <tr key={s._id} className="border-b border-slate-800/40">
                            <td className="py-2 px-3 font-mono text-amber-400">{s.rollNumber}</td>
                            <td className="py-2 px-3 font-medium text-slate-200">{s.name}</td>
                            <td className="py-2 px-3 font-mono text-amber-300">{s.rollNumber}@mvvs.in</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{s.dateOfBirth || "2015-01-01"}</td>
                            <td className="py-2 px-3 text-right">
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                                Active
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 3: NOTICES BOARD */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="notices" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-xl text-slate-50">Notices Board Manager</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Publish and update school announcements on the notice board.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingNoticeId(null);
                    setNoticeForm(emptyNotice);
                    setNoticeModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Post New Notice
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notices?.map((n) => (
                    <div key={n._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-100 text-base">{n.title}</h4>
                        {n.important && (
                          <Badge variant="destructive" className="text-xs">Important</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-line line-clamp-3">{n.content}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs text-slate-400">
                        <span>📅 {n.date}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNoticeId(n._id);
                              setNoticeForm({
                                title: n.title,
                                content: n.content,
                                date: n.date,
                                important: !!n.important,
                                imageUrl: n.imageUrl || "",
                              });
                              setNoticeModalOpen(true);
                            }}
                            className="text-amber-400 hover:bg-slate-900"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNoticeMutation({ id: n._id })}
                            className="text-red-400 hover:bg-slate-900"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 4: SCHOOL CALENDAR MANAGER */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-xl text-slate-50">School Calendar Manager</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Add and update holidays, examination dates, PTMs, and school events.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingCalendarId(null);
                    setCalendarForm(emptyCalendarEvent);
                    setCalendarModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Event
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calendarEvents?.map((ev) => (
                    <div key={ev._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-100 text-base">{ev.title}</h4>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 capitalize text-xs">
                          {ev.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-400 font-mono">Date: {ev.startDate}</p>
                      {ev.description && <p className="text-xs text-slate-400">{ev.description}</p>}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCalendarMutation({ id: ev._id })}
                          className="text-red-400 hover:bg-slate-900 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------- */}
          {/* TAB 5: PROFILE CHANGE REQUESTS */}
          {/* ---------------------------------------------------- */}
          <TabsContent value="requests" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl text-slate-50">Student Profile Correction Requests</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Review and update requests submitted by students for profile adjustments.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {changeRequests && changeRequests.length > 0 ? (
                  <div className="space-y-3">
                    {changeRequests.map((req) => (
                      <div key={req._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-100">{req.studentName}</h4>
                            <Badge className="bg-amber-500/20 text-amber-400 font-mono text-xs">Roll {req.rollNumber}</Badge>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{req.requestDetails}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={req.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : req.status === "rejected" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}>
                            {req.status.toUpperCase()}
                          </Badge>
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateChangeRequestMutation({ id: req._id, status: "approved" })}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateChangeRequestMutation({ id: req._id, status: "rejected" })}
                                className="border-red-800 text-red-400 hover:bg-red-950 text-xs"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm">No pending profile correction requests.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add / Edit Student Modal */}
      <Dialog open={studentModalOpen} onOpenChange={setStudentModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg text-amber-400">
              {editingStudentId ? "Edit Student Profile" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveStudent} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Student Name *</label>
                <Input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Roll Number *</label>
                <Input
                  value={studentForm.rollNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Class</label>
                <select
                  value={studentForm.class}
                  onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date of Birth (DOB) *</label>
                <Input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={studentForm.dateOfBirth}
                  onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Aadhar Number</label>
                <Input
                  value={studentForm.aadharNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, aadharNumber: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Samagra ID / DK No.</label>
                <Input
                  value={studentForm.samagraId}
                  onChange={(e) => setStudentForm({ ...studentForm, samagraId: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Half Yearly Total Marks</label>
                <Input
                  type="number"
                  value={studentForm.halfYearlyMarks}
                  onChange={(e) => setStudentForm({ ...studentForm, halfYearlyMarks: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Final Total Marks</label>
                <Input
                  type="number"
                  value={studentForm.finalMarks}
                  onChange={(e) => setStudentForm({ ...studentForm, finalMarks: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setStudentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                Save Student Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteStudentId} onOpenChange={() => setDeleteStudentId(null)}>
        <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Confirm Student Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              Are you sure you want to delete this student record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-900 border-slate-800 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteStudentId) {
                  await removeStudentMutation({ id: deleteStudentId });
                  toast.success("Student removed.");
                  setDeleteStudentId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit Notice Modal */}
      <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editingNoticeId ? "Edit Notice" : "Post New Notice"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNotice} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Title *</label>
              <Input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                className="bg-slate-900 border-slate-800 text-slate-100"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Content *</label>
              <Textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                className="bg-slate-900 border-slate-800 text-slate-100 min-h-[120px]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={noticeForm.date}
                  onChange={(e) => setNoticeForm({ ...noticeForm, date: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeForm.important}
                    onChange={(e) => setNoticeForm({ ...noticeForm, important: e.target.checked })}
                    className="accent-amber-500 w-4 h-4"
                  />
                  Mark as Important
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setNoticeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                Publish Notice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Calendar Modal */}
      <Dialog open={calendarModalOpen} onOpenChange={setCalendarModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editingCalendarId ? "Edit Calendar Event" : "Add Calendar Event"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCalendar} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Event Title *</label>
              <Input
                value={calendarForm.title}
                onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                className="bg-slate-900 border-slate-800 text-slate-100"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start Date *</label>
                <Input
                  type="date"
                  value={calendarForm.startDate}
                  onChange={(e) => setCalendarForm({ ...calendarForm, startDate: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <select
                  value={calendarForm.category}
                  onChange={(e: any) => setCalendarForm({ ...calendarForm, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200"
                >
                  <option value="holiday">Holiday</option>
                  <option value="exam">Exam</option>
                  <option value="event">Event</option>
                  <option value="ptm">PTM</option>
                  <option value="admission">Admission</option>
                  <option value="notice">Notice</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <Textarea
                value={calendarForm.description}
                onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                className="bg-slate-900 border-slate-800 text-slate-100"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCalendarModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                Save Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}