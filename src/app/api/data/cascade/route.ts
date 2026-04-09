import { NextRequest, NextResponse } from "next/server";
import { databases, storage, DATABASE_ID, BUCKET_ID, COLLECTIONS, Query } from "@/lib/appwrite-server";

type CascadeAction = "delete-subject" | "delete-semester" | "delete-all";

interface CascadeRequest {
  action: CascadeAction;
  subjectId?: string;
  semesterId?: string;
}

interface CascadeResult {
  deleted: {
    semesters: number;
    subjects: number;
    tasks: number;
    events: number;
    schedules: number;
    occurrences: number;
    exams: number;
    files: number;
    links: number;
    notes: number;
    storageFiles: number;
  };
}

interface DocRef {
  $id: string;
}

function asDocRefs(docs: unknown[]): DocRef[] {
  return docs
    .filter((doc): doc is Record<string, unknown> => typeof doc === "object" && doc !== null)
    .map((doc) => ({ $id: String(doc.$id ?? "") }))
    .filter((doc) => doc.$id.length > 0);
}

function asFileRefs(docs: unknown[]): Array<{ $id: string; storage_file_id: string }> {
  return docs
    .filter((doc): doc is Record<string, unknown> => typeof doc === "object" && doc !== null)
    .map((doc) => ({ $id: String(doc.$id ?? ""), storage_file_id: String(doc.storage_file_id ?? "") }))
    .filter((doc) => doc.$id.length > 0 && doc.storage_file_id.length > 0);
}

async function listByField(collectionId: string, field: string, value: string): Promise<unknown[]> {
  const response = await databases.listDocuments(DATABASE_ID, collectionId, [Query.equal(field, value), Query.limit(500)]);
  return response.documents;
}

async function listAllDocuments(collectionId: string): Promise<unknown[]> {
  const response = await databases.listDocuments(DATABASE_ID, collectionId, [Query.limit(500)]);
  return response.documents;
}

async function hardDeleteCollection(collectionId: string, ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => databases.deleteDocument(DATABASE_ID, collectionId, id)));
}

async function deleteStorageFiles(storageFileIds: string[]): Promise<number> {
  const results: number[] = await Promise.all(
    storageFileIds.map(async (fileId) => {
      try {
        await storage.deleteFile(BUCKET_ID, fileId);
        return 1;
      } catch (error) {
        console.warn("Storage file delete failed", fileId, error);
        return 0;
      }
    })
  );
  return results.reduce((sum, value) => sum + value, 0);
}

async function deleteSubjectTree(subjectId: string): Promise<CascadeResult["deleted"]> {
  const [schedulesRaw, occurrencesRaw, examsRaw, filesRaw, linksRaw, notesRaw, tasksRaw] = await Promise.all([
    listByField(COLLECTIONS.CLASS_SCHEDULES, "subject_id", subjectId),
    listByField(COLLECTIONS.CLASS_OCCURRENCES, "subject_id", subjectId),
    listByField(COLLECTIONS.EXAMS, "subject_id", subjectId),
    listByField(COLLECTIONS.FILES, "subject_id", subjectId),
    listByField(COLLECTIONS.RESOURCE_LINKS, "subject_id", subjectId),
    listByField(COLLECTIONS.NOTES, "subject_id", subjectId),
    listByField(COLLECTIONS.TASKS, "subject_id", subjectId),
  ]);

  const schedules = asDocRefs(schedulesRaw);
  const occurrences = asDocRefs(occurrencesRaw);
  const exams = asDocRefs(examsRaw);
  const tasks = asDocRefs(tasksRaw);
  const subjectFiles = asFileRefs(filesRaw);
  const links = asDocRefs(linksRaw);
  const notes = asDocRefs(notesRaw);

  const [examFileRefsRaw, taskFileRefsRaw] = await Promise.all([
    Promise.all(exams.map((exam) => listByField(COLLECTIONS.FILES, "exam_id", exam.$id))),
    Promise.all(tasks.map((task) => listByField(COLLECTIONS.FILES, "task_id", task.$id))),
  ]);

  const allFilesMap = new Map<string, { $id: string; storage_file_id: string }>();
  for (const file of subjectFiles) {
    allFilesMap.set(file.$id, file);
  }
  for (const group of examFileRefsRaw) {
    for (const file of asFileRefs(group)) {
      allFilesMap.set(file.$id, file);
    }
  }
  for (const group of taskFileRefsRaw) {
    for (const file of asFileRefs(group)) {
      allFilesMap.set(file.$id, file);
    }
  }
  const files = Array.from(allFilesMap.values());

  const deletedStorageFiles = await deleteStorageFiles(files.map((file) => file.storage_file_id));

  await Promise.all([
    hardDeleteCollection(COLLECTIONS.CLASS_SCHEDULES, schedules.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.CLASS_OCCURRENCES, occurrences.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.EXAMS, exams.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.TASKS, tasks.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.FILES, files.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.RESOURCE_LINKS, links.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.NOTES, notes.map((item) => item.$id)),
  ]);

  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SUBJECTS, subjectId);
  return {
    semesters: 0,
    subjects: 1,
    tasks: tasks.length,
    events: 0,
    schedules: schedules.length,
    occurrences: occurrences.length,
    exams: exams.length,
    files: files.length,
    links: links.length,
    notes: notes.length,
    storageFiles: deletedStorageFiles,
  };
}

