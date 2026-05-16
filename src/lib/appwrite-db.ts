/**
 * Appwrite Database Service
 * Generic CRUD operations for all collections
 */

import type {
  ClasseyFile,
  ClassOccurrence,
  ClassSchedule,
  Event,
  Exam,
  Holiday,
  Minor,
  MinorCourse,
  Note,
  NotificationLog,
  ReminderOffset,
  ResourceLink,
  Semester,
  SemesterCourse,
  Settings,
  Slot,
  Subject,
  Task,
} from "@/types/database";
import { normalizeShortCode } from "@/utils/short-code";
import { COLLECTIONS, DATABASE_ID, databases, ID, Query } from "./appwrite";

type AppwriteDoc = object;

function normalizeSubjectSlotIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string",
        );
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function serializeSubjectSlotIds(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  return "[]";
}

function normalizeSubjectDocument(doc: Record<string, unknown>): Subject {
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
    semester_id: String(doc.semester_id ?? ""),
    name: String(doc.name ?? ""),
    short_name: String(doc.short_name ?? ""),
    code: typeof doc.code === "string" ? doc.code : null,
    start_date: typeof doc.start_date === "string" ? doc.start_date : null,
    end_date: typeof doc.end_date === "string" ? doc.end_date : null,
    color: typeof doc.color === "string" ? doc.color : "#8B5CF6",
    icon: typeof doc.icon === "string" ? doc.icon : null,
    attendance_requirement_percent:
      typeof doc.attendance_requirement_percent === "number"
        ? doc.attendance_requirement_percent
        : null,
    credits: typeof doc.credits === "number" ? doc.credits : 0,
    grade: typeof doc.grade === "string" ? doc.grade : null,
    grade_points:
      typeof doc.grade_points === "number" ? doc.grade_points : null,
    grade_scale_id:
      typeof doc.grade_scale_id === "string" ? doc.grade_scale_id : null,
    type:
      doc.type === "lab" ||
      doc.type === "practical" ||
      doc.type === "project" ||
      doc.type === "other"
        ? doc.type
        : "theory",
    slot_ids: normalizeSubjectSlotIds(doc.slot_ids),
    teacher_name:
      typeof doc.teacher_name === "string" ? doc.teacher_name : null,
    teacher_email:
      typeof doc.teacher_email === "string" ? doc.teacher_email : null,
    teacher_phone:
      typeof doc.teacher_phone === "string" ? doc.teacher_phone : null,
    telegram_notify_classes: Boolean(doc.telegram_notify_classes),
    sort_order: typeof doc.sort_order === "number" ? doc.sort_order : 0,
    deleted_at: typeof doc.deleted_at === "string" ? doc.deleted_at : null,
  };
}

function parseReminderOffsetsJson(value: unknown): ReminderOffset[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          typeof (item as { value?: unknown }).value === "number" &&
          ((item as { unit?: unknown }).unit === "minutes" ||
            (item as { unit?: unknown }).unit === "hours" ||
            (item as { unit?: unknown }).unit === "days")
        ) {
          return {
            value: (item as { value: number }).value,
            unit: (item as { unit: "minutes" | "hours" | "days" }).unit,
          };
        }
        return null;
      })
      .filter((item): item is ReminderOffset => item !== null);
  } catch {
    return [];
  }
}

function serializeReminderOffsetsJson(
  offsets: ReminderOffset[] | null | undefined,
): string | null {
  if (!offsets || offsets.length === 0) return null;
  return JSON.stringify(offsets);
}

function extractUnknownAttributeKey(message: string): string | null {
  const match = message.match(/Unknown attribute: "([^"]+)"/);
  return match?.[1] ?? null;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

function isUnknownDescriptionError(error: unknown): boolean {
  return getErrorMessage(error).includes('Unknown attribute: "description"');
}

function shouldLogAppwriteError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    !message.includes('Unknown attribute: "description"') &&
    !(
      message.includes("Document with the requested ID") &&
      message.includes("could not be found")
    )
  );
}

/**
 * Generic list documents with optional queries
 */
