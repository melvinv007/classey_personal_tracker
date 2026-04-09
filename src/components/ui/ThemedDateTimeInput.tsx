"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { Calendar, Clock } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ThemedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ThemedDateInput({
  value,
  onChange,
  className,
}: ThemedDateInputProps): React.ReactNode {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined;
  const display = selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date";

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl",
            "bg-white/6 border border-white/10 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]",
            "transition-all",
            className
          )}
        >
          <span>{display}</span>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className={cn(
            "z-[300] rounded-2xl p-3 bg-[var(--glass-bg-elevated)] backdrop-blur-2xl border border-white/12 shadow-xl",
            "text-foreground"
          )}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
            }}
            className="rdp-themed"
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface ThemedTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ThemedTimeInput({
  value,
  onChange,
  className,
}: ThemedTimeInputProps): React.ReactNode {
  return (
    <div
      className={cn(
        "w-full inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
        "bg-white/6 border border-white/10 text-foreground",
        "focus-within:ring-2 focus-within:ring-[rgba(var(--accent),0.5)]",
        className
      )}
    >
      <Clock className="h-4 w-4 text-muted-foreground" />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-foreground focus:outline-none"
      />
    </div>
  );
}

interface ThemedDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ThemedDateTimeInput({
  value,
  onChange,
  className,
}: ThemedDateTimeInputProps): React.ReactNode {
  const [datePart, timePart] = value.split("T");
  const dateValue = datePart ?? "";
  const timeValue = timePart ?? "00:00";

  return (
    <div className={cn("grid grid-cols-[1fr_auto_1fr] gap-2", className)}>
      <ThemedDateInput
        value={dateValue}
        onChange={(nextDate) => onChange(`${nextDate}T${timeValue}`)}
      />
      <span className="self-center text-muted-foreground text-sm">at</span>
      <ThemedTimeInput
        value={timeValue}
        onChange={(nextTime) => onChange(`${dateValue || format(new Date(), "yyyy-MM-dd")}T${nextTime}`)}
      />
    </div>
  );
}

