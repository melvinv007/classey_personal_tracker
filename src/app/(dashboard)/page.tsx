"use client";

import { motion } from "framer-motion";
import { 
  Plus, Archive, Settings, Clock, CheckCircle2, XCircle, 
  MinusCircle, Calendar, TrendingUp, AlertCircle, Coffee, Loader2
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useData } from "@/hooks/use-data";
import { SemesterCard } from "@/components/cards";
import { CreateSemesterModal } from "@/components/modals";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { cn, normalizeTimeHM } from "@/lib/utils";
import { toast } from "sonner";
import { format, isToday, parseISO } from "date-fns";
import Link from "next/link";

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

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

interface TodayClass {
  scheduleId: string;
  subjectId: string;
  subjectName: string;
  shortName: string;
  color: string;
  startTime: string;
  endTime: string;
  room: string | null;
  status: "upcoming" | "ongoing" | "ended";
  isMarked: boolean;
  markedState: "present" | "absent" | "cancelled" | null;
  minutesUntil: number;
  minutesSinceEnd: number;
}

/**
 * Home / Dashboard page
 * Shows today's classes, attendance suggestions, and semester list
 */
export default function Home(): React.ReactNode {
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  // Use Appwrite data via useData hook
  const {
    activeSemesters,
    archivedSemesters,
    subjects,
    tasks,
    ongoingSemester,
    activeSemesterId,
    setActiveSemesterId,
    classOccurrences,
    getTodaySchedules,
    getSubjectById,
    markAttendance,
    createAndMarkAttendance,
    toggleTaskComplete,
    archiveSemester,
    unarchiveSemester,
    isLoading,
  } = useData();

  const displayedSemesters = showArchived ? archivedSemesters : activeSemesters;
  const activeSemesterFilterId = ongoingSemester?.$id ?? null;
  const activeSemesterOptions = useMemo(
    () => [
      { value: "__auto__", label: "Auto (Current/Ongoing)" },
      ...activeSemesters.map((semester) => ({
        value: semester.$id,
        label: semester.name,
      })),
    ],
    [activeSemesters]
  );

  // Get today's classes with status
  const todayClasses = useMemo((): TodayClass[] => {
    const schedules = getTodaySchedules();
    const today = format(now, "yyyy-MM-dd");
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return schedules
      .filter((schedule) => {
        const subject = getSubjectById(schedule.subject_id);
        if (!subject || subject.deleted_at) return false;
        return activeSemesterFilterId ? subject.semester_id === activeSemesterFilterId : true;
      })
      .map((schedule) => {
        const subject = getSubjectById(schedule.subject_id)!;
        const [startH, startM] = schedule.start_time.split(":").map(Number);
        const [endH, endM] = schedule.end_time.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Check if already marked
        const occurrence = classOccurrences.find(
          (o) => o.subject_id === schedule.subject_id && 
                 o.date === today && 
                 normalizeTimeHM(o.start_time) === normalizeTimeHM(schedule.start_time)
        );

        let status: "upcoming" | "ongoing" | "ended" = "upcoming";
        if (currentMinutes >= endMinutes) {
          status = "ended";
        } else if (currentMinutes >= startMinutes) {
          status = "ongoing";
        }

        return {
          scheduleId: schedule.$id,
          subjectId: subject.$id,
          subjectName: subject.name,
          shortName: subject.short_name,
          color: subject.color,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          room: schedule.room,
          status,
          isMarked: !!occurrence,
          markedState: (occurrence
            ? occurrence.status === "cancelled"
              ? "cancelled"
              : occurrence.attendance
            : null) as TodayClass["markedState"],
          minutesUntil: startMinutes - currentMinutes,
          minutesSinceEnd: currentMinutes - endMinutes,
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [now, getTodaySchedules, getSubjectById, classOccurrences, activeSemesterFilterId]);

  // Classes that need attendance marking (ended 30+ min ago, not marked)
  const pendingAttendance = useMemo(() => {
    return todayClasses.filter(
      (c) => c.status === "ended" && !c.isMarked && c.minutesSinceEnd >= 30 && c.minutesSinceEnd <= 120
    );
  }, [todayClasses]);

  // Find free time slots (gaps > 1h 15min)
  const freeTimeSlots = useMemo(() => {
    const gaps: { start: string; end: string; duration: number }[] = [];
    const sortedClasses = [...todayClasses].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Check from 8 AM
    if (sortedClasses.length > 0) {
      const firstClass = sortedClasses[0];
      const [firstH, firstM] = firstClass.startTime.split(":").map(Number);
      const firstMinutes = firstH * 60 + firstM;
      const dayStart = 8 * 60; // 8 AM

      if (firstMinutes - dayStart >= 75) {
        gaps.push({
          start: "08:00",
          end: firstClass.startTime,
          duration: firstMinutes - dayStart,
        });
      }
    }

    // Check between classes
    for (let i = 0; i < sortedClasses.length - 1; i++) {
      const current = sortedClasses[i];
      const next = sortedClasses[i + 1];
      const [endH, endM] = current.endTime.split(":").map(Number);
      const [startH, startM] = next.startTime.split(":").map(Number);
      const endMinutes = endH * 60 + endM;
      const startMinutes = startH * 60 + startM;
      const gap = startMinutes - endMinutes;

      if (gap >= 75) {
        gaps.push({
          start: current.endTime,
          end: next.startTime,
          duration: gap,
        });
      }
    }

    return gaps
      .map((gap) => {
        const [startH, startM] = gap.start.split(":").map(Number);
        const [endH, endM] = gap.end.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        if (endMinutes <= nowMinutes) return null;
        if (startMinutes >= nowMinutes) return gap;
        const adjustedDuration = endMinutes - nowMinutes;
        return {
          start: `${String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:${String(nowMinutes % 60).padStart(2, "0")}`,
          end: gap.end,
          duration: adjustedDuration,
        };
      })
      .filter((gap): gap is { start: string; end: string; duration: number } => Boolean(gap));
  }, [todayClasses, now]);

  const visibleTodayClasses = useMemo(() => {
    return todayClasses.filter((cls) => cls.status !== "ended" || cls.minutesSinceEnd <= 60);
  }, [todayClasses]);

  const pendingTasksForActiveSemester = useMemo(() => {
    return tasks.filter(
      (task) =>
        !task.deleted_at &&
        !task.is_completed &&
        (!activeSemesterFilterId || task.semester_id === activeSemesterFilterId)
    );
  }, [tasks, activeSemesterFilterId]);

  const dueTodayTasks = useMemo(
    () =>
      pendingTasksForActiveSemester.filter(
        (task) => task.deadline && isToday(parseISO(task.deadline))
      ),
    [pendingTasksForActiveSemester]
  );

  const otherPendingTasks = useMemo(
    () =>
      pendingTasksForActiveSemester.filter(
        (task) => !task.deadline || !isToday(parseISO(task.deadline))
      ),
    [pendingTasksForActiveSemester]
  );
  const hasPendingTasks = pendingTasksForActiveSemester.length > 0;

  const handleCompleteTask = (taskId: string): void => {
    void toggleTaskComplete(taskId);
    toast.success("Task completed", {
      action: {
        label: "Undo",
        onClick: () => {
          void toggleTaskComplete(taskId);
        },
      },
    });
  };

  // Count subjects per semester
  const getSubjectCount = (semesterId: string): number => {
    return subjects.filter(
      (s) => s.semester_id === semesterId && !s.deleted_at
    ).length;
  };

  const handleArchive = (semester: { $id: string; is_archived: boolean }) => {
    if (semester.is_archived) {
      unarchiveSemester(semester.$id);
    } else {
      archiveSemester(semester.$id);
    }
  };

  const handleMarkAttendance = async (cls: TodayClass, attendance: "present" | "absent" | "cancelled") => {
    const today = format(now, "yyyy-MM-dd");
    const existingOccurrence = classOccurrences.find(
      (o) => o.subject_id === cls.subjectId && o.date === today && normalizeTimeHM(o.start_time) === normalizeTimeHM(cls.startTime)
    );

    if (existingOccurrence) {
      await markAttendance(cls.subjectId, today, cls.startTime, attendance);
    } else {
      await createAndMarkAttendance(
        cls.subjectId,
        today,
        cls.startTime,
        cls.endTime,
        attendance,
        cls.scheduleId
      );
    }
    
    if (attendance === "absent") {
      toast("Marked as Absent", {
        action: {
          label: "Undo",
          onClick: () => {
            const occurrence = classOccurrences.find(
              (o) => o.subject_id === cls.subjectId && o.date === today && normalizeTimeHM(o.start_time) === normalizeTimeHM(cls.startTime)
            );
            if (occurrence) {
              return markAttendance(cls.subjectId, today, cls.startTime, "present");
            }
            return createAndMarkAttendance(
              cls.subjectId,
              today,
              cls.startTime,
              cls.endTime,
              "present",
              cls.scheduleId
            );
          },
        },
      });
    } else {
      toast.success(`Marked as ${attendance === "present" ? "Present" : "Cancelled"}`);
    }
  };

  // Get current day name
  const dayOfWeek = now.getDay();
  const currentDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.main
      className="min-h-screen p-6 pb-28 md:pb-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 items-start md:items-center gap-3">
            <h1 className="hidden md:block text-2xl md:text-3xl font-bold text-foreground md:text-left">
              {format(now, "HH:mm")}
            </h1>

            <div className="text-left md:text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Good {now.getHours() < 12 ? "Morning" : now.getHours() < 17 ? "Afternoon" : "Evening"}, Melvin
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(now, "EEEE, MMMM d")} • {ongoingSemester?.name ?? "No active semester"}
              </p>
            </div>

            <div className="md:justify-self-end w-full md:w-64">
              <ThemedSelect
                value={activeSemesterId ?? "__auto__"}
                onChange={(value) => setActiveSemesterId(value === "__auto__" ? null : value)}
                options={activeSemesterOptions}
                placeholder="Select active semester"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Auto-Suggest Cards */}
            {pendingAttendance.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {pendingAttendance.map((cls) => (
                  <motion.div
                    key={cls.scheduleId}
                    variants={cardVariants}
                    className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${cls.color}30` }}
                        >
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {cls.shortName} class ended {cls.minutesSinceEnd} min ago
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cls.startTime} - {cls.endTime} {cls.room && `• ${cls.room}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkAttendance(cls, "present")}
                          className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                          title="Present"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(cls, "absent")}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                          title="Absent"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(cls, "cancelled")}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-muted-foreground transition-colors"
                          title="Cancelled"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Today's Classes */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[rgb(var(--accent))]" />
                  <h2 className="text-lg font-semibold text-foreground">Today&apos;s Classes</h2>
                </div>
                <Link
                  href="/timetable"
                  className="interactive-surface interactive-focus rounded-lg px-2 py-1 text-sm text-[rgb(var(--accent))] hover:bg-[rgba(var(--accent),0.12)]"
                >
                  View Timetable
                </Link>
              </div>

              {visibleTodayClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Coffee className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No classes scheduled for today
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleTodayClasses.map((cls) => (
                    <div
                      key={cls.scheduleId}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-xl border transition-colors",
                        cls.status === "ongoing"
                          ? "bg-[rgba(var(--accent),0.1)] border-[rgba(var(--accent),0.3)]"
                          : cls.status === "ended"
                          ? "bg-white/3 border-white/5 opacity-60"
                          : "bg-white/5 border-white/10"
                      )}
                    >
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: cls.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {cls.shortName}
                          </span>
                          {cls.status === "ongoing" && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                              Now
                            </span>
                          )}
                          {cls.isMarked && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cls.startTime} - {cls.endTime}
                          {cls.room && ` • ${cls.room}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cls.status === "upcoming" && cls.minutesUntil > 0 && (
                          <span className="text-xs text-muted-foreground mr-1">
                            in {cls.minutesUntil} min
                          </span>
                        )}
                        {cls.isMarked && (
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[11px] rounded-full capitalize",
                              cls.markedState === "present" && "bg-emerald-500/20 text-emerald-400",
                              cls.markedState === "absent" && "bg-red-500/20 text-red-400",
                              cls.markedState === "cancelled" && "bg-white/10 text-muted-foreground"
                            )}
                          >
                            {cls.markedState}
                          </span>
                        )}
                        <button
                          onClick={() => void handleMarkAttendance(cls, "present")}
                          className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                          title="Present"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void handleMarkAttendance(cls, "absent")}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                          title="Absent"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void handleMarkAttendance(cls, "cancelled")}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-muted-foreground transition-colors"
                          title="Cancelled"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Tasks - Mobile (above semesters) */}
            {hasPendingTasks ? (
              <DashboardTasksCard
                dueTodayTasks={dueTodayTasks}
                otherPendingTasks={otherPendingTasks}
                getSubjectById={getSubjectById}
                onCompleteTask={handleCompleteTask}
                className="lg:hidden"
              />
            ) : null}

            {/* Semester List */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {showArchived ? "Archived Semesters" : "Semesters"}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      showArchived
                        ? "bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))]"
                        : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                    title={showArchived ? "Show active" : "Show archived"}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(var(--accent),0.2)] hover:bg-[rgba(var(--accent),0.3)] text-[rgb(var(--accent))] text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New</span>
                  </button>
                </div>
              </div>

              {displayedSemesters.length > 0 ? (
                <motion.div
                  className="grid gap-4 sm:grid-cols-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {displayedSemesters.map((semester) => (
                    <SemesterCard
                      key={semester.$id}
                      semester={semester}
                      subjectCount={getSubjectCount(semester.$id)}
                      onArchive={handleArchive}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="glass-card flex flex-col items-center justify-center py-12 text-center rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                    {showArchived ? (
                      <Archive className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <Settings className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    {showArchived ? "No archived semesters" : "No semesters yet"}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs mb-4">
                    {showArchived
                      ? "Archived semesters will appear here."
                      : "Create your first semester to get started."}
                  </p>
                  {!showArchived && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(var(--accent),0.2)] hover:bg-[rgba(var(--accent),0.3)] text-[rgb(var(--accent))] text-sm font-medium transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Create Semester
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Tasks & Free Time */}
          <div className="space-y-6">
            {hasPendingTasks ? (
              <DashboardTasksCard
                dueTodayTasks={dueTodayTasks}
                otherPendingTasks={otherPendingTasks}
                getSubjectById={getSubjectById}
                onCompleteTask={handleCompleteTask}
                className="hidden lg:block"
              />
            ) : null}

            {/* Free Time Finder */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Coffee className="w-4 h-4 text-[rgb(var(--accent))]" />
                <h3 className="text-sm font-medium text-muted-foreground">Free Time Today</h3>
              </div>

              {freeTimeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {visibleTodayClasses.length === 0
                      ? "You're free all day! 🎉"
                      : "No significant breaks between classes."}
                  </p>
              ) : (
                <div className="space-y-2">
                  {freeTimeSlots.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-foreground">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">
                        {Math.floor(slot.duration / 60)}h {slot.duration % 60}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Ongoing Semester Quick Link */}
            {ongoingSemester && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.25 }}
              >
                <Link
                  href={`/semester/${ongoingSemester.$id}`}
                  className="block bg-[rgba(var(--accent),0.1)] backdrop-blur-xl border border-[rgba(var(--accent),0.2)] rounded-2xl p-5 hover:bg-[rgba(var(--accent),0.15)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${ongoingSemester.color}30` }}
                    >
                      <TrendingUp className="w-5 h-5" style={{ color: ongoingSemester.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{ongoingSemester.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getSubjectCount(ongoingSemester.$id)} subjects
                        {ongoingSemester.target_spi && ` • Target: ${ongoingSemester.target_spi} SPI`}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Create Semester Modal */}
      <CreateSemesterModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </motion.main>
  );
}

interface DashboardTasksCardProps {
  dueTodayTasks: Array<{ $id: string; title: string; deadline: string | null; subject_id: string | null }>;
  otherPendingTasks: Array<{ $id: string; title: string; deadline: string | null; subject_id: string | null }>;
  getSubjectById: (id: string) => { short_name: string } | undefined;
  onCompleteTask: (taskId: string) => void;
  className?: string;
}

function DashboardTasksCard({
  dueTodayTasks,
  otherPendingTasks,
  getSubjectById,
  onCompleteTask,
  className,
}: DashboardTasksCardProps): React.ReactNode {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.12 }}
      className={cn("glass-card rounded-2xl p-5", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
        <Link
          href="/tasks"
          className="text-xs text-[rgb(var(--accent))] hover:underline underline-offset-4"
        >
          View all
        </Link>
      </div>

      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-300 mb-2">Due Today</p>
          {dueTodayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending tasks due today.</p>
          ) : (
            <div className="space-y-2">
              {dueTodayTasks.map((task) => {
                const subject = task.subject_id ? getSubjectById(task.subject_id) : undefined;
                return (
                  <div key={task.$id} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.deadline ? `Today ${format(parseISO(task.deadline), "HH:mm")}` : "Today"}
                          {subject ? ` • ${subject.short_name}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => onCompleteTask(task.$id)}
                        className="p-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                        title="Mark complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-white/60 mb-2">Other Pending</p>
          {otherPendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other pending tasks.</p>
          ) : (
            <div className="space-y-2">
              {otherPendingTasks.map((task) => {
                const subject = task.subject_id ? getSubjectById(task.subject_id) : undefined;
                return (
                  <div key={task.$id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.deadline ? format(parseISO(task.deadline), "MMM d, HH:mm") : "No deadline"}
                          {subject ? ` • ${subject.short_name}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => onCompleteTask(task.$id)}
                        className="p-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                        title="Mark complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
