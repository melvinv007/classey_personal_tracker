import { NextRequest, NextResponse } from "next/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite-server";
import { sendTelegramMessage } from "@/lib/telegram";
import type { Exam, NotificationLog, ReminderOffset, Settings, Subject, Task } from "@/types/database";

interface DueReminder {
  entityType: "exam" | "task";
  entityId: string;
  dedupeKey: string;
  chatId: string;
  message: string;
  channel: "telegram";
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
      doc.background_style === "noise-grid"
        ? doc.background_style
        : "spooky-smoke",
    background_custom_css: typeof doc.background_custom_css === "string" ? doc.background_custom_css : null,
    font_family: typeof doc.font_family === "string" ? doc.font_family : "Nunito",
    accent_color_default: typeof doc.accent_color_default === "string" ? doc.accent_color_default : "#8B5CF6",
    timezone: typeof doc.timezone === "string" ? doc.timezone : "Asia/Kolkata",
    first_day_of_week: doc.first_day_of_week === 0 ? 0 : 1,
    time_format: doc.time_format === "12h" ? "12h" : "24h",
    date_format:
      doc.date_format === "MM/DD/YYYY" || doc.date_format === "YYYY-MM-DD"
        ? doc.date_format
        : "DD/MM/YYYY",
    spi_scale: typeof doc.spi_scale === "number" ? doc.spi_scale : 10,
    credits_range_max: typeof doc.credits_range_max === "number" ? doc.credits_range_max : 100,
    auto_absent_hours: typeof doc.auto_absent_hours === "number" ? doc.auto_absent_hours : 48,
    default_attendance_requirement:
      typeof doc.default_attendance_requirement === "number" ? doc.default_attendance_requirement : 75,
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
    exam_default_reminder_offsets_json:
      typeof doc.exam_default_reminder_offsets_json === "string" ? doc.exam_default_reminder_offsets_json : null,
    task_default_reminder_offsets_json:
      typeof doc.task_default_reminder_offsets_json === "string" ? doc.task_default_reminder_offsets_json : null,
    ai_requests_today: typeof doc.ai_requests_today === "number" ? doc.ai_requests_today : 0,
    ai_requests_reset_date:
      typeof doc.ai_requests_reset_date === "string" ? doc.ai_requests_reset_date : new Date().toISOString().split("T")[0] ?? "",
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
    attendance_requirement_percent:
      typeof doc.attendance_requirement_percent === "number" ? doc.attendance_requirement_percent : null,
    credits: typeof doc.credits === "number" ? doc.credits : 0,
    grade: typeof doc.grade === "string" ? doc.grade : null,
    grade_points: typeof doc.grade_points === "number" ? doc.grade_points : null,
    grade_scale_id: typeof doc.grade_scale_id === "string" ? doc.grade_scale_id : null,
    type:
      doc.type === "lab" || doc.type === "practical" || doc.type === "project" || doc.type === "other"
        ? doc.type
        : "theory",
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
    type:
      doc.type === "assignment" || doc.type === "midterm" || doc.type === "final" || doc.type === "practical" || doc.type === "other"
        ? doc.type
        : "quiz",
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
    priority:
      doc.priority === "urgent" || doc.priority === "high" || doc.priority === "medium" || doc.priority === "low"
        ? doc.priority
        : null,
    sort_order: typeof doc.sort_order === "number" ? doc.sort_order : 0,
    deleted_at: typeof doc.deleted_at === "string" ? doc.deleted_at : null,
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
      return (
        typeof candidate.value === "number" &&
        (candidate.unit === "minutes" || candidate.unit === "hours" || candidate.unit === "days")
      );
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

async function getSettings(): Promise<Settings | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SETTINGS, [Query.limit(1)]);
  const first = res.documents[0];
  if (!first || typeof first !== "object") return null;
  return toSettings(first as Record<string, unknown>);
}

async function getSubjectsMap(): Promise<Map<string, Subject>> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SUBJECTS, [
    Query.isNull("deleted_at"),
    Query.limit(500),
  ]);
  const subjects = res.documents.map((doc) => toSubject(doc as Record<string, unknown>));
  return new Map(subjects.map((s) => [s.$id, s]));
}

async function hasNotificationLog(dedupeKey: string): Promise<boolean> {
  const logs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, [
    Query.equal("dedupe_key", dedupeKey),
    Query.limit(1),
  ]);
  return logs.total > 0;
}

