"use client";

import { useData } from "@/hooks/use-data";
import { cn, normalizeTimeHMS } from "@/lib/utils";
import type {
  DatesSetArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { addDays, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import "./calendar.css";

// Exam type colors
const EXAM_COLORS = {
  quiz: "#8B5CF6",
  assignment: "#10B981",
  midterm: "#F59E0B",
  final: "#EF4444",
  practical: "#06B6D4",
  other: "#6B7280",
};

/**
 * Weekly Calendar page using FullCalendar
 */
export default function CalendarPage(): React.ReactNode {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const nowDate = useMemo(() => new Date(), []);
  const nowTime = useMemo(() => nowDate.toTimeString().slice(0, 8), [nowDate]);
  const [currentDate, setCurrentDate] = useState<Date | null>(nowDate);
  const [view, setView] = useState<
    "timeGridWeek" | "timeGridDay" | "dayGridMonth"
  >("timeGridWeek");
  const [visibleRange, setVisibleRange] = useState(() => ({
    start: format(nowDate, "yyyy-MM-dd"),
    end: format(addDays(nowDate, 6), "yyyy-MM-dd"),
  }));

  const {
    classSchedules,
    classOccurrences,
    exams,
    events: personalEvents,
    subjects,
    getSubjectById,
    getHolidaysBySemester,
    ongoingSemester,
    isLoading,
  } = useData();
  const activeSemesterFilterId = ongoingSemester?.$id ?? null;

  // Helper to add minutes to a time string - wrapped in useCallback
  const addMinutesToTime = useCallback(
    (time: string, minutes: number): string => {
      const normalized = normalizeTimeHMS(time);
      const [h, m] = normalized.split(":").map(Number);
      const totalMinutes = h * 60 + m + minutes;
      const newH = Math.floor(totalMinutes / 60) % 24;
      const newM = totalMinutes % 60;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}:00`;
    },
    [],
  );

  // Generate calendar events from schedules, exams, and events
  const calendarEvents = useMemo((): EventInput[] => {
    const result: EventInput[] = [];
    if (!activeSemesterFilterId) {
      return result;
    }

    const rangeStart = parseISO(visibleRange.start);
    const rangeEnd = parseISO(visibleRange.end);
    const holidayDates = new Set<string>();
    getHolidaysBySemester(activeSemesterFilterId).forEach((holiday) => {
      const holidayStart = holiday.date;
      const holidayEnd = holiday.date_end ?? holiday.date;
      if (holidayEnd < visibleRange.start || holidayStart > visibleRange.end) {
        return;
      }
      const loopStart =
        holidayStart > visibleRange.start ? holidayStart : visibleRange.start;
      const loopEnd =
        holidayEnd < visibleRange.end ? holidayEnd : visibleRange.end;
      const loopEndDate = parseISO(loopEnd);
      for (
        let cursor = parseISO(loopStart);
        cursor.getTime() <= loopEndDate.getTime();
        cursor = addDays(cursor, 1)
      ) {
        holidayDates.add(format(cursor, "yyyy-MM-dd"));
      }
    });
    const cancelledClassKeys = new Set(
      classOccurrences
        .filter((occurrence) => occurrence.status === "cancelled")
        .map(
          (occurrence) =>
            `${occurrence.subject_id}|${occurrence.date}|${normalizeTimeHMS(occurrence.start_time)}|${normalizeTimeHMS(occurrence.end_time)}`,
        ),
    );

    if (view !== "dayGridMonth") {
      classSchedules.forEach((schedule) => {
        if (schedule.deleted_at) return;
        const subject = getSubjectById(schedule.subject_id);
        if (!subject || subject.deleted_at) return;
        if (subject.semester_id !== activeSemesterFilterId) return;

        const startTime = normalizeTimeHMS(schedule.start_time);
        const endTime = normalizeTimeHMS(schedule.end_time);
        for (
          let cursor = new Date(rangeStart);
          cursor.getTime() <= rangeEnd.getTime();
          cursor = addDays(cursor, 1)
        ) {
          const date = format(cursor, "yyyy-MM-dd");
          const dayOfWeek = cursor.getDay() === 0 ? 7 : cursor.getDay();
          if (dayOfWeek !== schedule.day_of_week) continue;
          if (schedule.effective_from > date) continue;
          if (schedule.effective_until && schedule.effective_until < date)
            continue;
          if (holidayDates.has(date)) continue;
          const classKey = `${subject.$id}|${date}|${startTime}|${endTime}`;
          if (cancelledClassKeys.has(classKey)) continue;

          result.push({
            id: `${schedule.$id}-${date}`,
            title: subject.short_name,
            start: `${date}T${startTime}`,
            end: `${date}T${endTime}`,
            backgroundColor: `${subject.color}40`,
            borderColor: subject.color,
            textColor: subject.color,
            extendedProps: {
              subjectId: subject.$id,
              semesterId: subject.semester_id,
              subjectName: subject.name,
              room: schedule.room,
              type: "class",
            },
          });
        }
      });
    }

    // Add exams
    exams.forEach((exam) => {
      if (exam.deleted_at) return;
      const subject = getSubjectById(exam.subject_id);
      if (!subject) return;
      if (subject.semester_id !== activeSemesterFilterId) return;

      const examColor = EXAM_COLORS[exam.type] || EXAM_COLORS.other;
      const startDateTime = exam.start_time
        ? `${exam.date}T${normalizeTimeHMS(exam.start_time)}`
        : `${exam.date}T09:00:00`;
      const endDateTime =
        exam.start_time && exam.duration_minutes
          ? `${exam.date}T${addMinutesToTime(exam.start_time, exam.duration_minutes)}`
          : `${exam.date}T10:00:00`;

      result.push({
        id: `exam-${exam.$id}`,
        title: `📝 ${exam.name}`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: `${examColor}30`,
        borderColor: examColor,
        textColor: examColor,
        extendedProps: {
          examId: exam.$id,
          subjectId: subject.$id,
          semesterId: subject.semester_id,
          type: "exam",
          examType: exam.type,
        },
      });
    });

    // Add personal events
    personalEvents.forEach((event) => {
      if (event.deleted_at) return;
      if (event.semester_id && event.semester_id !== activeSemesterFilterId) {
        return;
      }

      result.push({
        id: `event-${event.$id}`,
        title: `🗓️ ${event.title}`,
        start: event.start_datetime,
        end: event.end_datetime,
        backgroundColor: event.color
          ? `${event.color}30`
          : "rgba(139,92,246,0.3)",
        borderColor: event.color || "#8B5CF6",
        textColor: event.color || "#8B5CF6",
        extendedProps: {
          eventId: event.$id,
          type: "event",
        },
      });
    });

    return result;
  }, [
    classSchedules,
    classOccurrences,
    exams,
    personalEvents,
    getSubjectById,
    activeSemesterFilterId,
    addMinutesToTime,
    visibleRange,
    view,
    getHolidaysBySemester,
  ]);

  const handleEventClick = (info: EventClickArg) => {
    const { extendedProps } = info.event;
    if (extendedProps.type === "class") {
      router.push(
        `/semester/${extendedProps.semesterId ?? ongoingSemester?.$id}/subject/${extendedProps.subjectId}`,
      );
    } else if (extendedProps.type === "exam") {
      router.push(
        `/semester/${extendedProps.semesterId ?? ongoingSemester?.$id}/subject/${extendedProps.subjectId}`,
      );
    } else if (extendedProps.type === "event") {
      // For personal events, show a toast with event details
      const event = personalEvents.find((e) => e.$id === extendedProps.eventId);
      if (event) {
        toast.info(
          `${event.title}${event.location ? ` • ${event.location}` : ""}${event.description ? `\n${event.description}` : ""}`,
          { duration: 5000 },
        );
      }
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentDate(arg.start);
    setVisibleRange({
      start: format(arg.start, "yyyy-MM-dd"),
      end: format(addDays(arg.end, -1), "yyyy-MM-dd"),
    });
  };

  const navigatePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const navigateNext = () => {
    calendarRef.current?.getApi().next();
  };

  const navigateToday = () => {
    calendarRef.current?.getApi().today();
  };

  const changeView = (newView: typeof view) => {
    setView(newView);
    calendarRef.current?.getApi().changeView(newView);
  };

  useEffect(() => {
    if (view === "dayGridMonth") return;
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.scrollToTime(new Date().toTimeString().slice(0, 8));
  }, [view]);

  useEffect(() => {
    if (view === "dayGridMonth") return;
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const timer = setTimeout(() => {
      api.scrollToTime(new Date().toTimeString().slice(0, 8));
    }, 50);
    return () => clearTimeout(timer);
  }, [calendarEvents, view]);

  // Loading state - AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl btn-muted-themed interactive-focus"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Calendar</h1>
                <p className="text-sm text-white/50">
                  {ongoingSemester?.name ?? "No active semester"}
                  {currentDate ? ` • ${format(currentDate, "MMMM yyyy")}` : ""}
                </p>
              </div>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={navigateToday}
                className="px-3 py-1.5 text-sm rounded-lg btn-muted-themed interactive-focus"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={navigatePrev}
                  className="p-1.5 rounded-lg btn-muted-themed interactive-focus"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={navigateNext}
                  className="p-1.5 rounded-lg btn-muted-themed interactive-focus"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* View toggles */}
          <div className="flex items-center gap-2 mt-3">
            {(["timeGridWeek", "timeGridDay", "dayGridMonth"] as const).map(
              (v) => (
                <button
                  key={v}
                  onClick={() => changeView(v)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg interactive-focus transition-colors",
                    view === v
                      ? "btn-themed text-[rgb(var(--accent))]"
                      : "btn-muted-themed text-muted-foreground",
                  )}
                >
                  {v === "timeGridWeek"
                    ? "Week"
                    : v === "timeGridDay"
                      ? "Day"
                      : "Month"}
                </button>
              ),
            )}
          </div>
        </div>
      </motion.header>

      {/* Calendar */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 overflow-hidden"
        >
          <div
            className={cn(
              view === "dayGridMonth"
                ? "classey-month-calendar"
                : "classey-time-calendar calendar-scroll-window",
            )}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={view}
              headerToolbar={false}
              events={calendarEvents}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              initialDate={nowDate}
              slotMinTime="06:00:00"
              slotMaxTime="23:55:00"
              slotDuration="01:00:00"
              slotLabelInterval="01:00:00"
              snapDuration="00:05:00"
              allDaySlot={false}
              weekends={true}
              firstDay={1}
              height={view === "dayGridMonth" ? "auto" : 1650}
              nowIndicator={true}
              scrollTimeReset={false}
              scrollTime={nowTime}
              eventDisplay="block"
              slotLabelFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              dayHeaderFormat={{
                weekday: "short",
                day: "numeric",
              }}
              eventContent={(arg) => {
                const { extendedProps } = arg.event;
                return (
                  <div className="p-1 overflow-hidden h-full">
                    <div className="font-medium text-xs truncate">
                      {arg.event.title}
                    </div>
                    {extendedProps.room && (
                      <div className="text-[10px] opacity-70 truncate">
                        {extendedProps.room}
                      </div>
                    )}
                    {extendedProps.type === "exam" && (
                      <div className="text-[10px] opacity-70 truncate capitalize">
                        {extendedProps.examType}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </motion.div>

        {/* Legend */}
        {ongoingSemester && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 glass-card rounded-2xl"
          >
            <h3 className="text-sm font-medium text-white/70 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-3">
              {subjects
                .filter(
                  (s) => !s.deleted_at && s.semester_id === ongoingSemester.$id,
                )
                .map((subject) => (
                  <Link
                    key={subject.$id}
                    href={`/semester/${ongoingSemester.$id}/subject/${subject.$id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg btn-muted-themed interactive-focus"
                    style={{ backgroundColor: `${subject.color}15` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-sm">{subject.short_name}</span>
                  </Link>
                ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
