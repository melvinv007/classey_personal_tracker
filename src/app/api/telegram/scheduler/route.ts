import { NextRequest, NextResponse } from "next/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite-server";
import { sendTelegramMessage } from "@/lib/telegram";
import type { Exam, NotificationLog, ReminderOffset, Settings, Subject, Task } from "@/types/database";

type EntityType = "exam" | "task";
type SchedulerAction = "run-due" | "sync-entity" | "sync-all" | "clear-entity";

interface SchedulerRequest {
  action?: SchedulerAction;
  entityType?: EntityType;
  entityId?: string;
}

function toSettings(doc: Record<string, unknown>): Settings {
  return {
    $id: String(doc.$id ?? ""),
    $createdAt: String(doc.$createdAt ?? ""),
    $updatedAt: String(doc.$updatedAt ?? ""),
    $collectionId: String(doc.$collectionId ?? ""),
    $databaseId: String(doc.$databaseId ?? ""),
    $permissions: Array.isArray(doc.$permissions) ? doc.$permissions.filter((item): item is string => typeof item === "string") : [],
    user_id: String(doc.user_id ?? "default-user"),
    theme_mode: doc.theme_mode === "light" ? "light" : "dark",
    background_style:
      doc.background_style === "dotted" ||
      doc.background_style === "boxes" ||
      doc.background_style === "dot-pattern" ||
      doc.background_style === "aurora" ||
      doc.background_style === "beams" ||
      doc.background_style === "animated-grid"
        ? doc.background_style
        : "dotted",
    background_custom_css: typeof doc.background_custom_css === "string" ? doc.background_custom_css : null,
    font_family: typeof doc.font_family === "string" ? doc.font_family : "Nunito",
    accent_color_default: typeof doc.accent_color_default === "string" ? doc.accent_color_default : "#8B5CF6",
    timezone: typeof doc.timezone === "string" ? doc.timezone : "Asia/Kolkata",
    first_day_of_week: doc.first_day_of_week === 0 ? 0 : 1,
    time_format: doc.time_format === "12h" ? "12h" : "24h",
    date_format: doc.date_format === "MM/DD/YYYY" || doc.date_format === "YYYY-MM-DD" ? doc.date_format : "DD/MM/YYYY",
    spi_scale: typeof doc.spi_scale === "number" ? doc.spi_scale : 10,
    credits_range_max: typeof doc.credits_range_max === "number" ? doc.credits_range_max : 100,
    auto_absent_hours: typeof doc.auto_absent_hours === "number" ? doc.auto_absent_hours : 48,
    default_attendance_requirement: typeof doc.default_attendance_requirement === "number" ? doc.default_attendance_requirement : 75,
    push_notifications_enabled: Boolean(doc.push_notifications_enabled),
    push_notify_exams: Boolean(doc.push_notify_exams),
    push_notify_assignments: Boolean(doc.push_notify_assignments),
    push_notify_deadlines: Boolean(doc.push_notify_deadlines),
    push_notify_tasks: Boolean(doc.push_notify_tasks),
    telegram_notifications_enabled: Boolean(doc.telegram_notifications_enabled),
    telegram_bot_chat_id: typeof doc.telegram_bot_chat_id === "string" ? doc.telegram_bot_chat_id : null,
    telegram_notify_exams: doc.telegram_notify_exams !== false,
    telegram_notify_assignments: doc.telegram_notify_assignments !== false,
    telegram_notify_deadlines: doc.telegram_notify_deadlines !== false,
    telegram_notify_tasks: doc.telegram_notify_tasks !== false,
    telegram_notify_classes: Boolean(doc.telegram_notify_classes),
    pre_class_reminder_minutes: typeof doc.pre_class_reminder_minutes === "number" ? doc.pre_class_reminder_minutes : 15,
    exam_default_reminder_offsets_json: typeof doc.exam_default_reminder_offsets_json === "string" ? doc.exam_default_reminder_offsets_json : null,
    task_default_reminder_offsets_json: typeof doc.task_default_reminder_offsets_json === "string" ? doc.task_default_reminder_offsets_json : null,
    ai_requests_today: typeof doc.ai_requests_today === "number" ? doc.ai_requests_today : 0,
    ai_requests_reset_date: typeof doc.ai_requests_reset_date === "string" ? doc.ai_requests_reset_date : new Date().toISOString().split("T")[0] ?? "",
    last_opened_path: typeof doc.last_opened_path === "string" ? doc.last_opened_path : null,
  };
}

