"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Edit3, MoreHorizontal, Calendar, Loader2, Trash2, Sparkles } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useData } from "@/hooks/use-data";
import { useThemeStore } from "@/stores/theme-store";
import { SubjectCard } from "@/components/cards";
import { CreateSubjectModal, EditSemesterModal, AddExtraClassModal, ConfirmActionModal } from "@/components/modals";
import { toast } from "sonner";
import type { Subject } from "@/types/database";
import { normalizeTimeHM } from "@/lib/utils";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { ThemedDateInput } from "@/components/ui/ThemedDateTimeInput";
import { PersistentNotepad } from "@/components/ui/PersistentNotepad";
import { calculateSPI } from "@/utils/grades";

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
  const [periodName, setPeriodName] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [periodType, setPeriodType] = useState<"holiday" | "exam-time">("holiday");
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [isNoClassModalOpen, setIsNoClassModalOpen] = useState(false);

  const {
    getSemesterById,
    getSubjectsBySemester,
    getAttendanceStats,
    getSchedulesBySubject,
    getHolidaysBySemester,
    classSchedules,
    classOccurrences,
    addClassOccurrence,
    updateClassOccurrence,
    deleteClassOccurrence,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    refetch,
    isLoading,
  } =
    useData();

  const semester = getSemesterById(semesterId);
  const subjects = getSubjectsBySemester(semesterId);
  const semesterHolidays = getHolidaysBySemester(semesterId);
  const setAccentColor = useThemeStore((s) => s.setAccentColor);
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const subjectsWithGradePoints = subjects.filter((subject) => subject.grade_points !== null && subject.credits > 0);
  const hasAllSubjectGrades = subjects.length > 0 && subjectsWithGradePoints.length === subjects.length;
  const effectiveSemesterSPI = hasAllSubjectGrades
    ? calculateSPI(subjects)
    : semester?.is_quick_input && semester.spi !== null
      ? semester.spi
      : null;

  const toPeriodDescription = useCallback(
    (kind: "holiday" | "exam-time", note: string): string =>
      `semester:${semesterId}|type:${kind}|note:${encodeURIComponent(note)}`,
    [semesterId]
  );

  const parsePeriodMeta = useCallback((description: string | null): { kind: "holiday" | "exam-time"; note: string } => {
    const fallback = { kind: "holiday" as const, note: description ?? "" };
    if (!description) return fallback;
    const prefix = `semester:${semesterId}|`;
    if (!description.startsWith(prefix)) return fallback;
    const parts = description.slice(prefix.length).split("|");
    const typePart = parts.find((part) => part.startsWith("type:"));
    const notePart = parts.find((part) => part.startsWith("note:"));
    const kind = typePart === "type:exam-time" ? "exam-time" : "holiday";
    const noteRaw = notePart ? notePart.replace("note:", "") : "";
    return { kind, note: decodeURIComponent(noteRaw || "") };
  }, [semesterId]);

  const listDatesInRange = useCallback((startDate: string, endDate: string): string[] => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const dates: string[] = [];
    let cursor = start;
    while (cursor <= end) {
      dates.push(format(cursor, "yyyy-MM-dd"));
      cursor = addDays(cursor, 1);
    }
    return dates;
  }, []);

  const holidayTag = useCallback((holidayId: string): string => `[holiday:${holidayId}]`, []);

  const removeHolidayCancellations = useCallback(async (holidayId: string): Promise<void> => {
    const tag = holidayTag(holidayId);
    const subjectIds = new Set(subjects.map((subject) => subject.$id));
    const related = classOccurrences.filter(
      (occurrence) =>
        subjectIds.has(occurrence.subject_id) &&
        occurrence.status === "cancelled" &&
        Boolean(occurrence.cancellation_reason?.includes(tag))
    );
    await Promise.all(related.map((occurrence) => deleteClassOccurrence(occurrence.$id)));
  }, [classOccurrences, deleteClassOccurrence, holidayTag, subjects]);

  const applyHolidayCancellations = useCallback(
    async (holidayId: string, holidayName: string, startDate: string, endDate: string): Promise<number> => {
      const tag = holidayTag(holidayId);
      const reason = `No class: ${holidayName} ${tag}`;
      const dateList = listDatesInRange(startDate, endDate);
      let affected = 0;

      for (const subject of subjects) {
        const schedules = getSchedulesBySubject(subject.$id);
        for (const date of dateList) {
          const weekday = parseISO(date).getDay();
          const dayOfWeek = weekday === 0 ? 7 : weekday;
          if (dayOfWeek < 1 || dayOfWeek > 6) continue;

          const activeSchedules = schedules.filter(
            (schedule) =>
              schedule.day_of_week === dayOfWeek &&
              schedule.effective_from <= date &&
              (!schedule.effective_until || schedule.effective_until >= date)
          );

          for (const schedule of activeSchedules) {
            const existing = classOccurrences.find(
              (occurrence) =>
                occurrence.subject_id === subject.$id &&
                occurrence.date === date &&
                normalizeTimeHM(occurrence.start_time) === normalizeTimeHM(schedule.start_time) &&
                normalizeTimeHM(occurrence.end_time) === normalizeTimeHM(schedule.end_time)
            );

            if (existing) {
              await updateClassOccurrence(existing.$id, {
                status: "cancelled",
                cancellation_reason: reason,
                attendance: null,
                attendance_marked_at: null,
                attendance_note: null,
              });
            } else {
              await addClassOccurrence({
                subject_id: subject.$id,
                schedule_id: schedule.$id,
                date,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                status: "cancelled",
                cancellation_reason: reason,
                rescheduled_to: null,
                attendance: null,
                attendance_marked_at: null,
                attendance_note: null,
                is_extra_class: false,
              });
            }
            affected += 1;
          }
        }
      }

      return affected;
    },
    [addClassOccurrence, classOccurrences, getSchedulesBySubject, holidayTag, listDatesInRange, subjects, updateClassOccurrence]
  );

  const resetPeriodForm = useCallback(() => {
    setPeriodName("");
    setPeriodType("holiday");
    setPeriodStartDate(semester?.start_date ?? "");
    setPeriodEndDate(semester?.start_date ?? "");
    setEditingPeriodId(null);
  }, [semester?.start_date]);

  // Set this semester's accent color
  useEffect(() => {
    if (semester) {
      setAccentColor(semester.color);
      if (!periodStartDate) {
        setPeriodStartDate(semester.start_date);
      }
      if (!periodEndDate) {
        setPeriodEndDate(semester.start_date);
      }
    }
  }, [semester, setAccentColor, periodStartDate, periodEndDate]);

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

  const handleSaveNoClassPeriod = async (): Promise<boolean> => {
    if (!periodName.trim()) {
      toast.error("Please enter a name");
      return false;
    }
    if (!periodStartDate || !periodEndDate) {
      toast.error("Please choose start and end dates");
      return false;
    }
    if (periodStartDate > periodEndDate) {
      toast.error("End date must be on or after start date");
      return false;
    }

    try {
      if (editingPeriodId) {
        await removeHolidayCancellations(editingPeriodId);
        await updateHoliday(editingPeriodId, {
          name: periodName.trim(),
          date: periodStartDate,
          date_end: periodStartDate === periodEndDate ? null : periodEndDate,
          description: toPeriodDescription(periodType, periodName.trim()),
        });
        const updatedCount = await applyHolidayCancellations(editingPeriodId, periodName.trim(), periodStartDate, periodEndDate);
        toast.success(`Updated period. ${updatedCount} classes marked cancelled.`);
      } else {
        const created = await addHoliday({
          name: periodName.trim(),
          date: periodStartDate,
          date_end: periodStartDate === periodEndDate ? null : periodEndDate,
          description: toPeriodDescription(periodType, periodName.trim()),
          deleted_at: null,
        });
        const createdCount = await applyHolidayCancellations(created.$id, periodName.trim(), periodStartDate, periodEndDate);
        toast.success(`No-class period created. ${createdCount} classes cancelled.`);
      }

      await refetch();
      resetPeriodForm();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save no-class period");
      return false;
    }
  };

  const handleEditNoClassPeriod = (holidayId: string): void => {
    const target = semesterHolidays.find((holiday) => holiday.$id === holidayId);
    if (!target) return;
    const meta = parsePeriodMeta(target.description);
    setEditingPeriodId(target.$id);
    setPeriodName(target.name);
    setPeriodType(meta.kind);
    setPeriodStartDate(target.date);
    setPeriodEndDate(target.date_end ?? target.date);
    setIsNoClassModalOpen(true);
  };

  const handleDeleteNoClassPeriod = async (holidayId: string): Promise<void> => {
    try {
      await removeHolidayCancellations(holidayId);
      await deleteHoliday(holidayId);
      await refetch();
      if (editingPeriodId === holidayId) {
        resetPeriodForm();
      }
      toast.success("No-class period deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete no-class period");
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
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/10 text-foreground">
                  Total Credits: {totalCredits}
                </span>
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
                {effectiveSemesterSPI !== null && (
                  <span className="flex items-center gap-1.5">
                    SPI: {effectiveSemesterSPI.toFixed(2)}
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

        <PersistentNotepad
          storageKey={`classey:notepad:semester:${semesterId}`}
          title="Semester Notepad"
          placeholder="Write anything about this semester..."
          className="mb-8"
        />

        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">No-Class Periods</h2>
              <p className="text-sm text-muted-foreground">
                Add holidays and exam-time ranges. Classes in these dates are automatically cancelled.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetPeriodForm();
                setIsNoClassModalOpen(true);
              }}
              className="interactive-surface interactive-focus inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-[rgba(var(--accent-rgb),0.2)] hover:bg-[rgba(var(--accent-rgb),0.3)] text-[rgb(var(--accent))] text-sm font-medium transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Add No-Class Period
            </button>
          </div>

          {semesterHolidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No no-class periods added yet.</p>
          ) : (
            <div className="space-y-2">
              {semesterHolidays.map((holiday) => {
                const meta = parsePeriodMeta(holiday.description);
                return (
                  <div key={holiday.$id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/3">
                    <div>
                      <p className="text-sm text-foreground">{holiday.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {meta.kind === "exam-time" ? "Exam Time" : "Holiday"} • {holiday.date}
                        {holiday.date_end ? ` to ${holiday.date_end}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditNoClassPeriod(holiday.$id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteNoClassPeriod(holiday.$id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 transition-colors"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        semesterId={semesterId}
        semesterColor={semester.color}
        semesterStartDate={semester.start_date}
        semesterEndDate={semester.end_date}
        semesterStatus={semester.status}
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

      {isNoClassModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close no-class modal"
            onClick={() => setIsNoClassModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="relative z-10 w-full max-w-xl rounded-3xl border border-white/12 bg-[var(--glass-bg-elevated)] p-6 backdrop-blur-2xl"
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {editingPeriodId ? "Edit No-Class Period" : "Create No-Class Period"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Classes in this date range will be cancelled automatically.
            </p>

            <div className="space-y-3">
              <ThemedSelect
                value={periodType}
                onChange={(value) => setPeriodType(value as "holiday" | "exam-time")}
                options={[
                  { value: "holiday", label: "Holiday" },
                  { value: "exam-time", label: "Exam Time" },
                ]}
              />
              <input
                value={periodName}
                onChange={(event) => setPeriodName(event.target.value)}
                placeholder={periodType === "exam-time" ? "Exam Preparation Week" : "Holiday name"}
                className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Start date</p>
                  <ThemedDateInput value={periodStartDate} onChange={setPeriodStartDate} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">End date</p>
                  <ThemedDateInput value={periodEndDate} onChange={setPeriodEndDate} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsNoClassModalOpen(false);
                  resetPeriodForm();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await handleSaveNoClassPeriod();
                  if (ok) {
                    setIsNoClassModalOpen(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-[rgba(var(--accent),0.18)] hover:bg-[rgba(var(--accent),0.28)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
              >
                {editingPeriodId ? "Update Period" : "Create Period"}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}

    </motion.main>
  );
}
