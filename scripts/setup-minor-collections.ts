/**
 * Appwrite Collection Setup Script — Minor Course Checker
 * Creates the 3 new collections + adds home_department to settings
 * 
 * Usage: npx tsx scripts/setup-minor-collections.ts
 */

import { Client, Databases, Permission, Role } from "node-appwrite";
import * as dotenv from "dotenv";

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

const PERMISSIONS = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

async function createAttribute(collectionId: string, attr: AttributeDef): Promise<void> {
  try {
    switch (attr.type) {
      case "string":
        await databases.createStringAttribute(DATABASE_ID, collectionId, attr.key, attr.size || 255, attr.required);
        break;
      case "integer":
        await databases.createIntegerAttribute(DATABASE_ID, collectionId, attr.key, attr.required);
        break;
      case "float":
        await databases.createFloatAttribute(DATABASE_ID, collectionId, attr.key, attr.required);
        break;
      case "boolean":
        await databases.createBooleanAttribute(DATABASE_ID, collectionId, attr.key, attr.required);
        break;
      case "datetime":
        await databases.createDatetimeAttribute(DATABASE_ID, collectionId, attr.key, attr.required);
        break;
      case "enum":
        await databases.createEnumAttribute(DATABASE_ID, collectionId, attr.key, attr.elements || [], attr.required);
        break;
    }
    console.log(`  ✓ Created attribute: ${attr.key}`);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    if (err.code === 409) {
      console.log(`  - Attribute already exists: ${attr.key}`);
    } else {
      console.error(`  ✗ Failed to create attribute ${attr.key}:`, err.message);
    }
  }
}

async function createCollectionWithAttributes(id: string, name: string, attributes: AttributeDef[]): Promise<void> {
  console.log(`\n📁 Creating collection: ${name}`);

  try {
    await databases.createCollection(DATABASE_ID, id, name, PERMISSIONS);
    console.log(`  ✓ Collection created: ${id}`);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    if (err.code === 409) {
      console.log(`  - Collection already exists: ${id}`);
    } else {
      console.error(`  ✗ Failed to create collection:`, err.message);
      return;
    }
  }

  for (const attr of attributes) {
    await createAttribute(id, attr);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function setup(): Promise<void> {
  console.log("🚀 Setting up Minor Course Checker collections...\n");

  // 1. Minors collection
  await createCollectionWithAttributes("minors", "Minors", [
    { type: "string", key: "name", size: 150, required: true },
    { type: "integer", key: "credits_required", required: true },
    { type: "integer", key: "courses_required", required: true },
    { type: "datetime", key: "deleted_at", required: false },
  ]);

  // 2. Minor Courses collection
  await createCollectionWithAttributes("minor_courses", "Minor Courses", [
    { type: "string", key: "minor_id", size: 36, required: true },
    { type: "string", key: "short_code", size: 20, required: true },
    { type: "string", key: "short_code_normalized", size: 20, required: true },
    { type: "string", key: "name", size: 200, required: true },
    { type: "integer", key: "credits", required: true },
    { type: "boolean", key: "is_required", required: true },
    { type: "string", key: "slot", size: 10, required: false },
    { type: "string", key: "prerequisites", size: 2000, required: false },
    { type: "string", key: "cutoff", size: 100, required: false },
    { type: "enum", key: "difficulty", elements: ["Easy", "Medium", "Hard"], required: false },
    { type: "string", key: "instructors", size: 2000, required: false },
    { type: "enum", key: "duration", elements: ["full", "first_half", "second_half"], required: true },
    { type: "enum", key: "typically_offered", elements: ["odd", "even", "both"], required: true },
    { type: "string", key: "notes", size: 5000, required: false },
    { type: "datetime", key: "deleted_at", required: false },
  ]);

  // 3. Semester Courses collection
  await createCollectionWithAttributes("semester_courses", "Semester Courses", [
    { type: "string", key: "semester_id", size: 36, required: true },
    { type: "string", key: "department", size: 100, required: true },
    { type: "string", key: "short_code", size: 20, required: true },
    { type: "string", key: "short_code_normalized", size: 20, required: true },
    { type: "string", key: "name", size: 200, required: true },
    { type: "string", key: "instructors", size: 2000, required: false },
    { type: "string", key: "slot", size: 10, required: false },
    { type: "string", key: "classroom", size: 100, required: false },
    { type: "integer", key: "student_limit", required: false },
    { type: "enum", key: "category", elements: ["stem", "advanced"], required: false },
    { type: "enum", key: "course_type", elements: ["theory", "lab", "seminar", "project", "other"], required: true },
    { type: "enum", key: "duration", elements: ["full", "first_half", "second_half"], required: true },
    { type: "datetime", key: "deleted_at", required: false },
  ]);

  // 4. Add home_department to existing settings collection
  console.log("\n📁 Adding home_department to Settings collection");
  await createAttribute("settings", {
    type: "string",
    key: "home_department",
    size: 100,
    required: false,
  });

  console.log("\n✅ Minor Course Checker setup complete!");
}

setup().catch(console.error);
