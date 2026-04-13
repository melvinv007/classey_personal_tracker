"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
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
            "bg-white/6 border border-white/10 text-foreground interactive-surface interactive-focus",
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
  const [hours, minutes = "00"] = (value || "00:00").split(":");

  const updateHour = (nextHour: string): void => {
    const hh = nextHour.padStart(2, "0");
    onChange(`${hh}:${minutes}`);
  };

  const updateMinute = (nextMinute: string): void => {
    const mm = nextMinute.padStart(2, "0");
    onChange(`${hours.padStart(2, "0")}:${mm}`);
  };

  const hourOptions = Array.from({ length: 24 }, (_, idx) => ({
    value: String(idx).padStart(2, "0"),
    label: String(idx).padStart(2, "0"),
  }));
  const minuteOptions = Array.from({ length: 60 }, (_, idx) => ({
    value: String(idx).padStart(2, "0"),
    label: String(idx).padStart(2, "0"),
  }));

  return (
    <div
      className={cn(
        "w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-xl",
        "bg-white/6 border border-white/10 text-foreground interactive-surface interactive-focus",
        "focus-within:ring-2 focus-within:ring-[rgba(var(--accent),0.5)]",
        className
      )}
    >
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full">
        <Select.Root value={hours.padStart(2, "0")} onValueChange={updateHour}>
          <Select.Trigger className="inline-flex items-center justify-between rounded-lg border border-white/10 bg-white/6 px-2 py-1.5 text-sm text-foreground">
            <Select.Value />
            <Select.Icon>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={8}
              className="z-[320] max-h-64 overflow-hidden rounded-xl border border-white/12 bg-[var(--glass-bg-elevated)] backdrop-blur-2xl"
            >
              <Select.ScrollUpButton className="flex h-6 items-center justify-center bg-white/6 text-muted-foreground">
                <ChevronUp className="h-3.5 w-3.5" />
              </Select.ScrollUpButton>
              <Select.Viewport className="p-1">
                {hourOptions.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm text-foreground/90 cursor-pointer outline-none",
                      "data-[highlighted]:bg-[rgba(var(--accent),0.15)] data-[highlighted]:text-foreground"
                    )}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        <span className="text-muted-foreground text-sm">:</span>

        <Select.Root value={minutes.padStart(2, "0")} onValueChange={updateMinute}>
          <Select.Trigger className="inline-flex items-center justify-between rounded-lg border border-white/10 bg-white/6 px-2 py-1.5 text-sm text-foreground">
            <Select.Value />
            <Select.Icon>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={8}
              className="z-[320] max-h-64 overflow-hidden rounded-xl border border-white/12 bg-[var(--glass-bg-elevated)] backdrop-blur-2xl"
            >
              <Select.ScrollUpButton className="flex h-6 items-center justify-center bg-white/6 text-muted-foreground">
                <ChevronUp className="h-3.5 w-3.5" />
              </Select.ScrollUpButton>
              <Select.Viewport className="p-1">
                {minuteOptions.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm text-foreground/90 cursor-pointer outline-none",
                      "data-[highlighted]:bg-[rgba(var(--accent),0.15)] data-[highlighted]:text-foreground"
                    )}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
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

