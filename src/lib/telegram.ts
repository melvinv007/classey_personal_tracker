/**
 * Telegram Bot Notification Library
 * Handles sending notifications via Telegram Bot API
 */

// Telegram Bot API base URL
const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  disable_notification?: boolean;
}

export interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
  error_code?: number;
}

/**
 * Send a message via Telegram Bot
 */
export async function sendTelegramMessage(
  message: TelegramMessage
): Promise<TelegramResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN not configured");
    return { ok: false, description: "Bot token not configured" };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: message.chat_id,
        text: message.text,
        parse_mode: message.parse_mode || "HTML",
        disable_notification: message.disable_notification || false,
      }),
    });

    const data = await response.json() as TelegramResponse;
    return data;
  } catch (error) {
    console.error("Telegram API error:", error);
    return { 
      ok: false, 
      description: error instanceof Error ? error.message : "Network error" 
    };
  }
}

/**
 * Notification types
 */
export type NotificationType = 
  | "exam_reminder"
  | "assignment_due"
  | "task_deadline"
  | "class_reminder"
  | "attendance_warning";

/**
 * Format exam reminder message
 */
export function formatExamReminder(exam: {
  name: string;
  subject_name: string;
  date: string;
  start_time?: string;
  location?: string;
  syllabus?: string;
}): string {
  let message = `📚 <b>Exam Reminder</b>\n\n`;
  message += `<b>${exam.name}</b>\n`;
  message += `Subject: ${exam.subject_name}\n`;
  message += `📅 Date: ${exam.date}`;
  
  if (exam.start_time) {
    message += ` at ${exam.start_time}`;
  }
  message += "\n";
  
  if (exam.location) {
    message += `📍 Location: ${exam.location}\n`;
  }
  
  if (exam.syllabus) {
    message += `\n📖 Syllabus: ${exam.syllabus}`;
  }
  
  message += `\n\n<i>Good luck! 🍀</i>`;
  return message;
}

/**
 * Format assignment due reminder
 */
export function formatAssignmentDue(assignment: {
  name: string;
  subject_name: string;
  deadline: string;
  marks_total?: number;
}): string {
  let message = `📝 <b>Assignment Due</b>\n\n`;
  message += `<b>${assignment.name}</b>\n`;
  message += `Subject: ${assignment.subject_name}\n`;
  message += `⏰ Deadline: ${assignment.deadline}`;
  
  if (assignment.marks_total) {
    message += `\n📊 Marks: ${assignment.marks_total}`;
  }
  
  message += `\n\n<i>Don't forget to submit!</i>`;
  return message;
}

/**
 * Format task deadline reminder
 */
export function formatTaskDeadline(task: {
  title: string;
  deadline: string;
  description?: string;
  priority?: string;
}): string {
  const priorityEmoji = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  }[task.priority || "medium"] || "🟡";

  let message = `✅ <b>Task Deadline</b>\n\n`;
  message += `${priorityEmoji} <b>${task.title}</b>\n`;
  message += `⏰ Due: ${task.deadline}`;
  
  if (task.description) {
    message += `\n\n${task.description}`;
  }
  
  return message;
}

/**
 * Format class reminder
 */
export function formatClassReminder(classInfo: {
  subject_name: string;
  short_name: string;
  start_time: string;
  end_time: string;
  room?: string;
  minutes_until: number;
}): string {
  let message = `🔔 <b>Class in ${classInfo.minutes_until} minutes</b>\n\n`;
  message += `<b>${classInfo.subject_name}</b> (${classInfo.short_name})\n`;
  message += `⏰ ${classInfo.start_time} - ${classInfo.end_time}`;
  
  if (classInfo.room) {
    message += `\n📍 Room: ${classInfo.room}`;
  }
  
  return message;
}

/**
 * Format attendance warning
 */
export function formatAttendanceWarning(warning: {
  subject_name: string;
  current_percent: number;
  required_percent: number;
  classes_needed: number;
}): string {
  let message = `⚠️ <b>Attendance Alert</b>\n\n`;
  message += `<b>${warning.subject_name}</b>\n`;
  message += `📊 Current: ${warning.current_percent.toFixed(1)}%\n`;
  message += `🎯 Required: ${warning.required_percent}%\n\n`;
  
  if (warning.classes_needed > 0) {
    message += `You need to attend <b>${warning.classes_needed}</b> more classes to meet the requirement.`;
  } else {
    message += `❌ You may not be able to meet the attendance requirement.`;
  }
  
  return message;
}

/**
 * Format daily summary
 */
export function formatDailySummary(summary: {
  date: string;
  classes_today: number;
  exams_upcoming: number;
  tasks_due: number;
  attendance_avg: number;
}): string {
  let message = `📅 <b>Daily Summary - ${summary.date}</b>\n\n`;
  
  message += `📚 Classes today: ${summary.classes_today}\n`;
  message += `📝 Upcoming exams: ${summary.exams_upcoming}\n`;
  message += `✅ Tasks due soon: ${summary.tasks_due}\n`;
  message += `📊 Avg attendance: ${summary.attendance_avg.toFixed(1)}%`;
  
  return message;
}

/**
 * Send notification based on type
 */
export async function sendNotification(
  chatId: string,
  type: NotificationType,
  data: Record<string, unknown>
): Promise<TelegramResponse> {
  let text: string;
  
  switch (type) {
    case "exam_reminder":
      text = formatExamReminder(data as Parameters<typeof formatExamReminder>[0]);
      break;
    case "assignment_due":
      text = formatAssignmentDue(data as Parameters<typeof formatAssignmentDue>[0]);
      break;
    case "task_deadline":
      text = formatTaskDeadline(data as Parameters<typeof formatTaskDeadline>[0]);
      break;
    case "class_reminder":
      text = formatClassReminder(data as Parameters<typeof formatClassReminder>[0]);
      break;
    case "attendance_warning":
      text = formatAttendanceWarning(data as Parameters<typeof formatAttendanceWarning>[0]);
      break;
    default:
      text = JSON.stringify(data);
  }

  return sendTelegramMessage({ chat_id: chatId, text });
}

/**
 * Verify Telegram chat ID is valid
 */
export async function verifyChatId(chatId: string): Promise<boolean> {
  const result = await sendTelegramMessage({
    chat_id: chatId,
    text: "✅ <b>Classey Connected!</b>\n\nYour Telegram notifications are now set up.",
  });
  return result.ok;
}
