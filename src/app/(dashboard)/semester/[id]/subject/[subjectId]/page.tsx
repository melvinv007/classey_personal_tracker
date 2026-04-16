"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Edit3, MoreHorizontal, CheckCircle2, XCircle, 
  MinusCircle, Calendar, TrendingUp, Clock, User, Award, Check, X,
  Link as LinkIcon, StickyNote, PlayCircle, Globe, FileText, Code2, Pin, Trash2, ExternalLink, Loader2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useData } from "@/hooks/use-data";
import { useThemeStore } from "@/stores/theme-store";
import { ConfirmActionModal, EditSubjectModal } from "@/components/modals";
import { CreateExamModal } from "@/components/modals/CreateExamModal";
import { AddResourceLinkModal } from "@/components/modals/AddResourceLinkModal";
import { AddNoteModal } from "@/components/modals/AddNoteModal";
import { EditExamMarksModal } from "@/components/modals/EditExamMarksModal";
import { UploadFileModal } from "@/components/modals/UploadFileModal";
import { EditAttendanceHistoryModal } from "@/components/modals/EditAttendanceHistoryModal";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { ThemedTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { PersistentNotepad } from "@/components/ui/PersistentNotepad";
import { hexToRgbComma, cn, DAY_SHORT_NAMES, normalizeTimeHM } from "@/lib/utils";
import { getDayName } from "@/utils/slots";
import { toast } from "sonner";
import { addDays, format, parseISO } from "date-fns";
import { deleteFile, getFileDownloadUrl, getFileViewUrl } from "@/lib/appwrite-storage";
import type { ClassOccurrence } from "@/types/database";

const pageVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

/**
 * Circular progress ring for attendance
 */
function AttendanceRing({ 
  percentage, 
  requirement = 75,
  color,
  size = 120,
}: { 
  percentage: number; 
  requirement?: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStatusColor = () => {
    if (percentage >= requirement) return color;
    if (percentage >= requirement - 5) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStatusColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{Math.round(percentage)}%</span>
        <span className="text-xs text-muted-foreground">Attendance</span>
      </div>
    </div>
  );
}

export default function SubjectDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const semesterId = params.id as string;
  const subjectId = params.subjectId as string;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [manualDayOfWeek, setManualDayOfWeek] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualEndTime, setManualEndTime] = useState("10:00");
  const [manualRoom, setManualRoom] = useState("");
  const [isAttendanceHistoryModalOpen, setIsAttendanceHistoryModalOpen] = useState(false);
  const [isConfirmDeleteSubjectOpen, setIsConfirmDeleteSubjectOpen] = useState(false);
  const [isConfirmDeleteFileOpen, setIsConfirmDeleteFileOpen] = useState(false);
  const [deleteFileTarget, setDeleteFileTarget] = useState<{ fileId: string; storageFileId: string; fileName: string } | null>(null);
  const [isConfirmDeleteScheduleOpen, setIsConfirmDeleteScheduleOpen] = useState(false);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<{ id: string; label: string } | null>(null);
  const [isConfirmDeleteLinkOpen, setIsConfirmDeleteLinkOpen] = useState(false);
  const [deleteLinkTarget, setDeleteLinkTarget] = useState<{ id: string; title: string } | null>(null);
  const [isConfirmDeleteNoteOpen, setIsConfirmDeleteNoteOpen] = useState(false);
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<{ id: string; preview: string } | null>(null);

  const {
    getSemesterById, 
    getSubjectById, 
    markAttendance, 
    createAndMarkAttendance,
    addClassOccurrence,
    getOccurrencesBySubject, 
    getSchedulesBySubject, 
    getExamsBySubject, 
    getLinksBySubject, 
    getNotesBySubject,
    getFilesBySubject,
    addClassSchedule,
    deleteClassSchedule,
    updateClassOccurrence,
    deleteClassOccurrence,
    deleteNote,
    updateNote,
    deleteResourceLink,
    settings,
    getHolidaysBySemester,
    refetch,
    isLoading
  } = useData();
  
  const semester = getSemesterById(semesterId);
  const subject = getSubjectById(subjectId);
  const setAccentColor = useThemeStore((s) => s.setAccentColor);

  // Get data
  const occurrences = getOccurrencesBySubject(subjectId);
  const schedules = getSchedulesBySubject(subjectId);
  const semesterHolidays = getHolidaysBySemester(semesterId);
  const exams = getExamsBySubject(subjectId);
  const resourceLinks = getLinksBySubject(subjectId);
  const notes = getNotesBySubject(subjectId);
  const files = getFilesBySubject(subjectId);
  
  // Calculate attendance stats
  const nonCancelled = occurrences.filter(o => o.status !== "cancelled");
  const cancelled = occurrences.filter(o => o.status === "cancelled").length;
  const present = occurrences.filter(o => o.attendance === "present").length;
  const absent = occurrences.filter(o => o.attendance === "absent").length;
  const requirement = subject?.attendance_requirement_percent ?? 75;
  
  // Calculate bunk capacity
  const percentage = nonCancelled.length > 0 ? (present / nonCancelled.length) * 100 : 0;
  const maxTotal = Math.floor((present * 100) / requirement);
  const canBunk = Math.max(0, maxTotal - nonCancelled.length);
  const classesNeeded = percentage >= requirement ? 0 : Math.ceil((requirement * nonCancelled.length - 100 * present) / (100 - requirement));
  
  const stats = {
    percentage,
    present,
    absent,
    cancelled,
    total: nonCancelled.length,
    canBunk,
    classesNeeded,
  };

  const subjectStartDate = subject?.start_date ?? semester?.start_date ?? null;
  const subjectEndDate = subject?.end_date ?? semester?.end_date ?? null;
  const currentDateTime = new Date();
  const currentDate = format(currentDateTime, "yyyy-MM-dd");
  const currentTime = format(currentDateTime, "HH:mm");

  const scheduleWithinRange = (effectiveFrom: string, effectiveUntil: string | null, date: string): boolean =>
    effectiveFrom <= date && (!effectiveUntil || effectiveUntil >= date);

  const attendanceHistory = useMemo((): ClassOccurrence[] => {
    if (!subjectStartDate || !subjectEndDate) return [];

    const existingMap = new Map<string, typeof occurrences[number]>();
    for (const occurrence of occurrences) {
      const key = `${occurrence.date}|${normalizeTimeHM(occurrence.start_time)}|${normalizeTimeHM(occurrence.end_time)}`;
      if (!existingMap.has(key)) {
        existingMap.set(key, occurrence);
      }
    }

    const history: ClassOccurrence[] = [];
    let cursor = parseISO(subjectStartDate);
    const end = parseISO(subjectEndDate);

    while (cursor <= end) {
      const date = format(cursor, "yyyy-MM-dd");
      const day = cursor.getDay() === 0 ? 7 : cursor.getDay();
      const activeForDate = schedules.filter(
        (schedule) =>
          schedule.day_of_week === day &&
          scheduleWithinRange(schedule.effective_from, schedule.effective_until, date)
      );

      for (const schedule of activeForDate) {
        const key = `${date}|${normalizeTimeHM(schedule.start_time)}|${normalizeTimeHM(schedule.end_time)}`;
        const existing = existingMap.get(key);
        if (existing) {
          history.push(existing);
          continue;
        }

        history.push({
          $id: `expected:${date}:${schedule.$id}`,
          $createdAt: "",
          $updatedAt: "",
          $collectionId: "",
          $databaseId: "",
          $permissions: [],
          subject_id: subjectId,
          schedule_id: schedule.$id,
          date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          status: "scheduled",
          cancellation_reason: null,
          rescheduled_to: null,
          attendance: null,
          attendance_marked_at: null,
          attendance_note: null,
          is_extra_class: false,
        });
      }

      cursor = addDays(cursor, 1);
    }

    return history.sort((a, b) => {
      const left = `${a.date}T${a.start_time}`;
      const right = `${b.date}T${b.start_time}`;
      return right.localeCompare(left);
    });
  }, [occurrences, scheduleWithinRange, schedules, subjectEndDate, subjectId, subjectStartDate]);

  const expectedClassStats = useMemo(() => {
    if (!subjectStartDate || !subjectEndDate) {
      return { total: 0, left: 0 };
    }
    const scheduleDayMap = new Map<number, Array<{ start: string; end: string }>>();
    for (const schedule of schedules) {
      const items = scheduleDayMap.get(schedule.day_of_week) ?? [];
      items.push({ start: schedule.start_time, end: schedule.end_time });
      scheduleDayMap.set(schedule.day_of_week, items);
    }
    let total = 0;
    let left = 0;
    let cursor = parseISO(subjectStartDate);
    const end = parseISO(subjectEndDate);
    while (cursor <= end) {
      const date = format(cursor, "yyyy-MM-dd");
      const day = cursor.getDay() === 0 ? 7 : cursor.getDay();
      const daySchedules = scheduleDayMap.get(day);
      if (daySchedules && daySchedules.length > 0) {
        const activeForDate = schedules.filter(
          (schedule) =>
            schedule.day_of_week === day &&
            scheduleWithinRange(schedule.effective_from, schedule.effective_until, date)
        );
        for (const schedule of activeForDate) {
          const cancelledByNoClass = semesterHolidays.some((holiday) => {
            if (holiday.date > date) return false;
            const endDate = holiday.date_end ?? holiday.date;
            return date <= endDate;
          });
          if (cancelledByNoClass) {
            continue;
          }
          total += 1;
          const notStartedYet =
            date > currentDate || (date === currentDate && normalizeTimeHM(schedule.start_time) > normalizeTimeHM(currentTime));
          if (notStartedYet && !cancelledByNoClass) {
            left += 1;
          }
        }
      }
      cursor = addDays(cursor, 1);
    }
    return { total, left };
  }, [subjectStartDate, subjectEndDate, schedules, currentDate, currentTime, semesterHolidays]);

  const classesAttended = occurrences.filter(
    (occurrence) =>
      occurrence.attendance === "present" &&
      occurrence.status !== "cancelled" &&
      (!subjectStartDate || occurrence.date >= subjectStartDate) &&
      (!subjectEndDate || occurrence.date <= subjectEndDate)
  ).length;
  const autoAbsentHours = settings?.auto_absent_hours ?? 48;
  
  // Modal state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isResourceLinkModalOpen, setIsResourceLinkModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [examForMarks, setExamForMarks] = useState<typeof exams[0] | null>(null);

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const currentDay = new Date().getDay() === 0 ? 7 : new Date().getDay();

  const todaySubjectClasses = useMemo(() => {
    return schedules
      .filter((schedule) => schedule.day_of_week === currentDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((schedule) => {
        const existingOccurrence = occurrences.find(
          (occurrence) =>
            occurrence.date === todayDate &&
            normalizeTimeHM(occurrence.start_time) === normalizeTimeHM(schedule.start_time) &&
            normalizeTimeHM(occurrence.end_time) === normalizeTimeHM(schedule.end_time)
        );
        return {
          schedule,
          existingOccurrence,
        };
      });
  }, [currentDay, schedules, occurrences, todayDate]);

  const handleMarkTodaySubjectAttendance = async (
    scheduleId: string,
    startTime: string,
    endTime: string,
    attendance: "present" | "absent" | "cancelled"
  ): Promise<void> => {
    const existingOccurrence = occurrences.find(
      (occurrence) =>
        occurrence.date === todayDate &&
        normalizeTimeHM(occurrence.start_time) === normalizeTimeHM(startTime) &&
        normalizeTimeHM(occurrence.end_time) === normalizeTimeHM(endTime)
    );

    if (existingOccurrence) {
      await markAttendance(subjectId, todayDate, startTime, attendance);
    } else {
      await createAndMarkAttendance(
        subjectId,
        todayDate,
        startTime,
        endTime,
        attendance,
        scheduleId
      );
    }
  };

  // Set semester accent color
  useEffect(() => {
    if (semester) {
      setAccentColor(semester.color);
    }
  }, [semester, setAccentColor]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  if (!semester || !subject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">Subject not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This subject may have been deleted.
          </p>
          <button
            onClick={() => router.push(`/semester/${semesterId}`)}
            className="px-4 py-2 rounded-xl bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))] font-medium"
          >
            Back to Semester
          </button>
        </div>
      </div>
    );
  }

  const accentRgb = hexToRgbComma(subject.color);

  const handleDelete = async (): Promise<void> => {
    try {
      const response = await fetch("/api/data/cascade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-subject", subjectId: subject.$id }),
      });
      const result = (await response.json()) as { success: boolean; error?: string; deleted?: { exams?: number; files?: number; schedules?: number } };
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete subject");
      }
      toast.success(
        `Subject deleted (${result.deleted?.exams ?? 0} exams, ${result.deleted?.files ?? 0} files, ${result.deleted?.schedules ?? 0} schedules).`
      );
      router.push(`/semester/${semesterId}`);
    } catch (error) {
      toast.error(`Failed to delete subject: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteSubjectFile = async (fileId: string, storageFileId: string): Promise<void> => {
    setDeletingFileId(fileId);
    try {
      await deleteFile(fileId, storageFileId);
      refetch();
      toast.success("File deleted");
    } catch (error) {
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDeleteSubjectFileConfirmed = async (): Promise<void> => {
    if (!deleteFileTarget) return;
    await handleDeleteSubjectFile(deleteFileTarget.fileId, deleteFileTarget.storageFileId);
    setDeleteFileTarget(null);
    setIsConfirmDeleteFileOpen(false);
  };

  const handleAddManualSchedule = async (): Promise<void> => {
    if (manualStartTime >= manualEndTime) {
      toast.error("End time must be after start time");
      return;
    }
    try {
      await addClassSchedule({
        subject_id: subjectId,
        slot_id: null,
        sub_slot_id: null,
        day_of_week: manualDayOfWeek,
        start_time: manualStartTime,
        end_time: manualEndTime,
        room: manualRoom.trim() || null,
        building: null,
        effective_from: semester.start_date,
        effective_until: null,
        deleted_at: null,
      });
      refetch();
      toast.success("Class schedule added");
    } catch (error) {
      toast.error(`Failed to add schedule: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string): Promise<void> => {
    try {
      await deleteClassSchedule(scheduleId);
      refetch();
      toast.success("Schedule removed");
    } catch (error) {
      toast.error(`Failed to remove schedule: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteScheduleConfirmed = async (): Promise<void> => {
    if (!deleteScheduleTarget) return;
    await handleDeleteSchedule(deleteScheduleTarget.id);
    setDeleteScheduleTarget(null);
    setIsConfirmDeleteScheduleOpen(false);
  };

  return(
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
            onClick={() => router.push(`/semester/${semesterId}`)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {semester.name}
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
                  style={{ backgroundColor: subject.color }}
                />
                <span
                  className="px-2.5 py-1 text-sm font-medium rounded-lg"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.2)`,
                    color: subject.color,
                  }}
                >
                  {subject.short_name}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs rounded capitalize",
                    subject.type === "lab" && "bg-amber-500/20 text-amber-400",
                    subject.type === "theory" && "bg-blue-500/20 text-blue-400",
                    subject.type === "practical" && "bg-purple-500/20 text-purple-400",
                    subject.type === "project" && "bg-emerald-500/20 text-emerald-400",
                    subject.type === "other" && "bg-white/10 text-muted-foreground"
                  )}
                >
                  {subject.type}
                </span>
              </motion.div>

              <motion.h1
                className="text-2xl md:text-3xl font-bold text-foreground mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                {subject.name}
              </motion.h1>

              <motion.div
                className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {subject.code && (
                  <span className="flex items-center gap-1.5">
                    Code: {subject.code}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  {subject.credits} Credits
                </span>
                {subject.teacher_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {subject.teacher_name}
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
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit subject"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Attendance Overview */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Attendance Ring Card */}
          <div className="glass-card rounded-2xl p-6 flex items-center gap-6">
            <AttendanceRing
              percentage={stats.percentage}
              requirement={requirement}
              color={subject.color}
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Present</span>
                <span className="text-sm font-medium text-emerald-400">{stats.present}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Absent</span>
                <span className="text-sm font-medium text-red-400">{stats.absent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                <span className="text-sm font-medium text-muted-foreground">{stats.cancelled}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Classes</span>
                <span className="text-sm font-medium text-foreground">{stats.total}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Requirement</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{requirement}%</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              {stats.percentage >= requirement ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-muted-foreground">Can Bunk</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.canBunk}</p>
                  <p className="text-xs text-muted-foreground">classes</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-muted-foreground">Need</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">{stats.classesNeeded}</p>
                  <p className="text-xs text-muted-foreground">more classes</p>
                </>
              )}
            </div>

            {subject.grade && (
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Grade</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: subject.color }}>
                  {subject.grade}
                </p>
              </div>
            )}

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Classes</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{expectedClassStats.total}</p>
              <p className="text-xs text-muted-foreground">in subject date range</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Classes Left</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{expectedClassStats.left}</p>
              <p className="text-xs text-muted-foreground">from now onward</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Classes Attended</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{classesAttended}</p>
              <p className="text-xs text-muted-foreground">marked present</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Mark Attendance */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Mark Attendance</h2>
          {todaySubjectClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No class scheduled for this subject today.
            </p>
          ) : (
            <div className="space-y-3">
              {todaySubjectClasses.map(({ schedule, existingOccurrence }) => {
                const markedState: "present" | "absent" | "cancelled" | null = existingOccurrence
                  ? existingOccurrence.status === "cancelled"
                    ? "cancelled"
                    : existingOccurrence.attendance
                  : null;

                return (
                  <div
                    key={schedule.$id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/3"
                  >
                    <div>
                      <p className="text-sm text-foreground">
                        {getDayName(schedule.day_of_week, true)} • {schedule.start_time} - {schedule.end_time}
                        {schedule.room ? ` • ${schedule.room}` : ""}
                      </p>
                      {markedState && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          Marked: {markedState}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleMarkTodaySubjectAttendance(schedule.$id, schedule.start_time, schedule.end_time, "present")}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Present
                      </button>
                      <button
                        onClick={() => void handleMarkTodaySubjectAttendance(schedule.$id, schedule.start_time, schedule.end_time, "absent")}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Absent
                      </button>
                      <button
                        onClick={() => void handleMarkTodaySubjectAttendance(schedule.$id, schedule.start_time, schedule.end_time, "cancelled")}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-sm font-medium transition-all"
                      >
                        <MinusCircle className="w-4 h-4" />
                        Cancelled
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Schedule Section */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Class Schedules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <ThemedSelect
              value={String(manualDayOfWeek)}
              onChange={(value) => setManualDayOfWeek(Number(value) as 1 | 2 | 3 | 4 | 5 | 6)}
              options={[
                { value: "1", label: "Mon" },
                { value: "2", label: "Tue" },
                { value: "3", label: "Wed" },
                { value: "4", label: "Thu" },
                { value: "5", label: "Fri" },
                { value: "6", label: "Sat" },
              ]}
              className="px-3 py-2 text-sm"
            />
            <ThemedTimeInput value={manualStartTime} onChange={setManualStartTime} className="px-3 py-2 text-sm" />
            <ThemedTimeInput value={manualEndTime} onChange={setManualEndTime} className="px-3 py-2 text-sm" />
            <input
              value={manualRoom}
              onChange={(e) => setManualRoom(e.target.value)}
              placeholder="Room (optional)"
              className="px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-sm text-foreground placeholder:text-white/40"
            />
            <button
              onClick={() => void handleAddManualSchedule()}
              className="px-3 py-2 rounded-lg bg-[rgba(var(--accent),0.15)] hover:bg-[rgba(var(--accent),0.25)] text-sm text-[rgb(var(--accent))] transition-colors"
            >
              + Add
            </button>
          </div>

          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedules added yet.</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div key={schedule.$id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/3">
                  <p className="text-sm text-foreground">
                    {getDayName(schedule.day_of_week, true)} • {schedule.start_time} - {schedule.end_time}
                    {schedule.room ? ` • ${schedule.room}` : ""}
                  </p>
                  <button
                    onClick={() => {
                      setDeleteScheduleTarget({
                        id: schedule.$id,
                        label: `${getDayName(schedule.day_of_week, true)} ${schedule.start_time}-${schedule.end_time}`,
                      });
                      setIsConfirmDeleteScheduleOpen(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Exams Section */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Exams & Assessments</h2>
            <button 
              onClick={() => setIsExamModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[rgba(var(--accent),0.1)] hover:bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
            >
              + Add Exam
            </button>
          </div>

          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No exams yet. Track quizzes, assignments, and tests for this subject.
              </p>
              <button 
                onClick={() => setIsExamModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[rgba(var(--accent),0.15)] hover:bg-[rgba(var(--accent),0.25)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
              >
                Add First Exam
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => {
                const examDate = parseISO(exam.date);
                const isUpcoming = exam.status === "upcoming";
                const isCompleted = exam.status === "completed";
                const hasMarks = exam.marks_obtained !== null;
                const percentage = hasMarks ? (exam.marks_obtained! / exam.marks_total) * 100 : null;

                return (
                  <div
                    key={exam.$id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border border-white/10 transition-all hover:bg-white/5",
                      isUpcoming && "bg-[rgba(var(--accent),0.05)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          exam.type === "quiz" && "bg-purple-500/20 text-purple-400",
                          exam.type === "assignment" && "bg-emerald-500/20 text-emerald-400",
                          exam.type === "midterm" && "bg-amber-500/20 text-amber-400",
                          exam.type === "final" && "bg-red-500/20 text-red-400",
                          exam.type === "practical" && "bg-cyan-500/20 text-cyan-400",
                          exam.type === "other" && "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{exam.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(examDate, "MMM d, yyyy")}
                          {exam.start_time && ` at ${exam.start_time}`}
                          <span className="ml-2 capitalize px-1.5 py-0.5 rounded bg-white/5 text-xs">
                            {exam.type}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {hasMarks ? (
                        <>
                          <p 
                            className={cn(
                              "text-lg font-bold",
                              percentage! >= 90 && "text-emerald-400",
                              percentage! >= 75 && percentage! < 90 && "text-green-400",
                              percentage! >= 60 && percentage! < 75 && "text-amber-400",
                              percentage! < 60 && "text-red-400"
                            )}
                          >
                            {exam.marks_obtained}/{exam.marks_total}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {percentage!.toFixed(1)}%
                          </p>
                        </>
                      ) : isUpcoming ? (
                        <span className="px-2 py-1 rounded bg-[rgba(var(--accent),0.1)] text-[rgb(var(--accent))] text-xs font-medium">
                          Upcoming
                        </span>
                      ) : (
                        <button
                          onClick={() => setExamForMarks(exam)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-muted-foreground text-xs font-medium transition-colors"
                        >
                          + Add Marks
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Files Section */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Files</h2>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[rgba(var(--accent),0.1)] hover:bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
            >
              + Upload File
            </button>
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No files linked to this subject yet.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[rgba(var(--accent),0.15)] hover:bg-[rgba(var(--accent),0.25)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
              >
                Upload First File
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.$id}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.file_extension.toUpperCase()} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(getFileViewUrl(file.storage_file_id), "_blank")}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View
                    </button>
                    <a
                      href={getFileDownloadUrl(file.storage_file_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => {
                        setDeleteFileTarget({
                          fileId: file.$id,
                          storageFileId: file.storage_file_id,
                          fileName: file.file_name,
                        });
                        setIsConfirmDeleteFileOpen(true);
                      }}
                      disabled={deletingFileId === file.$id}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingFileId === file.$id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Resource Links Section */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Resources</h2>
            <button 
              onClick={() => setIsResourceLinkModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[rgba(var(--accent),0.1)] hover:bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
            >
              + Add Link
            </button>
          </div>

          {resourceLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LinkIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Save useful links like YouTube playlists, notes, or course materials.
              </p>
              <button 
                onClick={() => setIsResourceLinkModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[rgba(var(--accent),0.15)] hover:bg-[rgba(var(--accent),0.25)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
              >
                Add First Resource
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resourceLinks.map((link) => {
                const TypeIcon = link.type === "youtube" ? PlayCircle 
                  : link.type === "github" ? Code2 
                  : link.type === "notion" || link.type === "drive" ? FileText 
                  : Globe;
                const typeColor = link.type === "youtube" ? "#FF0000" 
                  : link.type === "github" ? "#6e5494" 
                  : link.type === "notion" ? "#000000" 
                  : link.type === "drive" ? "#4285F4" 
                  : "#8B5CF6";

                return (
                  <a
                    key={link.$id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/15 transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${typeColor}20` }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: typeColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate group-hover:text-[rgb(var(--accent))] transition-colors">
                        {link.title}
                      </p>
                      {link.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 truncate mt-1">
                        {link.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteLinkTarget({ id: link.$id, title: link.title });
                            setIsConfirmDeleteLinkOpen(true);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Notes Section */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Notes</h2>
            <button 
              onClick={() => setIsNoteModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[rgba(var(--accent),0.1)] hover:bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
            >
              + Add Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <StickyNote className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Jot down quick notes, reminders, or important points for this subject.
              </p>
              <button 
                onClick={() => setIsNoteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[rgba(var(--accent),0.15)] hover:bg-[rgba(var(--accent),0.25)] text-[rgb(var(--accent))] text-sm font-medium transition-colors"
              >
                Add First Note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.$id}
                  className={cn(
                    "group relative p-4 rounded-xl border transition-all",
                    note.is_pinned
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-white/3 border-white/10 hover:bg-white/5"
                  )}
                >
                  {note.is_pinned && (
                    <Pin className="absolute top-3 right-3 w-4 h-4 text-amber-400 fill-current" />
                  )}
                  <p className="text-sm text-foreground whitespace-pre-wrap pr-8">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(note.$createdAt), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          updateNote(note.$id, { is_pinned: !note.is_pinned });
                          toast.success(note.is_pinned ? "Note unpinned" : "Note pinned");
                        }}
                        className={cn(
                          "p-1 rounded transition-colors",
                          note.is_pinned
                            ? "hover:bg-amber-500/20 text-amber-400"
                            : "hover:bg-white/10 text-muted-foreground"
                        )}
                      >
                        <Pin className={cn("w-4 h-4", note.is_pinned && "fill-current")} />
                      </button>
                        <button
                          onClick={() => {
                          setDeleteNoteTarget({ id: note.$id, preview: note.content.slice(0, 40) });
                          setIsConfirmDeleteNoteOpen(true);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Attendance History */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Attendance History</h2>
            <button
              onClick={() => setIsAttendanceHistoryModalOpen(true)}
              className="text-sm text-[rgb(var(--accent))] hover:underline"
            >
              Edit History ({attendanceHistory.length})
            </button>
          </div>

          {attendanceHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Attendance history will appear here once classes are tracked.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.slice(0, 10).map((occurrence) => {
                const date = parseISO(occurrence.date);
                const dayOfWeek = date.getDay();
                const ourDay = dayOfWeek === 0 ? 7 : dayOfWeek;

                return (
                  <div
                    key={occurrence.$id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-colors",
                      occurrence.status === "cancelled"
                        ? "bg-white/3 border-white/5 opacity-60"
                        : occurrence.attendance === "present"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : occurrence.attendance === "absent"
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-white/5 border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          occurrence.status === "cancelled"
                            ? "bg-white/10 text-muted-foreground"
                            : occurrence.attendance === "present"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : occurrence.attendance === "absent"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        )}
                      >
                        {occurrence.status === "cancelled" ? (
                          <MinusCircle className="w-4 h-4" />
                        ) : occurrence.attendance === "present" ? (
                          <Check className="w-4 h-4" />
                        ) : occurrence.attendance === "absent" ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {format(date, "MMM d, yyyy")}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {DAY_SHORT_NAMES[ourDay] || ""}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {occurrence.start_time} - {occurrence.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded capitalize",
                          occurrence.status === "cancelled"
                            ? "bg-white/10 text-muted-foreground"
                            : occurrence.attendance === "present"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : occurrence.attendance === "absent"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        )}
                      >
                        {occurrence.status === "cancelled"
                          ? "Cancelled"
                          : occurrence.attendance ?? "Unmarked"}
                      </span>
                      {occurrence.attendance_note && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[120px] truncate">
                          {occurrence.attendance_note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Auto-absent</span>
          </div>
          <p className="text-sm font-medium text-foreground">{autoAbsentHours} hours</p>
          <p className="text-xs text-muted-foreground">after class</p>
        </motion.div>

        <PersistentNotepad
          storageKey={`classey:notepad:subject:${subjectId}`}
          title="Subject Notepad"
          placeholder="Write anything about this subject..."
          className="mb-8"
        />
      </div>

      {/* Edit Subject Modal */}
      <EditSubjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subject={subject}
        semesterStatus={semester.status}
        semesterStartDate={semester.start_date}
        semesterEndDate={semester.end_date}
        onDelete={() => setIsConfirmDeleteSubjectOpen(true)}
      />

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        subjectId={subjectId}
      />

      {/* Add Resource Link Modal */}
      <AddResourceLinkModal
        isOpen={isResourceLinkModalOpen}
        onClose={() => setIsResourceLinkModalOpen(false)}
        subjectId={subjectId}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        subjectId={subjectId}
      />

      {/* Edit Exam Marks Modal */}
      <EditExamMarksModal
        isOpen={!!examForMarks}
        onClose={() => setExamForMarks(null)}
        exam={examForMarks}
      />

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          refetch();
        }}
        defaultSubjectId={subjectId}
      />

      <EditAttendanceHistoryModal
        isOpen={isAttendanceHistoryModalOpen}
        onClose={() => setIsAttendanceHistoryModalOpen(false)}
        subjectColor={subject.color}
        occurrences={attendanceHistory}
        onSave={async (occurrenceId, changes) => {
          if (occurrenceId.startsWith("expected:")) {
            const scheduleId = occurrenceId.split(":").slice(2).join(":") || null;
            const status = changes.status ?? "scheduled";
            const attendance = status === "cancelled" ? null : (changes.attendance ?? null);
            await addClassOccurrence({
              subject_id: subjectId,
              schedule_id: scheduleId,
              date: changes.date ?? todayDate,
              start_time: changes.start_time ?? "09:00",
              end_time: changes.end_time ?? "10:00",
              status,
              cancellation_reason: status === "cancelled" ? (changes.cancellation_reason ?? "Edited as cancelled") : null,
              rescheduled_to: null,
              attendance,
              attendance_marked_at: attendance ? (changes.attendance_marked_at ?? new Date().toISOString()) : null,
              attendance_note: changes.attendance_note ?? null,
              is_extra_class: false,
            });
          } else {
            await updateClassOccurrence(occurrenceId, changes);
          }
          await refetch();
        }}
        onDelete={async (occurrenceId) => {
          if (!occurrenceId.startsWith("expected:")) {
            await deleteClassOccurrence(occurrenceId);
            await refetch();
          }
        }}
      />

      <ConfirmActionModal
        isOpen={isConfirmDeleteSubjectOpen}
        title="Delete subject permanently?"
        description={`This will permanently delete ${subject.name} and all linked schedules, attendance, exams, files, links, and notes.`}
        confirmText="Delete Subject"
        onConfirm={async () => {
          await handleDelete();
          setIsConfirmDeleteSubjectOpen(false);
        }}
        onCancel={() => setIsConfirmDeleteSubjectOpen(false)}
      />

      <ConfirmActionModal
        isOpen={isConfirmDeleteFileOpen}
        title="Delete file permanently?"
        description={deleteFileTarget ? `This will permanently delete "${deleteFileTarget.fileName}".` : ""}
        confirmText="Delete File"
        onConfirm={handleDeleteSubjectFileConfirmed}
        onCancel={() => {
          setDeleteFileTarget(null);
          setIsConfirmDeleteFileOpen(false);
        }}
      />

      <ConfirmActionModal
        isOpen={isConfirmDeleteScheduleOpen}
        title="Delete class schedule?"
        description={deleteScheduleTarget ? `This removes ${deleteScheduleTarget.label} from this subject.` : ""}
        confirmText="Delete Schedule"
        onConfirm={handleDeleteScheduleConfirmed}
        onCancel={() => {
          setDeleteScheduleTarget(null);
          setIsConfirmDeleteScheduleOpen(false);
        }}
      />

      <ConfirmActionModal
        isOpen={isConfirmDeleteLinkOpen}
        title="Delete resource link?"
        description={deleteLinkTarget ? `Delete "${deleteLinkTarget.title}" permanently.` : ""}
        confirmText="Delete Link"
        onConfirm={async () => {
          if (!deleteLinkTarget) return;
          await deleteResourceLink(deleteLinkTarget.id);
          toast.success("Link deleted");
          setDeleteLinkTarget(null);
          setIsConfirmDeleteLinkOpen(false);
        }}
        onCancel={() => {
          setDeleteLinkTarget(null);
          setIsConfirmDeleteLinkOpen(false);
        }}
      />

      <ConfirmActionModal
        isOpen={isConfirmDeleteNoteOpen}
        title="Delete note?"
        description={deleteNoteTarget ? `Delete note "${deleteNoteTarget.preview}${deleteNoteTarget.preview.length >= 40 ? "..." : ""}" permanently.` : ""}
        confirmText="Delete Note"
        onConfirm={async () => {
          if (!deleteNoteTarget) return;
          await deleteNote(deleteNoteTarget.id);
          toast.success("Note deleted");
          setDeleteNoteTarget(null);
          setIsConfirmDeleteNoteOpen(false);
        }}
        onCancel={() => {
          setDeleteNoteTarget(null);
          setIsConfirmDeleteNoteOpen(false);
        }}
      />
    </motion.main>
  );
}