export async function listDocuments<T extends AppwriteDoc>(
  collectionId: string,
  queries: string[] = [],
  includeSoftDeleteFilter: boolean = true,
): Promise<T[]> {
  try {
    const allQueries = includeSoftDeleteFilter
      ? [Query.isNull("deleted_at"), ...queries]
      : queries;

    const response = await databases.listDocuments(
      DATABASE_ID,
      collectionId,
      allQueries,
    );
    return response.documents as unknown as T[];
  } catch (error) {
    console.error(`Error listing documents from ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument<T extends AppwriteDoc>(
  collectionId: string,
  documentId: string,
): Promise<T> {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      collectionId,
      documentId,
    );
    return doc as unknown as T;
  } catch (error) {
    console.error(
      `Error getting document ${documentId} from ${collectionId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Create a new document
 */
export async function createDocument<T extends AppwriteDoc>(
  collectionId: string,
  data: Record<string, unknown>,
  documentId?: string,
): Promise<T> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      collectionId,
      documentId || ID.unique(),
      data,
    );
    return doc as unknown as T;
  } catch (error) {
    if (shouldLogAppwriteError(error)) {
      console.error(`Error creating document in ${collectionId}:`, error);
    }
    throw error;
  }
}

/**
 * Update an existing document
 */
export async function updateDocument<T extends AppwriteDoc>(
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>,
): Promise<T> {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      collectionId,
      documentId,
      data,
    );
    return doc as unknown as T;
  } catch (error) {
    if (shouldLogAppwriteError(error)) {
      console.error(
        `Error updating document ${documentId} in ${collectionId}:`,
        error,
      );
    }
    throw error;
  }
}

/**
 * Soft delete a document (set deleted_at)
 */
export async function softDeleteDocument<T extends AppwriteDoc>(
  collectionId: string,
  documentId: string,
): Promise<T> {
  return updateDocument<T>(collectionId, documentId, {
    deleted_at: new Date().toISOString(),
  });
}

/**
 * Restore a soft-deleted document
 */
export async function restoreDocument<T extends AppwriteDoc>(
  collectionId: string,
  documentId: string,
): Promise<T> {
  return updateDocument<T>(collectionId, documentId, {
    deleted_at: null,
  });
}

/**
 * Hard delete a document (permanent)
 */
export async function deleteDocument(
  collectionId: string,
  documentId: string,
): Promise<void> {
  try {
    await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
  } catch (error) {
    if (shouldLogAppwriteError(error)) {
      console.error(
        `Error deleting document ${documentId} from ${collectionId}:`,
        error,
      );
    }
    throw error;
  }
}

// ============================================================
// COLLECTION-SPECIFIC FUNCTIONS
// ============================================================

