/**
 * AI Library - Groq + Google AI fallback
 * Features:
 * - Primary: Groq (llama model)
 * - Fallback: Google AI (gemini-flash)
 * - 50 requests/day limit
 * - Conversation history (last 20 messages)
 */

import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { AiConversation, Subject, Exam, Task, Semester } from "@/types/database";

// AI providers
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || "",
});

// Daily limit
const DAILY_AI_LIMIT = 50;

// IST timezone
const IST_TIMEZONE = "Asia/Kolkata";

/**
 * AI context for system prompts
 */
export interface AIContext {
  currentSemester: Semester | null;
  subjects: Subject[];
  upcomingExams: Exam[];
  pendingTasks: Task[];
  aiRequestsToday: number;
}

/**
 * Get current IST date string
 */
function getISTDateString(): string {
  const now = new Date();
  const istTime = toZonedTime(now, IST_TIMEZONE);
  return format(istTime, "yyyy-MM-dd");
}

/**
 * Get current IST datetime string
 */
function getISTDateTimeString(): string {
  const now = new Date();
  const istTime = toZonedTime(now, IST_TIMEZONE);
  return format(istTime, "EEEE, MMMM d, yyyy 'at' h:mm a");
}

/**
 * Check if AI request is allowed (under daily limit)
 */
export function checkAILimit(
  aiRequestsToday: number,
  aiRequestsResetDate: string
): { allowed: boolean; remaining: number; resetDate: string } {
  const today = getISTDateString();
  
  // Reset counter if new day
  if (aiRequestsResetDate !== today) {
    return {
      allowed: true,
      remaining: DAILY_AI_LIMIT,
      resetDate: today,
    };
  }
  
  const remaining = Math.max(0, DAILY_AI_LIMIT - aiRequestsToday);
  return {
    allowed: remaining > 0,
    remaining,
    resetDate: aiRequestsResetDate,
  };
}

/**
 * Build system prompt with app context
 */
export function buildSystemPrompt(context: AIContext): string {
  const subjectsList = context.subjects
    .map((s) => {
      const attendance = s.attendance_requirement_percent || 75;
      return `- ${s.short_name} (${s.name}): ${s.credits} credits, ${s.type}, required attendance ${attendance}%`;
    })
    .join("\n");

  const examsList = context.upcomingExams
    .map((e) => {
      const subject = context.subjects.find((s) => s.$id === e.subject_id);
      return `- ${e.name} (${subject?.short_name || "Unknown"}): ${e.date}${e.start_time ? ` at ${e.start_time}` : ""}, ${e.marks_total} marks`;
    })
    .join("\n");

  const tasksSummary = `${context.pendingTasks.length} pending tasks, ${context.pendingTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date()).length} overdue`;

  return `You are Classey's AI assistant for a university student.
Current date and time: ${getISTDateTimeString()} (IST)
${context.currentSemester ? `Current semester: ${context.currentSemester.name} (ends ${context.currentSemester.end_date})` : "No active semester"}

Subjects:
${subjectsList || "No subjects yet"}

Upcoming exams (next 7 days):
${examsList || "No upcoming exams"}

Tasks: ${tasksSummary}
AI requests remaining today: ${DAILY_AI_LIMIT - context.aiRequestsToday}/${DAILY_AI_LIMIT}

Guidelines:
- Be concise, practical, and specific
- Use the student's actual data provided above
- Format responses with clear sections when needed
- Do not make up information not provided above
- When user asks to create something, respond with JSON in this format:
  { "action": "create", "entity_type": "exam|task|event", "fields": { ... } }
- For general questions, respond normally with helpful text
- Use markdown formatting for readability`;
}

/**
 * Parse AI response for entity creation
 */
export interface AIEntityAction {
  action: "create" | "none";
  entity_type?: "exam" | "task" | "event";
  fields?: Record<string, unknown>;
}

export function parseAIResponse(response: string): {
  text: string;
  entityAction: AIEntityAction | null;
} {
  // Try to extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*"action"[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as AIEntityAction;
      if (parsed.action === "create" && parsed.entity_type && parsed.fields) {
        // Remove JSON from text response
        const text = response.replace(jsonMatch[0], "").trim();
        return { text, entityAction: parsed };
      }
    } catch {
      // JSON parse failed, return as regular text
    }
  }
  
  return { text: response, entityAction: null };
}

/**
 * AI response type
 */
export interface AIResponse {
  text: string;
  provider: "groq" | "google";
  tokensUsed: number | null;
  entityAction: AIEntityAction | null;
}

/**
 * Call AI with Groq → Google fallback
 * This is a server-side function (use in API routes)
 */
export async function callAI(
  prompt: string,
  systemPrompt: string,
  conversationHistory: AiConversation[] = []
): Promise<AIResponse> {
  // Build messages array with history
  const messages = conversationHistory.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  let provider: "groq" | "google" = "groq";
  let responseText: string;
  let tokensUsed: number | null = null;

  try {
    // Try Groq first
    const response = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      messages: [...messages, { role: "user" as const, content: prompt }],
      maxOutputTokens: 1000,
    });
    responseText = response.text;
    tokensUsed = response.usage?.totalTokens || null;
  } catch (groqError) {
    // Fallback to Google AI on ANY Groq error
    console.warn("Groq failed, falling back to Google AI:", groqError);
    provider = "google";
    
    try {
      const response = await generateText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt,
        messages: [...messages, { role: "user" as const, content: prompt }],
        maxOutputTokens: 1000,
      });
      responseText = response.text;
      tokensUsed = response.usage?.totalTokens || null;
    } catch (googleError) {
      console.error("Google AI also failed:", googleError);
      throw new Error("AI service unavailable. Please try again later.");
    }
  }

  // Parse response for entity creation
  const { text, entityAction } = parseAIResponse(responseText);

  return {
    text,
    provider,
    tokensUsed,
    entityAction,
  };
}

/**
 * Quick AI prompts for common actions
 */
export const AI_QUICK_PROMPTS = {
  STUDY_TIPS: "Based on my upcoming exams and current attendance, what should I focus on today?",
  ATTENDANCE_CHECK: "How is my attendance looking? Any subjects I need to focus on?",
  EXAM_PREP: "Help me plan my study schedule for upcoming exams.",
  WEEKLY_SUMMARY: "Give me a summary of my academic week so far.",
  MOTIVATION: "I'm feeling overwhelmed. Give me some encouragement and practical advice.",
} as const;

/**
 * Format AI message for display
 */
export function formatAIMessage(content: string): string {
  // Basic markdown-like formatting for display
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}
