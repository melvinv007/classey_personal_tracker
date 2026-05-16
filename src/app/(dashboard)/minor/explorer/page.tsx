"use client";

import { useSemesters, useSemesterCourses, useMinors, useMinorCourses, useSettings } from "@/hooks/use-appwrite";
import { subjectService } from "@/lib/appwrite-db";
import type { SemesterCourse, Subject, MinorCourse } from "@/types/database";
import { normalizeShortCode } from "@/utils/short-code";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Filter, GraduationCap, Search, X } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

function useCompletedSubjects() {
  const { data: semesters } = useSemesters();
  const completed = useMemo(() => (semesters ?? []).filter((s) => s.status === "completed"), [semesters]);
  return useQuery({
    queryKey: ["completedSubjectsExplorer", completed.map((s) => s.$id)],
    queryFn: async () => {
      const all: Subject[] = [];
      for (const sem of completed) all.push(...(await subjectService.getBySemester(sem.$id)));
      return all;
    },
    enabled: completed.length > 0,
  });
}

function useCurrentSubjects() {
  const { data: semesters } = useSemesters();
  const current = useMemo(() => (semesters ?? []).find((s) => s.status === "ongoing"), [semesters]);
  return useQuery({
    queryKey: ["currentSubjectsExplorer", current?.$id],
    queryFn: () => (current ? subjectService.getBySemester(current.$id) : Promise.resolve([])),
    enabled: !!current,
  });
}

interface EnrichedCourse extends SemesterCourse {
  isCompleted: boolean;
  matchedGrade: string | null;
  minorNames: string[];
  slotClash: boolean;
}