// SEMESTERS
export const semesterService = {
  list: (queries?: string[]) =>
    listDocuments<Semester>(COLLECTIONS.SEMESTERS, [
      Query.orderAsc("start_date"),
      ...(queries ?? []),
    ]),
  get: (id: string) => getDocument<Semester>(COLLECTIONS.SEMESTERS, id),
  create: (
    data: Omit<
      Semester,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<Semester>(COLLECTIONS.SEMESTERS, data),
  update: (id: string, data: Partial<Semester>) =>
    updateDocument<Semester>(COLLECTIONS.SEMESTERS, id, data),
  delete: (id: string) =>
    softDeleteDocument<Semester>(COLLECTIONS.SEMESTERS, id),
  restore: (id: string) => restoreDocument<Semester>(COLLECTIONS.SEMESTERS, id),

  // Get ongoing semester
  getOngoing: async () => {
    const docs = await listDocuments<Semester>(COLLECTIONS.SEMESTERS, [
      Query.equal("status", "ongoing"),
      Query.limit(1),
    ]);
    return docs[0] || null;
  },
};

// SUBJECTS
export const subjectService = {
  list: async (queries?: string[]) => {
    const docs = await listDocuments<Record<string, unknown>>(
      COLLECTIONS.SUBJECTS,
      queries,
    );
    return docs.map(normalizeSubjectDocument);
  },
  get: async (id: string) => {
    const doc = await getDocument<Record<string, unknown>>(
      COLLECTIONS.SUBJECTS,
      id,
    );
    return normalizeSubjectDocument(doc);
  },
  create: (
    data: Omit<
      Subject,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) =>
    createDocument<Record<string, unknown>>(COLLECTIONS.SUBJECTS, {
      ...data,
      slot_ids: serializeSubjectSlotIds(data.slot_ids),
    }).then(normalizeSubjectDocument),
  update: (id: string, data: Partial<Subject>) =>
    updateDocument<Record<string, unknown>>(COLLECTIONS.SUBJECTS, id, {
      ...data,
      ...(data.slot_ids !== undefined
        ? { slot_ids: serializeSubjectSlotIds(data.slot_ids) }
        : {}),
    }).then(normalizeSubjectDocument),
  delete: (id: string) => softDeleteDocument<Subject>(COLLECTIONS.SUBJECTS, id),

  // Get subjects for a semester
  getBySemester: (semesterId: string) =>
    listDocuments<Record<string, unknown>>(COLLECTIONS.SUBJECTS, [
      Query.equal("semester_id", semesterId),
      Query.orderAsc("sort_order"),
    ]).then((docs) => docs.map(normalizeSubjectDocument)),
};

// CLASS SCHEDULES
export const classScheduleService = {
  list: (queries?: string[]) =>
    listDocuments<ClassSchedule>(COLLECTIONS.CLASS_SCHEDULES, queries),
  get: (id: string) =>
    getDocument<ClassSchedule>(COLLECTIONS.CLASS_SCHEDULES, id),
  create: (
    data: Omit<
      ClassSchedule,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<ClassSchedule>(COLLECTIONS.CLASS_SCHEDULES, data),
  update: (id: string, data: Partial<ClassSchedule>) =>
    updateDocument<ClassSchedule>(COLLECTIONS.CLASS_SCHEDULES, id, data),
  delete: (id: string) =>
    softDeleteDocument<ClassSchedule>(COLLECTIONS.CLASS_SCHEDULES, id),

  // Get schedules for a subject
  getBySubject: (subjectId: string) =>
    listDocuments<ClassSchedule>(COLLECTIONS.CLASS_SCHEDULES, [
      Query.equal("subject_id", subjectId),
      Query.orderAsc("day_of_week"),
      Query.orderAsc("start_time"),
    ]),

  // Get schedules for a specific day
  getByDay: (dayOfWeek: number) =>
    listDocuments<ClassSchedule>(COLLECTIONS.CLASS_SCHEDULES, [
      Query.equal("day_of_week", dayOfWeek),
      Query.orderAsc("start_time"),
    ]),
};

// SLOTS
export const slotService = {
  list: (queries?: string[]) => listDocuments<Slot>(COLLECTIONS.SLOTS, queries),
  get: (id: string) => getDocument<Slot>(COLLECTIONS.SLOTS, id),
};

// CLASS OCCURRENCES
export const classOccurrenceService = {
  list: (queries?: string[]) =>
    listDocuments<ClassOccurrence>(
      COLLECTIONS.CLASS_OCCURRENCES,
      queries,
      false,
    ),
  get: (id: string) =>
    getDocument<ClassOccurrence>(COLLECTIONS.CLASS_OCCURRENCES, id),
  create: (
    data: Omit<
      ClassOccurrence,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<ClassOccurrence>(COLLECTIONS.CLASS_OCCURRENCES, data),
  update: (id: string, data: Partial<ClassOccurrence>) =>
    updateDocument<ClassOccurrence>(COLLECTIONS.CLASS_OCCURRENCES, id, data),
  delete: (id: string) => deleteDocument(COLLECTIONS.CLASS_OCCURRENCES, id),

  // Get occurrences for a subject
  getBySubject: (subjectId: string) =>
    listDocuments<ClassOccurrence>(
      COLLECTIONS.CLASS_OCCURRENCES,
      [Query.equal("subject_id", subjectId), Query.orderDesc("date")],
      false,
    ),

  // Get occurrences for a date
  getByDate: (date: string) =>
    listDocuments<ClassOccurrence>(
      COLLECTIONS.CLASS_OCCURRENCES,
      [Query.equal("date", date)],
      false,
    ),

  // Mark attendance
  markAttendance: async (
    id: string,
    attendance: "present" | "absent" | null,
  ) => {
    return updateDocument<ClassOccurrence>(COLLECTIONS.CLASS_OCCURRENCES, id, {
      attendance,
      status: attendance === null ? "cancelled" : "completed",
      cancellation_reason: attendance === null ? "Marked cancelled" : null,
      attendance_marked_at: attendance ? new Date().toISOString() : null,
    });
  },
};

// EXAMS
export const examService = {
  list: (queries?: string[]) => listDocuments<Exam>(COLLECTIONS.EXAMS, queries),
  get: (id: string) => getDocument<Exam>(COLLECTIONS.EXAMS, id),
  create: (
    data: Omit<
      Exam,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) =>
    createDocument<Exam>(COLLECTIONS.EXAMS, {
      ...data,
      reminder_offsets_json: data.reminder_offsets_json ?? null,
    }),
  update: (id: string, data: Partial<Exam>) =>
    updateDocument<Exam>(COLLECTIONS.EXAMS, id, data),
  delete: (id: string) => softDeleteDocument<Exam>(COLLECTIONS.EXAMS, id),

  // Get exams for a subject
  getBySubject: (subjectId: string) =>
    listDocuments<Exam>(COLLECTIONS.EXAMS, [
      Query.equal("subject_id", subjectId),
      Query.orderDesc("date"),
    ]),

  // Get upcoming exams
  getUpcoming: (days: number = 7) => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return listDocuments<Exam>(COLLECTIONS.EXAMS, [
      Query.greaterThanEqual("date", now.toISOString().split("T")[0]),
      Query.lessThanEqual("date", future.toISOString().split("T")[0]),
      Query.orderAsc("date"),
    ]);
  },
};

// TASKS
export const taskService = {
  list: (queries?: string[]) => listDocuments<Task>(COLLECTIONS.TASKS, queries),
  get: (id: string) => getDocument<Task>(COLLECTIONS.TASKS, id),
  create: (
    data: Omit<
      Task,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) =>
    createDocument<Task>(COLLECTIONS.TASKS, {
      ...data,
      reminder_offsets_json: data.reminder_offsets_json ?? null,
    }),
  update: (id: string, data: Partial<Task>) =>
    updateDocument<Task>(COLLECTIONS.TASKS, id, data),
  delete: (id: string) => softDeleteDocument<Task>(COLLECTIONS.TASKS, id),

  // Toggle completion
  toggleComplete: async (id: string, isCompleted: boolean) => {
    return updateDocument<Task>(COLLECTIONS.TASKS, id, {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    });
  },

  // Get pending tasks
  getPending: () =>
    listDocuments<Task>(COLLECTIONS.TASKS, [
      Query.equal("is_completed", false),
      Query.orderAsc("deadline"),
    ]),
};

export const settingsService = {
  list: () =>
    listDocuments<Settings>(COLLECTIONS.SETTINGS, [Query.limit(1)], false),
  getFirst: async () => {
    const docs = await listDocuments<Settings>(
      COLLECTIONS.SETTINGS,
      [Query.limit(1)],
      false,
    );
    return docs[0] ?? null;
  },
  update: (id: string, data: Record<string, unknown>) =>
    updateDocument<Settings>(COLLECTIONS.SETTINGS, id, data),
  create: (data: Record<string, unknown>) =>
    createDocument<Settings>(COLLECTIONS.SETTINGS, data),
};

// HOLIDAYS
export const holidayService = {
  list: (queries?: string[]) =>
    listDocuments<Holiday>(COLLECTIONS.HOLIDAYS, queries),
  get: (id: string) => getDocument<Holiday>(COLLECTIONS.HOLIDAYS, id),
  create: async (
    data: Omit<
      Holiday,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => {
    if ("description" in data && data.description !== null) {
      try {
        return await createDocument<Holiday>(COLLECTIONS.HOLIDAYS, { ...data });
      } catch (error) {
        if (isUnknownDescriptionError(error)) {
          return createDocument<Holiday>(COLLECTIONS.HOLIDAYS, {
            ...data,
            description: undefined,
          });
        }
      }
    }
    const payload: Record<string, unknown> = { ...data };
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        return await createDocument<Holiday>(COLLECTIONS.HOLIDAYS, payload);
      } catch (error) {
        const unknown = extractUnknownAttributeKey(getErrorMessage(error));
        if (unknown && unknown in payload) {
          delete payload[unknown];
          continue;
        }
        throw error;
      }
    }
    return createDocument<Holiday>(COLLECTIONS.HOLIDAYS, payload);
  },
  update: async (id: string, data: Partial<Holiday>) => {
    if ("description" in data && data.description !== undefined) {
      try {
        return await updateDocument<Holiday>(COLLECTIONS.HOLIDAYS, id, {
          ...data,
        });
      } catch (error) {
        if (isUnknownDescriptionError(error)) {
          return updateDocument<Holiday>(COLLECTIONS.HOLIDAYS, id, {
            ...data,
            description: undefined,
          });
        }
      }
    }
    const payload: Record<string, unknown> = { ...data };
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        return await updateDocument<Holiday>(COLLECTIONS.HOLIDAYS, id, payload);
      } catch (error) {
        const unknown = extractUnknownAttributeKey(getErrorMessage(error));
        if (unknown && unknown in payload) {
          delete payload[unknown];
          continue;
        }
        throw error;
      }
    }
    return updateDocument<Holiday>(COLLECTIONS.HOLIDAYS, id, payload);
  },
  delete: (id: string) => softDeleteDocument<Holiday>(COLLECTIONS.HOLIDAYS, id),
};

