/**
 * Slot system utilities for Classey
 * Handles college timetable slot system with 15 regular + 4 lab + Wednesday extras
 */

import type { Slot, SubSlot, ClassSchedule } from "@/types/database";

/**
 * Day of week constants (1 = Monday, 6 = Saturday)
 */
export const DAYS_OF_WEEK = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export const DAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const DAY_SHORT_NAMES: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

/**
 * Parse sub-slots from JSON string
 */
export function parseSubSlots(slot: Slot): SubSlot[] {
  try {
    return JSON.parse(slot.sub_slots) as SubSlot[];
  } catch {
    return [];
  }
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number, short: boolean = false): string {
  return short ? DAY_SHORT_NAMES[dayOfWeek] || "" : DAY_NAMES[dayOfWeek] || "";
}

/**
 * Format time string for display (24h to 12h)
 */
export function formatTime(time: string, use24h: boolean = false): string {
  if (use24h) return time;
  
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Format time range for display
 */
export function formatTimeRange(startTime: string, endTime: string, use24h: boolean = false): string {
  return `${formatTime(startTime, use24h)} - ${formatTime(endTime, use24h)}`;
}

/**
 * Generate class schedules from a slot selection
 */
export function generateSchedulesFromSlot(
  subjectId: string,
  slot: Slot,
  selectedSubSlotIds: string[] = [], // empty = all sub-slots
  semesterStartDate: string,
  room?: string,
  building?: string
): Omit<ClassSchedule, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">[] {
  const subSlots = parseSubSlots(slot);
  const targetSubSlots = selectedSubSlotIds.length > 0
    ? subSlots.filter((ss) => selectedSubSlotIds.includes(ss.id))
    : subSlots;

  return targetSubSlots.map((subSlot) => ({
    subject_id: subjectId,
    slot_id: slot.$id,
    sub_slot_id: subSlot.id,
    day_of_week: subSlot.day_of_week,
    start_time: subSlot.start_time,
    end_time: subSlot.end_time,
    room: room || null,
    building: building || null,
    effective_from: semesterStartDate,
    effective_until: null,
    deleted_at: null,
  }));
}

/**
 * Check if a time slot overlaps with another
 */
export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
}

/**
 * Check for schedule conflicts on the same day
 */
export function findScheduleConflicts(
  schedules: ClassSchedule[],
  dayOfWeek: number
): Array<{ schedule1: ClassSchedule; schedule2: ClassSchedule }> {
  const daySchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);
  const conflicts: Array<{ schedule1: ClassSchedule; schedule2: ClassSchedule }> = [];

  for (let i = 0; i < daySchedules.length; i++) {
    for (let j = i + 1; j < daySchedules.length; j++) {
      if (
        checkTimeOverlap(
          daySchedules[i].start_time,
          daySchedules[i].end_time,
          daySchedules[j].start_time,
          daySchedules[j].end_time
        )
      ) {
        conflicts.push({
          schedule1: daySchedules[i],
          schedule2: daySchedules[j],
        });
      }
    }
  }

  return conflicts;
}

/**
 * Get schedule duration in minutes
 */
export function getScheduleDuration(schedule: ClassSchedule): number {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  return toMinutes(schedule.end_time) - toMinutes(schedule.start_time);
}

/**
 * Sort schedules by time
 */
export function sortSchedulesByTime(schedules: ClassSchedule[]): ClassSchedule[] {
  return [...schedules].sort((a, b) => {
    // First by day
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week;
    }
    // Then by start time
    return a.start_time.localeCompare(b.start_time);
  });
}

/**
 * Group schedules by day of week
 */
export function groupSchedulesByDay(
  schedules: ClassSchedule[]
): Record<number, ClassSchedule[]> {
  const grouped: Record<number, ClassSchedule[]> = {};
  
  for (const schedule of schedules) {
    if (!grouped[schedule.day_of_week]) {
      grouped[schedule.day_of_week] = [];
    }
    grouped[schedule.day_of_week].push(schedule);
  }

  // Sort each day's schedules by time
  for (const day in grouped) {
    grouped[Number(day)] = grouped[Number(day)].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
  }

  return grouped;
}

/**
 * Calculate total classes per week for a subject
 */
export function getClassesPerWeek(schedules: ClassSchedule[]): number {
  return schedules.filter((s) => !s.deleted_at && !s.effective_until).length;
}
