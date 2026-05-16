"use client";

import { MonthGridView } from "@/components/calendar/MonthGridView";
import { TimeGridView } from "@/components/calendar/TimeGridView";
import type { CalendarGridEvent } from "@/components/calendar/types";
import { CreateEventModal } from "@/components/modals/CreateEventModal";
import {
  useCalendarColumnWidthSetting,
  useCalendarHourRowHeightSetting,
  useCalendarWeekendsSetting,
} from "@/hooks/use-timetable-weekend-setting";
import { useData } from "@/hooks/use-data";
import { cn, normalizeTimeHM } from "@/lib/utils";
import {
  addDays,
  addMinutes,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CalendarViewMode = "week" | "day" | "month";

interface EventModalDefaults {
  title?: string;
  description?: string;
  location?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  is_all_day?: boolean;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  color?: string;
}

function isInRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
  return date >= rangeStart && date <= rangeEnd;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toDateString(day: Date): string {
  return format(day, "yyyy-MM-dd");
}

export default function CalendarPage(): React.ReactNode {
  const router = useRouter();
  const [view, setView] = useState<CalendarViewMode>("week");
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventDefaults, setEventDefaults] = useState<EventModalDefaults | undefined>(
    undefined,
  );
  const [selectedEvent, setSelectedEvent] = useState<{
    event: CalendarGridEvent;
    anchorRect: DOMRect;
  } | null>(null);

  const showWeekends = useCalendarWeekendsSetting();
  const hourRowHeight = useCalendarHourRowHeightSetting();
  const columnMinWidth = useCalendarColumnWidthSetting();

  const {
    classSchedules,
    classOccurrences,
    exams,
    tasks,
    events: personalEvents,
    getSubjectById,
    getHolidaysBySemester,
    activeSemester,
    isLoading,
  } = useData();

  const activeSemesterId = activeSemester?.$id ?? null;

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(focusDate, { weekStartsOn: 1 });
    const length = showWeekends ? 7 : 5;
    return Array.from({ length }, (_, index) => addDays(weekStart, index));
  }, [focusDate, showWeekends]);

  const visibleDays = useMemo(() => {
    if (view === "day") return [focusDate];
    if (view === "month") return [];
    return weekDays;
  }, [focusDate, view, weekDays]);

  const visibleRange = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
      const monthEnd = endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });
      return { start: monthStart, end: monthEnd };
    }
    return {
      start: startOfDay(visibleDays[0] ?? focusDate),
      end: endOfDay(visibleDays[visibleDays.length - 1] ?? focusDate),
    };
  }, [focusDate, view, visibleDays]);

  const calendarEvents = useMemo<CalendarGridEvent[]>(() => {
    if (!activeSemesterId) return [];

    const rangeStart = visibleRange.start;
    const rangeEnd = visibleRange.end;
    const holidayDates = new Set<string>();

    getHolidaysBySemester(activeSemesterId).forEach((holiday) => {
      const holidayStart = holiday.date;
      const holidayEnd = holiday.date_end ?? holiday.date;
      const holidayStartDate = new Date(`${holidayStart}T00:00:00`);
      const holidayEndDate = new Date(`${holidayEnd}T00:00:00`);
      if (holidayEndDate < rangeStart || holidayStartDate > rangeEnd) return;

      for (
        let cursor = new Date(holidayStartDate);
        cursor <= holidayEndDate;
        cursor = addDays(cursor, 1)
      ) {
        holidayDates.add(toDateString(cursor));
      }
    });

    const cancelledClassKeys = new Set(
      classOccurrences
        .filter((occurrence) => occurrence.status === "cancelled")
        .map(
          (occurrence) =>
            `${occurrence.subject_id}|${occurrence.date}|${normalizeTimeHM(occurrence.start_time)}|${normalizeTimeHM(occurrence.end_time)}`,
        ),
    );

    const result: CalendarGridEvent[] = [];

    classSchedules.forEach((schedule) => {
      if (schedule.deleted_at) return;
      const subject = getSubjectById(schedule.subject_id);
      if (!subject || subject.deleted_at) return;
      if (subject.semester_id !== activeSemesterId) return;

      const startTime = normalizeTimeHM(schedule.start_time);
      const endTime = normalizeTimeHM(schedule.end_time);

      for (
        let cursor = new Date(rangeStart);
        cursor <= rangeEnd;
        cursor = addDays(cursor, 1)
      ) {
        const date = toDateString(cursor);
        const dayOfWeek = cursor.getDay() === 0 ? 7 : cursor.getDay();
        if (dayOfWeek !== schedule.day_of_week) continue;
        if (schedule.effective_from > date) continue;
        if (schedule.effective_until && schedule.effective_until < date) continue;
        if (holidayDates.has(date)) continue;

        const classKey = `${subject.$id}|${date}|${startTime}|${endTime}`;
        if (cancelledClassKeys.has(classKey)) continue;

        result.push({
          id: `${schedule.$id}-${date}`,
          type: "class",
          title: subject.short_name,
          start: new Date(`${date}T${startTime}:00`),
          end: new Date(`${date}T${endTime}:00`),
          color: subject.color,
          location: schedule.room ?? null,
          subjectId: subject.$id,
          semesterId: subject.semester_id,
        });
      }
    });

    exams.forEach((exam) => {
      if (exam.deleted_at) return;
      const subject = getSubjectById(exam.subject_id);
      if (!subject || subject.deleted_at) return;
      if (subject.semester_id !== activeSemesterId) return;

      const startTime = exam.start_time ? normalizeTimeHM(exam.start_time) : "09:00";
      const startDate = new Date(`${exam.date}T${startTime}:00`);
      if (!isInRange(startDate, rangeStart, rangeEnd)) return;

      const endDate = addMinutes(startDate, exam.duration_minutes ?? 60);
      result.push({
        id: `exam-${exam.$id}`,
        type: "exam",
        title: exam.name,
        start: startDate,
        end: endDate,
        color: "rgb(var(--warning))",
        subjectId: subject.$id,
        semesterId: subject.semester_id,
      });
    });

    tasks.forEach((task) => {
      if (task.deleted_at || task.is_completed || !task.deadline) return;
      if (task.semester_id !== activeSemesterId) return;

      const deadline = new Date(task.deadline);
      if (!isInRange(deadline, rangeStart, rangeEnd)) return;

      const isMidnightDeadline =
        deadline.getHours() === 0 && deadline.getMinutes() === 0;
      result.push({
        id: `task-${task.$id}`,
        type: "task",
        title: task.title,
        start: deadline,
        end: isMidnightDeadline ? endOfDay(deadline) : addMinutes(deadline, 30),
        color: "rgb(var(--info))",
        isAllDay: isMidnightDeadline,
      });
    });

    personalEvents.forEach((event) => {
      if (event.deleted_at) return;
      if (event.semester_id && event.semester_id !== activeSemesterId) return;

      const start = new Date(event.start_datetime);
      const end = new Date(event.end_datetime);
      if (end < rangeStart || start > rangeEnd) return;

      result.push({
        id: `event-${event.$id}`,
        type: "event",
        title: event.title,
        start,
        end,
        color: event.color || "rgb(var(--accent))",
        isAllDay: event.is_all_day,
        description: event.description,
        location: event.location,
        semesterId: event.semester_id,
      });
    });

    return result;
  }, [
    activeSemesterId,
    classOccurrences,
    classSchedules,
    exams,
    getHolidaysBySemester,
    getSubjectById,
    personalEvents,
    tasks,
    visibleRange.end,
    visibleRange.start,
  ]);

  const label = useMemo(() => {
    if (view === "month") return format(focusDate, "MMMM yyyy");
    if (view === "day") return format(focusDate, "EEEE, MMM d");
    const weekStart = visibleDays[0] ?? focusDate;
    const weekEnd = visibleDays[visibleDays.length - 1] ?? focusDate;
    return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
  }, [focusDate, view, visibleDays]);

  const navigateToday = () => {
    setFocusDate(new Date());
  };

  const navigatePrev = () => {
    if (view === "month") {
      setFocusDate((prev) => subMonths(prev, 1));
      return;
    }
    if (view === "day") {
      setFocusDate((prev) => subDays(prev, 1));
      return;
    }
    setFocusDate((prev) => subDays(prev, 7));
  };

  const navigateNext = () => {
    if (view === "month") {
      setFocusDate((prev) => addMonths(prev, 1));
      return;
    }
    if (view === "day") {
      setFocusDate((prev) => addDays(prev, 1));
      return;
    }
    setFocusDate((prev) => addDays(prev, 7));
  };

  const openCreateEventAt = (dateTime: Date) => {
    const startDate = format(dateTime, "yyyy-MM-dd");
    const startTime = format(dateTime, "HH:mm");
    const endDateTime = addMinutes(dateTime, 60);
    setEventDefaults({
      start_date: startDate,
      start_time: startTime,
      end_date: format(endDateTime, "yyyy-MM-dd"),
      end_time: format(endDateTime, "HH:mm"),
      recurrence: "none",
      is_all_day: false,
    });
    setIsCreateEventOpen(true);
  };

  const openDayFromMonth = (day: Date) => {
    setFocusDate(day);
    setView("day");
  };

  const openEventDetail = (event: CalendarGridEvent, anchorRect: DOMRect) => {
    setSelectedEvent({ event, anchorRect });
  };

  const closeEventDetail = () => {
    setSelectedEvent(null);
  };

  const openRelatedPage = () => {
    if (!selectedEvent) return;
    const { event } = selectedEvent;
    if ((event.type === "class" || event.type === "exam") && event.subjectId) {
      router.push(`/semester/${event.semesterId}/subject/${event.subjectId}`);
      closeEventDetail();
      return;
    }
    if (event.type === "task") {
      router.push("/tasks");
      closeEventDetail();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  const popoverStyle =
    selectedEvent && typeof window !== "undefined"
      ? {
          top: clamp(
            selectedEvent.anchorRect.bottom + 8,
            72,
            window.innerHeight - 250,
          ),
          left: clamp(
            selectedEvent.anchorRect.left,
            16,
            window.innerWidth - 340,
          ),
        }
      : undefined;

  return (
    <div className="page-fluid min-h-screen">
      <header className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">Calendar</h1>
            <p className="text-sm text-muted-foreground">
              {activeSemester?.name ?? "No active semester"} • {label}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={navigateToday}
              className="rounded-xl border border-white/15 px-3 py-1.5 text-sm text-foreground transition-all duration-150 hover:bg-white/5"
            >
              Today
            </button>
            <button
              type="button"
              onClick={navigatePrev}
              className="rounded-xl border border-white/15 p-2 transition-all duration-150 hover:bg-white/5"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={navigateNext}
              className="rounded-xl border border-white/15 p-2 transition-all duration-150 hover:bg-white/5"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 inline-flex rounded-full border border-white/12 bg-white/5 p-1">
          {(["week", "day", "month"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                view === item
                  ? "bg-[rgb(var(--accent))] text-white shadow-[0_0_20px_rgba(var(--accent),0.2)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <motion.main
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {view === "month" ? (
          <MonthGridView
            monthDate={focusDate}
            events={calendarEvents.filter((e) => e.type !== "class")}
            onSelectDay={openDayFromMonth}
            onSelectEvent={openEventDetail}
          />
        ) : (
          <TimeGridView
            days={visibleDays}
            events={calendarEvents}
            hourRowHeight={hourRowHeight}
            columnMinWidth={columnMinWidth}
            showWeekendDim={view === "week" && showWeekends}
            showNowLineMode={view === "day" ? "day" : "week"}
            onSelectEvent={openEventDetail}
            onSelectEmptyCell={activeSemesterId ? openCreateEventAt : undefined}
          />
        )}
      </motion.main>

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => {
          setIsCreateEventOpen(false);
          setEventDefaults(undefined);
        }}
        semesterId={activeSemesterId ?? undefined}
        defaultValues={eventDefaults}
      />

      <AnimatePresence>
        {selectedEvent && popoverStyle && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/20"
              onClick={closeEventDetail}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed z-50 w-[320px] rounded-2xl border border-white/12 bg-black/75 p-4 backdrop-blur-xl"
              style={popoverStyle}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {selectedEvent.event.type}
                  </p>
                  <h3 className="text-sm font-semibold text-foreground">
                    {selectedEvent.event.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeEventDetail}
                  className="rounded-lg p-1 text-muted-foreground transition-colors duration-150 hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {format(selectedEvent.event.start, "EEE, MMM d • HH:mm")} -{" "}
                {format(selectedEvent.event.end, "HH:mm")}
              </p>
              {selectedEvent.event.location && (
                <p className="mt-2 text-xs text-foreground/90">
                  {selectedEvent.event.location}
                </p>
              )}
              {selectedEvent.event.description && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedEvent.event.description}
                </p>
              )}
              {(selectedEvent.event.type === "class" ||
                selectedEvent.event.type === "exam" ||
                selectedEvent.event.type === "task") && (
                <button
                  type="button"
                  onClick={openRelatedPage}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-foreground transition-colors duration-150 hover:bg-white/10"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!activeSemester && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          No active semester. Create or activate a semester to see scheduled classes.
          <Link href="/" className="ml-2 text-[rgb(var(--accent))] underline">
            Go to Home
          </Link>
        </div>
      )}
    </div>
  );
}

