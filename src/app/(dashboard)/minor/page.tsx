"use client";

import { MinorCard } from "@/components/cards/MinorCard";
import { EmptyState } from "@/components/common";
import { CreateMinorModal } from "@/components/modals/CreateMinorModal";
import { useMinors, useMinorCourses, useSemesters } from "@/hooks/use-appwrite";
import type { Minor, Subject } from "@/types/database";
import { normalizeShortCode } from "@/utils/short-code";
import { motion } from "framer-motion";
import { GraduationCap, Library, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { subjectService } from "@/lib/appwrite-db";
import { useQuery } from "@tanstack/react-query";

function useAllSubjects() {
  const { data: semesters } = useSemesters();
  const completed = useMemo(() => (semesters ?? []).filter((s) => s.status === "completed"), [semesters]);
  return useQuery({
    queryKey: ["allSubjectsForMinor", completed.map((s) => s.$id)],
    queryFn: async () => {
      const all: Subject[] = [];
      for (const sem of completed) all.push(...(await subjectService.getBySemester(sem.$id)));
      return all;
    },
    enabled: completed.length > 0,
  });
}

function MinorCardWithData({ minor, allSubjects }: { minor: Minor; allSubjects: Subject[] }) {
  const { data: courses = [] } = useMinorCourses(minor.$id);
  const { cc, cr } = useMemo(() => {
    let cr = 0, cc = 0;
    for (const mc of courses) {
      const m = allSubjects.find((s) => s.code && normalizeShortCode(s.code) === mc.short_code_normalized);
      if (m?.grade && m.grade !== "F" && m.grade !== "FF") { cr += mc.credits; cc += 1; }
    }
    return { cr, cc };
  }, [courses, allSubjects]);
  return <MinorCard minor={minor} completedCredits={cr} completedCourses={cc} />;
}

export default function MinorListPage() {
  const { data: minors = [], isLoading } = useMinors();
  const { data: allSubjects = [] } = useAllSubjects();
  const [showCreate, setShowCreate] = useState(false);
  const active = useMemo(() => minors.filter((m) => !m.deleted_at), [minors]);

  return (
    <div className="page-medium">
      <motion.div className="mb-8 flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minor Programs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your minor progress and explore courses</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-themed flex items-center gap-2 px-4 py-2.5 text-sm font-medium">
          <Plus className="h-4 w-4" /> New Minor
        </button>
      </motion.div>

      <motion.div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Link href="/minor/courses">
          <div className="glass-card interactive-surface flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(var(--accent-rgb), 0.1)" }}>
              <Library className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Semester Course List</h3>
              <p className="text-xs text-muted-foreground">Import & manage department courses</p>
            </div>
          </div>
        </Link>
        <Link href="/minor/explorer">
          <div className="glass-card interactive-surface flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(var(--accent-rgb), 0.1)" }}>
              <Search className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Course Explorer</h3>
              <p className="text-xs text-muted-foreground">Browse & filter eligible courses</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-40 animate-pulse rounded-2xl" />)}
        </div>
      ) : active.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No minors yet" description="Create your first minor program to start tracking courses and credits." action={{ label: "Create Minor", onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((m) => <MinorCardWithData key={m.$id} minor={m} allSubjects={allSubjects} />)}
        </div>
      )}

      <CreateMinorModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
