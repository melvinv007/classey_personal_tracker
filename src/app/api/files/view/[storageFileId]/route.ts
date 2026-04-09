import { NextResponse } from "next/server";
import { databases, storage, DATABASE_ID, COLLECTIONS, Query, BUCKET_ID } from "@/lib/appwrite-server";

function encodeFilename(filename: string): string {
  return encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, "%2A");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ storageFileId: string }> }
): Promise<Response> {
  try {
    const { storageFileId } = await context.params;

    const [binary, docs] = await Promise.all([
      storage.getFileView(BUCKET_ID, storageFileId),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.FILES, [
        Query.equal("storage_file_id", storageFileId),
        Query.isNull("deleted_at"),
        Query.limit(1),
      ]),
    ]);

    const doc = docs.documents[0] as { mime_type?: string; file_name?: string } | undefined;
    const mimeType = doc?.mime_type || "application/octet-stream";
    const fileName = doc?.file_name || "file";

    return new Response(binary, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeFilename(fileName)}`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("File view API error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to view file" },
      { status: 500 }
    );
  }
}
