import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Search, User, BookOpen, Hash, CreditCard, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

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

function getGrade(marks?: number) {
  if (marks === undefined || marks === null) return null;
  if (marks >= 90) return { grade: "A+", color: "bg-green-100 text-green-800" };
  if (marks >= 80) return { grade: "A", color: "bg-green-100 text-green-700" };
  if (marks >= 70) return { grade: "B+", color: "bg-blue-100 text-blue-800" };
  if (marks >= 60) return { grade: "B", color: "bg-blue-100 text-blue-700" };
  if (marks >= 50) return { grade: "C", color: "bg-yellow-100 text-yellow-800" };
  if (marks >= 33) return { grade: "D", color: "bg-orange-100 text-orange-800" };
  return { grade: "F", color: "bg-red-100 text-red-800" };
}

function SubjectTable({ marks }: { marks: Record<string, number | undefined> | undefined }) {
  if (!marks) return null;
  const rows = SUBJECTS.filter((s) => marks[s.key] !== undefined && marks[s.key] !== null);
  if (rows.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Subject</th>
            <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Marks</th>
            <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Grade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const m = marks[s.key];
            const g = getGrade(m);
            return (
              <tr key={s.key} className="border-b last:border-0">
                <td className="px-3 py-2">{s.label}</td>
                <td className="px-3 py-2 text-right font-semibold">{m}</td>
                <td className="px-3 py-2 text-right">
                  {g && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.color}`}>{g.grade}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProfileCard({ rollNumber }: { rollNumber: string }) {
  const student = useQuery(api.students.getByRoll, { rollNumber });

  if (student === undefined) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (student === null) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Student Not Found</h3>
        <p className="text-muted-foreground text-sm">
          No student found with roll number <strong>{rollNumber}</strong>. Please check and try again.
        </p>
      </motion.div>
    );
  }

  const halfGrade = getGrade(student.halfYearlyMarks);
  const finalGrade = getGrade(student.finalMarks);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Profile Header */}
      <Card className="border-primary/20 overflow-hidden">
        <div className="bg-primary h-20" />
        <CardContent className="pt-0 pb-6">
          <div className="-mt-10 flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center border-4 border-background shadow-lg">
              <span className="text-2xl font-bold text-accent-foreground">
                {student.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-muted-foreground text-sm">
                {student.class ? `Class ${student.class}` : "Class not assigned"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Hash className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Roll Number</p>
                <p className="font-semibold text-sm">{student.rollNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Class</p>
                <p className="font-semibold text-sm">{student.class ? `Class ${student.class}` : "N/A"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Examination Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Half Yearly */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm font-medium">Half Yearly Examination</p>
                <p className="text-xs text-muted-foreground">Mid-term assessment</p>
              </div>
              <div className="text-right">
                {student.halfYearlyMarks !== undefined && student.halfYearlyMarks !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{student.halfYearlyMarks}</span>
                    {halfGrade && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${halfGrade.color}`}>{halfGrade.grade}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Not available</span>
                )}
              </div>
            </div>
            <SubjectTable marks={student.subjects?.halfYearly as Record<string, number | undefined> | undefined} />
          </div>

          {/* Final */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm font-medium">Final Examination</p>
                <p className="text-xs text-muted-foreground">Annual assessment</p>
              </div>
              <div className="text-right">
                {student.finalMarks !== undefined && student.finalMarks !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{student.finalMarks}</span>
                    {finalGrade && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${finalGrade.color}`}>{finalGrade.grade}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Not available</span>
                )}
              </div>
            </div>
            <SubjectTable marks={student.subjects?.final as Record<string, number | undefined> | undefined} />
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      {(student.aadharNumber || student.dkNumber) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.aadharNumber && (
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Aadhar Number</span>
                <span className="text-sm font-medium">{student.aadharNumber}</span>
              </div>
            )}
            {student.dkNumber && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">DK Number</span>
                <span className="text-sm font-medium">{student.dkNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function NameSearchResults({ name, onSelect }: { name: string; onSelect: (roll: string) => void }) {
  const results = useQuery(api.students.searchByName, { name });
  if (!results) return <div className="flex justify-center py-4"><div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (results.length === 0) return <p className="text-center text-muted-foreground text-sm py-4">No students found with that name.</p>;
  return (
    <div className="space-y-2">
      {results.map((s) => (
        <button
          key={s._id}
          onClick={() => onSelect(s.rollNumber)}
          className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <p className="font-medium text-sm">{s.name}</p>
          <p className="text-xs text-muted-foreground">Roll: {s.rollNumber}{s.class ? ` • Class ${s.class}` : ""}</p>
        </button>
      ))}
    </div>
  );
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<"roll" | "name">("roll");
  const [rollInput, setRollInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [searchedRoll, setSearchedRoll] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  const handleRollSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (rollInput.trim()) {
      setSearchedRoll(rollInput.trim().toUpperCase());
      setNameSearch("");
    }
  };

  const handleNameSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length >= 2) {
      setNameSearch(nameInput.trim());
      setSearchedRoll("");
    }
  };

  const handleSelectFromName = (roll: string) => {
    setSearchedRoll(roll);
    setNameSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <GraduationCap className="w-6 h-6 shrink-0" />
          <div>
            <h1 className="font-bold text-base leading-tight">Student Portal</h1>
            <p className="text-primary-foreground/70 text-xs">Maa Veena Vaidini School</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">View Your Profile</h2>
          <p className="text-muted-foreground text-sm">Search by roll number or name to access your academic records</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              {/* Search mode toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant={searchMode === "roll" ? "default" : "outline"}
                  onClick={() => { setSearchMode("roll"); setNameSearch(""); setSearchedRoll(""); }}
                  className="flex-1"
                >
                  By Roll Number
                </Button>
                <Button
                  size="sm"
                  variant={searchMode === "name" ? "default" : "outline"}
                  onClick={() => { setSearchMode("name"); setNameSearch(""); setSearchedRoll(""); }}
                  className="flex-1"
                >
                  By Name
                </Button>
              </div>

              {searchMode === "roll" ? (
                <form onSubmit={handleRollSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your roll number..."
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>
              ) : (
                <form onSubmit={handleNameSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your name (min 2 chars)..."
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit" disabled={nameInput.trim().length < 2}>Search</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {nameSearch && !searchedRoll && (
            <motion.div key={`name-${nameSearch}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-muted-foreground mb-3">Select a student to view their profile:</p>
              <NameSearchResults name={nameSearch} onSelect={handleSelectFromName} />
            </motion.div>
          )}
          {searchedRoll && (
            <motion.div key={searchedRoll} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {nameSearch === "" && searchMode === "name" && (
                <Button variant="ghost" size="sm" className="mb-3" onClick={() => { setSearchedRoll(""); setNameSearch(nameInput); }}>
                  ← Back to results
                </Button>
              )}
              <ProfileCard rollNumber={searchedRoll} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}