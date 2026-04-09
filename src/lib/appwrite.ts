/**
 * Appwrite Client Configuration
 * Singleton client for browser-side Appwrite SDK
 */

import { Client, Account, Databases, Storage, ID, Query } from "appwrite";

// Environment variables
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "";

// Validate required env vars
if (!PROJECT_ID) {
  console.warn("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID");
}

// Singleton client instance
let client: Client | null = null;

/**
 * Get or create the Appwrite client
 */
export function getClient(): Client {
  if (!client) {
    client = new Client();
    client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  }
  return client;
}

// Service instances
export const account = new Account(getClient());
export const databases = new Databases(getClient());
export const storage = new Storage(getClient());

// Export constants
export { DATABASE_ID, BUCKET_ID, ID, Query };

// Collection IDs - will be populated after creation
export const COLLECTIONS = {
  SEMESTERS: "semesters",
  SUBJECTS: "subjects",
  CLASS_SCHEDULES: "class_schedules",
  CLASS_OCCURRENCES: "class_occurrences",
  EXAMS: "exams",
  TASKS: "tasks",
  EVENTS: "events",
  FILES: "files",
  RESOURCE_LINKS: "resource_links",
  NOTES: "notes",
  SETTINGS: "settings",
  SLOTS: "slots",
  GRADE_SCALES: "grade_scales",
  HOLIDAYS: "holidays",
  TAGS: "tags",
  TAGGED_ITEMS: "tagged_items",
  GOALS: "goals",
  BACKUPS: "backups",
  WIDGETS_CONFIG: "widgets_config",
  AI_CONVERSATIONS: "ai_conversations",
  NOTIFICATIONS_LOG: "notifications_log",
  AUDIT_LOG: "audit_log",
  STUDY_SESSIONS: "study_sessions",
} as const;

export type CollectionId = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
