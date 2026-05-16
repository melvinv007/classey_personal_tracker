"use client";

import { EditCourseModal } from "@/components/modals/EditCourseModal";
import { LLMImportModal } from "@/components/modals/LLMImportModal";
import { useSemesters, useSemesterCourses, useBatchCreateSemesterCourses, useReplaceSemesterCourses, useDeleteSemesterCourse, useSettings, useUpdateSemesterCourse } from "@/hooks/use-appwrite";
import type { SemesterCourse } from "@/types/database";
import type { SemesterCourseImport } from "@/utils/minor-validation";
import { normalizeShortCode } from "@/utils/short-code";
import { semesterCourseService } from "@/lib/appwrite-db";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronRight, Edit2, Library, Search, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const SEM_COURSE_FIELDS = [
  { key: "short_code", label: "Course Code", type: "text" as const },
  { key: "name", label: "Name", type: "text" as const },
  { key: "slot", label: "Slot", type: "text" as const, placeholder: "e.g. 5A" },
  { key: "classroom", label: "Classroom", type: "text" as const },
  { key: "student_limit", label: "Student Limit", type: "number" as const },
  { key: "category", label: "Category", type: "select" as const, options: [{ value: "stem", label: "STEM" }, { value: "advanced", label: "Advanced" }] },
  { key: "course_type", label: "Type", type: "select" as const, options: [{ value: "theory", label: "Theory" }, { value: "lab", label: "Lab" }, { value: "seminar", label: "Seminar" }, { value: "project", label: "Project" }, { value: "other", label: "Other" }] },
  { key: "duration", label: "Duration", type: "select" as const, options: [{ value: "full", label: "Full" }, { value: "first_half", label: "First Half" }, { value: "second_half", label: "Second Half" }] },
];

function parseJsonSafe(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

function SemCourseDrawer({ course }: { course: SemesterCourse }) {
  const instructors = parseJsonSafe(course.instructors);
  const items: [string, string | null | undefined][] = [
    ["Slot", course.slot],
    ["Classroom", course.classroom],
    ["Student Limit", course.student_limit ? String(course.student_limit) : null],
    ["Category", course.category],
    ["Type", course.course_type],
    ["Duration", course.duration !== "full" ? course.duration : null],
    ["Instructors", instructors.length > 0 ? instructors.join(", ") : null],
  ];
  const filled = items.filter(([, v]) => v);

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5 bg-white/[0.02]">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-8 py-3 text-xs sm:grid-cols-3">
        {filled.length === 0 ? (
          <span className="col-span-full text-muted-foreground italic">No additional details — click Edit to add info.</span>
        ) : filled.map(([label, val]) => (
          <div key={label}><span className="text-muted-foreground">{label}: </span><span className="font-medium">{val}</span></div>
        ))}
      </div>
    </motion.div>
  );
}

