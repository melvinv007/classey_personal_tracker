/**
 * Appwrite Server-Side Configuration
 * Uses node-appwrite SDK for API routes and server components
 */

import { Client, Databases, Storage, Users, ID, Query } from "node-appwrite";

// Environment variables (server-side)
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const API_KEY = process.env.APPWRITE_API_KEY || "";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "";

// Create server client with API key
function createServerClient(): Client {
  const client = new Client();
  client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);
  
  if (API_KEY) {
    client.setKey(API_KEY);
  }
  
  return client;
}

// Server client and services
const serverClient = createServerClient();
export const databases = new Databases(serverClient);
export const storage = new Storage(serverClient);
export const users = new Users(serverClient);

// Export constants
export { DATABASE_ID, BUCKET_ID, ID, Query };

// Collection IDs
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
  HOLIDAYS: "holidays",
  SLOTS: "slots",
  GRADE_SCALES: "grade_scales",
  TAGS: "tags",
  TAGGED_ITEMS: "tagged_items",
  GOALS: "goals",
  AUDIT_LOG: "audit_log",
  NOTIFICATIONS_LOG: "notifications_log",
  AI_CONVERSATIONS: "ai_conversations",
  BACKUPS: "backups",
  WIDGETS_CONFIG: "widgets_config",
  STUDY_SESSIONS: "study_sessions",
};
