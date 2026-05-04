import type { Semester, Subject } from "@/types/database";

export type SemesterDisplayStatus =
  | "upcoming"
  | "ongoing"
  | "over"
  | "completed";

function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSemesterCompletedByFinalGrades(
  semester: Semester,
  subjects: Subject[],
): boolean {
  const semesterSubjects = subjects.filter(
    (subject) => !subject.deleted_at && subject.semester_id === semester.$id,
  );
  if (semesterSubjects.length === 0) return false;
  return semesterSubjects.every((subject) => subject.grade_points !== null);
}

export function getSemesterDisplayStatus(
  semester: Semester,
  subjects: Subject[] = [],
  todayISO: string = getTodayISO(),
): SemesterDisplayStatus {
  if (semester.status === "completed") return "completed";
  if (semester.spi !== null) return "completed";
  if (isSemesterCompletedByFinalGrades(semester, subjects)) return "completed";
  if (todayISO < semester.start_date) return "upcoming";
  if (todayISO <= semester.end_date) return "ongoing";
  return "over";
}
