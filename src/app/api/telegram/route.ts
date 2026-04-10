/**
 * Telegram Notification API Routes
 * POST /api/telegram/send - Send a notification
 * POST /api/telegram/verify - Verify chat ID
 * POST /api/telegram/test - Send test message
 */

import { NextRequest, NextResponse } from "next/server";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "@/lib/appwrite-server";
import { 
  sendNotification, 
  verifyChatId, 
  sendTelegramMessage,
  type NotificationType 
} from "@/lib/telegram";

interface SendRequest {
  chatId: string;
  type: NotificationType;
  data: Record<string, unknown>;
  entityType?: "exam" | "task" | "class" | "deadline" | "assignment";
  entityId?: string;
  dedupeKey?: string;
}

interface VerifyRequest {
  chatId: string;
}

interface TestRequest {
  chatId: string;
}

/**
 * POST /api/telegram - Send notification
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case "send": {
        const { chatId, type, data, entityType, entityId, dedupeKey } = body as SendRequest & { action: string };
        
        if (!chatId || !type || !data) {
          return NextResponse.json(
            { success: false, error: "Missing required fields" },
            { status: 400 }
          );
        }

        if (dedupeKey) {
          const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS_LOG, [
            Query.equal("dedupe_key", dedupeKey),
            Query.limit(1),
          ]);
          if (existing.total > 0) {
            return NextResponse.json({ success: true, skipped: true });
          }
        }

        const result = await sendNotification(chatId, type, data);

        if (entityType && entityId) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.NOTIFICATIONS_LOG,
            ID.unique(),
            {
              type: entityType,
              entity_id: entityId,
              channel: "telegram",
              sent_at: new Date().toISOString(),
              success: result.ok,
              error_message: result.ok ? null : result.description ?? "Unknown error",
              dedupe_key: dedupeKey ?? null,
              retry_count: result.ok ? 0 : 1,
              next_retry_at: result.ok ? null : new Date(Date.now() + 10 * 60_000).toISOString(),
            }
          );
        }
        
        return NextResponse.json({
          success: result.ok,
          error: result.ok ? undefined : result.description,
        });
      }

      case "verify": {
        const { chatId } = body as VerifyRequest & { action: string };
        
        if (!chatId) {
          return NextResponse.json(
            { success: false, error: "Chat ID is required" },
            { status: 400 }
          );
        }

        const isValid = await verifyChatId(chatId);
        
        return NextResponse.json({
          success: isValid,
          message: isValid 
            ? "Chat ID verified successfully" 
            : "Failed to verify chat ID",
        });
      }

      case "test": {
        const { chatId } = body as TestRequest & { action: string };
        
        if (!chatId) {
          return NextResponse.json(
            { success: false, error: "Chat ID is required" },
            { status: 400 }
          );
        }

        const result = await sendTelegramMessage({
          chat_id: chatId,
          text: "🧪 <b>Test Notification</b>\n\nThis is a test message from Classey.\nIf you received this, notifications are working!",
        });
        
        return NextResponse.json({
          success: result.ok,
          error: result.ok ? undefined : result.description,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Telegram API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Server error" 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram - Check bot status
 */
export async function GET(): Promise<NextResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  return NextResponse.json({
    configured: !!botToken,
    message: botToken 
      ? "Telegram bot is configured" 
      : "TELEGRAM_BOT_TOKEN not set",
  });
}