function toSubject(doc: Record<string, unknown>): Subject {
  return {
    $id: String(doc.$id ?? ""),
    $createdAt: String(doc.$createdAt ?? ""),
    $updatedAt: String(doc.$updatedAt ?? ""),
    $collectionId: String(doc.$collectionId ?? ""),
    $databaseId: String(doc.$databaseId ?? ""),
    $permissions: Array.isArray(doc.$permissions) ? doc.$permissions.filter((item): item is string => typeof item === "string") : [],
    semester_id: String(doc.semester_id ?? ""),
    name: String(doc.name ?? ""),
    short_name: String(doc.short_name ?? ""),
    code: typeof doc.code === "string" ? doc.code : null,
    start_date: typeof doc.start_date === "string" ? doc.start_date : null,
    end_date: typeof doc.end_date === "string" ? doc.end_date : null,
    color: typeof doc.color === "string" ? doc.color : "#8B5CF6",
    icon: typeof doc.icon === "string" ? doc.icon : null,
    attendance_requirement_percent: typeof doc.attendance_requirement_percent === "number" ? doc.attendance_requirement_percent : null,
    credits: typeof doc.credits === "number" ? doc.credits : 0,
    grade: typeof doc.grade === "string" ? doc.grade : null,
    grade_points: typeof doc.grade_points === "number" ? doc.grade_points : null,
    grade_scale_id: typeof doc.grade_scale_id === "string" ? doc.grade_scale_id : null,
    type: doc.type === "lab" || doc.type === "practical" || doc.type === "project" || doc.type === "other" ? doc.type : "theory",
    slot_ids: Array.isArray(doc.slot_ids) ? doc.slot_ids.filter((item): item is string => typeof item === "string") : [],
    teacher_name: typeof doc.teacher_name === "string" ? doc.teacher_name : null,
    teacher_email: typeof doc.teacher_email === "string" ? doc.teacher_email : null,
    teacher_phone: typeof doc.teacher_phone === "string" ? doc.teacher_phone : null,
    telegram_notify_classes: Boolean(doc.telegram_notify_classes),
    sort_order: typeof doc.sort_order === "number" ? doc.sort_order : 0,
    deleted_at: typeof doc.deleted_at === "string" ? doc.deleted_at : null,
  };
}

function toExam(doc: Record<string, unknown>): Exam {
  return {
    $id: String(doc.$id ?? ""),
    $createdAt: String(doc.$createdAt ?? ""),
    $updatedAt: String(doc.$updatedAt ?? ""),
    $collectionId: String(doc.$collectionId ?? ""),
    $databaseId: String(doc.$databaseId ?? ""),
    $permissions: Array.isArray(doc.$permissions) ? doc.$permissions.filter((item): item is string => typeof item === "string") : [],
    subject_id: String(doc.subject_id ?? ""),
    name: String(doc.name ?? ""),
    type: doc.type === "assignment" || doc.type === "midterm" || doc.type === "final" || doc.type === "practical" || doc.type === "other" ? doc.type : "quiz",
    date: String(doc.date ?? ""),
    start_time: typeof doc.start_time === "string" ? doc.start_time : null,
    duration_minutes: typeof doc.duration_minutes === "number" ? doc.duration_minutes : null,
    location: typeof doc.location === "string" ? doc.location : null,
    marks_obtained: typeof doc.marks_obtained === "number" ? doc.marks_obtained : null,
    marks_total: typeof doc.marks_total === "number" ? doc.marks_total : 0,
    weightage_percent: typeof doc.weightage_percent === "number" ? doc.weightage_percent : null,
    syllabus: typeof doc.syllabus === "string" ? doc.syllabus : null,
    notes: typeof doc.notes === "string" ? doc.notes : null,
    reminder_offsets_json: typeof doc.reminder_offsets_json === "string" ? doc.reminder_offsets_json : null,
    status: doc.status === "completed" || doc.status === "missed" ? doc.status : "upcoming",
    deleted_at: typeof doc.deleted_at === "string" ? doc.deleted_at : null,
  };
}

