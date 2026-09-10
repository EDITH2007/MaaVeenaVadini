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
  DialogDescription,
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
  DollarSign,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router";

const ADMIN_PASSWORD = "MVVS@som145";

type Tab = "students" | "fees" | "attendance" | "achievements" | "provisioning" | "notices" | "calendar" | "requests";

const CLASSES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const CATEGORIES = ["General", "OBC", "SC", "ST"];

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

  // Fees queries & mutations
  const [feeClassFilter, setFeeClassFilter] = useState("all");
  const allFees = useQuery(api.admin.listAllFees, { classFilter: feeClassFilter });
  const assignFeeMutation = useMutation(api.admin.assignFeeStructure);
  const recordFeePaymentMutation = useMutation(api.admin.recordFeePayment);
  const removeFeeMutation = useMutation(api.admin.removeFee);

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

  // Fees modal state
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({
    target: "all" as "all" | "class" | "student",
    targetClass: "1st",
    studentId: "",
    title: "Tuition Fee - Term 1",
    amount: "1200",
    dueDate: new Date().toISOString().split("T")[0],
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    remarks: "",
  });

  const [deleteFeeId, setDeleteFeeId] = useState<Id<"fees"> | null>(null);

  // Attendance State & Hooks
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceClass, setAttendanceClass] = useState("1st");
  const attendanceForDate = useQuery(api.admin.getAttendanceForDate, { date: attendanceDate });
  const saveClassAttendanceMutation = useMutation(api.admin.saveClassAttendance);

  const [attendanceStatusMap, setAttendanceStatusMap] = useState<Record<string, { status: "present" | "absent" | "leave"; remarks: string }>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  const classStudents = (students || []).filter((s) => s.class === attendanceClass);

  useEffect(() => {
    if (!students) return;
    const existingMap = new Map((attendanceForDate || []).map((a: any) => [a.studentId, a]));
    const nextMap: Record<string, { status: "present" | "absent" | "leave"; remarks: string }> = {};
    classStudents.forEach((s) => {
      const rec = existingMap.get(s._id);
      nextMap[s._id] = {
        status: rec ? rec.status : "present",
        remarks: rec?.remarks || "",
      };
    });
    setAttendanceStatusMap(nextMap);
  }, [attendanceDate, attendanceClass, attendanceForDate, students]);

  const handleSaveClassAttendance = async () => {
    if (classStudents.length === 0) {
      toast.info("No students in selected class to record attendance for.");
      return;
    }
    setIsSavingAttendance(true);
    try {
      const records = classStudents.map((s) => ({
        studentId: s._id,
        status: attendanceStatusMap[s._id]?.status || "present",
        remarks: attendanceStatusMap[s._id]?.remarks || undefined,
      }));
      await saveClassAttendanceMutation({
        date: attendanceDate,
        records,
      });
      toast.success(`Attendance saved for Class ${attendanceClass} (${records.length} students).`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save attendance.");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handleMarkAllPresent = () => {
    const nextMap = { ...attendanceStatusMap };
    classStudents.forEach((s) => {
      nextMap[s._id] = {
        status: "present",
        remarks: nextMap[s._id]?.remarks || "",
      };
    });
    setAttendanceStatusMap(nextMap);
    toast.info(`Marked all ${classStudents.length} students as Present in Class ${attendanceClass}.`);
  };

  // Achievements State & Hooks
  const [achievementClassFilter, setAchievementClassFilter] = useState("all");
  const allAchievements = useQuery(api.admin.listAllAchievements, { classFilter: achievementClassFilter });
  const addAchievementMutation = useMutation(api.admin.addAchievement);
  const updateAchievementMutation = useMutation(api.admin.updateAchievement);
  const removeAchievementMutation = useMutation(api.admin.removeAchievement);

  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [editingAchievementId, setEditingAchievementId] = useState<Id<"achievements"> | null>(null);
  const [achievementForm, setAchievementForm] = useState({
    studentId: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    certificateUrl: "",
  });
  const [deleteAchievementId, setDeleteAchievementId] = useState<Id<"achievements"> | null>(null);

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementForm.studentId || !achievementForm.title.trim() || !achievementForm.description.trim()) {
      toast.error("Please fill in all required fields (Student, Title, Description).");
      return;
    }
    try {
      if (editingAchievementId) {
        await updateAchievementMutation({
          id: editingAchievementId,
          studentId: achievementForm.studentId as Id<"students">,
          title: achievementForm.title.trim(),
          description: achievementForm.description.trim(),
          date: achievementForm.date,
          certificateUrl: achievementForm.certificateUrl.trim() || undefined,
          imageUrl: achievementForm.certificateUrl.trim() || undefined,
        });
        toast.success("Achievement updated successfully.");
      } else {
        await addAchievementMutation({
          studentId: achievementForm.studentId as Id<"students">,
          title: achievementForm.title.trim(),
          description: achievementForm.description.trim(),
          date: achievementForm.date,
          certificateUrl: achievementForm.certificateUrl.trim() || undefined,
          imageUrl: achievementForm.certificateUrl.trim() || undefined,
        });
        toast.success("Achievement recorded successfully.");
      }
      setAchievementModalOpen(false);
      setEditingAchievementId(null);
      setAchievementForm({
        studentId: "",
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        certificateUrl: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save achievement.");
    }
  };

  const handleDeleteAchievement = async () => {
    if (!deleteAchievementId) return;
    try {
      await removeAchievementMutation({ id: deleteAchievementId });
      toast.success("Achievement removed.");
      setDeleteAchievementId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete achievement.");
    }
  };

  // Auto provision state
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Filter students list
  const filteredStudents = (students || []).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.mobileNumber && s.mobileNumber.includes(searchQuery)) ||
      (s.samagraId && s.samagraId.includes(searchQuery)) ||
      (s.dkNumber && s.dkNumber.includes(searchQuery)) ||
      (s.aadharNumber && s.aadharNumber.includes(searchQuery));
    const matchesClass = classFilter === "all" || s.class === classFilter;
    return matchesSearch && matchesClass;
  });

  // Open edit student
  const handleOpenEditStudent = (s: any) => {
    setEditingStudentId(s._id);

    const hySub: SubjectMarks = { ...emptySubjects };
    const fnSub: SubjectMarks = { ...emptySubjects };

    if (s.subjects?.halfYearly) {
      SUBJECTS.forEach((sub) => {
        const val = s.subjects.halfYearly[sub.key];
        if (val !== undefined) hySub[sub.key] = String(val);
      });
    }

    if (s.subjects?.final) {
      SUBJECTS.forEach((sub) => {
        const val = s.subjects.final[sub.key];
        if (val !== undefined) fnSub[sub.key] = String(val);
      });
    }

    setStudentForm({
      name: s.name || "",
      rollNumber: s.rollNumber || "",
      class: s.class || "1st",
      dateOfBirth: s.dateOfBirth || "2015-01-01",
      category: s.category || "General",
      mobileNumber: s.mobileNumber || "",
      samagraId: s.samagraId || "",
      halfYearlyMarks: s.halfYearlyMarks !== undefined ? String(s.halfYearlyMarks) : "",
      finalMarks: s.finalMarks !== undefined ? String(s.finalMarks) : "",
      aadharNumber: s.aadharNumber || "",
      dkNumber: s.dkNumber || "",
      halfYearlySubjects: hySub,
      finalSubjects: fnSub,
    });
    setStudentModalOpen(true);
  };

  // Save Student (Add / Edit)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parseSubjectObject = (subObj: SubjectMarks) => {
        const res: Record<string, number> = {};
        for (const [k, v] of Object.entries(subObj)) {
          if (v !== "" && v !== undefined && !isNaN(Number(v))) {
            res[k] = Number(v);
          }
        }
        return Object.keys(res).length > 0 ? res : undefined;
      };

      const hySub = parseSubjectObject(studentForm.halfYearlySubjects);
      const fnSub = parseSubjectObject(studentForm.finalSubjects);

      const hySum = hySub ? Object.values(hySub).reduce((a, b) => a + b, 0) : undefined;
      const fnSum = fnSub ? Object.values(fnSub).reduce((a, b) => a + b, 0) : undefined;

      const hyFinalMarks = hySum !== undefined ? hySum : (studentForm.halfYearlyMarks ? Number(studentForm.halfYearlyMarks) : undefined);
      const fnFinalMarks = fnSum !== undefined ? fnSum : (studentForm.finalMarks ? Number(studentForm.finalMarks) : undefined);

      const subjectsData = (hySub || fnSub) ? { halfYearly: hySub, final: fnSub } : undefined;

      const payload = {
        name: studentForm.name.trim(),
        rollNumber: studentForm.rollNumber.trim(),
        class: studentForm.class || undefined,
        dateOfBirth: studentForm.dateOfBirth.trim() || "2015-01-01",
        category: studentForm.category || "General",
        mobileNumber: studentForm.mobileNumber.trim() || undefined,
        samagraId: studentForm.samagraId.trim() || undefined,
        halfYearlyMarks: hyFinalMarks,
        finalMarks: fnFinalMarks,
        aadharNumber: studentForm.aadharNumber.trim() || undefined,
        dkNumber: studentForm.dkNumber.trim() || undefined,
        subjects: subjectsData,
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

  // Assign Fee Installment
  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await assignFeeMutation({
        target: feeForm.target,
        targetClass: feeForm.target === "class" ? feeForm.targetClass : undefined,
        studentId: feeForm.target === "student" && feeForm.studentId ? (feeForm.studentId as Id<"students">) : undefined,
        title: feeForm.title.trim(),
        amount: Number(feeForm.amount),
        dueDate: feeForm.dueDate,
      });
      toast.success(`Fee structure assigned to ${res.count} student(s)!`);
      setFeeModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign fee.");
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeForPayment) return;
    try {
      await recordFeePaymentMutation({
        id: selectedFeeForPayment._id,
        paidAmount: Number(paymentForm.paidAmount),
        paymentDate: paymentForm.paymentDate,
        paymentMode: paymentForm.paymentMode,
        remarks: paymentForm.remarks.trim() || undefined,
      });
      toast.success("Fee payment recorded successfully!");
      setPaymentModalOpen(false);
      setSelectedFeeForPayment(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment.");
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
      <div className="min-h-screen bg-[#f5f7fa] text-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-slate-200 text-slate-900 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mb-2">
              <GraduationCap className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl text-[#0a2540] font-bold">Admin Portal Login</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Maa Veena Vadini Upper Primary School Administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Admin Passcode</label>
                <Input
                  type="password"
                  placeholder="Enter passcode"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 focus-visible:ring-amber-500"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#0a2540] text-white font-bold hover:bg-[#0f3256]">
                Sign In to Admin Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900 flex flex-col font-sans">
      {/* Admin Top Header - Navy Bar matching public site */}
      <header className="bg-[#0a2540] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Admin Dashboard</h1>
              <p className="text-xs text-slate-300">Maa Veena Vadini Upper Primary School</p>
            </div>
          </div>
          <Button
            variant="outlineWhite"
            size="sm"
            onClick={handleLogout}
            className="font-medium"
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
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.totalStudents ?? 0}</p>
              </div>
              <Users className="w-7 h-7 text-amber-500/60" />
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Active Classes</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalClasses ?? 8}</p>
              </div>
              <BookOpen className="w-7 h-7 text-blue-500/60" />
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Assigned Fee</p>
                <p className="text-2xl font-bold text-emerald-600">₹{(stats?.totalAssignedFee || 0).toLocaleString("en-IN")}</p>
              </div>
              <DollarSign className="w-7 h-7 text-emerald-500/60" />
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Overdue Fees</p>
                <p className="text-2xl font-bold text-red-600">{stats?.overdueFeesCount ?? 0}</p>
              </div>
              <CreditCard className="w-7 h-7 text-red-500/60" />
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Change Requests</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.pendingRequestsCount ?? 0}</p>
              </div>
              <FileText className="w-7 h-7 text-amber-500/60" />
            </CardContent>
          </Card>
        </div>

        {/* Main Tabbed Management */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 shadow-sm">
            <TabsTrigger value="students" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Students Table
            </TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Fees Status
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <CalendarIcon className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <Award className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="provisioning" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <KeyRound className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Provisioning
            </TabsTrigger>
            <TabsTrigger value="notices" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <Bell className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Notices Board
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <Clock className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-[#0a2540] data-[state=active]:text-white font-semibold text-xs sm:text-sm">
              <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Requests
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: STUDENTS TABLE */}
          <TabsContent value="students" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4 space-y-4">
                {/* Search & Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search name, roll, mobile, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white border-slate-300 text-slate-900 text-xs sm:text-sm"
                      />
                    </div>
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="all">All Classes</option>
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingStudentId(null);
                      setStudentForm(emptyStudent);
                      setStudentModalOpen(true);
                    }}
                    className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 shadow-sm w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add New Student
                  </Button>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Roll</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Mobile</th>
                        <th className="p-3">Samagra ID</th>
                        <th className="p-3">DK No</th>
                        <th className="p-3">Half Yearly</th>
                        <th className="p-3">Final Marks</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            No student records found.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s) => {
                          const hasSubjectBreakdown = Boolean(s.subjects?.halfYearly || s.subjects?.final);
                          return (
                            <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-mono font-bold text-amber-700">{s.rollNumber}</td>
                              <td className="p-3 font-semibold text-slate-900">
                                {s.name}
                                {!hasSubjectBreakdown && (
                                  <Badge variant="outline" className="ml-2 text-[10px] bg-amber-50 text-amber-700 border-amber-300">
                                    Total Only
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                                  {s.class || "N/A"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">
                                  {s.category || "General"}
                                </Badge>
                              </td>
                              <td className="p-3 text-slate-600">{s.mobileNumber || "—"}</td>
                              <td className="p-3 font-mono text-xs text-slate-600">{s.samagraId || "—"}</td>
                              <td className="p-3 font-mono text-xs text-slate-600">{s.dkNumber || "—"}</td>
                              <td className="p-3 font-semibold text-slate-800">{s.halfYearlyMarks ?? "—"}</td>
                              <td className="p-3 font-semibold text-slate-800">{s.finalMarks ?? "—"}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenEditStudent(s)}
                                    className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteStudentId(s._id)}
                                    className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FEES STATUS MANAGEMENT */}
          <TabsContent value="fees" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
                <div>
                  <CardTitle className="text-lg text-[#0a2540]">Fees Management & Payment Tracker</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Assign fee structures (tuition, transport, exam fees) and record payments per student.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={feeClassFilter}
                    onChange={(e) => setFeeClassFilter(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Classes</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                  <Button
                    onClick={() => setFeeModalOpen(true)}
                    className="bg-[#0a2540] text-white font-bold hover:bg-[#0f3256] text-xs sm:text-sm shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Assign Fee Installment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Fee Installments Table */}
                <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Roll</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Fee Title</th>
                        <th className="p-3">Total Fee</th>
                        <th className="p-3">Paid Amount</th>
                        <th className="p-3">Due Balance</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!allFees || allFees.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            No fee records assigned yet. Use <strong>"Assign Fee Installment"</strong> above to define tuition/exam fees.
                          </td>
                        </tr>
                      ) : (
                        allFees.map((fee) => {
                          const due = Math.max(0, fee.amount - fee.paidAmount);
                          let statusBadge = (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pending</Badge>
                          );
                          if (fee.status === "paid") {
                            statusBadge = (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Paid</Badge>
                            );
                          } else if (fee.status === "overdue") {
                            statusBadge = (
                              <Badge className="bg-red-100 text-red-800 border-red-300">Overdue</Badge>
                            );
                          }

                          return (
                            <tr key={fee._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-slate-900">{fee.studentName}</td>
                              <td className="p-3 font-mono text-amber-700 font-bold">{fee.rollNumber}</td>
                              <td className="p-3">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                                  {fee.class}
                                </Badge>
                              </td>
                              <td className="p-3 font-medium text-slate-800">{fee.title}</td>
                              <td className="p-3 font-semibold text-slate-900">₹{fee.amount}</td>
                              <td className="p-3 text-emerald-600 font-semibold">₹{fee.paidAmount}</td>
                              <td className="p-3 font-bold text-red-600">₹{due}</td>
                              <td className="p-3 text-slate-600 text-xs">{fee.dueDate}</td>
                              <td className="p-3">{statusBadge}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFeeForPayment(fee);
                                      setPaymentForm({
                                        paidAmount: String(fee.amount),
                                        paymentDate: new Date().toISOString().split("T")[0],
                                        paymentMode: "Cash",
                                        remarks: "",
                                      });
                                      setPaymentModalOpen(true);
                                    }}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 text-xs font-semibold px-2.5"
                                  >
                                    Record Payment
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteFeeId(fee._id)}
                                    className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: ATTENDANCE MANAGEMENT */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <CardTitle className="text-lg text-[#0a2540] flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-amber-600" />
                    Daily Class Attendance Register
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Mark and save daily attendance for any class on any chosen date.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllPresent}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> Mark All Present
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveClassAttendance}
                    disabled={isSavingAttendance}
                    className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 text-xs shadow-sm"
                  >
                    {isSavingAttendance ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1.5" /> Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Date & Class Selectors + Class Stats */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 uppercase">Select Date</label>
                      <Input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="bg-white border-slate-300 text-slate-900 text-xs font-medium w-40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 uppercase">Select Class</label>
                      <select
                        value={attendanceClass}
                        onChange={(e) => setAttendanceClass(e.target.value)}
                        className="h-9 w-36 bg-white border border-slate-300 rounded-md px-3 text-xs font-medium text-slate-900 focus:ring-amber-500"
                      >
                        {CLASSES.map((c) => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Class Strength</span>
                      <span className="text-sm font-bold text-slate-900">{classStudents.length}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-700 block">Present</span>
                      <span className="text-sm font-bold text-emerald-700">
                        {classStudents.filter((s) => (attendanceStatusMap[s._id]?.status || "present") === "present").length}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-center">
                      <span className="text-[10px] text-red-700 block">Absent</span>
                      <span className="text-sm font-bold text-red-700">
                        {classStudents.filter((s) => attendanceStatusMap[s._id]?.status === "absent").length}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-center">
                      <span className="text-[10px] text-amber-800 block">Leave</span>
                      <span className="text-sm font-bold text-amber-800">
                        {classStudents.filter((s) => attendanceStatusMap[s._id]?.status === "leave").length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class Student Attendance Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Attendance Status</th>
                        <th className="p-3">Remarks / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            No students registered in Class {attendanceClass}.
                          </td>
                        </tr>
                      ) : (
                        classStudents.map((st) => {
                          const currentVal = attendanceStatusMap[st._id] || { status: "present", remarks: "" };
                          return (
                            <tr key={st._id} className="hover:bg-slate-50/80">
                              <td className="p-3 font-mono font-bold text-amber-700">{st.rollNumber}</td>
                              <td className="p-3 font-semibold text-slate-900">{st.name}</td>
                              <td className="p-3 text-slate-600">Class {st.class || attendanceClass}</td>
                              <td className="p-3">
                                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAttendanceStatusMap((prev) => ({
                                        ...prev,
                                        [st._id]: { ...prev[st._id], status: "present" },
                                      }))
                                    }
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                      currentVal.status === "present"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-emerald-700"
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAttendanceStatusMap((prev) => ({
                                        ...prev,
                                        [st._id]: { ...prev[st._id], status: "absent" },
                                      }))
                                    }
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                      currentVal.status === "absent"
                                        ? "bg-red-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-red-700"
                                    }`}
                                  >
                                    Absent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAttendanceStatusMap((prev) => ({
                                        ...prev,
                                        [st._id]: { ...prev[st._id], status: "leave" },
                                      }))
                                    }
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                      currentVal.status === "leave"
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-amber-700"
                                    }`}
                                  >
                                    Leave
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <Input
                                  type="text"
                                  placeholder="e.g. Sick leave, Late arrival..."
                                  value={currentVal.remarks}
                                  onChange={(e) =>
                                    setAttendanceStatusMap((prev) => ({
                                      ...prev,
                                      [st._id]: { ...prev[st._id], remarks: e.target.value },
                                    }))
                                  }
                                  className="h-8 text-xs bg-white border-slate-300 max-w-xs"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ACHIEVEMENTS MANAGEMENT */}
          <TabsContent value="achievements" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <CardTitle className="text-lg text-[#0a2540] flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Student Achievements & Recognitions
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Log and publish student milestones, sports awards, and academic honors.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={achievementClassFilter}
                    onChange={(e) => setAchievementClassFilter(e.target.value)}
                    className="h-9 bg-white border border-slate-300 rounded-md px-3 text-xs font-medium text-slate-900 focus:ring-amber-500"
                  >
                    <option value="all">All Classes</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                  <Button
                    onClick={() => {
                      setEditingAchievementId(null);
                      setAchievementForm({
                        studentId: students && students.length > 0 ? students[0]._id : "",
                        title: "",
                        description: "",
                        date: new Date().toISOString().split("T")[0],
                        certificateUrl: "",
                      });
                      setAchievementModalOpen(true);
                    }}
                    className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 text-xs shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Achievement
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Roll / Class</th>
                        <th className="p-3">Achievement Title</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(allAchievements || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No achievements logged yet. Click "Add Achievement" to log a student award.
                          </td>
                        </tr>
                      ) : (
                        (allAchievements || []).map((ach: any) => (
                          <tr key={ach._id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-semibold text-slate-900">{ach.studentName}</td>
                            <td className="p-3 text-slate-600">
                              <span className="font-mono text-amber-700 font-bold">{ach.rollNumber}</span> • Class {ach.class}
                            </td>
                            <td className="p-3 font-bold text-[#0a2540]">{ach.title}</td>
                            <td className="p-3 text-slate-500">{ach.date}</td>
                            <td className="p-3 text-slate-600 max-w-xs truncate">{ach.description}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingAchievementId(ach._id);
                                    setAchievementForm({
                                      studentId: ach.studentId,
                                      title: ach.title,
                                      description: ach.description,
                                      date: ach.date,
                                      certificateUrl: ach.certificateUrl || ach.imageUrl || "",
                                    });
                                    setAchievementModalOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteAchievementId(ach._id)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: ACCOUNT PROVISIONING */}
          <TabsContent value="provisioning" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-[#0a2540]">Account Provisioning & Security</CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Automatically generate authenticated login credentials for all registered students. Default password is set to their Date of Birth (YYYY-MM-DD).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
                  <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Automated Student Accounts</h4>
                    <p className="text-xs text-amber-800 mt-1">
                      Clicking <strong>"Provision All Accounts"</strong> scans the database for any student profiles missing default credentials or missing birth dates and automatically sets up seamless single-sign-on access.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleAutoProvision}
                    disabled={isProvisioning}
                    className="bg-[#0a2540] text-white font-bold hover:bg-[#0f3256]"
                  >
                    {isProvisioning ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Provisioning Accounts...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" /> Provision All Student Accounts Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: NOTICES BOARD */}
          <TabsContent value="notices" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#0a2540]">School Notices Board</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Publish official announcements and updates visible on the main school landing page.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingNoticeId(null);
                    setNoticeForm(emptyNotice);
                    setNoticeModalOpen(true);
                  }}
                  className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Notice
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(notices || []).map((notice) => (
                    <div
                      key={notice._id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm hover:shadow transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900">{notice.title}</h4>
                        {notice.important && (
                          <Badge variant="destructive" className="text-[10px]">Important</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-line">{notice.content}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>Date: {notice.date}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingNoticeId(notice._id);
                              setNoticeForm({
                                title: notice.title,
                                content: notice.content,
                                date: notice.date,
                                important: Boolean(notice.important),
                                imageUrl: notice.imageUrl || "",
                              });
                              setNoticeModalOpen(true);
                            }}
                            className="h-7 px-2 text-amber-600 hover:bg-amber-50"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteNoticeId(notice._id)}
                            className="h-7 px-2 text-red-600 hover:bg-red-50"
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

          {/* TAB 5: SCHOOL CALENDAR */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#0a2540]">School Calendar & Events</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    Manage holidays, examinations, sports day, and administrative events.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingCalendarId(null);
                    setCalendarForm(emptyCalendarEvent);
                    setCalendarModalOpen(true);
                  }}
                  className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Calendar Event
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(calendarEvents || []).map((ev) => (
                    <div
                      key={ev._id}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{ev.title}</span>
                          <Badge variant="outline" className="capitalize text-xs">
                            {ev.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {ev.startDate} {ev.endDate ? `to ${ev.endDate}` : ""} {ev.description ? `• ${ev.description}` : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteCalendarId(ev._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: CHANGE REQUESTS */}
          <TabsContent value="requests" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-[#0a2540]">Student Profile Change Requests</CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Review and approve correction requests submitted by students or parents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(!changeRequests || changeRequests.length === 0) ? (
                    <p className="text-center text-slate-400 p-6 text-sm">No pending change requests.</p>
                  ) : (
                    changeRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{req.studentName}</span>
                            <span className="text-xs text-amber-700 font-mono">Roll: {req.rollNumber}</span>
                            <Badge
                              variant="outline"
                              className={
                                req.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : req.status === "rejected"
                                  ? "bg-red-50 text-red-700 border-red-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }
                            >
                              {req.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{req.requestDetails}</p>
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateChangeRequestMutation({ id: req._id, status: "approved" })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateChangeRequestMutation({ id: req._id, status: "rejected" })}
                              className="border-slate-300 text-slate-700 text-xs"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOG 1: ADD/EDIT STUDENT MODAL */}
      <Dialog open={studentModalOpen} onOpenChange={setStudentModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#0a2540]">
              {editingStudentId ? "Edit Student Profile" : "Add New Student Record"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Complete student details and enter subject-wise exam marks.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStudent} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Student Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Roll Number *</label>
                <Input
                  required
                  placeholder="e.g. 101"
                  value={studentForm.rollNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Class *</label>
                <select
                  value={studentForm.class}
                  onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900 focus:ring-amber-500"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category *</label>
                <select
                  value={studentForm.category}
                  onChange={(e) => setStudentForm({ ...studentForm, category: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900 focus:ring-amber-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Date of Birth (YYYY-MM-DD)</label>
                <Input
                  type="date"
                  value={studentForm.dateOfBirth}
                  onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                <Input
                  placeholder="e.g. 9876543210"
                  value={studentForm.mobileNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, mobileNumber: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>

            {/* Split Samagra ID and DK No. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Samagra ID</label>
                <Input
                  placeholder="e.g. 123456789"
                  value={studentForm.samagraId}
                  onChange={(e) => setStudentForm({ ...studentForm, samagraId: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">DK No.</label>
                <Input
                  placeholder="e.g. DK-9876"
                  value={studentForm.dkNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, dkNumber: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Aadhar Number</label>
                <Input
                  placeholder="e.g. 1234 5678 9012"
                  value={studentForm.aadharNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, aadharNumber: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>

            {/* Subject-Wise Marks Entry */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-sm text-[#0a2540]">Subject-Wise Marks Entry (Max 100 per subject)</h4>

              {/* Half Yearly Subjects */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-800">Half Yearly Examination</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUBJECTS.map((sub) => (
                    <div key={sub.key} className="space-y-1">
                      <label className="text-[11px] text-slate-600">{sub.label}</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Marks"
                        value={studentForm.halfYearlySubjects[sub.key] || ""}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            halfYearlySubjects: {
                              ...studentForm.halfYearlySubjects,
                              [sub.key]: e.target.value,
                            },
                          })
                        }
                        className="bg-white border-slate-300 text-xs text-slate-900 h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Subjects */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-800">Final Examination</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUBJECTS.map((sub) => (
                    <div key={sub.key} className="space-y-1">
                      <label className="text-[11px] text-slate-600">{sub.label}</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Marks"
                        value={studentForm.finalSubjects[sub.key] || ""}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            finalSubjects: {
                              ...studentForm.finalSubjects,
                              [sub.key]: e.target.value,
                            },
                          })
                        }
                        className="bg-white border-slate-300 text-xs text-slate-900 h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setStudentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0a2540] text-white hover:bg-[#0f3256] font-bold">
                Save Student Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: ASSIGN FEE INSTALLMENT */}
      <Dialog open={feeModalOpen} onOpenChange={setFeeModalOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#0a2540]">Assign Fee Installment</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Define tuition, exam, or transport fee structure for students.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignFee} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Target Assignment</label>
              <select
                value={feeForm.target}
                onChange={(e: any) => setFeeForm({ ...feeForm, target: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900"
              >
                <option value="all">All Students in School</option>
                <option value="class">Entire Specific Class</option>
                <option value="student">Single Student</option>
              </select>
            </div>

            {feeForm.target === "class" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Select Class</label>
                <select
                  value={feeForm.targetClass}
                  onChange={(e) => setFeeForm({ ...feeForm, targetClass: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>
            )}

            {feeForm.target === "student" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Select Student</label>
                <select
                  value={feeForm.studentId}
                  onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {(students || []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} (Class {s.class || "N/A"} - Roll {s.rollNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fee Description / Title *</label>
              <Input
                required
                placeholder="e.g. Tuition Fee - Term 1"
                value={feeForm.title}
                onChange={(e) => setFeeForm({ ...feeForm, title: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  placeholder="1500"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Due Date *</label>
                <Input
                  type="date"
                  required
                  value={feeForm.dueDate}
                  onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setFeeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0a2540] text-white hover:bg-[#0f3256] font-bold">
                Assign Installment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: RECORD PAYMENT */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#0a2540]">Record Fee Payment</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Log payment details for {selectedFeeForPayment?.studentName} ({selectedFeeForPayment?.title}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Paid Amount (₹) *</label>
              <Input
                type="number"
                required
                min="0"
                max={selectedFeeForPayment?.amount || 100000}
                value={paymentForm.paidAmount}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
              <p className="text-[11px] text-slate-500">Total Installment Amount: ₹{selectedFeeForPayment?.amount || 0}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Payment Date</label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Remarks / Receipt No.</label>
              <Input
                placeholder="e.g. Receipt #4582"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold">
                Confirm & Save Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: ADD/EDIT NOTICE */}
      <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#0a2540]">
              {editingNoticeId ? "Edit Notice" : "Add School Announcement"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {editingNoticeId ? "Update announcement details below." : "Create a new notice to display on the school website."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNotice} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notice Title *</label>
              <Input
                required
                placeholder="e.g. Annual Sports Meet 2026"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notice Content *</label>
              <Textarea
                required
                rows={4}
                placeholder="Detailed announcement details..."
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Date</label>
                <Input
                  type="date"
                  value={noticeForm.date}
                  onChange={(e) => setNoticeForm({ ...noticeForm, date: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={noticeForm.important}
                    onChange={(e) => setNoticeForm({ ...noticeForm, important: e.target.checked })}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Mark as Important</span>
                </label>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setNoticeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0a2540] text-white hover:bg-[#0f3256] font-bold">
                Save Notice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: ADD/EDIT CALENDAR EVENT */}
      <Dialog open={calendarModalOpen} onOpenChange={setCalendarModalOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#0a2540]">
              {editingCalendarId ? "Edit Calendar Event" : "Add Calendar Event"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {editingCalendarId ? "Update calendar event details below." : "Schedule an upcoming event or holiday."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCalendar} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Event Title *</label>
              <Input
                required
                placeholder="e.g. Half Yearly Examinations"
                value={calendarForm.title}
                onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={calendarForm.category}
                  onChange={(e: any) => setCalendarForm({ ...calendarForm, category: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900"
                >
                  <option value="holiday">Holiday</option>
                  <option value="exam">Examination</option>
                  <option value="event">Event</option>
                  <option value="ptm">Parent Teacher Meeting</option>
                  <option value="admission">Admission</option>
                  <option value="notice">Notice</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Start Date *</label>
                <Input
                  type="date"
                  required
                  value={calendarForm.startDate}
                  onChange={(e) => setCalendarForm({ ...calendarForm, startDate: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Textarea
                rows={2}
                placeholder="Event summary..."
                value={calendarForm.description}
                onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setCalendarModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0a2540] text-white hover:bg-[#0f3256] font-bold">
                Save Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOGS FOR DELETE CONFIRMATION */}
      <AlertDialog open={Boolean(deleteStudentId)} onOpenChange={() => setDeleteStudentId(null)}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. This will permanently delete the student's profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteStudentId) {
                  await removeStudentMutation({ id: deleteStudentId });
                  toast.success("Student record deleted.");
                  setDeleteStudentId(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteNoticeId)} onOpenChange={() => setDeleteNoticeId(null)}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will remove the notice from the school website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteNoticeId) {
                  await removeNoticeMutation({ id: deleteNoticeId });
                  toast.success("Notice deleted.");
                  setDeleteNoticeId(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG 6: ADD/EDIT ACHIEVEMENT */}
      <Dialog open={achievementModalOpen} onOpenChange={setAchievementModalOpen}>
        <DialogContent className="max-w-lg bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#0a2540] flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              {editingAchievementId ? "Edit Student Achievement" : "Add Student Achievement"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Record academic, sports, or extracurricular milestone for a student.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAchievement} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Select Student *</label>
              <select
                required
                value={achievementForm.studentId}
                onChange={(e) => setAchievementForm({ ...achievementForm, studentId: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-900 focus:ring-amber-500"
              >
                <option value="">-- Choose Student --</option>
                {(students || []).map((s) => (
                  <option key={s._id} value={s._id}>
                    Roll {s.rollNumber} - {s.name} (Class {s.class})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Achievement Title *</label>
                <Input
                  required
                  placeholder="e.g. 1st Rank in Science Fair"
                  value={achievementForm.title}
                  onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Date *</label>
                <Input
                  type="date"
                  required
                  value={achievementForm.date}
                  onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description *</label>
              <Textarea
                required
                rows={3}
                placeholder="Describe the milestone, competition details, or award highlights..."
                value={achievementForm.description}
                onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Certificate / Image URL (Optional)</label>
              <Input
                type="text"
                placeholder="https://... (Image or Certificate Link)"
                value={achievementForm.certificateUrl}
                onChange={(e) => setAchievementForm({ ...achievementForm, certificateUrl: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setAchievementModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600">
                {editingAchievementId ? "Update Achievement" : "Save Achievement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteAchievementId)} onOpenChange={() => setDeleteAchievementId(null)}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Achievement?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-xs">
              Are you sure you want to permanently remove this achievement record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAchievement} className="bg-red-600 text-white hover:bg-red-700">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}