export default function SemesterCoursesPage() {
  const queryClient = useQueryClient();
  const { data: semesters = [] } = useSemesters();
  const { data: settings } = useSettings();
  // Show ALL semesters, not just active
  const allSemesters = useMemo(() => [...semesters].sort((a, b) => b.sort_order - a.sort_order), [semesters]);
  const [selectedSemId, setSelectedSemId] = useState<string>("");
  const semId = selectedSemId || allSemesters[0]?.$id || "";
  const { data: courses = [], isLoading } = useSemesterCourses(semId);
  const batchMut = useBatchCreateSemesterCourses();
  const replaceMut = useReplaceSemesterCourses();
  const deleteMut = useDeleteSemesterCourse();
  const updateCourseMut = useUpdateSemesterCourse();

  const [showImport, setShowImport] = useState(false);
  const [importDept, setImportDept] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<SemesterCourse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingDept, setDeletingDept] = useState<string | null>(null);

  const activeCourses = useMemo(() => courses.filter((c) => !c.deleted_at), [courses]);

  const grouped = useMemo(() => {
    const map = new Map<string, SemesterCourse[]>();
    for (const c of activeCourses) {
      const arr = map.get(c.department) || [];
      arr.push(c);
      map.set(c.department, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [activeCourses]);

  // Filter within expanded departments
  const filterCourses = useCallback((list: SemesterCourse[]) => {
    if (!searchQuery.trim()) return list.sort((a, b) => a.short_code.localeCompare(b.short_code));
    const q = searchQuery.toLowerCase();
    return list.filter((c) => c.short_code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).sort((a, b) => a.short_code.localeCompare(b.short_code));
  }, [searchQuery]);

  const toggleDept = useCallback((dept: string) => {
    setExpandedDepts((prev) => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n; });
  }, []);

  const openImport = useCallback((dept: string) => { setImportDept(dept); setShowImport(true); }, []);

  const handleImport = useCallback(async (data: unknown[], mode: "append" | "replace") => {
    if (!semId || !importDept) return;
    const mapped = (data as SemesterCourseImport[]).map((c) => ({
      short_code: c.short_code, short_code_normalized: normalizeShortCode(c.short_code),
      name: c.name, instructors: JSON.stringify(c.instructors), slot: c.slot,
      classroom: c.classroom, student_limit: c.student_limit, category: c.category,
      course_type: c.course_type, duration: c.duration, deleted_at: null,
      semester_id: semId, department: importDept,
    }));
    if (mode === "replace") await replaceMut.mutateAsync({ semesterId: semId, department: importDept, courses: mapped });
    else await batchMut.mutateAsync({ semesterId: semId, department: importDept, courses: mapped });
  }, [semId, importDept, batchMut, replaceMut]);

  const handleDeleteDept = useCallback(async (dept: string) => {
    if (!confirm(`Delete all courses for "${dept}" in this semester?`)) return;
    setDeletingDept(dept);
    const deptCourses = activeCourses.filter((c) => c.department === dept);
    for (const c of deptCourses) {
      await semesterCourseService.delete(c.$id);
    }
    setDeletingDept(null);
    queryClient.invalidateQueries({ queryKey: ["semesterCourses", semId] });
  }, [activeCourses, semId, queryClient]);

  const handleEditCourseSave = useCallback(async (updates: Record<string, unknown>) => {
    if (!editingCourse) return;
    await updateCourseMut.mutateAsync({ id: editingCourse.$id, semesterId: semId, data: updates as Partial<SemesterCourse> });
  }, [editingCourse, semId, updateCourseMut]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:pl-20">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/minor" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Minors
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(var(--accent-rgb), 0.15)" }}>
            <Library className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Semester Courses</h1>
            <p className="text-sm text-muted-foreground">Manage department course lists</p>
          </div>
        </div>
      </motion.div>

      {/* Semester selector + search + import */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Semester:</label>
        <select value={semId} onChange={(e) => setSelectedSemId(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
          {allSemesters.map((s) => <option key={s.$id} value={s.$id}>{s.name}</option>)}
          {allSemesters.length === 0 && <option value="">No semesters</option>}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search courses..." className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm outline-none focus:border-accent/50" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
      </div>
      <div className="mb-6 flex gap-2">
        <input value={importDept} onChange={(e) => setImportDept(e.target.value)} placeholder="Department name..." className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none w-48" />
        <button onClick={() => { if (importDept.trim()) setShowImport(true); }} disabled={!importDept.trim()} className={cn("btn-themed flex items-center gap-1.5 px-3 py-2 text-sm", !importDept.trim() && "opacity-50 pointer-events-none")}>
          <Sparkles className="h-4 w-4" /> Import
        </button>
      </div>

      {/* Department groups */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-16 animate-pulse rounded-2xl" />)}</div>
      ) : grouped.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <Library className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No courses imported yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Enter a department name above and click Import to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([dept, deptCourses]) => {
            const filtered = filterCourses(deptCourses);
            return (
            <div key={dept} className="glass-card overflow-hidden">
              {/* Department header — use div not button, move actions outside */}
              <div
                className="flex w-full items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-white/[0.02]"
                onClick={() => toggleDept(dept)}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedDepts.has(dept) && "rotate-180")} />
                  <span className="font-semibold">{dept}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{deptCourses.length}</span>
                  {settings?.home_department && dept.toLowerCase() === settings.home_department.toLowerCase() && (
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">HOME</span>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openImport(dept)} className="btn-muted-themed flex items-center gap-1 px-2 py-1 text-xs">
                    <Sparkles className="h-3 w-3" /> Re-import
                  </button>
                  <button
                    onClick={() => handleDeleteDept(dept)}
                    disabled={deletingDept === dept}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    {deletingDept === dept ? <span className="animate-pulse">Deleting...</span> : <><Trash2 className="inline h-3 w-3" /> Dept</>}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedDepts.has(dept) && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="border-t border-white/10">
                      {filtered.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">{searchQuery ? "No matching courses" : "No courses"}</div>
                      ) : filtered.map((c) => {
                        const isOpen = expandedCourseId === c.$id;
                        return (
                          <div key={c.$id}>
                            <div
                              className={cn("flex items-center justify-between border-b border-white/5 px-5 py-2.5 text-sm hover:bg-white/5 cursor-pointer select-none", isOpen && "bg-white/[0.03]")}
                              onClick={() => setExpandedCourseId(isOpen ? null : c.$id)}
                              onContextMenu={(e) => { e.preventDefault(); setEditingCourse(c); }}
                              title="Click to expand · Right-click to edit"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <ChevronRight className={cn("h-3 w-3 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                                <span className="font-mono font-semibold shrink-0">{c.short_code}</span>
                                <span className="truncate text-muted-foreground">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0" onClick={(e) => e.stopPropagation()}>
                                {c.slot && <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">{c.slot}</span>}
                                {c.category && <span className={cn("rounded px-1.5 py-0.5 font-semibold", c.category === "stem" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{c.category.toUpperCase()}</span>}
                                <span>{c.course_type}</span>
                                <button onClick={() => setEditingCourse(c)} className="p-1 hover:text-accent" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => deleteMut.mutate({ id: c.$id, semesterId: semId })} className="p-1 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </div>
                            <AnimatePresence>
                              {isOpen && <SemCourseDrawer course={c} />}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
          })}
        </div>
      )}

      <LLMImportModal open={showImport} onClose={() => setShowImport(false)} type="semester" onImport={handleImport} isPending={batchMut.isPending || replaceMut.isPending} />
      <EditCourseModal
        open={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        title={`Edit ${editingCourse?.short_code ?? "Course"}`}
        data={editingCourse as unknown as Record<string, unknown>}
        fields={SEM_COURSE_FIELDS}
        onSave={handleEditCourseSave}
        isPending={updateCourseMut.isPending}
      />
    </div>
  );
}
