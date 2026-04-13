/**
 * Compatibility layer that provides data from Appwrite
 * via hooks similar to the old useDataStore API.
 * 
 * This allows gradual migration without rewriting all components.
 */

import { useMemo, useCallback } from "react";
import { format } from "date-fns";
import { normalizeTimeHM } from "@/lib/utils";
import { useSemesterStore } from "@/stores/semester-store";
import {
  useSemesters,
  useSubjects,
  useClassSchedules,
  useClassOccurrences,
  useExams,
  useTasks,
  useEvents,
  useFiles,
  useResourceLinks,
  useNotes,
  useCreateSemester,
  useUpdateSemester,
  useDeleteSemester,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskComplete,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useCreateFile,
  useDeleteFile,
  useCreateResourceLink,
  useDeleteResourceLink,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useMarkAttendance,
  useCreateClassOccurrence,
  useUpdateClassOccurrence,
  useDeleteClassOccurrence,
  useSlots,
  useCreateClassSchedule,
  useUpdateClassSchedule,
  useDeleteClassSchedule,
  useSettings,
  useUpdateSettings,
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from "./use-appwrite";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Semester,
  Subject,
  Slot,
  ClassSchedule,
  ClassOccurrence,
  Exam,
  Task,
  Event,
  ClasseyFile,
  ResourceLink,
  Note,
  Settings,
  ReminderOffset,
  Holiday,
} from "@/types/database";
import {
  parseReminderOffsetsJson,
  serializeReminderOffsetsJson,
} from "@/lib/appwrite-db";

// Calculate attendance stats from occurrences
function calculateAttendanceStats(
  occurrences: ClassOccurrence[],
  requiredPercent: number = 75
) {
  const nonCancelled = occurrences.filter(o => o.status !== "cancelled");
  const present = occurrences.filter(o => o.attendance === "present").length;
  const absent = occurrences.filter(o => o.attendance === "absent").length;
  const cancelled = occurrences.filter(o => o.status === "cancelled").length;
  const total = nonCancelled.length;
  const percentage = total > 0 ? (present / total) * 100 : 0;

  // Classes needed to reach required %
  const classesNeeded = percentage >= requiredPercent
    ? 0
    : Math.ceil((requiredPercent * total - 100 * present) / (100 - requiredPercent));

  // Classes can bunk while staying safe
  const maxTotal = Math.floor((present * 100) / requiredPercent);
  const canBunk = Math.max(0, maxTotal - total);

  return {
    total,
    present,
    absent,
    cancelled,
    percentage: Math.round(percentage * 10) / 10,
    classesNeeded: Math.max(0, classesNeeded),
    canBunk,
  };
}

/**
 * Main data hook that provides Appwrite data with familiar API
 */