async function deleteSemesterTree(semesterId: string): Promise<CascadeResult["deleted"]> {
  const [subjectsRaw, tasksRaw, eventsRaw] = await Promise.all([
    listByField(COLLECTIONS.SUBJECTS, "semester_id", semesterId),
    listByField(COLLECTIONS.TASKS, "semester_id", semesterId),
    listByField(COLLECTIONS.EVENTS, "semester_id", semesterId),
  ]);

  const subjects = asDocRefs(subjectsRaw);
  const tasks = asDocRefs(tasksRaw);
  const events = asDocRefs(eventsRaw);

  const totals: CascadeResult["deleted"] = {
    semesters: 1,
    subjects: 0,
    tasks: 0,
    events: events.length,
    schedules: 0,
    occurrences: 0,
    exams: 0,
    files: 0,
    links: 0,
    notes: 0,
    storageFiles: 0,
  };

  for (const subject of subjects) {
    const subjectStats = await deleteSubjectTree(subject.$id);
    totals.subjects += subjectStats.subjects;
    totals.tasks += subjectStats.tasks;
    totals.schedules += subjectStats.schedules;
    totals.occurrences += subjectStats.occurrences;
    totals.exams += subjectStats.exams;
    totals.files += subjectStats.files;
    totals.links += subjectStats.links;
    totals.notes += subjectStats.notes;
    totals.storageFiles += subjectStats.storageFiles;
  }

  await Promise.all([
    hardDeleteCollection(COLLECTIONS.TASKS, tasks.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.EVENTS, events.map((item) => item.$id)),
  ]);

  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SEMESTERS, semesterId);
  return totals;
}

async function deleteAllData(): Promise<CascadeResult["deleted"]> {
  const semesters = asDocRefs(await listAllDocuments(COLLECTIONS.SEMESTERS));
  const totals: CascadeResult["deleted"] = {
    semesters: 0,
    subjects: 0,
    tasks: 0,
    events: 0,
    schedules: 0,
    occurrences: 0,
    exams: 0,
    files: 0,
    links: 0,
    notes: 0,
    storageFiles: 0,
  };
  for (const semester of semesters) {
    const semesterStats = await deleteSemesterTree(semester.$id);
    totals.semesters += semesterStats.semesters;
    totals.subjects += semesterStats.subjects;
    totals.tasks += semesterStats.tasks;
    totals.events += semesterStats.events;
    totals.schedules += semesterStats.schedules;
    totals.occurrences += semesterStats.occurrences;
    totals.exams += semesterStats.exams;
    totals.files += semesterStats.files;
    totals.links += semesterStats.links;
    totals.notes += semesterStats.notes;
    totals.storageFiles += semesterStats.storageFiles;
  }

  const [subjectsRaw, tasksRaw, eventsRaw, schedulesRaw, occurrencesRaw, examsRaw, filesRaw, linksRaw, notesRaw] =
    await Promise.all([
      listAllDocuments(COLLECTIONS.SUBJECTS),
      listAllDocuments(COLLECTIONS.TASKS),
      listAllDocuments(COLLECTIONS.EVENTS),
      listAllDocuments(COLLECTIONS.CLASS_SCHEDULES),
      listAllDocuments(COLLECTIONS.CLASS_OCCURRENCES),
      listAllDocuments(COLLECTIONS.EXAMS),
      listAllDocuments(COLLECTIONS.FILES),
      listAllDocuments(COLLECTIONS.RESOURCE_LINKS),
      listAllDocuments(COLLECTIONS.NOTES),
    ]);

  const danglingSubjects = asDocRefs(subjectsRaw);
  const danglingTasks = asDocRefs(tasksRaw);
  const danglingEvents = asDocRefs(eventsRaw);
  const danglingSchedules = asDocRefs(schedulesRaw);
  const danglingOccurrences = asDocRefs(occurrencesRaw);
  const danglingExams = asDocRefs(examsRaw);
  const danglingFiles = asFileRefs(filesRaw);
  const danglingLinks = asDocRefs(linksRaw);
  const danglingNotes = asDocRefs(notesRaw);

  const extraStorageDeleted = await deleteStorageFiles(danglingFiles.map((file) => file.storage_file_id));
  await Promise.all([
    hardDeleteCollection(COLLECTIONS.SUBJECTS, danglingSubjects.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.TASKS, danglingTasks.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.EVENTS, danglingEvents.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.CLASS_SCHEDULES, danglingSchedules.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.CLASS_OCCURRENCES, danglingOccurrences.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.EXAMS, danglingExams.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.FILES, danglingFiles.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.RESOURCE_LINKS, danglingLinks.map((item) => item.$id)),
    hardDeleteCollection(COLLECTIONS.NOTES, danglingNotes.map((item) => item.$id)),
  ]);
  totals.subjects += danglingSubjects.length;
  totals.tasks += danglingTasks.length;
  totals.events += danglingEvents.length;
  totals.schedules += danglingSchedules.length;
  totals.occurrences += danglingOccurrences.length;
  totals.exams += danglingExams.length;
  totals.files += danglingFiles.length;
  totals.links += danglingLinks.length;
  totals.notes += danglingNotes.length;
  totals.storageFiles += extraStorageDeleted;
  return totals;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CascadeRequest;
    if (!body.action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }

    if (body.action === "delete-subject") {
      if (!body.subjectId) {
        return NextResponse.json({ success: false, error: "subjectId is required" }, { status: 400 });
      }
      const deleted = await deleteSubjectTree(body.subjectId);
      return NextResponse.json({ success: true, deleted });
    }

    if (body.action === "delete-semester") {
      if (!body.semesterId) {
        return NextResponse.json({ success: false, error: "semesterId is required" }, { status: 400 });
      }
      const deleted = await deleteSemesterTree(body.semesterId);
      return NextResponse.json({ success: true, deleted });
    }

    const deleted = await deleteAllData();
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Cascade delete API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Cascade delete failed" },
      { status: 500 }
    );
  }
}

