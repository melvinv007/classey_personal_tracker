import {
  BUCKET_ID,
  COLLECTIONS,
  DATABASE_ID,
  databases,
  ID,
  storage,
} from "@/lib/appwrite-server";
import type { ClasseyFile } from "@/types/database";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "txt",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "py",
  "js",
  "ts",
  "c",
  "cpp",
  "h",
  "java",
  "jsx",
  "tsx",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
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
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

class UploadValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadValidationError";
    this.status = status;
  }
}

function isDeletedDocument(doc: Record<string, unknown>): boolean {
  return typeof doc.deleted_at === "string" && doc.deleted_at.length > 0;
}

function readString(doc: Record<string, unknown>, key: string): string | null {
  const value = doc[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function getDocumentOrThrow(
  collectionId: string,
  documentId: string,
  label: string,
): Promise<Record<string, unknown>> {
  try {
    return (await databases.getDocument(
      DATABASE_ID,
      collectionId,
      documentId,
    )) as Record<string, unknown>;
  } catch {
    throw new UploadValidationError(`Invalid ${label} selected.`);
  }
}

type FileLinkPayload = {
  subjectId: string | null;
  examId: string | null;
  taskId: string | null;
  eventId: string | null;
  occurrenceId: string | null;
};

async function validateFileLinkPayload(
  payload: FileLinkPayload,
): Promise<FileLinkPayload> {
  const { subjectId, examId, taskId, eventId, occurrenceId } = payload;
  const linkedCount = [subjectId, examId, taskId, eventId, occurrenceId].filter(
    Boolean,
  ).length;
  if (linkedCount === 0) {
    // Global file: allowed to exist without any entity links.
    return { subjectId, examId, taskId, eventId, occurrenceId };
  }

  const semesterIds = new Set<string>();
  const subjectCache = new Map<string, Record<string, unknown>>();
  let subjectDoc: Record<string, unknown> | null = null;

  const getSubject = async (id: string) => {
    const cached = subjectCache.get(id);
    if (cached) return cached;
    const subject = await getDocumentOrThrow(
      COLLECTIONS.SUBJECTS,
      id,
      "subject",
    );
    if (isDeletedDocument(subject)) {
      throw new UploadValidationError("Selected subject is deleted.");
    }
    subjectCache.set(id, subject);
    return subject;
  };

  if (subjectId) {
    subjectDoc = await getSubject(subjectId);
    const semesterId = readString(subjectDoc, "semester_id");
    if (semesterId) semesterIds.add(semesterId);
  }

  if (examId) {
    const exam = await getDocumentOrThrow(COLLECTIONS.EXAMS, examId, "exam");
    if (isDeletedDocument(exam)) {
      throw new UploadValidationError("Selected exam is deleted.");
    }
    const examSubjectId = readString(exam, "subject_id");
    if (!examSubjectId) {
      throw new UploadValidationError(
        "Selected exam is missing subject linkage.",
      );
    }
    const examSubject = await getSubject(examSubjectId);
    if (subjectId && examSubjectId !== subjectId) {
      throw new UploadValidationError(
        "Exam does not belong to the selected subject.",
      );
    }
    const semesterId = readString(examSubject, "semester_id");
    if (semesterId) semesterIds.add(semesterId);
  }

  if (taskId) {
    const task = await getDocumentOrThrow(COLLECTIONS.TASKS, taskId, "task");
    if (isDeletedDocument(task)) {
      throw new UploadValidationError("Selected task is deleted.");
    }
    const taskSubjectId = readString(task, "subject_id");
    if (subjectId && taskSubjectId && taskSubjectId !== subjectId) {
      throw new UploadValidationError(
        "Task does not belong to the selected subject.",
      );
    }
    const semesterId = readString(task, "semester_id");
    if (semesterId) semesterIds.add(semesterId);
  }

  if (eventId) {
    const event = await getDocumentOrThrow(
      COLLECTIONS.EVENTS,
      eventId,
      "event",
    );
    if (isDeletedDocument(event)) {
      throw new UploadValidationError("Selected event is deleted.");
    }
    const semesterId = readString(event, "semester_id");
    if (semesterId) semesterIds.add(semesterId);
  }

  if (occurrenceId) {
    const occurrence = await getDocumentOrThrow(
      COLLECTIONS.CLASS_OCCURRENCES,
      occurrenceId,
      "class occurrence",
    );
    const occurrenceSubjectId = readString(occurrence, "subject_id");
    if (!occurrenceSubjectId) {
      throw new UploadValidationError(
        "Selected class occurrence is missing subject linkage.",
      );
    }
    if (subjectId && occurrenceSubjectId !== subjectId) {
      throw new UploadValidationError(
        "Class occurrence does not belong to the selected subject.",
      );
    }
    const occurrenceSubject = await getSubject(occurrenceSubjectId);
    const semesterId = readString(occurrenceSubject, "semester_id");
    if (semesterId) semesterIds.add(semesterId);
  }

  if (semesterIds.size > 1) {
    throw new UploadValidationError(
      "Linked entities belong to different semesters. Please choose matching links.",
    );
  }

  return { subjectId, examId, taskId, eventId, occurrenceId };
}

function mapToClasseyFile(doc: Record<string, unknown>): ClasseyFile {
  return {
    $id: String(doc.$id ?? ""),
    $createdAt: String(doc.$createdAt ?? ""),
    $updatedAt: String(doc.$updatedAt ?? ""),
    $collectionId: String(doc.$collectionId ?? ""),
    $databaseId: String(doc.$databaseId ?? ""),
    $permissions: Array.isArray(doc.$permissions)
      ? doc.$permissions.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    storage_file_id: String(doc.storage_file_id ?? ""),
    file_name: String(doc.file_name ?? ""),
    file_size: Number(doc.file_size ?? 0),
    mime_type: String(doc.mime_type ?? "application/octet-stream"),
    file_extension: String(doc.file_extension ?? ""),
    subject_id: typeof doc.subject_id === "string" ? doc.subject_id : null,
    exam_id: typeof doc.exam_id === "string" ? doc.exam_id : null,
    task_id: typeof doc.task_id === "string" ? doc.task_id : null,
    event_id: typeof doc.event_id === "string" ? doc.event_id : null,
    occurrence_id:
      typeof doc.occurrence_id === "string" ? doc.occurrence_id : null,
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
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 100MB limit" },
        { status: 400 },
      );
    }

    const extension = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { success: false, error: `File type .${extension} is not allowed` },
        { status: 400 },
      );
    }

    const linkPayload = await validateFileLinkPayload({
      subjectId: parseOptionalString(formData, "subject_id"),
      examId: parseOptionalString(formData, "exam_id"),
      taskId: parseOptionalString(formData, "task_id"),
      eventId: parseOptionalString(formData, "event_id"),
      occurrenceId: parseOptionalString(formData, "occurrence_id"),
    });

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
          subject_id: linkPayload.subjectId,
          exam_id: linkPayload.examId,
          task_id: linkPayload.taskId,
          event_id: linkPayload.eventId,
          occurrence_id: linkPayload.occurrenceId,
          description: parseOptionalString(formData, "description"),
          is_past_paper: formData.get("is_past_paper") === "true",
          deleted_at: null,
        },
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
    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("Server upload error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
