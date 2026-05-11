"use client";

import { cn } from "@/lib/utils";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import type { CalendarGridEvent } from "./types";

interface MonthGridViewProps {
  monthDate: Date;
  events: CalendarGridEvent[];
  onSelectEvent?: (event: CalendarGridEvent, anchorRect: DOMRect) => void;
  onSelectDay?: (day: Date) => void;
}

export function MonthGridView({
  monthDate,
  events,
  onSelectEvent,
  onSelectDay,
}: MonthGridViewProps): React.ReactNode {
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);

  const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });

  const days = useMemo(() => {
    const items: Date[] = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      items.push(new Date(cursor));
    }
    return items;
  }, [start, end]);

  const eventsByDay = useMemo(() => {
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayKey = format(day, "yyyy-MM-dd");
      const dayEvents = events
        .filter(
          (event) =>
            format(event.start, "yyyy-MM-dd") <= dayKey &&
            format(event.end, "yyyy-MM-dd") >= dayKey,
        )
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      return { dayStart, dayEvents };
    });
  }, [days, events]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/10 bg-black/10 sticky top-0 z-10">
        {weekdayHeaders.map((name) => (
          <div
            key={name}
            className="px-2 py-2 text-center text-xs text-muted-foreground border-l border-white/8 first:border-l-0"
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthDate);
          const dayEvents = eventsByDay[index]?.dayEvents ?? [];
          const visibleEvents = dayEvents.slice(0, 3);
          const hiddenCount = Math.max(0, dayEvents.length - visibleEvents.length);

          return (
            <div
              key={dayKey}
              className={cn(
                "relative min-h-[120px] border-l border-t border-white/8 p-2 transition-colors duration-150 hover:bg-white/[0.05]",
                !isCurrentMonth && "opacity-40",
                isToday && "bg-white/[0.04] ring-1 ring-[rgba(var(--accent),0.45)]",
              )}
              onClick={() => onSelectDay?.(day)}
            >
              <div className="absolute right-2 top-2 text-xs font-medium text-muted-foreground">
                {format(day, "d")}
              </div>

              <div className="mt-5 space-y-1">
                {visibleEvents.map((event) => {
                  const baseColor = event.color || "rgb(var(--accent))";
                  return (
                    <button
                      key={`${event.id}-${dayKey}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent?.(
                          event,
                          (e.currentTarget as HTMLButtonElement).getBoundingClientRect(),
                        );
                      }}
                      className="w-full truncate rounded-md border-l-[3px] px-2 py-1 text-left text-[11px] font-medium transition-all duration-150 hover:brightness-110"
                      style={{
                        borderLeftColor: baseColor,
                        backgroundColor: `color-mix(in srgb, ${baseColor} 24%, transparent)`,
                        color: "rgb(var(--foreground))",
                      }}
                    >
                      {event.title}
                    </button>
                  );
                })}

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDayKey(expandedDayKey === dayKey ? null : dayKey);
                    }}
                    className="text-[11px] text-[rgb(var(--accent))] hover:underline"
                  >
                    +{hiddenCount} more
                  </button>
                )}
              </div>

              {expandedDayKey === dayKey && (
                <div
                  className="absolute left-2 right-2 top-8 z-20 rounded-xl border border-white/12 bg-black/80 p-2 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="mb-2 text-xs text-muted-foreground">
                    {format(day, "EEEE, MMM d")}
                  </p>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {dayEvents.map((event) => {
                      const baseColor = event.color || "rgb(var(--accent))";
                      return (
                        <button
                          key={`${event.id}-${dayKey}-expanded`}
                          type="button"
                          onClick={(e) => {
                            onSelectEvent?.(
                              event,
                              (e.currentTarget as HTMLButtonElement).getBoundingClientRect(),
                            );
                            setExpandedDayKey(null);
                          }}
                          className="w-full truncate rounded-md border-l-[3px] px-2 py-1 text-left text-[11px] font-medium transition-all duration-150 hover:brightness-110"
                          style={{
                            borderLeftColor: baseColor,
                            backgroundColor: `color-mix(in srgb, ${baseColor} 24%, transparent)`,
                            color: "rgb(var(--foreground))",
                          }}
                        >
                          {event.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

