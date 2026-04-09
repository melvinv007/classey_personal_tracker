/**
 * Appwrite Collection Setup Script
 * Run this script to create all 23 collections with proper attributes
 * 
 * Usage: npx tsx scripts/setup-appwrite.ts
 */

import { Client, Databases, Permission, Role, ID, Query } from "node-appwrite";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const API_KEY = process.env.APPWRITE_API_KEY || "";

if (!PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error("Missing required environment variables!");
  console.error("Required: NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, APPWRITE_API_KEY");
  process.exit(1);
}

console.log("Configuration:");
console.log(`  Endpoint: ${ENDPOINT}`);
console.log(`  Project ID: ${PROJECT_ID}`);
console.log(`  Database ID: ${DATABASE_ID}`);
console.log("");

// Initialize Appwrite client with API key
const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const databases = new Databases(client);

interface AttributeDef {
  type: "string" | "integer" | "float" | "boolean" | "datetime" | "enum";
  key: string;
  size?: number;
  required: boolean;
  elements?: string[];
}

interface CollectionDef {
  id: string;
  name: string;
  attributes: AttributeDef[];
}

interface SeedSlot {
  slot_id: string;
  name: string;
  type: "regular" | "lab" | "extra";
  sub_slots: Array<{ id: string; day_of_week: 1 | 2 | 3 | 4 | 5 | 6; start_time: string; end_time: string }>;
  sort_order: number;
}

