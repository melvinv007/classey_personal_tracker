"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useData } from "@/hooks/use-data";
import { cn, DAY_SHORT_NAMES, normalizeTimeHM } from "@/lib/utils";

const GRID_START = "00:00";
const GRID_END = "23:55";
const HOUR_ROW_HEIGHT = 56;
const TIME_SLOTS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00`
);

// Days of the week (1-6, Monday to Saturday)
const DAYS = [1, 2, 3, 4, 5, 6] as const;

interface TimetableEvent {
  id: string;
  subjectId: string;
  semesterId: string;
  subjectName: string;
  shortName: string;
  color: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  slotId: string | null;
}

/**
 * Convert time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const normalized = normalizeTimeHM(time);
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate position and height for a timetable event
 */
function getEventStyle(startTime: string, endTime: string): React.CSSProperties {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const gridStartMinutes = timeToMinutes(GRID_START);
  const gridEndMinutes = timeToMinutes(GRID_END);
  const totalMinutes = gridEndMinutes - gridStartMinutes;

  const top = ((startMinutes - gridStartMinutes) / totalMinutes) * 100;
  const height = ((endMinutes - startMinutes) / totalMinutes) * 100;

  return {
    top: `${top}%`,
    height: `${height}%`,
  };
}

/**
 * Format time for display (24h to readable)
 */
function formatTime(time: string): string {
  return normalizeTimeHM(time);
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function TimetablePage() {
  const { classSchedules, subjects, getSubjectById, ongoingSemester, isLoading } = useData();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeSemesterFilterId = ongoingSemester?.$id ?? null;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const total = timeToMinutes(GRID_END) - timeToMinutes(GRID_START);
    const ratio = Math.max(0, Math.min(1, (minutes - timeToMinutes(GRID_START)) / total));
    const target = ratio * (TIME_SLOTS.length * HOUR_ROW_HEIGHT);
    container.scrollTop = Math.max(0, target - container.clientHeight * 0.35);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  // Build timetable events from schedules
  const events: TimetableEvent[] = classSchedules
    .filter((schedule) => {
      if (schedule.deleted_at) return false;
      const subject = getSubjectById(schedule.subject_id);
      if (!subject || subject.deleted_at) return false;
      if (activeSemesterFilterId && subject.semester_id !== activeSemesterFilterId) return false;
      return true;
    })
    .map((schedule) => {
      const subject = getSubjectById(schedule.subject_id)!;
        return {
        id: schedule.$id,
        subjectId: subject.$id,
        semesterId: subject.semester_id,
        subjectName: subject.name,
        shortName: subject.short_name,
        color: subject.color,
        dayOfWeek: schedule.day_of_week,
          startTime: normalizeTimeHM(schedule.start_time),
          endTime: normalizeTimeHM(schedule.end_time),
        room: schedule.room,
        slotId: schedule.slot_id,
      };
    });

  // Group events by day
  const eventsByDay = DAYS.reduce((acc, day) => {
    acc[day] = events.filter((e) => e.dayOfWeek === day);
    return acc;
  }, {} as Record<number, TimetableEvent[]>);

  // Get current day (JS: 0=Sun, convert to our format: 1=Mon)
  const today = new Date().getDay();
  const currentDay = today === 0 ? 7 : today;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Weekly Timetable</h1>
              <p className="text-sm text-white/50">
                {ongoingSemester?.name ?? "No active semester"}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Timetable Grid */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-white/10">
            <div className="p-3 text-center text-sm text-white/30">Time</div>
            {DAYS.map((day) => (
              <motion.div
                key={day}
                variants={itemVariants}
                className={cn(
                  "p-3 text-center text-sm font-medium border-l border-white/10",
                  day === currentDay && "bg-[rgba(var(--accent),0.1)]"
                )}
              >
                <span className={cn(
                  day === currentDay && "text-[rgb(var(--accent))]"
                )}>
                  {DAY_SHORT_NAMES[day]}
                </span>
                {day === currentDay && (
                  <div className="text-xs text-white/50 mt-0.5">Today</div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Time grid */}
          <div ref={scrollRef} className="max-h-[72vh] overflow-y-auto">
            <div className="grid grid-cols-[64px_repeat(6,1fr)]">
            {/* Time labels */}
            <div className="relative">
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="border-b border-white/8 flex items-start justify-center pt-1"
                  style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                >
                  <span className="text-xs text-white/40">{time}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((day) => (
              <motion.div
                key={day}
                variants={itemVariants}
                className={cn(
                  "relative border-l border-white/10",
                  day === currentDay && "bg-[rgba(var(--accent),0.03)]"
                )}
                style={{ height: `${TIME_SLOTS.length * HOUR_ROW_HEIGHT}px` }}
              >
                {/* Hour grid lines */}
                {TIME_SLOTS.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-b border-white/8"
                    style={{ top: `${(i + 1) * HOUR_ROW_HEIGHT}px` }}
                  />
                ))}

                {/* Events */}
                {eventsByDay[day]?.map((event) => (
                  <TimetableEventCard key={event.id} event={event} />
                ))}
              </motion.div>
            ))}
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        >
          <h3 className="text-sm font-medium text-white/70 mb-3">Subjects</h3>
          <div className="flex flex-wrap gap-3">
            {subjects
              .filter((s) => !s.deleted_at && (!activeSemesterFilterId || s.semester_id === activeSemesterFilterId))
              .map((subject) => (
                <div
                  key={subject.$id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm">{subject.short_name}</span>
                </div>
              ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/**
 * Individual timetable event card
 */
function TimetableEventCard({ event }: { event: TimetableEvent }) {
  const style = getEventStyle(event.startTime, event.endTime);
  const duration = timeToMinutes(event.endTime) - timeToMinutes(event.startTime);
  const isCompact = duration <= 55; // Less than 1 hour

  return (
    <Link href={`/semester/${event.semesterId}/subject/${event.subjectId}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, zIndex: 10 }}
        className={cn(
          "absolute left-1 right-1 rounded-lg p-2 cursor-pointer",
          "border transition-all duration-150",
          "hover:shadow-lg"
        )}
        style={{
          ...style,
          backgroundColor: `${event.color}30`,
          borderColor: `${event.color}50`,
        }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <span
            className="font-semibold text-xs truncate"
            style={{ color: event.color }}
          >
            {event.shortName}
          </span>
          {!isCompact && (
            <>
              <span className="text-[10px] text-white/60 mt-0.5">
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </span>
              {event.room && (
                <span className="text-[10px] text-white/40 flex items-center gap-1 mt-auto">
                  <MapPin className="w-2.5 h-2.5" />
                  {event.room}
                </span>
              )}
            </>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
