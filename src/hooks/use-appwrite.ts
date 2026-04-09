/**
 * TanStack Query hooks for Appwrite data fetching
 * These hooks replace the mock data store with real Appwrite queries
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  semesterService,
  subjectService,
  slotService,
  classScheduleService,
  classOccurrenceService,
  examService,
  taskService,
  eventService,
  fileService,
  resourceLinkService,
  noteService,
  settingsService,
} from "@/lib/appwrite-db";
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
} from "@/types/database";

async function syncReminderJobs(
  action: "sync-entity" | "clear-entity",
  entityType: "exam" | "task",
  entityId: string
): Promise<void> {
  await fetch("/api/telegram/scheduler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, entityType, entityId }),
  });
}

// Query keys for cache management
export const queryKeys = {
  semesters: ["semesters"] as const,
  semester: (id: string) => ["semesters", id] as const,
  subjects: (semesterId?: string) => ["subjects", semesterId] as const,
  subject: (id: string) => ["subjects", "detail", id] as const,
  classSchedules: (subjectId?: string) => ["classSchedules", subjectId] as const,
  slots: () => ["slots"] as const,
  classOccurrences: (subjectId?: string) => ["classOccurrences", subjectId] as const,
  exams: (subjectId?: string) => ["exams", subjectId] as const,
  tasks: () => ["tasks"] as const,
  events: () => ["events"] as const,
  files: (subjectId?: string) => ["files", subjectId] as const,
  resourceLinks: (subjectId?: string) => ["resourceLinks", subjectId] as const,
  notes: (subjectId?: string) => ["notes", subjectId] as const,
  settings: () => ["settings"] as const,
};

// ============================================================
// SEMESTERS
// ============================================================

export function useSemesters() {
  return useQuery({
    queryKey: queryKeys.semesters,
    queryFn: () => semesterService.list(),
  });
}

export function useSemester(id: string) {
  return useQuery({
    queryKey: queryKeys.semester(id),
    queryFn: () => semesterService.get(id),
    enabled: !!id,
  });
}

export function useOngoingSemester() {
  return useQuery({
    queryKey: [...queryKeys.semesters, "ongoing"],
    queryFn: () => semesterService.getOngoing(),
  });
}

export function useCreateSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Semester, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      semesterService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
    },
  });
}

export function useUpdateSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Semester> }) =>
      semesterService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
      queryClient.invalidateQueries({ queryKey: queryKeys.semester(id) });
    },
  });
}

export function useDeleteSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => semesterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
    },
  });
}

// ============================================================
// SUBJECTS
// ============================================================

export function useSubjects(semesterId?: string) {
  return useQuery({
    queryKey: queryKeys.subjects(semesterId),
    queryFn: () =>
      semesterId
        ? subjectService.getBySemester(semesterId)
        : subjectService.list(),
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: queryKeys.subject(id),
    queryFn: () => subjectService.get(id),
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Subject, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      subjectService.create(data),
    onSuccess: (subject) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects(subject.semester_id) });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subject> }) =>
      subjectService.update(id, data),
    onSuccess: (subject, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects(subject.semester_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.subject(id) });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

// ============================================================
// CLASS SCHEDULES
// ============================================================

export function useClassSchedules(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.classSchedules(subjectId),
    queryFn: () =>
      subjectId
        ? classScheduleService.getBySubject(subjectId)
        : classScheduleService.list(),
  });
}

export function useClassSchedulesByDay(dayOfWeek: number) {
  return useQuery({
    queryKey: ["classSchedules", "day", dayOfWeek],
    queryFn: () => classScheduleService.getByDay(dayOfWeek),
  });
}

export function useSlots() {
  return useQuery({
    queryKey: queryKeys.slots(),
    queryFn: () => slotService.list(),
  });
}

export function useCreateClassSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ClassSchedule, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      classScheduleService.create(data),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classSchedules(schedule.subject_id) });
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
    },
  });
}

export function useUpdateClassSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassSchedule> }) =>
      classScheduleService.update(id, data),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classSchedules(schedule.subject_id) });
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
    },
  });
}

export function useDeleteClassSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classScheduleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
    },
  });
}

// ============================================================
// CLASS OCCURRENCES
// ============================================================

export function useClassOccurrences(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.classOccurrences(subjectId),
    queryFn: () =>
      subjectId
        ? classOccurrenceService.getBySubject(subjectId)
        : classOccurrenceService.list(),
  });
}

export function useCreateClassOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ClassOccurrence, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      classOccurrenceService.create(data),
    onSuccess: (occurrence) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classOccurrences(occurrence.subject_id) });
      queryClient.invalidateQueries({ queryKey: ["classOccurrences"] });
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useUpdateClassOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassOccurrence> }) =>
      classOccurrenceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classOccurrences"] });
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      attendance,
    }: {
      id: string;
      attendance: "present" | "absent" | null;
    }) => classOccurrenceService.markAttendance(id, attendance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classOccurrences"] });
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteClassOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classOccurrenceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classOccurrences"] });
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

// ============================================================
// EXAMS
// ============================================================

export function useExams(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.exams(subjectId),
    queryFn: () =>
      subjectId ? examService.getBySubject(subjectId) : examService.list(),
  });
}

export function useUpcomingExams(days: number = 7) {
  return useQuery({
    queryKey: ["exams", "upcoming", days],
    queryFn: () => examService.getUpcoming(days),
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Exam, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      examService.create(data),
    onSuccess: (exam) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams(exam.subject_id) });
      queryClient.invalidateQueries({ queryKey: ["exams", "upcoming"] });
      void syncReminderJobs("sync-entity", "exam", exam.$id);
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exam> }) =>
      examService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      void syncReminderJobs("sync-entity", "exam", id);
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      void syncReminderJobs("clear-entity", "exam", id);
    },
  });
}

// ============================================================
// TASKS
// ============================================================

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks(),
    queryFn: () => taskService.list(),
  });
}

export function usePendingTasks() {
  return useQuery({
    queryKey: [...queryKeys.tasks(), "pending"],
    queryFn: () => taskService.getPending(),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Task, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      taskService.create(data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      void syncReminderJobs("sync-entity", "task", task.$id);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      taskService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      void syncReminderJobs("sync-entity", "task", id);
    },
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      taskService.toggleComplete(id, isCompleted),
    onSuccess: (_, { id, isCompleted }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      void syncReminderJobs(isCompleted ? "clear-entity" : "sync-entity", "task", id);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      void syncReminderJobs("clear-entity", "task", id);
    },
  });
}

// ============================================================
// EVENTS
// ============================================================

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events(),
    queryFn: () => eventService.list(),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Event, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      eventService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
      eventService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events() });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events() });
    },
  });
}

// ============================================================
// FILES
// ============================================================

export function useFiles(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.files(subjectId),
    queryFn: () =>
      subjectId ? fileService.getBySubject(subjectId) : fileService.list(),
  });
}

export function useCreateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ClasseyFile, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      fileService.create(data),
    onSuccess: (file) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files(file.subject_id ?? undefined) });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fileService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

// ============================================================
// RESOURCE LINKS
// ============================================================

export function useResourceLinks(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.resourceLinks(subjectId),
    queryFn: () =>
      subjectId
        ? resourceLinkService.getBySubject(subjectId)
        : resourceLinkService.list(),
  });
}

export function useCreateResourceLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ResourceLink, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      resourceLinkService.create(data),
    onSuccess: (link) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceLinks(link.subject_id) });
    },
  });
}

export function useDeleteResourceLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resourceLinkService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resourceLinks"] });
    },
  });
}

// ============================================================
// NOTES
// ============================================================

export function useNotes(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.notes(subjectId),
    queryFn: () =>
      subjectId ? noteService.getBySubject(subjectId) : noteService.list(),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Note, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) =>
      noteService.create(data),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes(note.subject_id) });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Note> }) =>
      noteService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

// ============================================================
// SETTINGS
// ============================================================

function createDefaultSettingsInput(): Omit<
  Settings,
  "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions"
> {
  return {
    user_id: "default-user",
    theme_mode: "dark",
    background_style: "dotted",
    background_custom_css: null,
    font_family: "Nunito",
    accent_color_default: "#8B5CF6",
    timezone: "Asia/Kolkata",
    first_day_of_week: 1,
    time_format: "24h",
    date_format: "DD/MM/YYYY",
    spi_scale: 10,
    credits_range_max: 100,
    auto_absent_hours: 48,
    default_attendance_requirement: 75,
    push_notifications_enabled: false,
    push_notify_exams: false,
    push_notify_assignments: false,
    push_notify_deadlines: false,
    push_notify_tasks: false,
    telegram_notifications_enabled: false,
    telegram_bot_chat_id: null,
    telegram_notify_exams: true,
    telegram_notify_assignments: true,
    telegram_notify_deadlines: true,
    telegram_notify_tasks: true,
    telegram_notify_classes: false,
    pre_class_reminder_minutes: 15,
    exam_default_reminder_offsets_json: JSON.stringify([
      { value: 24, unit: "hours" },
      { value: 2, unit: "hours" },
    ]),
    task_default_reminder_offsets_json: JSON.stringify([
      { value: 24, unit: "hours" },
      { value: 2, unit: "hours" },
    ]),
    ai_requests_today: 0,
    ai_requests_reset_date: new Date().toISOString().split("T")[0] ?? "",
    last_opened_path: null,
  };
}

function toSettingsCreatePayload(settings: ReturnType<typeof createDefaultSettingsInput>): Record<string, unknown> {
  return {
    user_id: settings.user_id,
    theme_mode: settings.theme_mode,
    background_style: settings.background_style,
    background_custom_css: settings.background_custom_css,
    font_family: settings.font_family,
    accent_color_default: settings.accent_color_default,
    timezone: settings.timezone,
    first_day_of_week: settings.first_day_of_week,
    time_format: settings.time_format,
    date_format: settings.date_format,
    spi_scale: settings.spi_scale,
    credits_range_max: settings.credits_range_max,
    auto_absent_hours: settings.auto_absent_hours,
    default_attendance_requirement: settings.default_attendance_requirement,
    push_notifications_enabled: settings.push_notifications_enabled,
    push_notify_exams: settings.push_notify_exams,
    push_notify_assignments: settings.push_notify_assignments,
    push_notify_deadlines: settings.push_notify_deadlines,
    push_notify_tasks: settings.push_notify_tasks,
    telegram_notifications_enabled: settings.telegram_notifications_enabled,
    telegram_bot_chat_id: settings.telegram_bot_chat_id,
    telegram_notify_exams: settings.telegram_notify_exams,
    telegram_notify_assignments: settings.telegram_notify_assignments,
    telegram_notify_deadlines: settings.telegram_notify_deadlines,
    telegram_notify_tasks: settings.telegram_notify_tasks,
    telegram_notify_classes: settings.telegram_notify_classes,
    pre_class_reminder_minutes: settings.pre_class_reminder_minutes,
    exam_default_reminder_offsets_json: settings.exam_default_reminder_offsets_json,
    task_default_reminder_offsets_json: settings.task_default_reminder_offsets_json,
    ai_requests_today: settings.ai_requests_today,
    ai_requests_reset_date: settings.ai_requests_reset_date,
    last_opened_path: settings.last_opened_path,
  };
}

function toSettingsUpdatePayload(data: Partial<Settings>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const allowedKeys: Array<keyof Settings> = [
    "theme_mode",
    "background_style",
    "background_custom_css",
    "font_family",
    "accent_color_default",
    "timezone",
    "first_day_of_week",
    "time_format",
    "date_format",
    "spi_scale",
    "credits_range_max",
    "auto_absent_hours",
    "default_attendance_requirement",
    "push_notifications_enabled",
    "push_notify_exams",
    "push_notify_assignments",
    "push_notify_deadlines",
    "push_notify_tasks",
    "telegram_notifications_enabled",
    "telegram_bot_chat_id",
    "telegram_notify_exams",
    "telegram_notify_assignments",
    "telegram_notify_deadlines",
    "telegram_notify_tasks",
    "telegram_notify_classes",
    "pre_class_reminder_minutes",
    "exam_default_reminder_offsets_json",
    "task_default_reminder_offsets_json",
    "ai_requests_today",
    "ai_requests_reset_date",
    "last_opened_path",
  ];

  for (const key of allowedKeys) {
    if (data[key] !== undefined) {
      payload[key] = data[key];
    }
  }

  return payload;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

function extractMissingRequiredAttribute(message: string): string | null {
  const match = message.match(/Missing required attribute "([^"]+)"/);
  return match?.[1] ?? null;
}

function extractUnknownAttribute(message: string): string | null {
  const match = message.match(/Unknown attribute:? "([^"]+)"/);
  return match?.[1] ?? null;
}

async function createSettingsWithAdaptivePayload(
  payload: Record<string, unknown>,
  defaults: Record<string, unknown>
) {
  const workingPayload: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await settingsService.create(workingPayload);
    } catch (error) {
      const message = getErrorMessage(error);
      const missingKey = extractMissingRequiredAttribute(message);
      if (missingKey && workingPayload[missingKey] === undefined && missingKey in defaults) {
        workingPayload[missingKey] = defaults[missingKey];
        continue;
      }

      const unknownKey = extractUnknownAttribute(message);
      if (unknownKey && unknownKey in workingPayload) {
        delete workingPayload[unknownKey];
        continue;
      }

      throw error;
    }
  }

  return settingsService.create(workingPayload);
}

async function updateSettingsWithAdaptivePayload(id: string, payload: Record<string, unknown>) {
  const workingPayload: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await settingsService.update(id, workingPayload);
    } catch (error) {
      const message = getErrorMessage(error);
      const unknownKey = extractUnknownAttribute(message);
      if (unknownKey && unknownKey in workingPayload) {
        delete workingPayload[unknownKey];
        continue;
      }
      throw error;
    }
  }

  return settingsService.update(id, workingPayload);
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: async () => {
      const existing = await settingsService.getFirst();
      if (existing) return existing;
      const defaults = createDefaultSettingsInput();
      const payload = toSettingsCreatePayload(defaults);
      return createSettingsWithAdaptivePayload(payload, defaults as Record<string, unknown>);
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const current = await settingsService.getFirst();
      if (!current) {
        const defaults = {
          ...createDefaultSettingsInput(),
          ...data,
        } as ReturnType<typeof createDefaultSettingsInput>;
        const payload = toSettingsCreatePayload(defaults);
        return createSettingsWithAdaptivePayload(payload, defaults as Record<string, unknown>);
      }
      const payload = toSettingsUpdatePayload(data);
      return updateSettingsWithAdaptivePayload(current.$id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
    },
  });
}
