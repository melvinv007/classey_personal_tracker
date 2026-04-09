import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Semester,
  Subject,
  AttendanceStats,
  Slot,
  ClassSchedule,
  ClassOccurrence,
  Exam,
  Task,
  Event,
  ClasseyFile,
  ResourceLink,
  Note,
} from "@/types/database";
import {
  mockSemesters,
  mockSubjects,
  mockAttendanceStats,
  mockSlots,
  mockClassSchedules,
  mockClassOccurrences,
  mockExams,
  mockTasks,
  mockEvents,
  mockFiles,
  mockResourceLinks,
  mockNotes,
  createMockDocument,
} from "@/lib/mock-data";

/**
 * Data store for development without Appwrite
 * All CRUD operations work with local state + localStorage persistence
 * Will be replaced with TanStack Query + Appwrite hooks
 */
interface DataStore {
  // Data
  semesters: Semester[];
  subjects: Subject[];
  attendanceStats: Record<string, AttendanceStats>;
  slots: Slot[];
  classSchedules: ClassSchedule[];
  classOccurrences: ClassOccurrence[];
  exams: Exam[];
  tasks: Task[];
  events: Event[];
  files: ClasseyFile[];
  resourceLinks: ResourceLink[];
  notes: Note[];

  // Active semester (for accent color)
  activeSemesterId: string | null;
  setActiveSemesterId: (id: string | null) => void;

  // Semester CRUD
  addSemester: (semester: Omit<Semester, keyof ReturnType<typeof createMockDocument>>) => Semester;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  deleteSemester: (id: string) => void; // soft delete
  restoreSemester: (id: string) => void;
  archiveSemester: (id: string) => void;
  unarchiveSemester: (id: string) => void;

  // Subject CRUD
  addSubject: (subject: Omit<Subject, keyof ReturnType<typeof createMockDocument>>) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void; // soft delete
  restoreSubject: (id: string) => void;

  // Class Schedule CRUD
  addClassSchedule: (schedule: Omit<ClassSchedule, keyof ReturnType<typeof createMockDocument>>) => ClassSchedule;
  deleteClassSchedule: (id: string) => void;
  getSchedulesBySubject: (subjectId: string) => ClassSchedule[];
  getSchedulesByDay: (dayOfWeek: number) => ClassSchedule[];

  // Class Occurrence CRUD
  addClassOccurrence: (occurrence: Omit<ClassOccurrence, keyof ReturnType<typeof createMockDocument>>) => ClassOccurrence;
  updateClassOccurrence: (id: string, updates: Partial<ClassOccurrence>) => void;
  markAttendance: (subjectId: string, date: string, startTime: string, attendance: "present" | "absent" | "cancelled") => void;
  getOccurrencesBySubject: (subjectId: string) => ClassOccurrence[];
  getOccurrencesByDate: (date: string) => ClassOccurrence[];

  // Exam CRUD
  addExam: (exam: Omit<Exam, keyof ReturnType<typeof createMockDocument>>) => Exam;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  getExamsBySubject: (subjectId: string) => Exam[];
  getUpcomingExams: () => Exam[];

