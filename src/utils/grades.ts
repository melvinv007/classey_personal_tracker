/**
 * Grade and CGPA calculation utilities
 * Based on classey-features skill specifications
 */

import type { Exam, Subject, Semester } from "@/types/database";

/**
 * Grade scale mapping (default 10-point scale)
 */
export interface GradeMapping {
  grade: string;
  points: number;
  min_percent: number;
}

export const DEFAULT_GRADE_SCALE: GradeMapping[] = [
  { grade: "O", points: 10, min_percent: 90 },
  { grade: "A+", points: 9, min_percent: 80 },
  { grade: "A", points: 8, min_percent: 70 },
  { grade: "B+", points: 7, min_percent: 60 },
  { grade: "B", points: 6, min_percent: 50 },
  { grade: "C", points: 5, min_percent: 45 },
  { grade: "P", points: 4, min_percent: 40 },
  { grade: "F", points: 0, min_percent: 0 },
];

/**
 * Get grade from percentage using grade scale
 */
export function gradeFromPercent(
  percent: number,
  scale: GradeMapping[] = DEFAULT_GRADE_SCALE
): { grade: string; points: number } {
  const sorted = [...scale].sort((a, b) => b.min_percent - a.min_percent);
  const match = sorted.find((m) => percent >= m.min_percent);
  return match ? { grade: match.grade, points: match.points } : { grade: "F", points: 0 };
}

/**
 * Calculate current grade percentage for a subject based on exams
 */
export function calculateSubjectGrade(exams: Exam[]): {
  percentage: number;
  grade: string;
  points: number;
  earnedMarks: number;
  totalMarks: number;
  completedExams: number;
} {
  const withWeightage = exams.filter(
    (e) => e.weightage_percent && e.marks_obtained !== null && !e.deleted_at
  );
  const withoutWeightage = exams.filter(
    (e) => !e.weightage_percent && e.marks_obtained !== null && !e.deleted_at
  );

  if (withWeightage.length > 0) {
    // Weighted average
    const earned = withWeightage.reduce(
      (sum, e) => sum + (e.marks_obtained! / e.marks_total) * e.weightage_percent!,
      0
    );
    const totalObtained = withWeightage.reduce((sum, e) => sum + e.marks_obtained!, 0);
    const totalMax = withWeightage.reduce((sum, e) => sum + e.marks_total, 0);
    const { grade, points } = gradeFromPercent(earned);
    return {
      percentage: Math.round(earned * 10) / 10,
      grade,
      points,
      earnedMarks: totalObtained,
      totalMarks: totalMax,
      completedExams: withWeightage.length,
    };
  } else if (withoutWeightage.length > 0) {
    // Simple average
    const totalObtained = withoutWeightage.reduce((sum, e) => sum + e.marks_obtained!, 0);
    const totalMax = withoutWeightage.reduce((sum, e) => sum + e.marks_total, 0);
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const { grade, points } = gradeFromPercent(percentage);
    return {
      percentage: Math.round(percentage * 10) / 10,
      grade,
      points,
      earnedMarks: totalObtained,
      totalMarks: totalMax,
      completedExams: withoutWeightage.length,
    };
  }

  return {
    percentage: 0,
    grade: "-",
    points: 0,
    earnedMarks: 0,
    totalMarks: 0,
    completedExams: 0,
  };
}

/**
 * Calculate SPI (Semester Performance Index) for a semester
 * SPI = (sum of grade_points * credits) / total_credits
 */
export function calculateSPI(subjects: Subject[]): number {
  const completed = subjects.filter(
    (s) => s.grade_points !== null && s.credits > 0 && !s.deleted_at
  );
  const totalCredits = completed.reduce((sum, s) => sum + s.credits, 0);
  if (totalCredits === 0) return 0;
  const weightedPoints = completed.reduce(
    (sum, s) => sum + s.grade_points! * s.credits,
    0
  );
  return Math.round((weightedPoints / totalCredits) * 100) / 100;
}

/**
 * Semester data for CGPA calculation
 */
export interface SemesterGradeData {
  id: string;
  name: string;
  spi: number;
  credits: number;
  status: string;
  source: "subjects" | "manual";
}

export interface ResolvedSemesterGradeData extends SemesterGradeData {
  includedInCGPA: boolean;
}