function toTask(doc: Record<string, unknown>): Task {
  return {
    $id: String(doc.$id ?? ""),
    $createdAt: String(doc.$createdAt ?? ""),
    $updatedAt: String(doc.$updatedAt ?? ""),
    $collectionId: String(doc.$collectionId ?? ""),
    $databaseId: String(doc.$databaseId ?? ""),
    $permissions: Array.isArray(doc.$permissions) ? doc.$permissions.filter((item): item is string => typeof item === "string") : [],
    subject_id: typeof doc.subject_id === "string" ? doc.subject_id : null,
    semester_id: typeof doc.semester_id === "string" ? doc.semester_id : null,
    title: String(doc.title ?? ""),
    description: typeof doc.description === "string" ? doc.description : null,
    notes: typeof doc.notes === "string" ? doc.notes : null,
    deadline: typeof doc.deadline === "string" ? doc.deadline : null,
    reminder_at: typeof doc.reminder_at === "string" ? doc.reminder_at : null,
    reminder_offsets_json: typeof doc.reminder_offsets_json === "string" ? doc.reminder_offsets_json : null,
    is_completed: Boolean(doc.is_completed),
    completed_at: typeof doc.completed_at === "string" ? doc.completed_at : null,
    priority: doc.priority === "urgent" || doc.priority === "high" || doc.priority === "medium" || doc.priority === "low" ? doc.priority : null,
    sort_order: typeof doc.sort_order === "number" ? doc.sort_order : 0,
    deleted_at: typeof doc.deleted_at === "string" ? doc.deleted_at : null,
  };
}

function toNotificationLog(doc: Record<string, unknown>): NotificationLog {
  return {
    $id: String(doc.$id ?? ""),
    $createdAt: String(doc.$createdAt ?? ""),
    $updatedAt: String(doc.$updatedAt ?? ""),
    $collectionId: String(doc.$collectionId ?? ""),
    $databaseId: String(doc.$databaseId ?? ""),
    $permissions: Array.isArray(doc.$permissions) ? doc.$permissions.filter((item): item is string => typeof item === "string") : [],
    entity_type:
      doc.entity_type === "class" || doc.entity_type === "deadline" || doc.entity_type === "assignment" || doc.entity_type === "task"
        ? doc.entity_type
        : "exam",
    entity_id: String(doc.entity_id ?? ""),
    channel: doc.channel === "push" ? "push" : "telegram",
    sent_at: String(doc.sent_at ?? ""),
    message_preview: String(doc.message_preview ?? ""),
    success: Boolean(doc.success),
    error_message: typeof doc.error_message === "string" ? doc.error_message : null,
    dedupe_key: typeof doc.dedupe_key === "string" ? doc.dedupe_key : null,
    retry_count: typeof doc.retry_count === "number" ? doc.retry_count : 0,
    next_retry_at: typeof doc.next_retry_at === "string" ? doc.next_retry_at : null,
  };
}

function parseReminderOffsetsJson(value: string | null | undefined): ReminderOffset[] {
  if (!value || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ReminderOffset => {
      if (typeof item !== "object" || item === null) return false;
      const candidate = item as { value?: unknown; unit?: unknown };
      return typeof candidate.value === "number" && (candidate.unit === "minutes" || candidate.unit === "hours" || candidate.unit === "days");
    });
  } catch {
    return [];
  }
}

function toMs(offset: ReminderOffset): number {
  if (offset.unit === "minutes") return offset.value * 60_000;
  if (offset.unit === "hours") return offset.value * 3_600_000;
  return offset.value * 86_400_000;
}

function getReminderDateTimeForExam(exam: Exam): Date | null {
  if (!exam.start_time) return null;
  return new Date(`${exam.date}T${exam.start_time}:00`);
}

function getReminderDateTimeForTask(task: Task): Date | null {
  if (!task.deadline) return null;
  return new Date(task.deadline);
}

function buildExamMessage(exam: Exam, subject?: Subject): string {
  const subjectName = subject?.short_name ?? subject?.name ?? "Subject";
  return `📚 <b>Exam Reminder</b>\n\n<b>${exam.name}</b>\nSubject: ${subjectName}\nDate: ${exam.date}${exam.start_time ? ` ${exam.start_time}` : ""}`;
}

function buildTaskMessage(task: Task): string {
  return `✅ <b>Task Reminder</b>\n\n<b>${task.title}</b>\n${task.deadline ? `Due: ${new Date(task.deadline).toLocaleString()}` : "No deadline"}`;
}

function dedupeKey(entityType: EntityType, entityId: string, offset: ReminderOffset, targetDateTimeIso: string): string {
  return `reminder:${entityType}:${entityId}:${offset.value}:${offset.unit}:${targetDateTimeIso}`;
}

function isExamTelegramEnabled(settings: Settings, exam: Exam): boolean {
  if (!settings.telegram_notifications_enabled) return false;
  return exam.type === "assignment" ? settings.telegram_notify_assignments : settings.telegram_notify_exams;
}

async function getSettings(): Promise<Settings | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SETTINGS, [Query.limit(1)]);
  const first = res.documents[0];
  if (!first || typeof first !== "object") return null;
  return toSettings(first as Record<string, unknown>);
}

