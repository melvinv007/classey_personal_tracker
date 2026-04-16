import { NextRequest, NextResponse } from "next/server";
import { storage, databases, BUCKET_ID, DATABASE_ID, COLLECTIONS, ID } from "@/lib/appwrite-server";
import type { ClasseyFile } from "@/types/database";

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "txt", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
  "py", "js", "ts", "c", "cpp", "h", "java", "jsx", "tsx",
  "jpg", "jpeg", "png", "gif", "webp",
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    py: "text/x-python",
    js: "text/javascript",
    ts: "text/typescript",
    c: "text/x-c",
    cpp: "text/x-c++",
    h: "text/x-c",
    java: "text/x-java",
    jsx: "text/jsx",
    tsx: "text/tsx",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[extension] ?? "application/octet-stream";
}

function parseOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function mapToClasseyFile(doc: Record<string, unknown>): ClasseyFile {
  return {
    $id: String(doc.$id ?? ""),
    $createdAt: String(doc.$createdAt ?? ""),
    $updatedAt: String(doc.$updatedAt ?? ""),
    $collectionId: String(doc.$collectionId ?? ""),
    $databaseId: String(doc.$databaseId ?? ""),
    $permissions: Array.isArray(doc.$permissions) ? (doc.$permissions.filter((item): item is string => typeof item === "string")) : [],
    storage_file_id: String(doc.storage_file_id ?? ""),
    file_name: String(doc.file_name ?? ""),
    file_size: Number(doc.file_size ?? 0),
    mime_type: String(doc.mime_type ?? "application/octet-stream"),
    file_extension: String(doc.file_extension ?? ""),
    subject_id: typeof doc.subject_id === "string" ? doc.subject_id : null,
    exam_id: typeof doc.exam_id === "string" ? doc.exam_id : null,
    task_id: typeof doc.task_id === "string" ? doc.task_id : null,
    event_id: typeof doc.event_id === "string" ? doc.event_id : null,
    occurrence_id: typeof doc.occurrence_id === "string" ? doc.occurrence_id : null,
    description: typeof doc.description === "string" ? doc.description : null,
    is_past_paper: Boolean(doc.is_past_paper),
    deleted_at: typeof doc.deleted_at === "string" ? doc.deleted_at : null,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "File is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File exceeds 100MB limit" }, { status: 400 });
    }

    const extension = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ success: false, error: `File type .${extension} is not allowed` }, { status: 400 });
    }

    const storageFile = await storage.createFile(BUCKET_ID, ID.unique(), file);

    try {
      const fileDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FILES,
        ID.unique(),
        {
          storage_file_id: storageFile.$id,
          file_name: parseOptionalString(formData, "file_name") ?? file.name,
          file_size: file.size,
          mime_type: getMimeType(extension),
          file_extension: extension,
          subject_id: parseOptionalString(formData, "subject_id"),
          exam_id: parseOptionalString(formData, "exam_id"),
          task_id: parseOptionalString(formData, "task_id"),
          event_id: parseOptionalString(formData, "event_id"),
          occurrence_id: parseOptionalString(formData, "occurrence_id"),
          description: parseOptionalString(formData, "description"),
          is_past_paper: formData.get("is_past_paper") === "true",
          deleted_at: null,
        }
      );

      return NextResponse.json({
        success: true,
        data: mapToClasseyFile(fileDoc as Record<string, unknown>),
      });
    } catch (dbError) {
      await storage.deleteFile(BUCKET_ID, storageFile.$id);
      throw dbError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("Server upload error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
