/**
 * AI Chat API Route
 * POST /api/ai/chat
 */

import { NextRequest, NextResponse } from "next/server";
import { callAI, buildSystemPrompt, checkAILimit, type AIContext } from "@/lib/ai";
import { databases, DATABASE_ID } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import type { AiConversation, Subject, Exam, Task, Semester } from "@/types/database";

const COLLECTIONS = {
  semesters: "semesters",
  subjects: "subjects",
  exams: "exams",
  tasks: "tasks",
  settings: "settings",
};

interface ChatRequest {
  message: string;
  conversationHistory?: AiConversation[];
}

interface AppwriteDocWithId {
  $id: string;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  provider?: "groq" | "google";
  tokensUsed?: number | null;
  entityAction?: {
    action: "create" | "none";
    entity_type?: "exam" | "task" | "event";
    fields?: Record<string, unknown>;
  } | null;
  remaining?: number;
  error?: string;
}

function asSemester(doc: unknown): Semester | null {
  if (!doc || typeof doc !== "object") return null;
  return doc as Semester;
}

function asSubjectArray(docs: unknown[]): Subject[] {
  return docs.filter((doc) => doc && typeof doc === "object") as Subject[];
}

function asExamArray(docs: unknown[]): Exam[] {
  return docs.filter((doc) => doc && typeof doc === "object") as Exam[];
}

function asTaskArray(docs: unknown[]): Task[] {
  return docs.filter((doc) => doc && typeof doc === "object") as Task[];
}

// Fetch AI usage from settings
async function getAIUsage(): Promise<{ requestsToday: number; resetDate: string }> {
  try {
    const settings = await databases.listDocuments(DATABASE_ID, COLLECTIONS.settings, [
      Query.limit(1),
    ]);
    if (settings.documents.length > 0) {
      const doc = settings.documents[0] as Record<string, unknown>;
      return {
        requestsToday: typeof doc.ai_requests_today === "number" ? doc.ai_requests_today : 0,
        resetDate: typeof doc.ai_requests_reset_date === "string"
          ? doc.ai_requests_reset_date
          : new Date().toISOString().split("T")[0] ?? "",
      };
    }
  } catch {
    // Settings may not exist yet
  }
  return { requestsToday: 0, resetDate: new Date().toISOString().split("T")[0] };
}

// Update AI usage in settings
async function updateAIUsage(requestsToday: number, resetDate: string): Promise<void> {
  try {
    const settings = await databases.listDocuments(DATABASE_ID, COLLECTIONS.settings, [
      Query.limit(1),
    ]);
    if (settings.documents.length > 0) {
      const doc = settings.documents[0] as AppwriteDocWithId;
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.settings, doc.$id, {
        ai_requests_today: requestsToday,
        ai_requests_reset_date: resetDate,
      });
    }
  } catch {
    // Ignore - settings may not have these fields yet
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body = (await request.json()) as ChatRequest;
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Get AI usage from Appwrite
    let { requestsToday, resetDate } = await getAIUsage();

    // Check daily limit
    const limitCheck = checkAILimit(requestsToday, resetDate);
    
    if (limitCheck.resetDate !== resetDate) {
      // New day, reset counter
      requestsToday = 0;
      resetDate = limitCheck.resetDate;
      await updateAIUsage(0, resetDate);
    }

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Daily AI limit reached (50/50). Resets at midnight IST.",
          remaining: 0 
        },
        { status: 429 }
      );
    }

    // Fetch data from Appwrite
    // Get current (ongoing) semester
    let currentSemester: Semester | null = null;
    let subjects: Subject[] = [];
    let upcomingExams: Exam[] = [];
    let pendingTasks: Task[] = [];

    try {
      const semesterResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.semesters, [
        Query.equal("status", "ongoing"),
        Query.isNull("deleted_at"),
        Query.limit(1),
      ]);
      if (semesterResult.documents.length > 0) {
        currentSemester = asSemester(semesterResult.documents[0]);
      }
    } catch {
      console.error("Failed to fetch current semester");
    }

    // Get subjects for current semester
    if (currentSemester) {
      try {
        const subjectResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.subjects, [
          Query.equal("semester_id", currentSemester.$id),
          Query.isNull("deleted_at"),
          Query.limit(100),
        ]);
        subjects = asSubjectArray(subjectResult.documents);
      } catch {
        console.error("Failed to fetch subjects");
      }
    }

    // Get upcoming exams (next 7 days)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    try {
      const examResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.exams, [
        Query.isNull("deleted_at"),
        Query.greaterThanEqual("date", now.toISOString().split("T")[0]),
        Query.lessThanEqual("date", weekFromNow.toISOString().split("T")[0]),
        Query.limit(20),
      ]);
      upcomingExams = asExamArray(examResult.documents);
    } catch {
      console.error("Failed to fetch upcoming exams");
    }

    // Get pending tasks
    try {
      const taskResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.tasks, [
        Query.isNull("deleted_at"),
        Query.equal("is_completed", false),
        Query.limit(50),
      ]);
      pendingTasks = asTaskArray(taskResult.documents);
    } catch {
      console.error("Failed to fetch pending tasks");
    }

    const context: AIContext = {
      currentSemester,
      subjects,
      upcomingExams,
      pendingTasks,
      aiRequestsToday: requestsToday,
    };

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Call AI
    const response = await callAI(
      message,
      systemPrompt,
      conversationHistory
    );

    // Increment request counter and save to Appwrite
    const newRequestCount = requestsToday + 1;
    await updateAIUsage(newRequestCount, resetDate);

    return NextResponse.json({
      success: true,
      message: response.text,
      provider: response.provider,
      tokensUsed: response.tokensUsed,
      entityAction: response.entityAction,
      remaining: limitCheck.remaining - 1,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "AI service error" 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/chat - Get AI status
 */
export async function GET(): Promise<NextResponse> {
  const { requestsToday, resetDate } = await getAIUsage();
  const limitCheck = checkAILimit(requestsToday, resetDate);
  
  return NextResponse.json({
    requestsToday: limitCheck.resetDate !== resetDate ? 0 : requestsToday,
    remaining: limitCheck.remaining,
    limit: 50,
    resetDate: limitCheck.resetDate,
  });
}
