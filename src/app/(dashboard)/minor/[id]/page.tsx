"use client";

import { EditCourseModal } from "@/components/modals/EditCourseModal";
import { LLMImportModal } from "@/components/modals/LLMImportModal";
import { useMinor, useMinorCourses, useDeleteMinor, useUpdateMinor, useDeleteMinorCourse, useBatchCreateMinorCourses, useReplaceMinorCourses, useSemesters, useCreateMinorCourse, useUpdateMinorCourse } from "@/hooks/use-appwrite";
import type { MinorCourse, Subject } from "@/types/database";
import type { MinorCourseImport } from "@/utils/minor-validation";
import { normalizeShortCode } from "@/utils/short-code";
import { subjectService } from "@/lib/appwrite-db";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, Edit2, GraduationCap, Loader2, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const MINOR_COURSE_FIELDS = [
  { key: "short_code", label: "Course Code", type: "text" as const },
  { key: "name", label: "Name", type: "text" as const },
  { key: "credits", label: "Credits", type: "number" as const },
  { key: "is_required", label: "Required", type: "boolean" as const },
  { key: "slot", label: "Slot", type: "text" as const, placeholder: "e.g. 5A" },
  { key: "cutoff", label: "Cutoff", type: "text" as const, placeholder: "e.g. 7.0 CGPA" },
  { key: "difficulty", label: "Difficulty", type: "select" as const, options: [{ value: "Easy", label: "Easy" }, { value: "Medium", label: "Medium" }, { value: "Hard", label: "Hard" }] },
  { key: "duration", label: "Duration", type: "select" as const, options: [{ value: "full", label: "Full" }, { value: "first_half", label: "First Half" }, { value: "second_half", label: "Second Half" }] },
  { key: "typically_offered", label: "Typically Offered", type: "select" as const, options: [{ value: "odd", label: "Odd Sem" }, { value: "even", label: "Even Sem" }, { value: "both", label: "Both" }] },
  { key: "notes", label: "Notes", type: "text" as const },
];

function useAllCompletedSubjects() {
  const { data: semesters } = useSemesters();
  const completed = useMemo(() => (semesters ?? []).filter((s) => s.status === "completed"), [semesters]);
  return useQuery({
    queryKey: ["completedSubjects", completed.map((s) => s.$id)],
    queryFn: async () => {
      const all: Subject[] = [];
      for (const sem of completed) all.push(...(await subjectService.getBySemester(sem.$id)));
      return all;
    },
    enabled: completed.length > 0,
  });
}