export function resolveSemesterGradeData(
  semester: Semester,
  semesterSubjects: Subject[]
): ResolvedSemesterGradeData {
  const validSubjects = semesterSubjects.filter((subject) => !subject.deleted_at);
  const gradedSubjects = validSubjects.filter(
    (subject) => subject.grade_points !== null && subject.credits > 0
  );
  const allSubjectsGraded = validSubjects.length > 0 && gradedSubjects.length === validSubjects.length;

  if (allSubjectsGraded) {
    return {
      id: semester.$id,
      name: semester.name,
      spi: calculateSPI(validSubjects),
      credits: validSubjects.reduce((sum, subject) => sum + subject.credits, 0),
      status: semester.status,
      source: "subjects",
      includedInCGPA: semester.status === "completed",
    };
  }

  if (
    semester.is_quick_input &&
    semester.status === "completed" &&
    semester.spi !== null &&
    semester.credits_total !== null &&
    semester.credits_total > 0
  ) {
    return {
      id: semester.$id,
      name: semester.name,
      spi: semester.spi,
      credits: semester.credits_total,
      status: semester.status,
      source: "manual",
      includedInCGPA: true,
    };
  }

  return {
    id: semester.$id,
    name: semester.name,
    spi: 0,
    credits: validSubjects.reduce((sum, subject) => sum + subject.credits, 0),
    status: semester.status,
    source: "subjects",
    includedInCGPA: false,
  };
}

/**
 * Calculate CGPA across all semesters
 * CGPA = (sum of SPI * credits_per_semester) / total_credits
 */
export function calculateCGPA(semesters: SemesterGradeData[]): number {
  const completed = semesters.filter((s) => s.spi > 0 && s.credits > 0);
  const totalCredits = completed.reduce((sum, s) => sum + s.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = completed.reduce((sum, s) => sum + s.spi * s.credits, 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}

/**
 * What-if calculator: If I score X SPI this semester, what will my CGPA be?
 */
export function whatIfCGPA(
  currentSemesters: SemesterGradeData[],
  hypotheticalSPI: number,
  hypotheticalCredits: number
): number {
  return calculateCGPA([
    ...currentSemesters,
    {
      id: "hypothetical",
      name: "Current",
      spi: hypotheticalSPI,
      credits: hypotheticalCredits,
      status: "ongoing",
      source: "manual",
    },
  ]);
}

/**
 * To reach target CGPA, what SPI do I need this semester?
 */
export function requiredSPI(
  currentSemesters: SemesterGradeData[],
  targetCGPA: number,
  thisCredits: number,
  maxSPI: number = 10
): { required: number; achievable: boolean } {
  const currentCredits = currentSemesters.reduce((sum, s) => sum + s.credits, 0);
  const currentWeighted = currentSemesters.reduce((sum, s) => sum + s.spi * s.credits, 0);
  
  // Solve: (currentWeighted + x * thisCredits) / (currentCredits + thisCredits) = target
  const required = (targetCGPA * (currentCredits + thisCredits) - currentWeighted) / thisCredits;
  const rounded = Math.round(required * 100) / 100;
  
  return {
    required: Math.max(0, rounded),
    achievable: rounded <= maxSPI && rounded >= 0,
  };
}

/**
 * Calculate marks needed in remaining exams to achieve target grade
 */
export function marksNeededForGrade(
  completedExams: Exam[],
  remainingExams: Exam[],
  targetGrade: string,
  scale: GradeMapping[] = DEFAULT_GRADE_SCALE
): {
  targetPercent: number;
  currentEarned: number;
  remainingWeight: number;
  neededPercent: number;
  achievable: boolean;
} {
  const gradeInfo = scale.find((g) => g.grade === targetGrade);
  const targetPercent = gradeInfo?.min_percent ?? 0;

  // Calculate earned percentage from completed exams
  const completed = completedExams.filter(
    (e) => e.weightage_percent && e.marks_obtained !== null
  );
  const currentEarned = completed.reduce(
    (sum, e) => sum + (e.marks_obtained! / e.marks_total) * e.weightage_percent!,
    0
  );

  // Calculate remaining weightage
  const completedWeight = completed.reduce((sum, e) => sum + (e.weightage_percent ?? 0), 0);
  const remainingWeight = 100 - completedWeight;

  if (remainingWeight <= 0) {
    return {
      targetPercent,
      currentEarned,
      remainingWeight: 0,
      neededPercent: 0,
      achievable: currentEarned >= targetPercent,
    };
  }

  // Calculate needed percentage in remaining exams
  const neededPercent = ((targetPercent - currentEarned) / remainingWeight) * 100;

  return {
    targetPercent,
    currentEarned: Math.round(currentEarned * 10) / 10,
    remainingWeight,
    neededPercent: Math.round(neededPercent * 10) / 10,
    achievable: neededPercent <= 100 && neededPercent >= 0,
  };
}

/**
 * Get color for grade/percentage display
 */
export function getGradeColor(percentage: number): string {
  if (percentage >= 90) return "#10B981"; // emerald
  if (percentage >= 75) return "#22C55E"; // green
  if (percentage >= 60) return "#F59E0B"; // amber
  if (percentage >= 45) return "#F97316"; // orange
  return "#EF4444"; // red
}

/**
 * Get color for SPI/CGPA display
 */
export function getSPIColor(spi: number, max: number = 10): string {
  const percent = (spi / max) * 100;
  return getGradeColor(percent);
}