async function createNotificationLog(input: Omit<NotificationLog, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">): Promise<void> {
  await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.NOTIFICATIONS_LOG,
    ID.unique(),
    input as Record<string, unknown>
  );
}

function isDueWithinWindow(reminderAt: Date, now: Date, windowMinutes = 10): boolean {
  const diff = now.getTime() - reminderAt.getTime();
  return diff >= 0 && diff <= windowMinutes * 60_000;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.headers.get("x-scheduler-token");
    if (process.env.SCHEDULER_SECRET && token !== process.env.SCHEDULER_SECRET) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getSettings();
    if (!settings?.telegram_notifications_enabled || !settings.telegram_bot_chat_id) {
      return NextResponse.json({ success: true, sent: 0, skipped: 0, reason: "telegram-disabled" });
    }

    const now = new Date();
    const subjectsMap = await getSubjectsMap();
    const due: DueReminder[] = [];

    const examsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EXAMS, [
      Query.isNull("deleted_at"),
      Query.equal("status", "upcoming"),
      Query.limit(500),
    ]);
    const exams = examsRes.documents.map((doc) => toExam(doc as Record<string, unknown>));

    for (const exam of exams) {
      if (!settings.telegram_notify_exams) continue;
      const examDateTime = getReminderDateTimeForExam(exam);
      if (!examDateTime) continue;
      const examOffsets = parseReminderOffsetsJson(exam.reminder_offsets_json);
      const offsets = examOffsets.length > 0
        ? examOffsets
        : parseReminderOffsetsJson(settings.exam_default_reminder_offsets_json);
      for (const offset of offsets) {
        const reminderAt = new Date(examDateTime.getTime() - toMs(offset));
        if (!isDueWithinWindow(reminderAt, now)) continue;
        const key = `exam:${exam.$id}:${offset.value}:${offset.unit}:${examDateTime.toISOString()}`;
        due.push({
          entityType: "exam",
          entityId: exam.$id,
          dedupeKey: key,
          chatId: settings.telegram_bot_chat_id,
          message: buildExamMessage(exam, subjectsMap.get(exam.subject_id)),
          channel: "telegram",
        });
      }
    }

    const tasksRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TASKS, [
      Query.isNull("deleted_at"),
      Query.equal("is_completed", false),
      Query.limit(500),
    ]);
    const tasks = tasksRes.documents.map((doc) => toTask(doc as Record<string, unknown>));

    for (const task of tasks) {
      if (!settings.telegram_notify_tasks) continue;
      const taskDateTime = getReminderDateTimeForTask(task);
      if (!taskDateTime) continue;
      const taskOffsets = parseReminderOffsetsJson(task.reminder_offsets_json);
      const offsets = taskOffsets.length > 0
        ? taskOffsets
        : parseReminderOffsetsJson(settings.task_default_reminder_offsets_json);
      for (const offset of offsets) {
        const reminderAt = new Date(taskDateTime.getTime() - toMs(offset));
        if (!isDueWithinWindow(reminderAt, now)) continue;
        const key = `task:${task.$id}:${offset.value}:${offset.unit}:${taskDateTime.toISOString()}`;
        due.push({
          entityType: "task",
          entityId: task.$id,
          dedupeKey: key,
          chatId: settings.telegram_bot_chat_id,
          message: buildTaskMessage(task),
          channel: "telegram",
        });
      }
    }

    let sent = 0;
    let skipped = 0;

    for (const reminder of due) {
      const already = await hasNotificationLog(reminder.dedupeKey);
      if (already) {
        skipped += 1;
        continue;
      }

      const result = await sendTelegramMessage({
        chat_id: reminder.chatId,
        text: reminder.message,
      });

      await createNotificationLog({
        entity_type: reminder.entityType,
        entity_id: reminder.entityId,
        channel: reminder.channel,
        sent_at: new Date().toISOString(),
        message_preview: reminder.message.slice(0, 100),
        success: result.ok,
        error_message: result.ok ? null : result.description ?? "unknown error",
        dedupe_key: reminder.dedupeKey,
        retry_count: result.ok ? 0 : 1,
        next_retry_at: result.ok ? null : new Date(Date.now() + 10 * 60_000).toISOString(),
      });

      if (result.ok) sent += 1;
    }

    return NextResponse.json({ success: true, sent, skipped, totalDue: due.length });
  } catch (error) {
    console.error("Telegram scheduler error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Scheduler error" },
      { status: 500 }
    );
  }
}

