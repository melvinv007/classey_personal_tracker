"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Edit3, MoreHorizontal, Calendar, Target, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { useData } from "@/hooks/use-data";
import { useThemeStore } from "@/stores/theme-store";
import { SubjectCard } from "@/components/cards";
import { CreateSubjectModal, EditSemesterModal, AddExtraClassModal, ConfirmActionModal } from "@/components/modals";
import { toast } from "sonner";
import type { Subject } from "@/types/database";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const pageVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export default function SemesterDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const semesterId = params.id as string;
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isEditSemesterOpen, setIsEditSemesterOpen] = useState(false);
  const [isExtraClassOpen, setIsExtraClassOpen] = useState(false);
  const [extraClassSubjectId, setExtraClassSubjectId] = useState<string | undefined>();
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<Subject | null>(null);

  const { getSemesterById, getSubjectsBySemester, getAttendanceStats, classSchedules, addClassOccurrence, refetch, isLoading } =
    useData();

  const semester = getSemesterById(semesterId);
  const subjects = getSubjectsBySemester(semesterId);
  const setAccentColor = useThemeStore((s) => s.setAccentColor);

  // Set this semester's accent color
  useEffect(() => {
    if (semester) {
      setAccentColor(semester.color);
    }
  }, [semester, setAccentColor]);

  const handleDeleteSemester = async () => {
    if (!semester) return;
    try {
      const response = await fetch("/api/data/cascade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-semester", semesterId: semester.$id }),
      });
      const result = (await response.json()) as { success: boolean; error?: string; deleted?: { subjects?: number; tasks?: number; events?: number } };
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete semester");
      }
      toast.success(
        `Semester deleted (${result.deleted?.subjects ?? 0} subjects, ${result.deleted?.tasks ?? 0} tasks, ${result.deleted?.events ?? 0} events).`
      );
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete semester");
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubjectTarget) return;
    try {
      const response = await fetch("/api/data/cascade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-subject", subjectId: deleteSubjectTarget.$id }),
      });
      const result = (await response.json()) as { success: boolean; error?: string; deleted?: { exams?: number; files?: number; schedules?: number } };
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete subject");
      }
      toast.success(
        `Subject deleted (${result.deleted?.exams ?? 0} exams, ${result.deleted?.files ?? 0} files, ${result.deleted?.schedules ?? 0} schedules).`
      );
      setDeleteSubjectTarget(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete subject");
    }
  };

  // Handle extra class modal
  const handleAddExtraClass = useCallback((subject: Subject) => {
    setExtraClassSubjectId(subject.$id);
    setIsExtraClassOpen(true);
  }, []);

  // Handle mark all present today
  const handleMarkAllPresent = useCallback(async (subject: Subject) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay(); // ISO day (1=Mon, 7=Sun)
    
    // Get today's schedules for this subject
    const todaySchedules = classSchedules.filter(
      (s) => s.subject_id === subject.$id && s.day_of_week === dayOfWeek && !s.deleted_at
    );

    if (todaySchedules.length === 0) {
      toast.info("No classes scheduled today for this subject");
      return;
    }

    try {
      // Create occurrence records marked as present
      for (const schedule of todaySchedules) {
        await addClassOccurrence({
          subject_id: subject.$id,
          schedule_id: schedule.$id,
          date: today,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          attendance: "present",
          status: "completed",
          is_extra_class: false,
          cancellation_reason: null,
          rescheduled_to: null,
          attendance_marked_at: new Date().toISOString(),
          attendance_note: null,
        });
      }
      toast.success(`Marked ${todaySchedules.length} class${todaySchedules.length > 1 ? 'es' : ''} as present`);
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      toast.error("Failed to mark attendance");
    }
  }, [classSchedules, addClassOccurrence]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
          <p className="text-sm text-muted-foreground">Loading semester...</p>
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">Semester not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This semester may have been deleted or doesn&apos;t exist.
            </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))] font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Helper to extract RGB values from hex
  const hexToRgbComma = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const accentRgb = hexToRgbComma(semester.color);
  const startDate = new Date(semester.start_date);
  const endDate = new Date(semester.end_date);

  return (
    <motion.main
      className="min-h-screen p-6 pb-28 md:pb-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back button + Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Semesters
          </button>

          <div className="flex items-start justify-between">
            <div>
              <motion.div
                className="flex items-center gap-3 mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: semester.color }}
                />
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {semester.name}
                </h1>
                <span
                  className="px-2.5 py-1 text-xs font-medium rounded-full capitalize"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.2)`,
                    color: semester.color,
                  }}
                >
                  {semester.status}
                </span>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
                </span>
                {semester.target_spi && (
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Target: {semester.target_spi.toFixed(1)} SPI
                  </span>
                )}
                {semester.spi && (
                  <span className="flex items-center gap-1.5">
                    Achieved: {semester.spi.toFixed(1)} SPI
                  </span>
                )}
              </motion.div>
            </div>

            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => setIsEditSemesterOpen(true)}
                className="interactive-surface interactive-focus p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit semester"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                className="interactive-surface interactive-focus p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Subjects section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Subjects ({subjects.length})
            </h2>
            <button
              onClick={() => setIsCreateSubjectOpen(true)}
              className="interactive-surface interactive-focus flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(var(--accent-rgb),0.2)] hover:bg-[rgba(var(--accent-rgb),0.3)] text-[rgb(var(--accent))] font-medium transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>

          {subjects.length > 0 ? (
            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.$id}
                  subject={subject}
                  semesterId={semesterId}
                  stats={getAttendanceStats(subject.$id, subject.attendance_requirement_percent ?? 75)}
                  onAddExtraClass={handleAddExtraClass}
                  onMarkAllPresent={handleMarkAllPresent}
                  onDelete={(target) => setDeleteSubjectTarget(target)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
              >
                <Plus className="w-8 h-8" style={{ color: semester.color }} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No subjects yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Add your first subject to start tracking attendance, exams, and grades.
              </p>
              <button
                onClick={() => setIsCreateSubjectOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[rgba(var(--accent-rgb),0.2)] hover:bg-[rgba(var(--accent-rgb),0.3)] text-[rgb(var(--accent))] font-medium transition-all"
              >
                <Plus className="w-5 h-5" />
                Add First Subject
              </button>
            </motion.div>
          )}
        </div>

        {/* Quick stats (if subjects exist) */}
        {subjects.length > 0 && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Total credits */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold text-foreground">
                {subjects.reduce((sum, s) => sum + s.credits, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Credits</p>
            </div>

            {/* Average attendance */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold text-foreground">
                {subjects.length > 0
                  ? Math.round(
                      subjects.reduce(
                        (sum, s) => sum + (getAttendanceStats(s.$id, s.attendance_requirement_percent ?? 75)?.percentage || 0),
                        0
                      ) / subjects.length
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </div>

            {/* Subjects on track */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold text-emerald-400">
                {subjects.filter((s) => {
                  const stats = getAttendanceStats(s.$id, s.attendance_requirement_percent ?? 75);
                  const req = s.attendance_requirement_percent ?? 75;
                  return stats && stats.percentage >= req;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">On Track</p>
            </div>

            {/* Subjects at risk */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold text-amber-400">
                {subjects.filter((s) => {
                  const stats = getAttendanceStats(s.$id, s.attendance_requirement_percent ?? 75);
                  const req = s.attendance_requirement_percent ?? 75;
                  return stats && stats.percentage < req;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Needs Attention</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        semesterId={semesterId}
        semesterColor={semester.color}
      />

      {/* Edit Semester Modal */}
      <EditSemesterModal
        isOpen={isEditSemesterOpen}
        onClose={() => setIsEditSemesterOpen(false)}
        semester={semester}
        onDelete={handleDeleteSemester}
      />

      {/* Add Extra Class Modal */}
      <AddExtraClassModal
        isOpen={isExtraClassOpen}
        onClose={() => {
          setIsExtraClassOpen(false);
          setExtraClassSubjectId(undefined);
        }}
        subjects={subjects}
        preselectedSubjectId={extraClassSubjectId}
      />

      <ConfirmActionModal
        isOpen={deleteSubjectTarget !== null}
        title="Delete subject permanently?"
        description={
          deleteSubjectTarget
            ? `This will permanently delete ${deleteSubjectTarget.name} and all linked schedules, attendance, exams, files, links, and notes.`
            : ""
        }
        confirmText="Delete Subject"
        onConfirm={handleDeleteSubject}
        onCancel={() => setDeleteSubjectTarget(null)}
      />

    </motion.main>
  );
}
