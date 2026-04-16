/**
 * Appwrite Storage Service
 * File upload, download, and management
 */

import { storage, BUCKET_ID } from "./appwrite";
import type { ClasseyFile } from "@/types/database";

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  documents: ["pdf", "txt", "doc", "docx", "ppt", "pptx", "xls", "xlsx"],
  code: ["py", "js", "ts", "c", "cpp", "h", "java", "jsx", "tsx"],
  images: ["jpg", "jpeg", "png", "gif", "webp"],
};

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const extension = getExtension(file.name);
  const allAllowed = [
    ...ALLOWED_EXTENSIONS.documents,
    ...ALLOWED_EXTENSIONS.code,
    ...ALLOWED_EXTENSIONS.images,
  ];

  if (!allAllowed.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not allowed. Allowed: ${allAllowed.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 100MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Upload a file to Appwrite Storage
 */
export async function uploadFile(
  file: File,
  context: {
    file_name?: string;
    subject_id?: string;
    exam_id?: string;
    task_id?: string;
    event_id?: string;
    occurrence_id?: string;
    is_past_paper?: boolean;
    description?: string;
  } = {}
): Promise<ClasseyFile> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const formData = new FormData();
    formData.set("file", file);
    if (context.file_name) formData.set("file_name", context.file_name);
    if (context.subject_id) formData.set("subject_id", context.subject_id);
    if (context.exam_id) formData.set("exam_id", context.exam_id);
    if (context.task_id) formData.set("task_id", context.task_id);
    if (context.event_id) formData.set("event_id", context.event_id);
    if (context.occurrence_id) formData.set("occurrence_id", context.occurrence_id);
    if (context.description) formData.set("description", context.description);
    formData.set("is_past_paper", context.is_past_paper ? "true" : "false");

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as {
      success: boolean;
      data?: ClasseyFile;
      error?: string;
    };

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.error ?? "Upload failed");
    }

    return result.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Get file download URL
 */
export function getFileDownloadUrl(storageFileId: string): string {
  return `/api/files/download/${storageFileId}`;
}

/**
 * Get file preview URL (for images)
 */
export function getFilePreviewUrl(
  storageFileId: string,
  width?: number,
  height?: number
): string {
  return storage
    .getFilePreview(BUCKET_ID, storageFileId, width, height)
    .toString();
}

/**
 * Get file view URL (opens in browser)
 */
export function getFileViewUrl(storageFileId: string): string {
  return `/api/files/view/${storageFileId}`;
}

/**
 * Delete a file (storage + database record)
 */
export async function deleteFile(fileId: string, storageFileId: string): Promise<void> {
  try {
    const response = await fetch("/api/files/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, storageFileId }),
    });

    const result = (await response.json()) as { success: boolean; error?: string };
    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "Failed to delete file");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

/**
 * Get file category from extension
 */
export function getFileCategory(extension: string): "documents" | "code" | "images" | "other" {
  if (ALLOWED_EXTENSIONS.documents.includes(extension)) return "documents";
  if (ALLOWED_EXTENSIONS.code.includes(extension)) return "code";
  if (ALLOWED_EXTENSIONS.images.includes(extension)) return "images";
  return "other";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