async function getSubjectById(subjectId: string): Promise<Subject | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.SUBJECTS, subjectId);
    return toSubject(doc as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function getExamById(examId: string): Promise<Exam | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EXAMS, examId);
    return toExam(doc as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.TASKS, taskId);
    return toTask(doc as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function clearPendingJobs(entityType: EntityType, entityId: string): Promise<number> {
  const jobs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, [
    Query.equal("channel", "telegram"),
    Query.equal("entity_type", entityType),
    Query.equal("entity_id", entityId),
    Query.equal("success", false),
    Query.limit(500),
  ]);
  await Promise.all(
    jobs.documents.map((doc) => databases.deleteDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, String(doc.$id)))
  );
  return jobs.total;
}

async function createQueuedJob(
  entityType: EntityType,
  entityId: string,
  dedupe: string,
  nextRetryAt: string,
  preview: string
): Promise<void> {
  await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, ID.unique(), {
    entity_type: entityType,
    entity_id: entityId,
    channel: "telegram",
    sent_at: new Date().toISOString(),
    message_preview: preview.slice(0, 100),
    success: false,
    error_message: "queued",
    dedupe_key: dedupe,
    retry_count: 0,
    next_retry_at: nextRetryAt,
  });
}

async function syncExamReminderJobs(settings: Settings, examId: string): Promise<number> {
  await clearPendingJobs("exam", examId);
  if (!settings.telegram_bot_chat_id) return 0;
  const exam = await getExamById(examId);
  if (!exam || exam.deleted_at || exam.status !== "upcoming" || !isExamTelegramEnabled(settings, exam)) return 0;
  const examDateTime = getReminderDateTimeForExam(exam);
  if (!examDateTime) return 0;
  const offsets = parseReminderOffsetsJson(exam.reminder_offsets_json).length > 0
    ? parseReminderOffsetsJson(exam.reminder_offsets_json)
    : parseReminderOffsetsJson(settings.exam_default_reminder_offsets_json);
  let created = 0;
  for (const offset of offsets) {
    const scheduledAt = new Date(examDateTime.getTime() - toMs(offset));
    const runAt = scheduledAt.getTime() <= Date.now() ? new Date().toISOString() : scheduledAt.toISOString();
    await createQueuedJob("exam", exam.$id, dedupeKey("exam", exam.$id, offset, examDateTime.toISOString()), runAt, `Exam reminder job: ${exam.name}`);
    created += 1;
  }
  return created;
}

async function syncTaskReminderJobs(settings: Settings, taskId: string): Promise<number> {
  await clearPendingJobs("task", taskId);
  if (!settings.telegram_bot_chat_id || !settings.telegram_notify_tasks) return 0;
  const task = await getTaskById(taskId);
  if (!task || task.deleted_at || task.is_completed) return 0;
  const taskDateTime = getReminderDateTimeForTask(task);
  if (!taskDateTime) return 0;
  const offsets = parseReminderOffsetsJson(task.reminder_offsets_json).length > 0
    ? parseReminderOffsetsJson(task.reminder_offsets_json)
    : parseReminderOffsetsJson(settings.task_default_reminder_offsets_json);
  let created = 0;
  for (const offset of offsets) {
    const scheduledAt = new Date(taskDateTime.getTime() - toMs(offset));
    const runAt = scheduledAt.getTime() <= Date.now() ? new Date().toISOString() : scheduledAt.toISOString();
    await createQueuedJob("task", task.$id, dedupeKey("task", task.$id, offset, taskDateTime.toISOString()), runAt, `Task reminder job: ${task.title}`);
    created += 1;
  }
  return created;
}

function nextRetryIso(attempt: number): string {
  const delayMinutes = Math.min(60, 2 ** Math.min(attempt, 6));
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

async function markLogSuccess(logId: string, messagePreview: string, errorMessage: string | null = null): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, logId, {
    success: true,
    sent_at: new Date().toISOString(),
    message_preview: messagePreview.slice(0, 100),
    error_message: errorMessage,
    next_retry_at: null,
  });
}

async function markLogRetry(log: NotificationLog, reason: string): Promise<void> {
  const retryCount = log.retry_count + 1;
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, log.$id, {
    success: false,
    error_message: reason,
    retry_count: retryCount,
    next_retry_at: nextRetryIso(retryCount),
  });
}