export function useData() {
  const { activeSemesterId, setActiveSemesterId } = useSemesterStore();

  // Fetch all data
  const { data: semesters = [], isLoading: loadingSemesters, refetch: refetchSemesters } = useSemesters();
  const { data: subjects = [], isLoading: loadingSubjects, refetch: refetchSubjects } = useSubjects();
  const { data: classSchedules = [], isLoading: loadingSchedules } = useClassSchedules();
  const { data: slots = [], isLoading: loadingSlots, refetch: refetchSlots } = useSlots();
  const { data: classOccurrences = [], isLoading: loadingOccurrences } = useClassOccurrences();
  const { data: exams = [], isLoading: loadingExams, refetch: refetchExams } = useExams();
  const { data: tasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useTasks();
  const { data: events = [], isLoading: loadingEvents, refetch: refetchEvents } = useEvents();
  const { data: files = [], isLoading: loadingFiles, refetch: refetchFiles } = useFiles();
  const { data: resourceLinks = [], isLoading: loadingLinks, refetch: refetchLinks } = useResourceLinks();
  const { data: notes = [], isLoading: loadingNotes, refetch: refetchNotes } = useNotes();
  const { data: settings, isLoading: loadingSettings, refetch: refetchSettings } = useSettings();
  const { data: holidays = [], isLoading: loadingHolidays, refetch: refetchHolidays } = useHolidays();

  // Mutations
  const createSemesterMutation = useCreateSemester();
  const updateSemesterMutation = useUpdateSemester();
  const deleteSemesterMutation = useDeleteSemester();
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const createExamMutation = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const deleteExamMutation = useDeleteExam();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleTaskMutation = useToggleTaskComplete();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const createFileMutation = useCreateFile();
  const deleteFileMutation = useDeleteFile();
  const createLinkMutation = useCreateResourceLink();
  const deleteLinkMutation = useDeleteResourceLink();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const markAttendanceMutation = useMarkAttendance();
  const createClassOccurrenceMutation = useCreateClassOccurrence();
  const updateClassOccurrenceMutation = useUpdateClassOccurrence();
  const deleteClassOccurrenceMutation = useDeleteClassOccurrence();
  const createClassScheduleMutation = useCreateClassSchedule();
  const updateClassScheduleMutation = useUpdateClassSchedule();
  const deleteClassScheduleMutation = useDeleteClassSchedule();
  const updateSettingsMutation = useUpdateSettings();
  const createHolidayMutation = useCreateHoliday();
  const updateHolidayMutation = useUpdateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();

  // Loading state
  const isLoading = loadingSemesters || loadingSubjects || loadingSchedules || loadingSlots ||
                    loadingOccurrences || loadingExams || loadingTasks || 
                    loadingEvents || loadingFiles || loadingLinks || loadingNotes ||
                    loadingSettings || loadingHolidays;

  // Derived data (memoized)
  const activeSemesters = useMemo(
    () => semesters.filter(s => !s.is_archived && !s.deleted_at),
    [semesters]
  );

  const archivedSemesters = useMemo(
    () => semesters.filter(s => s.is_archived && !s.deleted_at),
    [semesters]
  );

  const autoCurrentSemesters = useMemo(() => {
    const now = new Date();
    return activeSemesters.filter(s => {
      const start = new Date(s.start_date);
      const end = new Date(s.end_date);
      return s.status === "ongoing" || (now >= start && now <= end);
    });
  }, [activeSemesters]);

  const selectedSemester = useMemo(() => {
    if (!activeSemesterId) return null;
    return activeSemesters.find((s) => s.$id === activeSemesterId) ?? null;
  }, [activeSemesterId, activeSemesters]);

  const currentSemesters = useMemo(() => {
    if (selectedSemester) return [selectedSemester];
    return autoCurrentSemesters;
  }, [selectedSemester, autoCurrentSemesters]);

  const ongoingSemester = useMemo(() => {
    return selectedSemester || autoCurrentSemesters[0] || activeSemesters[0] || null;
  }, [selectedSemester, autoCurrentSemesters, activeSemesters]);

  // Getter functions
  const getSemesterById = useCallback(
    (id: string) => semesters.find(s => s.$id === id),
    [semesters]
  );

  const getSubjectById = useCallback(
    (id: string) => subjects.find(s => s.$id === id),
    [subjects]
  );

  const getSubjectsBySemester = useCallback(
    (semesterId: string) => subjects.filter(s => s.semester_id === semesterId && !s.deleted_at),
    [subjects]
  );

  const getExamsBySubject = useCallback(
    (subjectId: string) => exams.filter(e => e.subject_id === subjectId && !e.deleted_at),
    [exams]
  );

  const getUpcomingExams = useCallback(
    (days: number = 7) => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      return exams.filter(e => {
        if (e.deleted_at) return false;
        const examDate = new Date(e.date);
        return examDate >= now && examDate <= futureDate;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    [exams]
  );

  const getTasksBySemester = useCallback(
    (semesterId: string) => tasks.filter(t => t.semester_id === semesterId && !t.deleted_at),
    [tasks]
  );

  const getPendingTasks = useCallback(
    () => tasks.filter(t => !t.is_completed && !t.deleted_at),
    [tasks]
  );

  const getOccurrencesBySubject = useCallback(
    (subjectId: string) => classOccurrences.filter(o => o.subject_id === subjectId),
    [classOccurrences]
  );

  const getSchedulesBySubject = useCallback(
    (subjectId: string) => classSchedules.filter(s => s.subject_id === subjectId && !s.deleted_at),
    [classSchedules]
  );

  const getSchedulesByDay = useCallback(
    (dayOfWeek: number) => classSchedules.filter(s => s.day_of_week === dayOfWeek && !s.deleted_at),
    [classSchedules]
  );

  const getTodaySchedules = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    return getSchedulesByDay(dayOfWeek);
  }, [getSchedulesByDay]);

  const getSlotById = useCallback(
    (id: string): Slot | undefined => slots.find((slot) => slot.$id === id),
    [slots]
  );

  const getFilesBySubject = useCallback(
    (subjectId: string) => files.filter(f => f.subject_id === subjectId && !f.deleted_at),
    [files]
  );

  const getLinksBySubject = useCallback(
    (subjectId: string) => resourceLinks.filter(l => l.subject_id === subjectId && !l.deleted_at),
    [resourceLinks]
  );

  const getNotesBySubject = useCallback(
    (subjectId: string) => notes.filter(n => n.subject_id === subjectId && !n.deleted_at),
    [notes]
  );

  const getHolidaysBySemester = useCallback(
    (semesterId: string) =>
      holidays.filter(
        (holiday) =>
          !holiday.deleted_at && holiday.description?.startsWith(`semester:${semesterId}`)
      ),
    [holidays]
  );

  // Calculate attendance stats for a subject
  const getAttendanceStats = useCallback(
    (subjectId: string, requiredPercent: number = 75) => {
      const subjectOccurrences = getOccurrencesBySubject(subjectId);
      return calculateAttendanceStats(subjectOccurrences, requiredPercent);
    },
    [getOccurrencesBySubject]
  );

  // CRUD operations
  const addSemester = useCallback(
    async (data: Omit<Semester, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createSemesterMutation.mutateAsync(data);
    },
    [createSemesterMutation]
  );

  const updateSemester = useCallback(
    async (id: string, data: Partial<Semester>) => {
      return updateSemesterMutation.mutateAsync({ id, data });
    },
    [updateSemesterMutation]
  );

  const deleteSemester = useCallback(
    async (id: string) => {
      return deleteSemesterMutation.mutateAsync(id);
    },
    [deleteSemesterMutation]
  );

  const archiveSemester = useCallback(
    async (id: string) => {
      return updateSemesterMutation.mutateAsync({ id, data: { is_archived: true } });
    },
    [updateSemesterMutation]
  );

  const unarchiveSemester = useCallback(
    async (id: string) => {
      return updateSemesterMutation.mutateAsync({ id, data: { is_archived: false } });
    },
    [updateSemesterMutation]
  );

  const addSubject = useCallback(
    async (data: Omit<Subject, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createSubjectMutation.mutateAsync(data);
    },
    [createSubjectMutation]
  );

  const updateSubject = useCallback(
    async (id: string, data: Partial<Subject>) => {
      return updateSubjectMutation.mutateAsync({ id, data });
    },
    [updateSubjectMutation]
  );

  const deleteSubject = useCallback(
    async (id: string) => {
      return deleteSubjectMutation.mutateAsync(id);
    },
    [deleteSubjectMutation]
  );

  const addExam = useCallback(
    async (data: Omit<Exam, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createExamMutation.mutateAsync(data);
    },
    [createExamMutation]
  );

  const updateExam = useCallback(
    async (id: string, data: Partial<Exam>) => {
      return updateExamMutation.mutateAsync({ id, data });
    },
    [updateExamMutation]
  );

  const deleteExam = useCallback(
    async (id: string) => {
      return deleteExamMutation.mutateAsync(id);
    },
    [deleteExamMutation]
  );

  const addTask = useCallback(
    async (data: Omit<Task, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createTaskMutation.mutateAsync(data);
    },
    [createTaskMutation]
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<Task>) => {
      return updateTaskMutation.mutateAsync({ id, data });
    },
    [updateTaskMutation]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      return deleteTaskMutation.mutateAsync(id);
    },
    [deleteTaskMutation]
  );

  const toggleTaskComplete = useCallback(
    async (id: string) => {
      const task = tasks.find(t => t.$id === id);
      if (task) {
        return toggleTaskMutation.mutateAsync({ id, isCompleted: !task.is_completed });
      }
    },
    [tasks, toggleTaskMutation]
  );

  const addEvent = useCallback(
    async (data: Omit<Event, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createEventMutation.mutateAsync(data);
    },
    [createEventMutation]
  );

  const updateEvent = useCallback(
    async (id: string, data: Partial<Event>) => {
      return updateEventMutation.mutateAsync({ id, data });
    },
    [updateEventMutation]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      return deleteEventMutation.mutateAsync(id);
    },
    [deleteEventMutation]
  );

  // Class Occurrence CRUD
  const addClassOccurrence = useCallback(
    async (data: Omit<ClassOccurrence, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createClassOccurrenceMutation.mutateAsync(data);
    },
    [createClassOccurrenceMutation]
  );

  const addClassSchedule = useCallback(
    async (data: Omit<ClassSchedule, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createClassScheduleMutation.mutateAsync(data);
    },
    [createClassScheduleMutation]
  );

  const updateClassSchedule = useCallback(
    async (id: string, data: Partial<ClassSchedule>) => {
      return updateClassScheduleMutation.mutateAsync({ id, data });
    },
    [updateClassScheduleMutation]
  );

  const deleteClassSchedule = useCallback(
    async (id: string) => {
      return deleteClassScheduleMutation.mutateAsync(id);
    },
    [deleteClassScheduleMutation]
  );

  const markAttendance = useCallback(
    async (
      subjectId: string,
      date: string,
      startTime: string,
      attendance: "present" | "absent" | "cancelled"
    ) => {
      // Find existing occurrence or create new one
      const existing = classOccurrences.find(
        (o) =>
          o.subject_id === subjectId &&
          o.date === date &&
          normalizeTimeHM(o.start_time) === normalizeTimeHM(startTime)
      );
      
      if (existing) {
        return markAttendanceMutation.mutateAsync({
          id: existing.$id,
          attendance: attendance === "cancelled" ? null : attendance,
        });
      }
      // If no occurrence exists, we need to create one - this requires the classOccurrenceService
      // For now, just use the mutation which handles updates
      console.warn("Cannot mark attendance: no existing occurrence found");
    },
    [classOccurrences, markAttendanceMutation]
  );

  const createAndMarkAttendance = useCallback(
    async (
      subjectId: string,
      date: string,
      startTime: string,
      endTime: string,
      attendance: "present" | "absent" | "cancelled",
      scheduleId: string | null = null
    ) => {
      return createClassOccurrenceMutation.mutateAsync({
        subject_id: subjectId,
        schedule_id: scheduleId,
        date,
        start_time: startTime,
        end_time: endTime,
        status: attendance === "cancelled" ? "cancelled" : "completed",
        cancellation_reason: attendance === "cancelled" ? "Marked cancelled" : null,
        rescheduled_to: null,
        attendance: attendance === "cancelled" ? null : attendance,
        attendance_marked_at: attendance === "cancelled" ? null : new Date().toISOString(),
        attendance_note: null,
        is_extra_class: false,
      });
    },
    [createClassOccurrenceMutation]
  );

  const updateClassOccurrence = useCallback(
    async (id: string, data: Partial<ClassOccurrence>) => {
      return updateClassOccurrenceMutation.mutateAsync({ id, data });
    },
    [updateClassOccurrenceMutation]
  );

  const deleteClassOccurrence = useCallback(
    async (id: string) => {
      return deleteClassOccurrenceMutation.mutateAsync(id);
    },
    [deleteClassOccurrenceMutation]
  );

  // Note CRUD
  const deleteNote = useCallback(
    async (id: string) => {
      return deleteNoteMutation.mutateAsync(id);
    },
    [deleteNoteMutation]
  );

  const updateNote = useCallback(
    async (id: string, data: { content?: string; is_pinned?: boolean }) => {
      return updateNoteMutation.mutateAsync({ id, data });
    },
    [updateNoteMutation]
  );

  // Resource link CRUD
  const deleteResourceLink = useCallback(
    async (id: string) => {
      return deleteLinkMutation.mutateAsync(id);
    },
    [deleteLinkMutation]
  );

  const updateSettings = useCallback(
    async (data: Partial<Settings>) => {
      return updateSettingsMutation.mutateAsync(data);
    },
    [updateSettingsMutation]
  );

  const addHoliday = useCallback(
    async (data: Omit<Holiday, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
      return createHolidayMutation.mutateAsync(data);
    },
    [createHolidayMutation]
  );

  const updateHoliday = useCallback(
    async (id: string, data: Partial<Holiday>) => {
      return updateHolidayMutation.mutateAsync({ id, data });
    },
    [updateHolidayMutation]
  );

  const deleteHoliday = useCallback(
    async (id: string) => {
      return deleteHolidayMutation.mutateAsync(id);
    },
    [deleteHolidayMutation]
  );

  const getExamReminderOffsets = useCallback(
    (exam: Exam): ReminderOffset[] => parseReminderOffsetsJson(exam.reminder_offsets_json),
    []
  );

  const getTaskReminderOffsets = useCallback(
    (task: Task): ReminderOffset[] => parseReminderOffsetsJson(task.reminder_offsets_json),
    []
  );

  const getDefaultExamReminderOffsets = useCallback((): ReminderOffset[] => {
    if (!settings) return [];
    return parseReminderOffsetsJson(settings.exam_default_reminder_offsets_json);
  }, [settings]);

  const getDefaultTaskReminderOffsets = useCallback((): ReminderOffset[] => {
    if (!settings) return [];
    return parseReminderOffsetsJson(settings.task_default_reminder_offsets_json);
  }, [settings]);

  const setDefaultExamReminderOffsets = useCallback(
    async (offsets: ReminderOffset[]) => {
      return updateSettingsMutation.mutateAsync({
        exam_default_reminder_offsets_json: serializeReminderOffsetsJson(offsets),
      });
    },
    [updateSettingsMutation]
  );

  const setDefaultTaskReminderOffsets = useCallback(
    async (offsets: ReminderOffset[]) => {
      return updateSettingsMutation.mutateAsync({
        task_default_reminder_offsets_json: serializeReminderOffsetsJson(offsets),
      });
    },
    [updateSettingsMutation]
  );

  // Refetch all data
  const refetch = useCallback(() => {
    refetchSemesters();
    refetchSubjects();
    refetchExams();
    refetchTasks();
    refetchEvents();
    refetchFiles();
    refetchLinks();
    refetchNotes();
    refetchSlots();
    refetchSettings();
    refetchHolidays();
  }, [refetchSemesters, refetchSubjects, refetchExams, refetchTasks, refetchEvents, refetchFiles, refetchLinks, refetchNotes, refetchSlots, refetchSettings, refetchHolidays]);

  return {
    // Data
    semesters,
    subjects,
    classSchedules,
    slots,
    classOccurrences,
    exams,
    tasks,
    events,
    files,
    resourceLinks,
    notes,
    settings: settings ?? null,
    holidays,
    
    // Loading
    isLoading,
    
    // Derived
    activeSemesters,
    archivedSemesters,
    currentSemesters,
    ongoingSemester,
    activeSemesterId,
    setActiveSemesterId,
    
    // Getters
    getSemesterById,
    getSubjectById,
    getSubjectsBySemester,
    getExamsBySubject,
    getUpcomingExams,
    getTasksBySemester,
    getPendingTasks,
    getOccurrencesBySubject,
    getSchedulesBySubject,
    getSchedulesByDay,
    getTodaySchedules,
    getSlotById,
    getFilesBySubject,
    getLinksBySubject,
    getNotesBySubject,
    getHolidaysBySemester,
    getAttendanceStats,
    
    // CRUD - async versions
    addSemester,
    updateSemester,
    deleteSemester,
    archiveSemester,
    unarchiveSemester,
    addSubject,
    updateSubject,
    deleteSubject,
    addExam,
    updateExam,
    deleteExam,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addEvent,
    updateEvent,
    deleteEvent,
    addClassSchedule,
    updateClassSchedule,
    deleteClassSchedule,
    addClassOccurrence,
    updateClassOccurrence,
    deleteClassOccurrence,
    markAttendance,
    createAndMarkAttendance,
    deleteNote,
    updateNote,
    deleteResourceLink,
    updateSettings,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    getExamReminderOffsets,
    getTaskReminderOffsets,
    getDefaultExamReminderOffsets,
    getDefaultTaskReminderOffsets,
    setDefaultExamReminderOffsets,
    setDefaultTaskReminderOffsets,
    
    // Refetch
    refetch,
    
    // Mutation loading states
    isMutating: 
      createSemesterMutation.isPending ||
      updateSemesterMutation.isPending ||
      deleteSemesterMutation.isPending ||
      createSubjectMutation.isPending ||
      updateSubjectMutation.isPending ||
      deleteSubjectMutation.isPending ||
      createExamMutation.isPending ||
      updateExamMutation.isPending ||
      deleteExamMutation.isPending ||
      createTaskMutation.isPending ||
      updateTaskMutation.isPending ||
      deleteTaskMutation.isPending ||
      createEventMutation.isPending ||
      updateEventMutation.isPending ||
      deleteEventMutation.isPending ||
      createClassScheduleMutation.isPending ||
      updateClassScheduleMutation.isPending ||
      deleteClassScheduleMutation.isPending ||
      createClassOccurrenceMutation.isPending ||
      updateClassOccurrenceMutation.isPending ||
      deleteClassOccurrenceMutation.isPending ||
      updateSettingsMutation.isPending ||
      createHolidayMutation.isPending ||
      updateHolidayMutation.isPending ||
      deleteHolidayMutation.isPending,
  };
}

// Re-export individual hooks for more granular usage
export * from "./use-appwrite";
