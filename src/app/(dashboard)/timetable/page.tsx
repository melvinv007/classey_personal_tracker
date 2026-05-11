"use client";

import { TimeGridView } from "@/components/calendar/TimeGridView";
import type { CalendarGridEvent } from "@/components/calendar/types";
import { CreateEventModal } from "@/components/modals/CreateEventModal";
import {
  useTimetableColumnWidthSetting,
  useTimetableHourRowHeightSetting,
  useTimetableWeekendSetting,
} from "@/hooks/use-timetable-weekend-setting";
import { useData } from "@/hooks/use-data";
import { cn, normalizeTimeHM } from "@/lib/utils";
import {
  addDays,
  addMinutes,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function TimetablePage(): React.ReactNode {
  const router = useRouter();
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventDefaults, setEventDefaults] = useState<EventModalDefaults | undefined>(
    undefined,
  );
  const [selectedEvent, setSelectedEvent] = useState<{
    event: CalendarGridEvent;
    anchorRect: DOMRect;
  } | null>(null);

  const showWeekends = useTimetableWeekendSetting();
  const hourRowHeight = useTimetableHourRowHeightSetting();
  const columnMinWidth = useTimetableColumnWidthSetting();

  const { classSchedules, subjects, getSubjectById, activeSemester, isLoading } =
    useData();
  const activeSemesterId = activeSemester?.$id ?? null;

  const visibleDays = useMemo(() => {
    const weekStart = startOfWeek(focusDate, { weekStartsOn: 1 });
    const length = showWeekends ? 7 : 5;
    return Array.from({ length }, (_, index) => addDays(weekStart, index));
  }, [focusDate, showWeekends]);

  const timetableEvents = useMemo<CalendarGridEvent[]>(() => {
    if (!activeSemesterId) return [];

    return classSchedules
      .filter((schedule) => {
        if (schedule.deleted_at) return false;
        const subject = getSubjectById(schedule.subject_id);
        if (!subject || subject.deleted_at) return false;
        return subject.semester_id === activeSemesterId;
      })
      .flatMap((schedule) => {
        const subject = getSubjectById(schedule.subject_id);
        if (!subject) return [];

        return visibleDays
          .filter((day) => {
            const dayOfWeek = day.getDay() === 0 ? 7 : day.getDay();
            return dayOfWeek === schedule.day_of_week;
          })
          .map((day) => ({
            id: `${schedule.$id}-${format(day, "yyyy-MM-dd")}`,
            type: "class" as const,
            title: subject.short_name,
            start: new Date(`${format(day, "yyyy-MM-dd")}T${normalizeTimeHM(schedule.start_time)}:00`),
            end: new Date(`${format(day, "yyyy-MM-dd")}T${normalizeTimeHM(schedule.end_time)}:00`),
            color: subject.color,
            location: schedule.room ?? null,
            subjectId: subject.$id,
            semesterId: subject.semester_id,
          }));
      });
  }, [activeSemesterId, classSchedules, getSubjectById, visibleDays]);

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

  const focusToday = () => {
    setFocusDate(new Date());
  };

  const navigatePrevWeek = () => {
    setFocusDate((prev) => subDays(prev, 7));
  };

  const navigateNextWeek = () => {
    setFocusDate((prev) => addDays(prev, 7));
  };

  const openEventDetail = (event: CalendarGridEvent, anchorRect: DOMRect) => {
    setSelectedEvent({ event, anchorRect });
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 py-4 md:px-6">
      <header className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">Weekly Timetable</h1>
            <p className="text-sm text-muted-foreground">
              {activeSemester?.name ?? "No active semester"} •{" "}
              {format(visibleDays[0] ?? new Date(), "MMM d")} -{" "}
              {format(visibleDays[visibleDays.length - 1] ?? new Date(), "MMM d, yyyy")}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-sm text-foreground">
              Timetable
            </div>
            <button
              type="button"
              onClick={focusToday}
              className="rounded-xl border border-white/15 px-3 py-1.5 text-sm text-foreground transition-all duration-150 hover:bg-white/5"
            >
              Today
            </button>
            <button
              type="button"
              onClick={navigatePrevWeek}
              className="rounded-xl border border-white/15 p-2 transition-all duration-150 hover:bg-white/5"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={navigateNextWeek}
              className="rounded-xl border border-white/15 p-2 transition-all duration-150 hover:bg-white/5"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <TimeGridView
        days={visibleDays}
        events={timetableEvents}
        hourRowHeight={hourRowHeight}
        columnMinWidth={columnMinWidth}
        showWeekendDim={showWeekends}
        showNowLineMode="week"
        onSelectEvent={openEventDetail}
        onSelectEmptyCell={activeSemesterId ? openCreateEventAt : undefined}
      />

      {/* Subjects section (kept unchanged in structure) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
      >
        <h3 className="mb-3 text-sm font-medium text-white/70">Subjects</h3>
        <div className="flex flex-wrap gap-3">
          {subjects
            .filter(
              (subject) =>
                !subject.deleted_at &&
                !!activeSemesterId &&
                subject.semester_id === activeSemesterId,
            )
            .map((subject) => (
              <Link
                key={subject.$id}
                href={`/semester/${activeSemesterId}/subject/${subject.$id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors duration-150 hover:bg-white/10"
                style={{ backgroundColor: `color-mix(in srgb, ${subject.color} 22%, transparent)` }}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-sm">{subject.short_name}</span>
              </Link>
            ))}
        </div>
      </motion.div>

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
              onClick={() => setSelectedEvent(null)}
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
                  onClick={() => setSelectedEvent(null)}
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
              {selectedEvent.event.subjectId && (
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      `/semester/${selectedEvent.event.semesterId}/subject/${selectedEvent.event.subjectId}`,
                    );
                    setSelectedEvent(null);
                  }}
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-foreground transition-colors duration-150 hover:bg-white/10",
                  )}
                >
                  Open Subject
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!activeSemester && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          No active semester. Timetable is empty until a semester is active.
        </div>
      )}
    </div>
  );
}