export const notificationLogService = {
  list: (queries?: string[]) =>
    listDocuments<NotificationLog>(
      COLLECTIONS.NOTIFICATIONS_LOG,
      queries,
      false,
    ),
  create: (
    data: Omit<
      NotificationLog,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<NotificationLog>(COLLECTIONS.NOTIFICATIONS_LOG, data),
};

export { parseReminderOffsetsJson, serializeReminderOffsetsJson };

// EVENTS
export const eventService = {
  list: (queries?: string[]) =>
    listDocuments<Event>(COLLECTIONS.EVENTS, queries),
  get: (id: string) => getDocument<Event>(COLLECTIONS.EVENTS, id),
  create: (
    data: Omit<
      Event,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<Event>(COLLECTIONS.EVENTS, data),
  update: (id: string, data: Partial<Event>) =>
    updateDocument<Event>(COLLECTIONS.EVENTS, id, data),
  delete: (id: string) => softDeleteDocument<Event>(COLLECTIONS.EVENTS, id),
};

// FILES
export const fileService = {
  list: (queries?: string[]) =>
    listDocuments<ClasseyFile>(COLLECTIONS.FILES, queries),
  get: (id: string) => getDocument<ClasseyFile>(COLLECTIONS.FILES, id),
  create: (
    data: Omit<
      ClasseyFile,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<ClasseyFile>(COLLECTIONS.FILES, data),
  update: (id: string, data: Partial<ClasseyFile>) =>
    updateDocument<ClasseyFile>(COLLECTIONS.FILES, id, data),
  delete: (id: string) =>
    softDeleteDocument<ClasseyFile>(COLLECTIONS.FILES, id),

  // Get files for a subject
  getBySubject: (subjectId: string) =>
    listDocuments<ClasseyFile>(COLLECTIONS.FILES, [
      Query.equal("subject_id", subjectId),
    ]),
};

// RESOURCE LINKS
export const resourceLinkService = {
  list: (queries?: string[]) =>
    listDocuments<ResourceLink>(COLLECTIONS.RESOURCE_LINKS, queries),
  get: (id: string) =>
    getDocument<ResourceLink>(COLLECTIONS.RESOURCE_LINKS, id),
  create: (
    data: Omit<
      ResourceLink,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<ResourceLink>(COLLECTIONS.RESOURCE_LINKS, data),
  update: (id: string, data: Partial<ResourceLink>) =>
    updateDocument<ResourceLink>(COLLECTIONS.RESOURCE_LINKS, id, data),
  delete: (id: string) =>
    softDeleteDocument<ResourceLink>(COLLECTIONS.RESOURCE_LINKS, id),

  // Get links for a subject
  getBySubject: (subjectId: string) =>
    listDocuments<ResourceLink>(COLLECTIONS.RESOURCE_LINKS, [
      Query.equal("subject_id", subjectId),
      Query.orderAsc("sort_order"),
    ]),
};

// NOTES
export const noteService = {
  list: (queries?: string[]) => listDocuments<Note>(COLLECTIONS.NOTES, queries),
  get: (id: string) => getDocument<Note>(COLLECTIONS.NOTES, id),
  create: (
    data: Omit<
      Note,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<Note>(COLLECTIONS.NOTES, data),
  update: (id: string, data: Partial<Note>) =>
    updateDocument<Note>(COLLECTIONS.NOTES, id, data),
  delete: (id: string) => softDeleteDocument<Note>(COLLECTIONS.NOTES, id),

  // Get notes for a subject
  getBySubject: (subjectId: string) =>
    listDocuments<Note>(COLLECTIONS.NOTES, [
      Query.equal("subject_id", subjectId),
      Query.orderDesc("$createdAt"),
    ]),
};

// ============================================================
// MINORS
// ============================================================

export const minorService = {
  list: (queries?: string[]) =>
    listDocuments<Minor>(COLLECTIONS.MINORS, queries),
  get: (id: string) => getDocument<Minor>(COLLECTIONS.MINORS, id),
  create: (
    data: Omit<
      Minor,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => createDocument<Minor>(COLLECTIONS.MINORS, data),
  update: (id: string, data: Partial<Minor>) =>
    updateDocument<Minor>(COLLECTIONS.MINORS, id, data),
  delete: (id: string) =>
    softDeleteDocument<Minor>(COLLECTIONS.MINORS, id),
  restore: (id: string) =>
    restoreDocument<Minor>(COLLECTIONS.MINORS, id),
};

// ============================================================
// MINOR COURSES (bucket)
// ============================================================

export const minorCourseService = {
  list: (queries?: string[]) =>
    listDocuments<MinorCourse>(COLLECTIONS.MINOR_COURSES, queries),
  get: (id: string) =>
    getDocument<MinorCourse>(COLLECTIONS.MINOR_COURSES, id),
  create: (
    data: Omit<
      MinorCourse,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => {
    const normalized = normalizeShortCode(data.short_code);
    return createDocument<MinorCourse>(COLLECTIONS.MINOR_COURSES, {
      ...data,
      short_code_normalized: normalized,
    });
  },
  update: (id: string, data: Partial<MinorCourse>) => {
    const patch: Record<string, unknown> = { ...data };
    if (data.short_code !== undefined) {
      patch.short_code_normalized = normalizeShortCode(data.short_code);
    }
    return updateDocument<MinorCourse>(COLLECTIONS.MINOR_COURSES, id, patch);
  },
  delete: (id: string) =>
    softDeleteDocument<MinorCourse>(COLLECTIONS.MINOR_COURSES, id),

  getByMinor: (minorId: string) =>
    listDocuments<MinorCourse>(COLLECTIONS.MINOR_COURSES, [
      Query.equal("minor_id", minorId),
      Query.orderAsc("short_code"),
      Query.limit(200),
    ]),

  batchCreate: async (
    minorId: string,
    courses: Array<
      Omit<
        MinorCourse,
        | "$id"
        | "$createdAt"
        | "$updatedAt"
        | "$collectionId"
        | "$databaseId"
        | "$permissions"
        | "minor_id"
        | "short_code_normalized"
      >
    >,
  ): Promise<MinorCourse[]> => {
    const results: MinorCourse[] = [];
    for (const course of courses) {
      const doc = await createDocument<MinorCourse>(
        COLLECTIONS.MINOR_COURSES,
        {
          ...course,
          minor_id: minorId,
          short_code_normalized: normalizeShortCode(course.short_code),
        },
      );
      results.push(doc);
    }
    return results;
  },

  replaceForMinor: async (
    minorId: string,
    courses: Array<
      Omit<
        MinorCourse,
        | "$id"
        | "$createdAt"
        | "$updatedAt"
        | "$collectionId"
        | "$databaseId"
        | "$permissions"
        | "minor_id"
        | "short_code_normalized"
      >
    >,
  ): Promise<MinorCourse[]> => {
    // Soft-delete existing courses for this minor
    const existing = await listDocuments<MinorCourse>(
      COLLECTIONS.MINOR_COURSES,
      [Query.equal("minor_id", minorId), Query.limit(500)],
    );
    for (const doc of existing) {
      await softDeleteDocument<MinorCourse>(COLLECTIONS.MINOR_COURSES, doc.$id);
    }
    // Create new courses
    return minorCourseService.batchCreate(minorId, courses);
  },
};

// ============================================================
// SEMESTER COURSES
// ============================================================

export const semesterCourseService = {
  list: (queries?: string[]) =>
    listDocuments<SemesterCourse>(COLLECTIONS.SEMESTER_COURSES, queries),
  get: (id: string) =>
    getDocument<SemesterCourse>(COLLECTIONS.SEMESTER_COURSES, id),
  create: (
    data: Omit<
      SemesterCourse,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => {
    const normalized = normalizeShortCode(data.short_code);
    return createDocument<SemesterCourse>(COLLECTIONS.SEMESTER_COURSES, {
      ...data,
      short_code_normalized: normalized,
    });
  },
  update: (id: string, data: Partial<SemesterCourse>) => {
    const patch: Record<string, unknown> = { ...data };
    if (data.short_code !== undefined) {
      patch.short_code_normalized = normalizeShortCode(data.short_code);
    }
    return updateDocument<SemesterCourse>(
      COLLECTIONS.SEMESTER_COURSES,
      id,
      patch,
    );
  },
  delete: (id: string) =>
    softDeleteDocument<SemesterCourse>(COLLECTIONS.SEMESTER_COURSES, id),

  getBySemester: (semesterId: string) =>
    listDocuments<SemesterCourse>(COLLECTIONS.SEMESTER_COURSES, [
      Query.equal("semester_id", semesterId),
      Query.orderAsc("department"),
      Query.orderAsc("short_code"),
      Query.limit(500),
    ]),

  getByDepartment: (semesterId: string, department: string) =>
    listDocuments<SemesterCourse>(COLLECTIONS.SEMESTER_COURSES, [
      Query.equal("semester_id", semesterId),
      Query.equal("department", department),
      Query.orderAsc("short_code"),
      Query.limit(200),
    ]),

  batchCreate: async (
    semesterId: string,
    department: string,
    courses: Array<
      Omit<
        SemesterCourse,
        | "$id"
        | "$createdAt"
        | "$updatedAt"
        | "$collectionId"
        | "$databaseId"
        | "$permissions"
        | "semester_id"
        | "department"
        | "short_code_normalized"
      >
    >,
  ): Promise<SemesterCourse[]> => {
    const results: SemesterCourse[] = [];
    for (const course of courses) {
      const doc = await createDocument<SemesterCourse>(
        COLLECTIONS.SEMESTER_COURSES,
        {
          ...course,
          semester_id: semesterId,
          department,
          short_code_normalized: normalizeShortCode(course.short_code),
        },
      );
      results.push(doc);
    }
    return results;
  },

  replaceForDepartment: async (
    semesterId: string,
    department: string,
    courses: Array<
      Omit<
        SemesterCourse,
        | "$id"
        | "$createdAt"
        | "$updatedAt"
        | "$collectionId"
        | "$databaseId"
        | "$permissions"
        | "semester_id"
        | "department"
        | "short_code_normalized"
      >
    >,
  ): Promise<SemesterCourse[]> => {
    // Soft-delete existing courses for this semester + department
    const existing = await listDocuments<SemesterCourse>(
      COLLECTIONS.SEMESTER_COURSES,
      [
        Query.equal("semester_id", semesterId),
        Query.equal("department", department),
        Query.limit(500),
      ],
    );
    for (const doc of existing) {
      await softDeleteDocument<SemesterCourse>(
        COLLECTIONS.SEMESTER_COURSES,
        doc.$id,
      );
    }
    return semesterCourseService.batchCreate(semesterId, department, courses);
  },
};