async function processDueJobs(settings: Settings): Promise<{ sent: number; retried: number; skipped: number; due: number }> {
  const dueDocs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, [
    Query.equal("channel", "telegram"),
    Query.equal("success", false),
    Query.lessThanEqual("next_retry_at", new Date().toISOString()),
    Query.limit(100),
  ]);
  let sent = 0;
  let retried = 0;
  let skipped = 0;

  for (const raw of dueDocs.documents) {
    const log = toNotificationLog(raw as Record<string, unknown>);
    if (log.entity_type !== "exam" && log.entity_type !== "task") {
      skipped += 1;
      await markLogSuccess(log.$id, "Skipped unsupported reminder job", "unsupported-entity");
      continue;
    }
    if (!settings.telegram_notifications_enabled || !settings.telegram_bot_chat_id) {
      retried += 1;
      await markLogRetry(log, "telegram-disabled");
      continue;
    }
    if (log.dedupe_key) {
      const existingSent = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, [
        Query.equal("dedupe_key", log.dedupe_key),
        Query.equal("success", true),
        Query.limit(1),
      ]);
      if (existingSent.total > 0) {
        skipped += 1;
        await markLogSuccess(log.$id, "Skipped duplicate reminder", "dedupe-hit");
        continue;
      }
    }

    if (log.entity_type === "exam") {
      const exam = await getExamById(log.entity_id);
      if (!exam || exam.deleted_at || exam.status !== "upcoming" || !isExamTelegramEnabled(settings, exam)) {
        skipped += 1;
        await markLogSuccess(log.$id, "Skipped exam reminder", "entity-ineligible");
        continue;
      }
      const subject = await getSubjectById(exam.subject_id);
      const message = buildExamMessage(exam, subject ?? undefined);
      const result = await sendTelegramMessage({ chat_id: settings.telegram_bot_chat_id, text: message });
      if (result.ok) {
        sent += 1;
        await markLogSuccess(log.$id, message);
      } else {
        retried += 1;
        await markLogRetry(log, result.description ?? "telegram-send-failed");
      }
      continue;
    }

    const task = await getTaskById(log.entity_id);
    if (!task || task.deleted_at || task.is_completed || !settings.telegram_notify_tasks) {
      skipped += 1;
      await markLogSuccess(log.$id, "Skipped task reminder", "entity-ineligible");
      continue;
    }
    const taskMessage = buildTaskMessage(task);
    const taskResult = await sendTelegramMessage({ chat_id: settings.telegram_bot_chat_id, text: taskMessage });
    if (taskResult.ok) {
      sent += 1;
      await markLogSuccess(log.$id, taskMessage);
    } else {
      retried += 1;
      await markLogRetry(log, taskResult.description ?? "telegram-send-failed");
    }
  }

  return { sent, retried, skipped, due: dueDocs.total };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({} as SchedulerRequest));
    const action: SchedulerAction = body.action ?? "run-due";

    if (action === "run-due" || action === "sync-all") {
      const token = request.headers.get("x-scheduler-token");
      if (process.env.SCHEDULER_SECRET && token !== process.env.SCHEDULER_SECRET) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const settings = await getSettings();
    if (!settings) {
      return NextResponse.json({ success: false, error: "Settings not found" }, { status: 404 });
    }

    if (action === "clear-entity") {
      if (!body.entityType || !body.entityId) {
        return NextResponse.json({ success: false, error: "entityType and entityId are required" }, { status: 400 });
      }
      const cleared = await clearPendingJobs(body.entityType, body.entityId);
      return NextResponse.json({ success: true, action, cleared });
    }

    if (action === "sync-entity") {
      if (!body.entityType || !body.entityId) {
        return NextResponse.json({ success: false, error: "entityType and entityId are required" }, { status: 400 });
      }
      const created = body.entityType === "exam"
        ? await syncExamReminderJobs(settings, body.entityId)
        : await syncTaskReminderJobs(settings, body.entityId);
      return NextResponse.json({ success: true, action, created });
    }

    if (action === "sync-all") {
      let created = 0;
      const exams = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EXAMS, [
        Query.isNull("deleted_at"),
        Query.equal("status", "upcoming"),
        Query.limit(500),
      ]);
      for (const raw of exams.documents) {
        const exam = toExam(raw as Record<string, unknown>);
        created += await syncExamReminderJobs(settings, exam.$id);
      }
      const tasks = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TASKS, [
        Query.isNull("deleted_at"),
        Query.equal("is_completed", false),
        Query.limit(500),
      ]);
      for (const raw of tasks.documents) {
        const task = toTask(raw as Record<string, unknown>);
        created += await syncTaskReminderJobs(settings, task.$id);
      }
      return NextResponse.json({ success: true, action, created });
    }

    const result = await processDueJobs(settings);
    return NextResponse.json({ success: true, action: "run-due", ...result });
  } catch (error) {
    console.error("Telegram scheduler error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Scheduler error" },
      { status: 500 }
    );
  }
}