function parseJsonSafe(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

/** Inline drawer that expands below a clicked course */
function CourseDrawer({ course }: { course: MinorCourse }) {
  const prereqs = parseJsonSafe(course.prerequisites);
  const instructors = parseJsonSafe(course.instructors);
  const items: [string, string | null][] = [
    ["Slot", course.slot],
    ["Duration", course.duration],
    ["Typically Offered", course.typically_offered],
    ["Cutoff", course.cutoff],
    ["Difficulty", course.difficulty],
    ["Instructors", instructors.length > 0 ? instructors.join(", ") : null],
    ["Prerequisites", prereqs.length > 0 ? prereqs.join(", ") : null],
    ["Notes", course.notes],
  ];
  const filled = items.filter(([, v]) => v && v !== "full" && v !== "both");

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden border-t border-white/5 bg-white/[0.02]"
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-8 py-3 text-xs sm:grid-cols-3">
        {filled.length === 0 ? (
          <span className="col-span-full text-muted-foreground italic">No additional details — click Edit to add info.</span>
        ) : (
          filled.map(([label, val]) => (
            <div key={label}>
              <span className="text-muted-foreground">{label}: </span>
              <span className="font-medium">{val}</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default function MinorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: minor, isLoading: minorLoading } = useMinor(id);
  const { data: courses = [] } = useMinorCourses(id);
  const { data: allSubjects = [] } = useAllCompletedSubjects();
  const deleteMut = useDeleteMinor();
  const updateMut = useUpdateMinor();
  const createCourseMut = useCreateMinorCourse();
  const updateCourseMut = useUpdateMinorCourse();
  const batchMut = useBatchCreateMinorCourses();
  const replaceMut = useReplaceMinorCourses();
  const deleteCourseMut = useDeleteMinorCourse();

  const [expanded, setExpanded] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCredits, setEditCredits] = useState(30);
  const [editCourseCount, setEditCourseCount] = useState(5);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<MinorCourse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Add course form
  const [addCode, setAddCode] = useState("");
  const [addName, setAddName] = useState("");
  const [addCredits, setAddCredits] = useState(6);
  const [addRequired, setAddRequired] = useState(false);

  const activeCourses = useMemo(() => courses.filter((c) => !c.deleted_at), [courses]);

  const { completedCredits, completedCourses, completedCodes } = useMemo(() => {
    let cr = 0, cc = 0;
    const codes = new Set<string>();
    for (const mc of activeCourses) {
      const m = allSubjects.find((s) => s.code && normalizeShortCode(s.code) === mc.short_code_normalized);
      if (m?.grade && m.grade !== "F" && m.grade !== "FF") { cr += mc.credits; cc += 1; codes.add(mc.short_code_normalized); }
    }
    return { completedCredits: cr, completedCourses: cc, completedCodes: codes };
  }, [activeCourses, allSubjects]);

  const creditPct = minor ? Math.min(100, Math.round((completedCredits / minor.credits_required) * 100)) : 0;
  const coursePct = minor ? Math.min(100, Math.round((completedCourses / minor.courses_required) * 100)) : 0;

  // Sort + filter
  const sorted = useMemo(() => {
    let list = [...activeCourses].sort((a, b) => {
      if (a.is_required !== b.is_required) return a.is_required ? -1 : 1;
      return a.short_code.localeCompare(b.short_code);
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.short_code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeCourses, searchQuery]);

  const handleImport = useCallback(async (data: unknown[], mode: "append" | "replace") => {
    const mapped = (data as MinorCourseImport[]).map((c) => ({
      short_code: c.short_code, name: c.name, credits: c.credits, is_required: c.is_required,
      slot: c.slot, prerequisites: JSON.stringify(c.prerequisites), cutoff: c.cutoff,
      difficulty: c.difficulty, instructors: JSON.stringify(c.instructors), duration: c.duration,
      typically_offered: c.typically_offered, notes: null, deleted_at: null,
      short_code_normalized: normalizeShortCode(c.short_code), minor_id: id,
    }));
    if (mode === "replace") await replaceMut.mutateAsync({ minorId: id, courses: mapped });
    else await batchMut.mutateAsync({ minorId: id, courses: mapped });
  }, [id, batchMut, replaceMut]);

  const handleAddCourse = useCallback(async () => {
    if (!addCode.trim() || !addName.trim()) return;
    await createCourseMut.mutateAsync({
      minor_id: id, short_code: addCode.trim(), short_code_normalized: normalizeShortCode(addCode),
      name: addName.trim(), credits: addCredits, is_required: addRequired, slot: null,
      prerequisites: "[]", cutoff: null, difficulty: null, instructors: "[]",
      duration: "full", typically_offered: "both", notes: null, deleted_at: null,
    });
    setAddCode(""); setAddName(""); setAddCredits(6); setAddRequired(false); setShowAdd(false);
  }, [id, addCode, addName, addCredits, addRequired, createCourseMut]);

  const startEdit = useCallback(() => {
    if (!minor) return;
    setEditName(minor.name); setEditCredits(minor.credits_required); setEditCourseCount(minor.courses_required); setEditing(true);
  }, [minor]);

  const saveEdit = useCallback(async () => {
    await updateMut.mutateAsync({ id, data: { name: editName, credits_required: editCredits, courses_required: editCourseCount } });
    setEditing(false);
  }, [id, editName, editCredits, editCourseCount, updateMut]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this minor program?")) return;
    await deleteMut.mutateAsync(id);
    router.push("/minor");
  }, [id, deleteMut, router]);

  const handleEditCourseSave = useCallback(async (updates: Record<string, unknown>) => {
    if (!editingCourse) return;
    await updateCourseMut.mutateAsync({ id: editingCourse.$id, minorId: id, data: updates as Partial<MinorCourse> });
  }, [editingCourse, id, updateCourseMut]);

  const handleContextMenu = useCallback((e: React.MouseEvent, course: MinorCourse) => {
    e.preventDefault();
    setEditingCourse(course);
  }, []);

  if (minorLoading || !minor) {
    return <div className="mx-auto max-w-4xl px-4 py-8 md:pl-20"><div className="glass-card h-64 animate-pulse rounded-2xl" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:pl-20">
      {/* Header */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/minor" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Minors
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(var(--accent-rgb), 0.15)" }}>
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
            {editing ? (
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xl font-bold outline-none focus:border-accent/50" autoFocus />
            ) : (
              <h1 className="text-2xl font-bold">{minor.name}</h1>
            )}
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-muted-themed px-3 py-2 text-sm">Cancel</button>
                <button onClick={saveEdit} className="btn-themed px-3 py-2 text-sm" disabled={updateMut.isPending}>
                  {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit} className="btn-muted-themed p-2"><Edit2 className="h-4 w-4" /></button>
                <button onClick={handleDelete} className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div className="glass-card mb-6 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completion Progress</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-2 flex justify-between text-sm"><span>Credits</span><span className="font-semibold">{completedCredits}/{editing ? editCredits : minor.credits_required}</span></div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full" style={{ background: creditPct >= 100 ? "rgb(52, 211, 153)" : "rgb(var(--accent))" }} initial={{ width: 0 }} animate={{ width: `${creditPct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm"><span>Courses</span><span className="font-semibold">{completedCourses}/{editing ? editCourseCount : minor.courses_required}</span></div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full" style={{ background: coursePct >= 100 ? "rgb(52, 211, 153)" : "rgb(var(--accent))" }} initial={{ width: 0 }} animate={{ width: `${coursePct}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Course Bucket */}
      <motion.div className="glass-card overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between px-5 py-4 text-left">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <span className="font-semibold">Course Bucket</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{activeCourses.length}</span>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              {/* Actions bar */}
              <div className="flex items-center gap-2 border-t border-white/10 px-5 py-3">
                <button onClick={() => setShowAdd(true)} className="btn-themed flex items-center gap-1.5 px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add</button>
                <button onClick={() => setShowImport(true)} className="btn-muted-themed flex items-center gap-1.5 px-3 py-1.5 text-xs"><Sparkles className="h-3.5 w-3.5" /> Import LLM</button>
                <div className="relative ml-auto flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter courses..." className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-accent/50" />
                  {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
                </div>
              </div>

              {/* Add course inline */}
              <AnimatePresence>
                {showAdd && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5 px-5 py-3">
                    <div className="grid grid-cols-4 gap-3">
                      <input value={addCode} onChange={(e) => setAddCode(e.target.value)} placeholder="Code" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
                      <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Course Name" className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
                      <div className="flex gap-2">
                        <input type="number" value={addCredits} onChange={(e) => setAddCredits(Number(e.target.value))} className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm outline-none" min={1} />
                        <button onClick={handleAddCourse} disabled={!addCode.trim() || !addName.trim()} className="btn-themed px-3 py-2 text-xs">Add</button>
                        <button onClick={() => setShowAdd(false)} className="p-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Course list */}
              <div className="border-t border-white/10">
                {sorted.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">{searchQuery ? "No matching courses" : "No courses in this bucket yet"}</div>
                ) : sorted.map((c) => {
                  const done = completedCodes.has(c.short_code_normalized);
                  const isOpen = expandedCourseId === c.$id;
                  return (
                    <div key={c.$id}>
                      <div
                        className={cn("flex items-center justify-between border-b border-white/5 px-5 py-3 transition-colors hover:bg-white/5 cursor-pointer select-none", done && "opacity-70", isOpen && "bg-white/[0.03]")}
                        onClick={() => setExpandedCourseId(isOpen ? null : c.$id)}
                        onContextMenu={(e) => handleContextMenu(e, c)}
                        title="Click to expand · Right-click to edit"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                          <div className={cn("h-2 w-2 rounded-full shrink-0", done ? "bg-emerald-400" : "bg-white/20")} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold">{c.short_code}</span>
                              {c.is_required && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">REQ</span>}
                              {done && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">DONE</span>}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{c.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          <span>{c.credits} cr</span>
                          {c.slot && <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">{c.slot}</span>}
                          <button onClick={(e) => { e.stopPropagation(); setEditingCourse(c); }} className="p-1 hover:text-accent" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteCourseMut.mutate({ id: c.$id, minorId: id }); }} className="p-1 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isOpen && <CourseDrawer course={c} />}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <LLMImportModal open={showImport} onClose={() => setShowImport(false)} type="minor" onImport={handleImport} isPending={batchMut.isPending || replaceMut.isPending} />
      <EditCourseModal
        open={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        title={`Edit ${editingCourse?.short_code ?? "Course"}`}
        data={editingCourse as unknown as Record<string, unknown>}
        fields={MINOR_COURSE_FIELDS}
        onSave={handleEditCourseSave}
        isPending={updateCourseMut.isPending}
      />
    </div>
  );
}
