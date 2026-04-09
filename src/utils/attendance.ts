/**
 * Attendance calculation utilities for Classey
 * Contains formulas for attendance percentage, bunk planning, and safety calculations
 */

import type { ClassOccurrence, AttendanceStats } from "@/types/database";

/**
 * Calculate attendance statistics for a subject
 */
export function calculateAttendance(
  occurrences: ClassOccurrence[],
  requiredPercent: number = 75
): AttendanceStats {
  // Filter out cancelled classes for percentage calculation
  const nonCancelled = occurrences.filter(
    (o) => o.status !== "cancelled" && o.attendance !== null
  );
  
  const present = nonCancelled.filter((o) => o.attendance === "present").length;
  const absent = nonCancelled.filter((o) => o.attendance === "absent").length;
  const cancelled = occurrences.filter((o) => o.status === "cancelled").length;
  const total = present + absent;

  const percentage = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

  return {
    total,
    present,
    absent,
    cancelled,
    percentage,
    classesNeeded: calculateClassesToSafety(present, total, requiredPercent),
    canBunk: calculateCanBunk(present, total, requiredPercent),
  };
}

/**
 * Calculate how many classes need to be attended to reach required percentage
 * Formula: (present + x) / (total + x) >= required/100
 * Solving: x = ceil((required * total - 100 * present) / (100 - required))
 */
export function calculateClassesToSafety(
  present: number,
  total: number,
  requiredPercent: number
): number {
  if (total === 0) return 0;
  if ((present / total) * 100 >= requiredPercent) return 0;
  
  const x = Math.ceil(
    (requiredPercent * total - 100 * present) / (100 - requiredPercent)
  );
  return Math.max(0, x);
}

/**
 * Calculate how many classes can be bunked while staying above required percentage
 * Formula: present / (total + x) >= required/100
 * Solving: x = floor(present * 100/required - total)
 */
export function calculateCanBunk(
  present: number,
  total: number,
  requiredPercent: number
): number {
  if (total === 0) return 0;
  
  const maxTotal = Math.floor((present * 100) / requiredPercent);
  return Math.max(0, maxTotal - total);
}

/**
 * Project future attendance percentage
 * @param currentPresent Current present count
 * @param currentTotal Current total classes
 * @param attendNext How many of the next classes will be attended
 * @param totalNext Total upcoming classes
 */
export function projectAttendance(
  currentPresent: number,
  currentTotal: number,
  attendNext: number,
  totalNext: number
): number {
  const newPresent = currentPresent + attendNext;
  const newTotal = currentTotal + totalNext;
  
  if (newTotal === 0) return 0;
  return Math.round((newPresent / newTotal) * 100 * 10) / 10;
}

/**
 * Calculate remaining classes in semester based on schedule
 * @param endDate Semester end date
 * @param classesPerWeek Number of classes per week for the subject
 */
export function calculateRemainingClasses(
  endDate: Date,
  classesPerWeek: number
): number {
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksRemaining = Math.max(0, (endDate.getTime() - now.getTime()) / msPerWeek);
  
  return Math.round(weeksRemaining * classesPerWeek);
}

/**
 * Determine attendance status color/severity
 */
export function getAttendanceStatus(
  percentage: number,
  requiredPercent: number = 75
): "safe" | "warning" | "danger" {
  if (percentage >= requiredPercent) return "safe";
  if (percentage >= requiredPercent - 10) return "warning";
  return "danger";
}

/**
 * Format attendance percentage for display
 */
export function formatAttendancePercent(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Get color class for attendance percentage
 */
export function getAttendanceColor(percentage: number, requiredPercent: number = 75): string {
  const status = getAttendanceStatus(percentage, requiredPercent);
  switch (status) {
    case "safe":
      return "text-green-400";
    case "warning":
      return "text-yellow-400";
    case "danger":
      return "text-red-400";
  }
}