export default function CourseExplorerPage() {
  const { data: semesters = [] } = useSemesters();
  const { data: settings } = useSettings();
  const allSemesters = useMemo(() => [...semesters].sort((a, b) => b.sort_order - a.sort_order), [semesters]);
  const [selectedSemId, setSelectedSemId] = useState<string>("");
  const semId = selectedSemId || allSemesters[0]?.$id || "";
  const selectedSem = allSemesters.find((s) => s.$id === semId);
  const { data: courses = [], isLoading } = useSemesterCourses(semId);
  const { data: completedSubjects = [] } = useCompletedSubjects();
  const { data: currentSubjects = [] } = useCurrentSubjects();
  const { data: minors = [] } = useMinors();
  const homeDept = settings?.home_department?.toLowerCase() || "";

  // Fetch all minor courses
  const activeMinors = useMemo(() => minors.filter((m) => !m.deleted_at), [minors]);
  const allMinorCoursesQueries = activeMinors.map((m) => ({
    minorId: m.$id,
    minorName: m.name,
  }));

  // Simple approach: fetch minor courses via individual hooks won't scale; use a combined query
  const { data: allMinorCourses = [] } = useQuery({
    queryKey: ["allMinorCoursesExplorer", activeMinors.map((m) => m.$id)],
    queryFn: async () => {
      const { minorCourseService } = await import("@/lib/appwrite-db");
      const all: (MinorCourse & { minorName: string })[] = [];
      for (const m of activeMinors) {
        const cs = await minorCourseService.getByMinor(m.$id);
        all.push(...cs.map((c) => ({ ...c, minorName: m.name })));
      }
      return all;
    },
    enabled: activeMinors.length > 0,
  });

  // Search
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [hideClash, setHideClash] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSlot, setFilterSlot] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Current enrolled slots for clash detection
  const enrolledSlots = useMemo(() => {
    const slots = new Set<string>();
    for (const sub of currentSubjects) {
      if (sub.slot_ids && Array.isArray(sub.slot_ids)) {
        sub.slot_ids.forEach((s) => slots.add(s.toUpperCase()));
      }
    }
    return slots;
  }, [currentSubjects]);

  const activeCourses = useMemo(() => courses.filter((c) => !c.deleted_at), [courses]);
  const departments = useMemo(() => [...new Set(activeCourses.map((c) => c.department))].sort(), [activeCourses]);
  const slots = useMemo(() => [...new Set(activeCourses.map((c) => c.slot).filter(Boolean) as string[])].sort(), [activeCourses]);

  // Enrichment
  const enriched: EnrichedCourse[] = useMemo(() => {
    return activeCourses.map((c) => {
      const norm = c.short_code_normalized;
      const completedSub = completedSubjects.find((s) => s.code && normalizeShortCode(s.code) === norm);
      const isCompleted = !!(completedSub?.grade && completedSub.grade !== "F" && completedSub.grade !== "FF");
      const matchedGrade = completedSub?.grade || null;
      const minorNames = allMinorCourses.filter((mc) => mc.short_code_normalized === norm).map((mc) => mc.minorName);
      const slotClash = c.slot ? enrolledSlots.has(c.slot.toUpperCase()) : false;
      return { ...c, isCompleted, matchedGrade, minorNames, slotClash };
    });
  }, [activeCourses, completedSubjects, allMinorCourses, enrolledSlots]);

  // Fuse search
  const fuse = useMemo(() => new Fuse(enriched, {
    keys: ["short_code", "name", "department"],
    threshold: 0.35,
    includeScore: true,
  }), [enriched]);

  // Filter pipeline
  const filtered = useMemo(() => {
    let results = debouncedQuery ? fuse.search(debouncedQuery).map((r) => r.item) : enriched;

    if (hideCompleted) results = results.filter((c) => !c.isCompleted);
    if (hideClash) results = results.filter((c) => !c.slotClash);
    if (eligibleOnly && homeDept) {
      results = results.filter((c) => {
        if (c.category === "stem") return true;
        if (c.category === "advanced" && c.department.toLowerCase() === homeDept) return true;
        if (!c.category) return true;
        return false;
      });
    }
    if (filterDept) results = results.filter((c) => c.department === filterDept);
    if (filterCategory) results = results.filter((c) => c.category === filterCategory);
    if (filterSlot) results = results.filter((c) => c.slot === filterSlot);

    return results;
  }, [enriched, debouncedQuery, fuse, hideCompleted, hideClash, eligibleOnly, homeDept, filterDept, filterCategory, filterSlot]);

  const clearFilters = useCallback(() => {
    setHideCompleted(true); setHideClash(false); setEligibleOnly(true);
    setFilterDept(""); setFilterCategory(""); setFilterSlot("");
  }, []);

  return (
    <div className="page-medium">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/minor" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Minors
        </Link>
        <h1 className="text-2xl font-bold">Course Explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Browse and filter courses across departments</p>
      </motion.div>

      {/* Semester selector */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Semester:</label>
        <select value={semId} onChange={(e) => setSelectedSemId(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
          {allSemesters.map((s) => <option key={s.$id} value={s.$id}>{s.name}</option>)}
          {allSemesters.length === 0 && <option value="">No semesters</option>}
        </select>
      </div>

      {/* Search + Filter bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by code, name, or department..." className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent/50" />
          {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={cn("btn-muted-themed flex items-center gap-2 px-4 py-2.5 text-sm", showFilters && "border-accent/30 bg-accent/10")}>
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="glass-card mb-4 overflow-hidden p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} className="accent-accent" /> Hide completed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hideClash} onChange={(e) => setHideClash(e.target.checked)} className="accent-accent" /> Hide clashes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} className="accent-accent" /> Eligible only
            </label>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs">
              <option value="">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs">
              <option value="">All categories</option>
              <option value="stem">STEM</option>
              <option value="advanced">Advanced</option>
            </select>
            <select value={filterSlot} onChange={(e) => setFilterSlot(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs">
              <option value="">All slots</option>
              {slots.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={clearFilters} className="mt-3 text-xs text-muted-foreground hover:text-foreground">Reset filters</button>
        </motion.div>
      )}

      {/* Results count */}
      <div className="mb-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {activeCourses.length} courses
        {selectedSem && <span> · {selectedSem.name}</span>}
      </div>

      {/* Course list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="glass-card h-14 animate-pulse rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No courses found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or importing courses first</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((c) => (
            <div key={c.$id} className={cn(
              "glass-card flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-white/5",
              c.isCompleted && "opacity-60",
              c.slotClash && "border-yellow-500/20",
            )}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="font-mono text-sm font-semibold shrink-0 w-20">{c.short_code}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                {c.slot && <span className={cn("rounded px-1.5 py-0.5 font-mono", c.slotClash ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10")}>{c.slot}</span>}
                {c.category && <span className={cn("rounded px-1.5 py-0.5 font-semibold", c.category === "stem" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{c.category.toUpperCase()}</span>}
                {c.minorNames.length > 0 && (
                  <span className="flex items-center gap-1 rounded bg-accent/20 px-1.5 py-0.5 text-accent" title={c.minorNames.join(", ")}>
                    <GraduationCap className="h-3 w-3" /> {c.minorNames.length}
                  </span>
                )}
                {c.isCompleted && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400">{c.matchedGrade}</span>}
                {c.slotClash && <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-yellow-400">CLASH</span>}
                <span className="text-muted-foreground">{c.course_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