  // Task CRUD
  addTask: (task: Omit<Task, keyof ReturnType<typeof createMockDocument>>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  getTasksBySemester: (semesterId: string) => Task[];
  getPendingTasks: () => Task[];

  // Event CRUD
  addEvent: (event: Omit<Event, keyof ReturnType<typeof createMockDocument>>) => Event;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  getUpcomingEvents: () => Event[];

  // File CRUD
  addFile: (file: Omit<ClasseyFile, keyof ReturnType<typeof createMockDocument>>) => ClasseyFile;
  updateFile: (id: string, updates: Partial<ClasseyFile>) => void;
  deleteFile: (id: string) => void;
  getFilesBySubject: (subjectId: string) => ClasseyFile[];
  getFilesByExam: (examId: string) => ClasseyFile[];
  getFilesByTask: (taskId: string) => ClasseyFile[];
  getPastPapers: (subjectId: string) => ClasseyFile[];
  getAllFiles: () => ClasseyFile[];

  // Resource Link CRUD
  addResourceLink: (link: Omit<ResourceLink, keyof ReturnType<typeof createMockDocument>>) => ResourceLink;
  updateResourceLink: (id: string, updates: Partial<ResourceLink>) => void;
  deleteResourceLink: (id: string) => void;
  getResourceLinksBySubject: (subjectId: string) => ResourceLink[];

  // Note CRUD
  addNote: (note: Omit<Note, keyof ReturnType<typeof createMockDocument>>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNotesBySubject: (subjectId: string) => Note[];
  getPinnedNotes: (subjectId: string) => Note[];

  // Queries
  getSemesterById: (id: string) => Semester | undefined;
  getSubjectsBySemester: (semesterId: string) => Subject[];
  getSubjectById: (id: string) => Subject | undefined;
  getActiveSemesters: () => Semester[];
  getArchivedSemesters: () => Semester[];
  getOngoingSemester: () => Semester | undefined;
  getSlotById: (id: string) => Slot | undefined;
  getTodaySchedules: () => ClassSchedule[];

  // Internal helpers
  recalculateAttendanceStats: (subjectId: string) => void;
}

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      // Initialize with mock data
      semesters: mockSemesters,
      subjects: mockSubjects,
      attendanceStats: mockAttendanceStats,
      slots: mockSlots,
      classSchedules: mockClassSchedules,
      classOccurrences: mockClassOccurrences,
      exams: mockExams,
      tasks: mockTasks,
      events: mockEvents,
      files: mockFiles,
      resourceLinks: mockResourceLinks,
      notes: mockNotes,
      activeSemesterId: mockSemesters.find((s) => s.status === "ongoing")?.$id ?? null,

      setActiveSemesterId: (id) => set({ activeSemesterId: id }),

      // Semester CRUD
      addSemester: (semesterData) => {
        const newSemester: Semester = {
          ...createMockDocument("semesters"),
          ...semesterData,
        } as Semester;
        set((state) => ({
          semesters: [newSemester, ...state.semesters],
        }));
        return newSemester;
      },

      updateSemester: (id, updates) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.$id === id
              ? { ...s, ...updates, $updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      deleteSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.$id === id
              ? { ...s, deleted_at: new Date().toISOString() }
              : s
          ),
          // Also soft delete all subjects in this semester
          subjects: state.subjects.map((sub) =>
            sub.semester_id === id
              ? { ...sub, deleted_at: new Date().toISOString() }
              : sub
          ),
        }));
      },

      restoreSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.$id === id ? { ...s, deleted_at: null } : s
          ),
          // Also restore all subjects in this semester
          subjects: state.subjects.map((sub) =>
            sub.semester_id === id ? { ...sub, deleted_at: null } : sub
          ),
        }));
      },

      archiveSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.$id === id ? { ...s, is_archived: true } : s
          ),
        }));
      },

      unarchiveSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.$id === id ? { ...s, is_archived: false } : s
          ),
        }));
      },

      // Subject CRUD
      addSubject: (subjectData) => {
        const newSubject: Subject = {
          ...createMockDocument("subjects"),
          ...subjectData,
        } as Subject;
        set((state) => ({
          subjects: [...state.subjects, newSubject],
          // Initialize empty attendance stats
          attendanceStats: {
            ...state.attendanceStats,
            [newSubject.$id]: {
              total: 0,
              present: 0,
              absent: 0,
              cancelled: 0,
              percentage: 0,
              classesNeeded: 0,
              canBunk: 0,
            },
          },
        }));
        return newSubject;
      },

      updateSubject: (id, updates) => {
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.$id === id
              ? { ...s, ...updates, $updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.$id === id
              ? { ...s, deleted_at: new Date().toISOString() }
              : s
          ),
        }));
      },

      restoreSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.$id === id ? { ...s, deleted_at: null } : s
          ),
        }));
      },

      // Class Schedule CRUD
      addClassSchedule: (scheduleData) => {
        const newSchedule: ClassSchedule = {
          ...createMockDocument("class_schedules"),
          ...scheduleData,
        } as ClassSchedule;
        set((state) => ({
          classSchedules: [...state.classSchedules, newSchedule],
        }));
        return newSchedule;
      },

      deleteClassSchedule: (id) => {
        set((state) => ({
          classSchedules: state.classSchedules.map((s) =>
            s.$id === id
              ? { ...s, deleted_at: new Date().toISOString() }
              : s
          ),
        }));
      },

      getSchedulesBySubject: (subjectId) => {
        return get().classSchedules.filter(
          (s) => s.subject_id === subjectId && !s.deleted_at
        );
      },

      getSchedulesByDay: (dayOfWeek) => {
        return get().classSchedules.filter(
          (s) => s.day_of_week === dayOfWeek && !s.deleted_at
        );
      },

      // Class Occurrence CRUD
      addClassOccurrence: (occurrenceData) => {
        const newOccurrence: ClassOccurrence = {
          ...createMockDocument("class_occurrences"),
          ...occurrenceData,
        } as ClassOccurrence;
        set((state) => ({
          classOccurrences: [...state.classOccurrences, newOccurrence],
        }));
        return newOccurrence;
      },

      updateClassOccurrence: (id, updates) => {
        set((state) => ({
          classOccurrences: state.classOccurrences.map((o) =>
            o.$id === id
              ? { ...o, ...updates, $updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      markAttendance: (subjectId, date, startTime, attendance) => {
        const state = get();
        // Find existing occurrence
        const existing = state.classOccurrences.find(
          (o) =>
            o.subject_id === subjectId &&
            o.date === date &&
            o.start_time === startTime
        );

        if (existing) {
          // Update existing occurrence
          set({
            classOccurrences: state.classOccurrences.map((o) =>
              o.$id === existing.$id
                ? {
                    ...o,
                    attendance: attendance === "cancelled" ? null : attendance,
                    status: attendance === "cancelled" ? "cancelled" : "completed",
                    attendance_marked_at: new Date().toISOString(),
                  }
                : o
            ),
          });
        } else {
          // Find the schedule for this class
          const schedule = state.classSchedules.find(
            (s) =>
              s.subject_id === subjectId &&
              s.start_time === startTime &&
              !s.deleted_at
          );

          // Create new occurrence
          const newOccurrence: ClassOccurrence = {
            ...createMockDocument("class_occurrences"),
            subject_id: subjectId,
            schedule_id: schedule?.$id ?? null,
            date,
            start_time: startTime,
            end_time: schedule?.end_time ?? startTime,
            status: attendance === "cancelled" ? "cancelled" : "completed",
            cancellation_reason: null,
            rescheduled_to: null,
            attendance: attendance === "cancelled" ? null : attendance,
            attendance_marked_at: new Date().toISOString(),
            attendance_note: null,
            is_extra_class: false,
          } as ClassOccurrence;

          set({
            classOccurrences: [...state.classOccurrences, newOccurrence],
          });
        }

        // Recalculate attendance stats
        get().recalculateAttendanceStats(subjectId);
      },

      getOccurrencesBySubject: (subjectId) => {
        return get()
          .classOccurrences.filter((o) => o.subject_id === subjectId)
          .sort((a, b) => b.date.localeCompare(a.date));
      },

      getOccurrencesByDate: (date) => {
        return get().classOccurrences.filter((o) => o.date === date);
      },

      // Queries
      getSemesterById: (id) => {
        return get().semesters.find((s) => s.$id === id && !s.deleted_at);
      },

      getSubjectsBySemester: (semesterId) => {
        return get()
          .subjects.filter(
            (s) => s.semester_id === semesterId && !s.deleted_at
          )
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      getSubjectById: (id) => {
        return get().subjects.find((s) => s.$id === id && !s.deleted_at);
      },

      getActiveSemesters: () => {
        return get()
          .semesters.filter((s) => !s.deleted_at && !s.is_archived)
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      getArchivedSemesters: () => {
        return get()
          .semesters.filter((s) => !s.deleted_at && s.is_archived)
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      getOngoingSemester: () => {
        return get().semesters.find(
          (s) => s.status === "ongoing" && !s.deleted_at && !s.is_archived
        );
      },

      getSlotById: (id) => {
        return get().slots.find((s) => s.$id === id && !s.deleted_at);
      },

      getTodaySchedules: () => {
        const dayOfWeek = new Date().getDay();
        // Convert JS day (0=Sun, 1=Mon...) to our format (1=Mon, 2=Tue...)
        const ourDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        return get()
          .classSchedules.filter(
            (s) => s.day_of_week === ourDay && !s.deleted_at
          )
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
      },

      // Internal helper to recalculate attendance stats
      recalculateAttendanceStats: (subjectId) => {
        const state = get();
        const subject = state.subjects.find((s) => s.$id === subjectId);
        if (!subject) return;

        const occurrences = state.classOccurrences.filter(
          (o) => o.subject_id === subjectId
        );

        const present = occurrences.filter((o) => o.attendance === "present").length;
        const absent = occurrences.filter((o) => o.attendance === "absent").length;
        const cancelled = occurrences.filter((o) => o.status === "cancelled").length;
        const total = present + absent; // excludes cancelled

        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        const required = subject.attendance_requirement_percent ?? 75;

        // Calculate classes needed to reach requirement
        let classesNeeded = 0;
        if (percentage < required && total > 0) {
          // Solve: (present + x) / (total + x) >= required/100
          classesNeeded = Math.ceil(
            (required * total - 100 * present) / (100 - required)
          );
        }

        // Calculate classes that can be bunked
        let canBunk = 0;
        if (percentage >= required && total > 0) {
          // Solve: present / (total + x) >= required/100
          const maxTotal = Math.floor((present * 100) / required);
          canBunk = Math.max(0, maxTotal - total);
        }

        set((state) => ({
          attendanceStats: {
            ...state.attendanceStats,
            [subjectId]: {
              total,
              present,
              absent,
              cancelled,
              percentage,
              classesNeeded: Math.max(0, classesNeeded),
              canBunk,
            },
          },
        }));
      },

      // Exam CRUD
      addExam: (examData) => {
        const newExam: Exam = {
          ...createMockDocument("exams"),
          ...examData,
        } as Exam;
        set((state) => ({
          exams: [...state.exams, newExam],
        }));
        return newExam;
      },

      updateExam: (id, updates) => {
        set((state) => ({
          exams: state.exams.map((e) =>
            e.$id === id
              ? { ...e, ...updates, $updatedAt: new Date().toISOString() }
              : e
          ),
        }));
      },

      deleteExam: (id) => {
        set((state) => ({
          exams: state.exams.map((e) =>
            e.$id === id
              ? { ...e, deleted_at: new Date().toISOString() }
              : e
          ),
        }));
      },

      getExamsBySubject: (subjectId) => {
        return get()
          .exams.filter((e) => e.subject_id === subjectId && !e.deleted_at)
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      getUpcomingExams: () => {
        const today = new Date().toISOString().split("T")[0];
        return get()
          .exams.filter((e) => !e.deleted_at && e.date >= today && e.status !== "completed")
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      // Task CRUD
      addTask: (taskData) => {
        const newTask: Task = {
          ...createMockDocument("tasks"),
          ...taskData,
        } as Task;
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
        return newTask;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.$id === id
              ? { ...t, ...updates, $updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.$id === id
              ? { ...t, deleted_at: new Date().toISOString() }
              : t
          ),
        }));
      },

      toggleTaskComplete: (id) => {
        const task = get().tasks.find((t) => t.$id === id);
        if (!task) return;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.$id === id
              ? {
                  ...t,
                  is_completed: !t.is_completed,
                  completed_at: !t.is_completed ? new Date().toISOString() : null,
                  $updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      getTasksBySemester: (semesterId) => {
        return get()
          .tasks.filter((t) => t.semester_id === semesterId && !t.deleted_at)
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      getPendingTasks: () => {
        return get()
          .tasks.filter((t) => !t.deleted_at && !t.is_completed)
          .sort((a, b) => {
            // Sort by deadline (null deadlines last), then by priority
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return a.deadline.localeCompare(b.deadline);
          });
      },

      // Event CRUD
      addEvent: (eventData) => {
        const newEvent: Event = {
          ...createMockDocument("events"),
          ...eventData,
        } as Event;
        set((state) => ({
          events: [...state.events, newEvent],
        }));
        return newEvent;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.$id === id
              ? { ...e, ...updates, $updatedAt: new Date().toISOString() }
              : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.$id === id
              ? { ...e, deleted_at: new Date().toISOString() }
              : e
          ),
        }));
      },

      getUpcomingEvents: () => {
        const now = new Date().toISOString();
        return get()
          .events.filter((e) => !e.deleted_at && e.end_datetime >= now)
          .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
      },

      // File CRUD
      addFile: (fileData) => {
        const newFile: ClasseyFile = {
          ...createMockDocument("files"),
          ...fileData,
        } as ClasseyFile;
        set((state) => ({
          files: [...state.files, newFile],
        }));
        return newFile;
      },

      updateFile: (id, updates) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.$id === id
              ? { ...f, ...updates, $updatedAt: new Date().toISOString() }
              : f
          ),
        }));
      },

      deleteFile: (id) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.$id === id
              ? { ...f, deleted_at: new Date().toISOString() }
              : f
          ),
        }));
      },

      getFilesBySubject: (subjectId) => {
        return get()
          .files.filter((f) => f.subject_id === subjectId && !f.deleted_at)
          .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
      },

      getFilesByExam: (examId) => {
        return get()
          .files.filter((f) => f.exam_id === examId && !f.deleted_at)
          .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
      },

      getFilesByTask: (taskId) => {
        return get()
          .files.filter((f) => f.task_id === taskId && !f.deleted_at)
          .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
      },

      getPastPapers: (subjectId) => {
        return get()
          .files.filter((f) => f.subject_id === subjectId && f.is_past_paper && !f.deleted_at)
          .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
      },

      getAllFiles: () => {
        return get()
          .files.filter((f) => !f.deleted_at)
          .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
      },

      // Resource Link CRUD
      addResourceLink: (linkData) => {
        const newLink: ResourceLink = {
          ...createMockDocument("resource_links"),
          ...linkData,
        } as ResourceLink;
        set((state) => ({
          resourceLinks: [...state.resourceLinks, newLink],
        }));
        return newLink;
      },

      updateResourceLink: (id, updates) => {
        set((state) => ({
          resourceLinks: state.resourceLinks.map((l) =>
            l.$id === id
              ? { ...l, ...updates, $updatedAt: new Date().toISOString() }
              : l
          ),
        }));
      },

      deleteResourceLink: (id) => {
        set((state) => ({
          resourceLinks: state.resourceLinks.map((l) =>
            l.$id === id
              ? { ...l, deleted_at: new Date().toISOString() }
              : l
          ),
        }));
      },

      getResourceLinksBySubject: (subjectId) => {
        return get()
          .resourceLinks.filter((l) => l.subject_id === subjectId && !l.deleted_at)
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      // Note CRUD
      addNote: (noteData) => {
        const newNote: Note = {
          ...createMockDocument("notes"),
          ...noteData,
        } as Note;
        set((state) => ({
          notes: [...state.notes, newNote],
        }));
        return newNote;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.$id === id
              ? { ...n, ...updates, $updatedAt: new Date().toISOString() }
              : n
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.$id === id
              ? { ...n, deleted_at: new Date().toISOString() }
              : n
          ),
        }));
      },

      getNotesBySubject: (subjectId) => {
        return get()
          .notes.filter((n) => n.subject_id === subjectId && !n.deleted_at)
          .sort((a, b) => {
            // Pinned notes first, then by creation date
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return b.$createdAt.localeCompare(a.$createdAt);
          });
      },

      getPinnedNotes: (subjectId) => {
        return get()
          .notes.filter((n) => n.subject_id === subjectId && n.is_pinned && !n.deleted_at)
          .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
      },
    }),
    {
      name: "classey-data",
      partialize: (state) => ({
        semesters: state.semesters,
        subjects: state.subjects,
        attendanceStats: state.attendanceStats,
        slots: state.slots,
        classSchedules: state.classSchedules,
        classOccurrences: state.classOccurrences,
        exams: state.exams,
        tasks: state.tasks,
        events: state.events,
        files: state.files,
        resourceLinks: state.resourceLinks,
        notes: state.notes,
        activeSemesterId: state.activeSemesterId,
      }),
    }
  )
);

/**
 * Hook to get attendance stats for a subject
 */
export function useAttendanceStats(subjectId: string): AttendanceStats {
  return useDataStore((state) => state.attendanceStats[subjectId] ?? {
    total: 0,
    present: 0,
    absent: 0,
    cancelled: 0,
    percentage: 0,
    classesNeeded: 0,
    canBunk: 0,
  });
}
