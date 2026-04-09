"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, MoreHorizontal, Repeat } from "lucide-react";
import { format, isSameDay, isPast, isFuture, differenceInDays } from "date-fns";
import type { Event } from "@/types/database";
import { cn } from "@/lib/utils";

export interface EventCardProps {
  event: Event;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

const recurrenceLabels: Record<NonNullable<Event["recurrence"]>, string> = {
  none: "",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * EventCard - Displays personal event with time, location, and recurrence
 */
export function EventCard({
  event,
  onEdit,
  onDelete,
  onClick,
}: EventCardProps): React.ReactNode {
  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  const isAllDay = event.is_all_day;
  const isPastEvent = isPast(endDate);
  const isToday = isSameDay(startDate, new Date());
  const isSameDate = isSameDay(startDate, endDate);

  // Time until event
  const getTimeStatus = (): string => {
    if (isPastEvent) return "Ended";
    if (isToday) return "Today";
    const days = differenceInDays(startDate, new Date());
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `In ${days} days`;
    return format(startDate, "MMM d");
  };

  // Event color (use event color or default accent)
  const eventColor = event.color || "rgb(var(--accent))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-xl p-4 cursor-pointer transition-all duration-200",
        "bg-white/5 backdrop-blur-xl border border-white/10",
        "hover:bg-white/8 hover:border-white/15",
        isPastEvent && "opacity-60"
      )}
      style={{
        boxShadow: `0 0 20px ${eventColor}15, inset 0 0 30px ${eventColor}05`,
      }}
    >
      {/* Color indicator */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: eventColor }}
      />

      <div className="flex items-start justify-between gap-3 pl-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">{event.title}</h4>
            {event.recurrence && event.recurrence !== "none" && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Repeat className="w-3 h-3" />
                {recurrenceLabels[event.recurrence]}
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {event.description}
            </p>
          )}

          {/* Date and time */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {isAllDay ? (
                isSameDate ? (
                  format(startDate, "EEE, MMM d")
                ) : (
                  `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                )
              ) : (
                format(startDate, "EEE, MMM d")
              )}
            </span>

            {!isAllDay && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(startDate, "h:mm a")}
                {!isSameDate && ` - ${format(endDate, "h:mm a")}`}
                {isSameDate && ` - ${format(endDate, "h:mm a")}`}
              </span>
            )}

            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              isPastEvent ? "text-muted-foreground" : isToday ? "text-accent" : "text-foreground"
            )}
          >
            {getTimeStatus()}
          </span>
          {isAllDay && (
            <span className="text-[10px] text-muted-foreground bg-white/10 px-1.5 py-0.5 rounded">
              All day
            </span>
          )}
        </div>

        {/* More button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Context menu would open here
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
