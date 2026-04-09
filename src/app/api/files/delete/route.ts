import { NextRequest, NextResponse } from "next/server";
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite-server";

interface DeleteFileRequest {
  fileId: string;
  storageFileId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as DeleteFileRequest;
    const { fileId, storageFileId } = body;

    if (!fileId || !storageFileId) {
      return NextResponse.json(
        { success: false, error: "fileId and storageFileId are required" },
        { status: 400 }
      );
    }

    await storage.deleteFile(BUCKET_ID, storageFileId);

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.FILES, fileId, {
      deleted_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const fileId = url.searchParams.get("fileId");
  const storageFileId = url.searchParams.get("storageFileId");

  if (!fileId || !storageFileId) {
    return NextResponse.json(
      { success: false, error: "fileId and storageFileId are required" },
      { status: 400 }
    );
  }

  try {
    await storage.deleteFile(BUCKET_ID, storageFileId);

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.FILES, fileId, {
      deleted_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 }
    );
  }
}
