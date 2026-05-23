import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

const ADMIN_PASSWORD = "MVVS@som145";

type Tab = "students" | "notices";

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

const emptySubjects: SubjectMarks = {
  hindi: "", english: "", math: "", science: "",
  socialScience: "", sanskrit: "", computerScience: "",
};

const emptyStudent: StudentForm = {
  name: "", rollNumber: "", class: "",
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

function SubjectMarksSection({
  title,
  marks,
  onChange,
}: {
  title: string;
  marks: SubjectMarks;
  onChange: (key: SubjectKey, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 text-sm font-medium hover:bg-muted transition-colors"
      >
        <span>{title} — Subject-wise Marks</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="p-4 grid grid-cols-2 gap-3">
          {SUBJECTS.map((s) => (
            <div key={s.key}>
              <label className="text-xs text-muted-foreground mb-1 block">{s.label}</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Marks"
                value={marks[s.key] ?? ""}
                onChange={(e) => onChange(s.key, e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Id<"students"> | null>(null);
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyStudent);
  const [deleteStudentId, setDeleteStudentId] = useState<Id<"students"> | null>(null);

  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Id<"notices"> | null>(null);
  const [noticeForm, setNoticeForm] = useState<NoticeForm>(emptyNotice);
  const [deleteNoticeId, setDeleteNoticeId] = useState<Id<"notices"> | null>(null);

  const students = useQuery(api.students.list, {});
  const notices = useQuery(api.notices.list);

  const addStudent = useMutation(api.students.add);
  const updateStudent = useMutation(api.students.update);
  const removeStudent = useMutation(api.students.remove);

  const addNotice = useMutation(api.notices.add);
  const updateNotice = useMutation(api.notices.update);
  const removeNotice = useMutation(api.notices.remove);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const filteredStudents = (students || []).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter ? s.class === classFilter : true;
    return matchesSearch && matchesClass;
  });

  const parseSubjects = (marks: SubjectMarks) => {
    const result: Record<string, number> = {};
    for (const s of SUBJECTS) {
      const val = marks[s.key];
      if (val !== undefined && val !== "") {
        const num = parseFloat(val);
        if (!isNaN(num)) result[s.key] = num;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  };

  const subjectsToForm = (obj?: Record<string, number | undefined>): SubjectMarks => {
    const result: SubjectMarks = { ...emptySubjects };
    if (!obj) return result;
    for (const s of SUBJECTS) {
      const val = obj[s.key];
      result[s.key] = val !== undefined ? String(val) : "";
    }
    return result;
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({ ...emptyStudent, halfYearlySubjects: { ...emptySubjects }, finalSubjects: { ...emptySubjects } });
    setStudentDialogOpen(true);
  };

  const handleEditStudent = (s: NonNullable<typeof students>[number]) => {
    setEditingStudent(s._id);
    setStudentForm({
      name: s.name,
      rollNumber: s.rollNumber,
      class: s.class || "",
      halfYearlyMarks: s.halfYearlyMarks?.toString() || "",
      finalMarks: s.finalMarks?.toString() || "",
      aadharNumber: s.aadharNumber || "",
      dkNumber: s.dkNumber || "",
      halfYearlySubjects: subjectsToForm(s.subjects?.halfYearly as Record<string, number | undefined> | undefined),
      finalSubjects: subjectsToForm(s.subjects?.final as Record<string, number | undefined> | undefined),
    });
    setStudentDialogOpen(true);
  };

  const handleSaveStudent = async () => {
    if (!studentForm.name.trim() || !studentForm.rollNumber.trim()) {
      toast.error("Name and Roll Number are required.");
      return;
    }
    try {
      const halfYearlySubjects = parseSubjects(studentForm.halfYearlySubjects);
      const finalSubjects = parseSubjects(studentForm.finalSubjects);
      const subjects =
        halfYearlySubjects || finalSubjects
          ? { halfYearly: halfYearlySubjects, final: finalSubjects }
          : undefined;

      const payload = {
        name: studentForm.name.trim(),
        rollNumber: studentForm.rollNumber.trim(),
        class: studentForm.class.trim() || undefined,
        halfYearlyMarks: studentForm.halfYearlyMarks ? parseFloat(studentForm.halfYearlyMarks) : undefined,
        finalMarks: studentForm.finalMarks ? parseFloat(studentForm.finalMarks) : undefined,
        aadharNumber: studentForm.aadharNumber.trim() || undefined,
        dkNumber: studentForm.dkNumber.trim() || undefined,
        subjects,
      };
      if (editingStudent) {
        await updateStudent({ id: editingStudent, ...payload });
        toast.success("Student updated successfully.");
      } else {
        await addStudent(payload);
        toast.success("Student added successfully.");
      }
      setStudentDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save student.");
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentId) return;
    try {
      await removeStudent({ id: deleteStudentId });
      toast.success("Student deleted.");
      setDeleteStudentId(null);
    } catch {
      toast.error("Failed to delete student.");
    }
  };

  const handleAddNotice = () => {
    setEditingNotice(null);
    setNoticeForm({ ...emptyNotice, date: new Date().toISOString().split("T")[0] });
    setNoticeDialogOpen(true);
  };

  const handleEditNotice = (n: NonNullable<typeof notices>[number]) => {
    setEditingNotice(n._id);
    setNoticeForm({
      title: n.title,
      content: n.content,
      date: n.date,
      important: n.important || false,
      imageUrl: n.imageUrl || "",
    });
    setNoticeDialogOpen(true);
  };

  const handleSaveNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    try {
      const payload = {
        title: noticeForm.title.trim(),
        content: noticeForm.content.trim(),
        date: noticeForm.date,
        important: noticeForm.important,
        imageUrl: noticeForm.imageUrl.trim() || undefined,
      };
      if (editingNotice) {
        await updateNotice({ id: editingNotice, ...payload });
        toast.success("Notice updated.");
      } else {
        await addNotice(payload);
        toast.success("Notice published.");
      }
      setNoticeDialogOpen(false);
    } catch {
      toast.error("Failed to save notice.");
    }
  };

  const handleDeleteNotice = async () => {
    if (!deleteNoticeId) return;
    try {
      await removeNotice({ id: deleteNoticeId });
      toast.success("Notice deleted.");
      setDeleteNoticeId(null);
    } catch {
      toast.error("Failed to delete notice.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary">
                  <img src="/logo.png" alt="Maa Veena Vaidini logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">Maa Veena Vaidini School</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4 mt-2">
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center tracking-widest"
                />
                {passwordError && (
                  <p className="text-destructive text-sm text-center">{passwordError}</p>
                )}
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10">
              <img src="/logo.png" alt="Maa Veena Vaidini logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Admin Dashboard</h1>
              <p className="text-primary-foreground/70 text-xs hidden sm:block">Maa Veena Vaidini School</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLoggedIn(false)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Students", value: students?.length ?? 0, icon: Users, color: "text-blue-600" },
            { label: "Notices", value: notices?.length ?? 0, icon: Bell, color: "text-amber-600" },
            { label: "Classes", value: [...new Set((students || []).map((s) => s.class).filter(Boolean))].length, icon: BookOpen, color: "text-green-600" },
            { label: "Important", value: (notices || []).filter((n) => n.important).length, icon: AlertCircle, color: "text-red-600" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card>
                <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <stat.icon className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 ${stat.color}`} />
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["students", "notices"] as Tab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)}
              size="sm"
              className="capitalize"
            >
              {tab === "students" ? <Users className="w-4 h-4 mr-1.5" /> : <Bell className="w-4 h-4 mr-1.5" />}
              {tab}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "students" && (
            <motion.div key="students" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">All Classes</option>
                  {["1", "2", "3", "4", "5", "6", "7", "8"].map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
                <Button onClick={handleAddStudent} size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Student
                </Button>
              </div>

              {/* Mobile cards / Desktop table */}
              <div className="block sm:hidden space-y-3">
                {filteredStudents.map((s) => (
                  <Card key={s._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">Roll: {s.rollNumber} {s.class ? `• Class ${s.class}` : ""}</p>
                          {(s.halfYearlyMarks !== undefined || s.finalMarks !== undefined) && (
                            <p className="text-xs mt-1">
                              {s.halfYearlyMarks !== undefined && <span className="mr-2">HY: <strong>{s.halfYearlyMarks}</strong></span>}
                              {s.finalMarks !== undefined && <span>Final: <strong>{s.finalMarks}</strong></span>}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditStudent(s)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteStudentId(s._id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredStudents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">No students found.</p>
                )}
              </div>

              <Card className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-semibold">Name</th>
                        <th className="text-left px-4 py-3 font-semibold">Roll No.</th>
                        <th className="text-left px-4 py-3 font-semibold">Class</th>
                        <th className="text-left px-4 py-3 font-semibold">Half Yearly</th>
                        <th className="text-left px-4 py-3 font-semibold">Final</th>
                        <th className="text-left px-4 py-3 font-semibold">Aadhar</th>
                        <th className="text-left px-4 py-3 font-semibold">DK No.</th>
                        <th className="text-right px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.rollNumber}</td>
                          <td className="px-4 py-3">{s.class ? `Class ${s.class}` : "—"}</td>
                          <td className="px-4 py-3">{s.halfYearlyMarks ?? "—"}</td>
                          <td className="px-4 py-3">{s.finalMarks ?? "—"}</td>
                          <td className="px-4 py-3 text-xs">{s.aadharNumber || "—"}</td>
                          <td className="px-4 py-3 text-xs">{s.dkNumber || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditStudent(s)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteStudentId(s._id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-muted-foreground">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "notices" && (
            <motion.div key="notices" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div className="flex justify-end mb-4">
                <Button onClick={handleAddNotice} size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Notice
                </Button>
              </div>
              <div className="space-y-3">
                {(notices || []).map((n) => (
                  <Card key={n._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{n.title}</p>
                            {n.important && <Badge variant="destructive" className="text-xs">Important</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{n.date}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                          {n.imageUrl && (
                            <img src={n.imageUrl} alt="Notice" className="mt-2 rounded-lg max-h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditNotice(n)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteNoticeId(n._id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(notices || []).length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">No notices yet.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Student Dialog */}
      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
                <Input
                  placeholder="Student name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Roll Number *</label>
                <Input
                  placeholder="Roll number"
                  value={studentForm.rollNumber}
                  onChange={(e) => setStudentForm((f) => ({ ...f, rollNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Class</label>
                <select
                  value={studentForm.class}
                  onChange={(e) => setStudentForm((f) => ({ ...f, class: e.target.value }))}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select class</option>
                  {["1", "2", "3", "4", "5", "6", "7", "8"].map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Half Yearly Total</label>
                <Input
                  type="number"
                  placeholder="Total marks"
                  value={studentForm.halfYearlyMarks}
                  onChange={(e) => setStudentForm((f) => ({ ...f, halfYearlyMarks: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Final Total</label>
                <Input
                  type="number"
                  placeholder="Total marks"
                  value={studentForm.finalMarks}
                  onChange={(e) => setStudentForm((f) => ({ ...f, finalMarks: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Aadhar Number</label>
                <Input
                  placeholder="Aadhar number"
                  value={studentForm.aadharNumber}
                  onChange={(e) => setStudentForm((f) => ({ ...f, aadharNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">DK Number</label>
                <Input
                  placeholder="DK number"
                  value={studentForm.dkNumber}
                  onChange={(e) => setStudentForm((f) => ({ ...f, dkNumber: e.target.value }))}
                />
              </div>
            </div>

            {/* Subject-wise marks */}
            <SubjectMarksSection
              title="Half Yearly"
              marks={studentForm.halfYearlySubjects}
              onChange={(key, val) =>
                setStudentForm((f) => ({
                  ...f,
                  halfYearlySubjects: { ...f.halfYearlySubjects, [key]: val },
                }))
              }
            />
            <SubjectMarksSection
              title="Final"
              marks={studentForm.finalSubjects}
              onChange={(key, val) =>
                setStudentForm((f) => ({
                  ...f,
                  finalSubjects: { ...f.finalSubjects, [key]: val },
                }))
              }
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStudent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNotice ? "Edit Notice" : "Add Notice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <Input
                placeholder="Notice title"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Content *</label>
              <textarea
                placeholder="Notice content..."
                value={noticeForm.content}
                onChange={(e) => setNoticeForm((f) => ({ ...f, content: e.target.value }))}
                rows={4}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Image URL (optional)</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={noticeForm.imageUrl}
                onChange={(e) => setNoticeForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
              {noticeForm.imageUrl && (
                <img
                  src={noticeForm.imageUrl}
                  alt="Preview"
                  className="mt-2 rounded-lg max-h-40 object-cover w-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Input
                  type="date"
                  value={noticeForm.date}
                  onChange={(e) => setNoticeForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeForm.important}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, important: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Mark as Important</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNotice}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Student Confirm */}
      <AlertDialog open={!!deleteStudentId} onOpenChange={(o) => !o && setDeleteStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Notice Confirm */}
      <AlertDialog open={!!deleteNoticeId} onOpenChange={(o) => !o && setDeleteNoticeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}