// Collection definitions
const collections: CollectionDef[] = [
  {
    id: "semesters",
    name: "Semesters",
    attributes: [
      { type: "string", key: "name", size: 100, required: true },
      { type: "string", key: "start_date", size: 10, required: true },
      { type: "string", key: "end_date", size: 10, required: true },
      { type: "string", key: "color", size: 7, required: true },
      { type: "string", key: "icon", size: 50, required: false },
      { type: "float", key: "target_spi", required: false },
      { type: "float", key: "spi", required: false },
      { type: "integer", key: "credits_earned", required: false },
      { type: "integer", key: "credits_total", required: false },
      { type: "boolean", key: "is_quick_input", required: true },
      { type: "enum", key: "status", elements: ["upcoming", "ongoing", "completed"], required: true },
      { type: "boolean", key: "is_archived", required: true },
      { type: "integer", key: "sort_order", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "subjects",
    name: "Subjects",
    attributes: [
      { type: "string", key: "semester_id", size: 36, required: true },
      { type: "string", key: "name", size: 150, required: true },
      { type: "string", key: "short_name", size: 20, required: true },
      { type: "string", key: "code", size: 20, required: false },
      { type: "string", key: "start_date", size: 10, required: false },
      { type: "string", key: "end_date", size: 10, required: false },
      { type: "string", key: "color", size: 7, required: true },
      { type: "string", key: "icon", size: 50, required: false },
      { type: "integer", key: "attendance_requirement_percent", required: false },
      { type: "integer", key: "credits", required: true },
      { type: "string", key: "grade", size: 3, required: false },
      { type: "float", key: "grade_points", required: false },
      { type: "string", key: "grade_scale_id", size: 36, required: false },
      { type: "enum", key: "type", elements: ["theory", "lab", "practical", "project", "other"], required: true },
      { type: "string", key: "slot_ids", size: 500, required: false },
      { type: "string", key: "teacher_name", size: 100, required: false },
      { type: "string", key: "teacher_email", size: 100, required: false },
      { type: "string", key: "teacher_phone", size: 20, required: false },
      { type: "boolean", key: "telegram_notify_classes", required: true },
      { type: "integer", key: "sort_order", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "class_schedules",
    name: "Class Schedules",
    attributes: [
      { type: "string", key: "subject_id", size: 36, required: true },
      { type: "string", key: "slot_id", size: 36, required: false },
      { type: "string", key: "sub_slot_id", size: 36, required: false },
      { type: "integer", key: "day_of_week", required: true },
      { type: "string", key: "start_time", size: 5, required: true },
      { type: "string", key: "end_time", size: 5, required: true },
      { type: "string", key: "room", size: 50, required: false },
      { type: "string", key: "building", size: 50, required: false },
      { type: "string", key: "effective_from", size: 10, required: true },
      { type: "string", key: "effective_until", size: 10, required: false },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "class_occurrences",
    name: "Class Occurrences",
    attributes: [
      { type: "string", key: "subject_id", size: 36, required: true },
      { type: "string", key: "schedule_id", size: 36, required: false },
      { type: "string", key: "date", size: 10, required: true },
      { type: "string", key: "start_time", size: 5, required: true },
      { type: "string", key: "end_time", size: 5, required: true },
      { type: "enum", key: "status", elements: ["scheduled", "completed", "cancelled", "rescheduled"], required: true },
      { type: "string", key: "cancellation_reason", size: 200, required: false },
      { type: "string", key: "rescheduled_to", size: 10, required: false },
      { type: "enum", key: "attendance", elements: ["present", "absent"], required: false },
      { type: "datetime", key: "attendance_marked_at", required: false },
      { type: "string", key: "attendance_note", size: 200, required: false },
      { type: "boolean", key: "is_extra_class", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "exams",
    name: "Exams",
    attributes: [
      { type: "string", key: "subject_id", size: 36, required: true },
      { type: "string", key: "name", size: 150, required: true },
      { type: "enum", key: "type", elements: ["quiz", "assignment", "midterm", "final", "practical", "other"], required: true },
      { type: "string", key: "date", size: 10, required: true },
      { type: "string", key: "start_time", size: 5, required: false },
      { type: "integer", key: "duration_minutes", required: false },
      { type: "string", key: "location", size: 100, required: false },
      { type: "float", key: "marks_obtained", required: false },
      { type: "float", key: "marks_total", required: true },
      { type: "float", key: "weightage_percent", required: false },
      { type: "string", key: "syllabus", size: 2000, required: false },
      { type: "string", key: "notes", size: 2000, required: false },
      { type: "enum", key: "status", elements: ["upcoming", "completed", "missed"], required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "tasks",
    name: "Tasks",
    attributes: [
      { type: "string", key: "subject_id", size: 36, required: false },
      { type: "string", key: "semester_id", size: 36, required: false },
      { type: "string", key: "title", size: 200, required: true },
      { type: "string", key: "description", size: 2000, required: false },
      { type: "string", key: "notes", size: 2000, required: false },
      { type: "datetime", key: "deadline", required: false },
      { type: "datetime", key: "reminder_at", required: false },
      { type: "boolean", key: "is_completed", required: true },
      { type: "datetime", key: "completed_at", required: false },
      { type: "enum", key: "priority", elements: ["urgent", "high", "medium", "low"], required: false },
      { type: "integer", key: "sort_order", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "events",
    name: "Events",
    attributes: [
      { type: "string", key: "semester_id", size: 36, required: false },
      { type: "string", key: "title", size: 200, required: true },
      { type: "string", key: "description", size: 2000, required: false },
      { type: "string", key: "location", size: 200, required: false },
      { type: "datetime", key: "start_datetime", required: true },
      { type: "datetime", key: "end_datetime", required: true },
      { type: "boolean", key: "is_all_day", required: true },
      { type: "enum", key: "recurrence", elements: ["none", "daily", "weekly", "monthly"], required: false },
      { type: "string", key: "color", size: 7, required: false },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "files",
    name: "Files",
    attributes: [
      { type: "string", key: "storage_file_id", size: 36, required: true },
      { type: "string", key: "file_name", size: 255, required: true },
      { type: "integer", key: "file_size", required: true },
      { type: "string", key: "mime_type", size: 100, required: true },
      { type: "string", key: "file_extension", size: 10, required: true },
      { type: "string", key: "subject_id", size: 36, required: false },
      { type: "string", key: "exam_id", size: 36, required: false },
      { type: "string", key: "task_id", size: 36, required: false },
      { type: "string", key: "event_id", size: 36, required: false },
      { type: "string", key: "occurrence_id", size: 36, required: false },
      { type: "string", key: "description", size: 500, required: false },
      { type: "boolean", key: "is_past_paper", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "resource_links",
    name: "Resource Links",
    attributes: [
      { type: "string", key: "subject_id", size: 36, required: true },
      { type: "string", key: "exam_id", size: 36, required: false },
      { type: "string", key: "title", size: 200, required: true },
      { type: "string", key: "url", size: 2000, required: true },
      { type: "enum", key: "type", elements: ["youtube", "notion", "drive", "github", "website", "other"], required: true },
      { type: "string", key: "description", size: 500, required: false },
      { type: "string", key: "thumbnail_url", size: 500, required: false },
      { type: "integer", key: "sort_order", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "notes",
    name: "Notes",
    attributes: [
      { type: "string", key: "subject_id", size: 36, required: true },
      { type: "string", key: "occurrence_id", size: 36, required: false },
      { type: "string", key: "content", size: 5000, required: true },
      { type: "boolean", key: "is_pinned", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "slots",
    name: "Slots",
    attributes: [
      { type: "string", key: "slot_id", size: 20, required: true },
      { type: "string", key: "name", size: 50, required: true },
      { type: "enum", key: "type", elements: ["regular", "lab", "extra"], required: true },
      { type: "string", key: "sub_slots", size: 5000, required: true },
      { type: "boolean", key: "is_default", required: true },
      { type: "integer", key: "sort_order", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    attributes: [
      { type: "string", key: "user_id", size: 36, required: true },
      { type: "enum", key: "theme_mode", elements: ["dark", "light"], required: true },
      { type: "enum", key: "background_style", elements: ["spooky-smoke", "dotted", "boxes", "dot-pattern", "noise-grid"], required: true },
      { type: "string", key: "background_custom_css", size: 5000, required: false },
      { type: "string", key: "font_family", size: 50, required: true },
      { type: "string", key: "accent_color_default", size: 7, required: true },
      { type: "string", key: "timezone", size: 50, required: true },
      { type: "integer", key: "first_day_of_week", required: true },
      { type: "enum", key: "time_format", elements: ["12h", "24h"], required: true },
      { type: "enum", key: "date_format", elements: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], required: true },
      { type: "integer", key: "spi_scale", required: true },
      { type: "integer", key: "credits_range_max", required: true },
      { type: "integer", key: "auto_absent_hours", required: true },
      { type: "integer", key: "default_attendance_requirement", required: true },
      { type: "boolean", key: "push_notifications_enabled", required: true },
      { type: "boolean", key: "push_notify_exams", required: true },
      { type: "boolean", key: "push_notify_assignments", required: true },
      { type: "boolean", key: "push_notify_deadlines", required: true },
      { type: "boolean", key: "push_notify_tasks", required: true },
      { type: "boolean", key: "telegram_notifications_enabled", required: true },
      { type: "string", key: "telegram_bot_chat_id", size: 50, required: false },
      { type: "boolean", key: "telegram_notify_exams", required: true },
      { type: "boolean", key: "telegram_notify_assignments", required: true },
      { type: "boolean", key: "telegram_notify_deadlines", required: true },
      { type: "boolean", key: "telegram_notify_tasks", required: true },
      { type: "boolean", key: "telegram_notify_classes", required: true },
      { type: "integer", key: "pre_class_reminder_minutes", required: true },
      { type: "integer", key: "ai_requests_today", required: true },
      { type: "string", key: "ai_requests_reset_date", size: 10, required: true },
      { type: "string", key: "last_opened_path", size: 200, required: false },
    ],
  },
  {
    id: "grade_scales",
    name: "Grade Scales",
    attributes: [
      { type: "string", key: "name", size: 100, required: true },
      { type: "boolean", key: "is_default", required: true },
      { type: "string", key: "mappings", size: 5000, required: true },
    ],
  },
  {
    id: "holidays",
    name: "Holidays",
    attributes: [
      { type: "string", key: "name", size: 100, required: true },
      { type: "string", key: "date", size: 10, required: true },
      { type: "string", key: "date_end", size: 10, required: false },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "tags",
    name: "Tags",
    attributes: [
      { type: "string", key: "name", size: 50, required: true },
      { type: "string", key: "color", size: 7, required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "tagged_items",
    name: "Tagged Items",
    attributes: [
      { type: "string", key: "tag_id", size: 36, required: true },
      { type: "string", key: "entity_type", size: 50, required: true },
      { type: "string", key: "entity_id", size: 36, required: true },
    ],
  },
  {
    id: "goals",
    name: "Goals",
    attributes: [
      { type: "string", key: "semester_id", size: 36, required: false },
      { type: "string", key: "subject_id", size: 36, required: false },
      { type: "string", key: "title", size: 200, required: true },
      { type: "enum", key: "type", elements: ["attendance", "grade", "spi", "custom"], required: true },
      { type: "float", key: "target_value", required: false },
      { type: "float", key: "current_value", required: false },
      { type: "boolean", key: "is_achieved", required: true },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
  {
    id: "backups",
    name: "Backups",
    attributes: [
      { type: "datetime", key: "backup_created_at", required: true },
      { type: "enum", key: "format", elements: ["json", "csv"], required: true },
      { type: "string", key: "storage_file_id", size: 36, required: false },
      { type: "string", key: "collections_included", size: 1000, required: true },
      { type: "integer", key: "size_bytes", required: true },
    ],
  },
  {
    id: "widgets_config",
    name: "Widgets Config",
    attributes: [
      { type: "string", key: "user_id", size: 36, required: true },
      { type: "string", key: "widget_id", size: 50, required: true },
      { type: "boolean", key: "is_visible", required: true },
      { type: "integer", key: "position", required: true },
      { type: "string", key: "settings", size: 5000, required: false },
    ],
  },
  {
    id: "ai_conversations",
    name: "AI Conversations",
    attributes: [
      { type: "enum", key: "role", elements: ["user", "assistant"], required: true },
      { type: "string", key: "content", size: 5000, required: true },
      { type: "datetime", key: "timestamp", required: true },
      { type: "integer", key: "tokens_used", required: false },
      { type: "enum", key: "provider", elements: ["groq", "google"], required: false },
    ],
  },
  {
    id: "notifications_log",
    name: "Notifications Log",
    attributes: [
      { type: "enum", key: "type", elements: ["exam", "task", "class", "attendance"], required: true },
      { type: "string", key: "entity_id", size: 36, required: true },
      { type: "enum", key: "channel", elements: ["telegram", "push"], required: true },
      { type: "datetime", key: "sent_at", required: true },
      { type: "boolean", key: "success", required: true },
      { type: "string", key: "error_message", size: 500, required: false },
    ],
  },
  {
    id: "audit_log",
    name: "Audit Log",
    attributes: [
      { type: "enum", key: "action", elements: ["create", "update", "delete", "restore"], required: true },
      { type: "string", key: "entity_type", size: 50, required: true },
      { type: "string", key: "entity_id", size: 36, required: true },
      { type: "string", key: "changes", size: 5000, required: false },
      { type: "datetime", key: "timestamp", required: true },
    ],
  },
  {
    id: "study_sessions",
    name: "Study Sessions",
    attributes: [
      { type: "string", key: "subject_id", size: 36, required: false },
      { type: "datetime", key: "start_time", required: true },
      { type: "datetime", key: "end_time", required: false },
      { type: "integer", key: "duration_minutes", required: false },
      { type: "string", key: "notes", size: 2000, required: false },
      { type: "datetime", key: "deleted_at", required: false },
    ],
  },
];

async function createAttribute(collectionId: string, attr: AttributeDef): Promise<void> {
  try {
    switch (attr.type) {
      case "string":
        await databases.createStringAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.size || 255,
          attr.required
        );
        break;
      case "integer":
        await databases.createIntegerAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required
        );
        break;
      case "float":
        await databases.createFloatAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required
        );
        break;
      case "boolean":
        await databases.createBooleanAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required
        );
        break;
      case "datetime":
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required
        );
        break;
      case "enum":
        await databases.createEnumAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.elements || [],
          attr.required
        );
        break;
    }
    console.log(`  ✓ Created attribute: ${attr.key}`);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    const message = err.message || "";
    if (err.code === 409) {
      console.log(`  - Attribute already exists: ${attr.key}`);
    } else if (
      attr.type === "string" &&
      typeof attr.size === "number" &&
      attr.size > 5000 &&
      message.toLowerCase().includes("maximum number or size")
    ) {
      try {
        await databases.createStringAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          5000,
          attr.required
        );
        console.log(`  ✓ Created attribute with fallback size 5000: ${attr.key}`);
      } catch (fallbackError: unknown) {
        const fallback = fallbackError as { message?: string };
        console.warn(`  - Skipped attribute ${attr.key} (limit reached): ${fallback.message}`);
      }
    } else if (message.toLowerCase().includes("maximum number or size")) {
      console.warn(`  - Skipped attribute ${attr.key} (limit reached): ${message}`);
    } else {
      console.error(`  ✗ Failed to create attribute ${attr.key}:`, err.message);
    }
  }
}

async function setupCollections(): Promise<void> {
  console.log("🚀 Setting up Appwrite collections...\n");

  for (const collection of collections) {
    console.log(`\n📁 Creating collection: ${collection.name}`);
    
    try {
      // Create collection with public read/write permissions (single-user app)
      await databases.createCollection(
        DATABASE_ID,
        collection.id,
        collection.name,
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );
      console.log(`  ✓ Collection created: ${collection.id}`);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: number };
      if (err.code === 409) {
        console.log(`  - Collection already exists: ${collection.id}`);
      } else {
        console.error(`  ✗ Failed to create collection:`, err.message);
        continue;
      }
    }

    // Create attributes
    for (const attr of collection.attributes) {
      await createAttribute(collection.id, attr);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log("\n✅ Setup complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Go to Appwrite Console → Your Project → Databases");
  console.log("2. Verify all 23 collections were created");
  console.log("3. Create indexes for frequently queried fields if needed");
}

const DEFAULT_SLOTS: SeedSlot[] = [
  { slot_id: "1", name: "Slot 1", type: "regular", sort_order: 1, sub_slots: [
    { id: "1A", day_of_week: 1, start_time: "08:30", end_time: "09:25" },
    { id: "1B", day_of_week: 2, start_time: "09:30", end_time: "10:25" },
    { id: "1C", day_of_week: 4, start_time: "10:35", end_time: "11:30" },
  ]},
  { slot_id: "2", name: "Slot 2", type: "regular", sort_order: 2, sub_slots: [
    { id: "2A", day_of_week: 1, start_time: "09:30", end_time: "10:25" },
    { id: "2B", day_of_week: 2, start_time: "10:35", end_time: "11:30" },
    { id: "2C", day_of_week: 4, start_time: "11:35", end_time: "12:30" },
  ]},
  { slot_id: "3", name: "Slot 3", type: "regular", sort_order: 3, sub_slots: [
    { id: "3A", day_of_week: 1, start_time: "10:35", end_time: "11:30" },
    { id: "3B", day_of_week: 2, start_time: "11:35", end_time: "12:30" },
    { id: "3C", day_of_week: 4, start_time: "08:30", end_time: "09:25" },
  ]},
  { slot_id: "4", name: "Slot 4", type: "regular", sort_order: 4, sub_slots: [
    { id: "4A", day_of_week: 1, start_time: "11:35", end_time: "12:30" },
    { id: "4B", day_of_week: 2, start_time: "08:30", end_time: "09:25" },
    { id: "4C", day_of_week: 4, start_time: "09:30", end_time: "10:25" },
  ]},
  { slot_id: "5", name: "Slot 5", type: "regular", sort_order: 5, sub_slots: [
    { id: "5A", day_of_week: 3, start_time: "09:30", end_time: "10:55" },
    { id: "5B", day_of_week: 5, start_time: "09:30", end_time: "10:55" },
  ]},
  { slot_id: "6", name: "Slot 6", type: "regular", sort_order: 6, sub_slots: [
    { id: "6A", day_of_week: 3, start_time: "11:05", end_time: "12:30" },
    { id: "6B", day_of_week: 5, start_time: "11:05", end_time: "12:30" },
  ]},
  { slot_id: "7", name: "Slot 7", type: "regular", sort_order: 7, sub_slots: [
    { id: "7A", day_of_week: 3, start_time: "08:30", end_time: "09:25" },
    { id: "7B", day_of_week: 5, start_time: "08:30", end_time: "09:25" },
  ]},
  { slot_id: "8", name: "Slot 8", type: "regular", sort_order: 8, sub_slots: [
    { id: "8A", day_of_week: 1, start_time: "14:00", end_time: "15:25" },
    { id: "8B", day_of_week: 4, start_time: "14:00", end_time: "15:25" },
  ]},
  { slot_id: "9", name: "Slot 9", type: "regular", sort_order: 9, sub_slots: [
    { id: "9A", day_of_week: 1, start_time: "15:30", end_time: "16:55" },
    { id: "9B", day_of_week: 4, start_time: "15:30", end_time: "16:55" },
  ]},
  { slot_id: "10", name: "Slot 10", type: "regular", sort_order: 10, sub_slots: [
    { id: "10A", day_of_week: 2, start_time: "14:00", end_time: "15:25" },
    { id: "10B", day_of_week: 5, start_time: "14:00", end_time: "15:25" },
  ]},
  { slot_id: "11", name: "Slot 11", type: "regular", sort_order: 11, sub_slots: [
    { id: "11A", day_of_week: 2, start_time: "15:30", end_time: "16:55" },
    { id: "11B", day_of_week: 5, start_time: "15:30", end_time: "16:55" },
  ]},
  { slot_id: "12", name: "Slot 12", type: "regular", sort_order: 12, sub_slots: [
    { id: "12A", day_of_week: 1, start_time: "17:30", end_time: "18:55" },
    { id: "12B", day_of_week: 4, start_time: "17:30", end_time: "18:55" },
  ]},
  { slot_id: "13", name: "Slot 13", type: "regular", sort_order: 13, sub_slots: [
    { id: "13A", day_of_week: 1, start_time: "19:00", end_time: "20:25" },
    { id: "13B", day_of_week: 4, start_time: "19:00", end_time: "20:25" },
  ]},
  { slot_id: "14", name: "Slot 14", type: "regular", sort_order: 14, sub_slots: [
    { id: "14A", day_of_week: 2, start_time: "17:30", end_time: "18:55" },
    { id: "14B", day_of_week: 5, start_time: "17:30", end_time: "18:55" },
  ]},
  { slot_id: "15", name: "Slot 15", type: "regular", sort_order: 15, sub_slots: [
    { id: "15A", day_of_week: 2, start_time: "19:00", end_time: "20:25" },
    { id: "15B", day_of_week: 5, start_time: "19:00", end_time: "20:25" },
  ]},
  { slot_id: "L1", name: "Lab Slot L1", type: "lab", sort_order: 16, sub_slots: [{ id: "L1", day_of_week: 1, start_time: "14:00", end_time: "16:55" }]},
  { slot_id: "L2", name: "Lab Slot L2", type: "lab", sort_order: 17, sub_slots: [{ id: "L2", day_of_week: 2, start_time: "14:00", end_time: "16:55" }]},
  { slot_id: "L3", name: "Lab Slot L3", type: "lab", sort_order: 18, sub_slots: [{ id: "L3", day_of_week: 4, start_time: "14:00", end_time: "16:55" }]},
  { slot_id: "L4", name: "Lab Slot L4", type: "lab", sort_order: 19, sub_slots: [{ id: "L4", day_of_week: 5, start_time: "14:00", end_time: "16:55" }]},
  { slot_id: "X1", name: "Wednesday Extra X1", type: "extra", sort_order: 20, sub_slots: [{ id: "X1", day_of_week: 3, start_time: "14:00", end_time: "14:55" }]},
  { slot_id: "X2", name: "Wednesday Extra X2", type: "extra", sort_order: 21, sub_slots: [{ id: "X2", day_of_week: 3, start_time: "15:00", end_time: "15:55" }]},
  { slot_id: "X3", name: "Wednesday Extra X3", type: "extra", sort_order: 22, sub_slots: [{ id: "X3", day_of_week: 3, start_time: "16:00", end_time: "16:55" }]},
  { slot_id: "Lx", name: "Wednesday Extra Lx", type: "extra", sort_order: 23, sub_slots: [{ id: "Lx", day_of_week: 3, start_time: "14:00", end_time: "16:55" }]},
  { slot_id: "XC", name: "Wednesday Extra XC", type: "extra", sort_order: 24, sub_slots: [{ id: "XC", day_of_week: 3, start_time: "17:30", end_time: "18:55" }]},
  { slot_id: "XD", name: "Wednesday Extra XD", type: "extra", sort_order: 25, sub_slots: [{ id: "XD", day_of_week: 3, start_time: "19:00", end_time: "20:25" }]},
];

async function seedDefaultSlotsIfEmpty(): Promise<void> {
  try {
    const existing = await databases.listDocuments(DATABASE_ID, "slots", [Query.limit(1)]);
    if (existing.total > 0) {
      console.log("  - Slots already seeded");
      return;
    }
    console.log("\n🌱 Seeding default slots...");
    for (const slot of DEFAULT_SLOTS) {
      await databases.createDocument(DATABASE_ID, "slots", ID.unique(), {
        slot_id: slot.slot_id,
        name: slot.name,
        type: slot.type,
        sub_slots: JSON.stringify(slot.sub_slots),
        is_default: true,
        sort_order: slot.sort_order,
        deleted_at: null,
      });
    }
    console.log(`  ✓ Seeded ${DEFAULT_SLOTS.length} default slots`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("  ✗ Failed to seed default slots:", err.message);
  }
}

// Run the setup
setupCollections()
  .then(seedDefaultSlotsIfEmpty)
  .catch(console.error);
