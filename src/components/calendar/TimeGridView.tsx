"use client";

import { DAY_SHORT_NAMES, cn } from "@/lib/utils";
import {
  addMinutes,
  differenceInMinutes,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarGridEvent } from "./types";

const TIME_GUTTER_WIDTH = 56;
const HOURS_IN_DAY = 24;
const SLOT_MINUTES = 30;

interface TimeGridSegment {
  event: CalendarGridEvent;
  startMinutes: number;
  endMinutes: number;
  column: number;
  columns: number;
}

interface TimeGridViewProps {
  days: Date[];
  events: CalendarGridEvent[];
  hourRowHeight: number;
  columnMinWidth: number;
  showWeekendDim: boolean;
  showNowLineMode: "week" | "day";
  onSelectEvent?: (event: CalendarGridEvent, anchorRect: DOMRect) => void;
  onSelectEmptyCell?: (dateTime: Date) => void;
}

function toMinuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isAllDayEvent(event: CalendarGridEvent): boolean {
  if (event.isAllDay) return true;
  const duration = Math.abs(differenceInMinutes(event.end, event.start));
  return duration >= 1439;
}

function buildSegmentsForDay(
  day: Date,
  timedEvents: CalendarGridEvent[],
): TimeGridSegment[] {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const baseSegments: TimeGridSegment[] = timedEvents
    .map((event) => {
      const start =
        event.start > dayStart ? event.start : new Date(dayStart.getTime());
      const end = event.end < dayEnd ? event.end : new Date(dayEnd.getTime());
      const startMinutes = Math.max(0, differenceInMinutes(start, dayStart));
      const endMinutes = Math.min(
        HOURS_IN_DAY * 60,
        Math.max(startMinutes + 1, differenceInMinutes(end, dayStart)),
      );

      return {
        event,
        startMinutes,
        endMinutes,
        column: 0,
        columns: 1,
      };
    })
    .filter((segment) => segment.endMinutes > segment.startMinutes)
    .sort(
      (a, b) =>
        a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes,
    );

  if (baseSegments.length === 0) return [];

  const clusters: TimeGridSegment[][] = [];
  let currentCluster: TimeGridSegment[] = [];
  let currentClusterEnd = -1;

  baseSegments.forEach((segment) => {
    if (
      currentCluster.length === 0 ||
      segment.startMinutes < currentClusterEnd
    ) {
      currentCluster.push(segment);
      currentClusterEnd = Math.max(currentClusterEnd, segment.endMinutes);
      return;
    }

    clusters.push(currentCluster);
    currentCluster = [segment];
    currentClusterEnd = segment.endMinutes;
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  return clusters.flatMap((cluster) => {
    const active: TimeGridSegment[] = [];
    let clusterColumns = 1;

    cluster.forEach((segment) => {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        if (active[i].endMinutes <= segment.startMinutes) {
          active.splice(i, 1);
        }
      }

      const used = new Set(active.map((entry) => entry.column));
      let nextColumn = 0;
      while (used.has(nextColumn)) {
        nextColumn += 1;
      }
      segment.column = nextColumn;
      active.push(segment);
      clusterColumns = Math.max(clusterColumns, nextColumn + 1);
    });

    cluster.forEach((segment) => {
      segment.columns = clusterColumns;
    });

    return cluster;
  });
}

export function TimeGridView({
  days,
  events,
  hourRowHeight,
  columnMinWidth,
  showWeekendDim,
  showNowLineMode,
  onSelectEvent,
  onSelectEmptyCell,
}: TimeGridViewProps): React.ReactNode {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  const allDayEventsByDay = useMemo(() => {
    const allDayEvents = events.filter((event) => isAllDayEvent(event));
    return days.map((day) =>
      allDayEvents.filter(
        (event) => event.start <= endOfDay(day) && event.end >= startOfDay(day),
      ),
    );
  }, [days, events]);

  const timedEventsByDay = useMemo(() => {
    const timedEvents = events.filter((event) => !isAllDayEvent(event));
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayEvents = timedEvents.filter(
        (event) => event.start < dayEnd && event.end > dayStart,
      );
      return buildSegmentsForDay(day, dayEvents);
    });
  }, [days, events]);

  const hasAllDayEvents = allDayEventsByDay.some((items) => items.length > 0);
  const totalGridHeight = HOURS_IN_DAY * hourRowHeight;
  const gridTemplateColumns = `${TIME_GUTTER_WIDTH}px repeat(${days.length}, minmax(${columnMinWidth}px, 1fr))`;
  const minGridWidth = TIME_GUTTER_WIDTH + days.length * columnMinWidth;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const minutes = toMinuteOfDay(new Date());
    const target = (minutes / 60) * hourRowHeight;
    container.scrollTop = Math.max(0, target - container.clientHeight * 0.35);
  }, [hourRowHeight, days]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const nowMinutes = toMinuteOfDay(now);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{ minWidth: minGridWidth }}
        >
          {/* Scrollable time grid — header is sticky INSIDE so columns share scrollbar space */}
          <div
            ref={scrollRef}
            className="relative max-h-[72vh] overflow-y-auto calendar-grid-scroll"
          >
            {/* Sticky day header */}
            <div
              className="sticky top-0 z-30 grid border-b border-white/10 bg-black/80 backdrop-blur-md"
              style={{ gridTemplateColumns }}
            >
              <div className="sticky left-0 z-20 border-r border-white/10 bg-black/90" />
              {days.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isSingleDay = days.length === 1;
                return (
                  <div
                    key={day.toISOString()}
                    className="flex items-center justify-center border-l border-white/8 py-3"
                  >
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {isSingleDay
                          ? format(day, "EEEE, MMM d")
                          : DAY_SHORT_NAMES[day.getDay() === 0 ? 7 : day.getDay()]}
                      </p>
                      <div
                        className={cn(
                          "mt-1 inline-flex h-7 items-center justify-center rounded-full px-2 text-sm font-semibold transition-colors duration-150",
                          isToday
                            ? "bg-[rgb(var(--accent))] text-white"
                            : "text-muted-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All-day row (hidden if empty) — also sticky below header */}
            {hasAllDayEvents && (
              <div
                className="sticky top-[62px] z-20 grid border-b border-white/10 bg-black/70 backdrop-blur-md"
                style={{ gridTemplateColumns }}
              >
                <div className="sticky left-0 z-20 border-r border-white/10 bg-black/90 px-2 py-2 text-[11px] text-muted-foreground text-right">
                  All day
                </div>
                {days.map((day, dayIndex) => (
                  <div
                    key={`all-day-${day.toISOString()}`}
                    className="min-h-12 border-l border-white/8 px-1.5 py-1.5"
                  >
                    <div className="space-y-1">
                      {allDayEventsByDay[dayIndex].map((event) => {
                        const baseColor = event.color || "rgb(var(--accent))";
                        return (
                          <button
                            key={`${event.id}-all-day`}
                            type="button"
                            onClick={(e) =>
                              onSelectEvent?.(
                                event,
                                (e.currentTarget as HTMLButtonElement).getBoundingClientRect(),
                              )
                            }
                            className="w-full truncate rounded-md border-l-[3px] px-2 py-1 text-left text-[11px] font-medium transition-all duration-150 hover:brightness-110"
                            style={{
                              borderLeftColor: baseColor,
                              backgroundColor: `color-mix(in srgb, ${baseColor} 22%, transparent)`,
                              color: "rgb(var(--foreground))",
                            }}
                          >
                            {event.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="relative" style={{ height: totalGridHeight }}>
              {/* Full-width hour lines */}
              {Array.from({ length: HOURS_IN_DAY + 1 }).map((_, hour) => (
                <div
                  key={`hour-line-${hour}`}
                  className="absolute left-0 right-0 border-t border-white/10"
                  style={{ top: hour * hourRowHeight }}
                />
              ))}

              {/* Half-hour short ticks */}
              {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
                <div
                  key={`half-tick-${hour}`}
                  className="absolute border-t border-white/15"
                  style={{
                    top: hour * hourRowHeight + hourRowHeight / 2,
                    left: TIME_GUTTER_WIDTH,
                    width: 12,
                  }}
                />
              ))}

              {/* Time gutter */}
              <div
                className="absolute inset-y-0 left-0 z-20 border-r border-white/8 bg-black/15"
                style={{ width: TIME_GUTTER_WIDTH }}
              >
                {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
                  <div
                    key={`label-${hour}`}
                    className="absolute right-2 text-[11px] text-muted-foreground/70"
                    style={{ top: hour * hourRowHeight + 2 }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div
                className="absolute inset-y-0 right-0"
                style={{
                  left: TIME_GUTTER_WIDTH,
                  display: "grid",
                  gridTemplateColumns: `repeat(${days.length}, minmax(${columnMinWidth}px, 1fr))`,
                }}
              >
                {days.map((day, dayIndex) => {
                  const isoDay = day.getDay() === 0 ? 7 : day.getDay();
                  const isToday = isSameDay(day, new Date());
                  const shouldShowNowLine =
                    (showNowLineMode === "week" && isToday) ||
                    showNowLineMode === "day";
                  const daySegments = timedEventsByDay[dayIndex];

                  return (
                    <div
                      key={`col-${day.toISOString()}`}
                      className={cn(
                        "relative border-l border-white/8",
                        isToday && "bg-white/[0.04]",
                        showWeekendDim &&
                          (isoDay === 6 || isoDay === 7) &&
                          "bg-white/[0.02]",
                      )}
                    >
                      {/* Empty interactive cells */}
                      {Array.from({
                        length: (HOURS_IN_DAY * 60) / SLOT_MINUTES,
                      }).map((_, slot) => {
                        const top = (slot * SLOT_MINUTES * hourRowHeight) / 60;
                        return (
                          <button
                            key={`slot-${slot}`}
                            type="button"
                            disabled={!onSelectEmptyCell}
                            title="Create event"
                            onClick={() =>
                              onSelectEmptyCell?.(
                                addMinutes(startOfDay(day), slot * SLOT_MINUTES),
                              )
                            }
                            className={cn(
                              "group absolute left-0 right-0 border-0 bg-transparent transition-colors duration-150",
                              onSelectEmptyCell &&
                                "cursor-pointer hover:bg-white/[0.05] focus-visible:bg-white/[0.06]",
                            )}
                            style={{
                              top,
                              height: (SLOT_MINUTES * hourRowHeight) / 60,
                            }}
                          >
                            {onSelectEmptyCell && (
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-80 group-focus-visible:opacity-80">
                                <Plus className="h-3.5 w-3.5 text-white/70" />
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Timed event blocks */}
                      {daySegments.map((segment) => {
                        const duration = segment.endMinutes - segment.startMinutes;
                        const isCompact = duration < 30;
                        const baseColor = segment.event.color || "rgb(var(--accent))";
                        const blockTop = (segment.startMinutes * hourRowHeight) / 60;
                        const blockHeight = Math.max(
                          (duration * hourRowHeight) / 60,
                          16,
                        );
                        const colWidth = 100 / segment.columns;
                        const left = segment.column * colWidth;

                        return (
                          <button
                            key={`${segment.event.id}-${dayIndex}-${segment.startMinutes}`}
                            type="button"
                            onClick={(e) =>
                              onSelectEvent?.(
                                segment.event,
                                (e.currentTarget as HTMLButtonElement).getBoundingClientRect(),
                              )
                            }
                            className="absolute z-10 rounded-[6px] border-0 px-2 py-1 text-left transition-all duration-150 hover:brightness-110"
                            style={{
                              top: blockTop,
                              height: blockHeight,
                              left: `calc(${left}% + ${segment.column === 0 ? 4 : 5}px)`,
                              width: `calc(${colWidth}% - ${segment.columns > 1 ? 6 : 8}px)`,
                              backgroundColor: `color-mix(in srgb, ${baseColor} 24%, transparent)`,
                              borderLeft: `3px solid ${baseColor}`,
                              color: "rgb(var(--foreground))",
                              cursor: "pointer",
                            }}
                          >
                            <p className="truncate text-[12px] font-semibold leading-tight">
                              {segment.event.title}
                            </p>
                            {!isCompact && (
                              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                                {format(segment.event.start, "HH:mm")} -{" "}
                                {format(segment.event.end, "HH:mm")}
                              </p>
                            )}
                          </button>
                        );
                      })}

                      {/* Current time indicator */}
                      {shouldShowNowLine && (
                        <div
                          className="absolute left-0 right-0 z-20"
                          style={{
                            top: (nowMinutes * hourRowHeight) / 60,
                            borderTop: "2.5px solid rgb(var(--accent))",
                            filter: "drop-shadow(0 0 6px rgba(var(--accent-rgb), 0.45))",
                          }}
                        >
                          <span
                            className="absolute -left-1 -top-[6px] h-2.5 w-2.5 rounded-full bg-[rgb(var(--accent))]"
                            style={{ boxShadow: "0 0 8px rgba(var(--accent-rgb), 0.5)" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

