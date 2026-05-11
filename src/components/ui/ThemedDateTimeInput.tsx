"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { Calendar, ChevronDown, ChevronUp, Clock } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
import { addMonths, format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface ThemedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface ThemedTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface ThemedDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface TimeSpinSelectProps {
  value: number;
  min: number;
  max: number;
  options: Array<{ value: string; label: string }>;
  onChange: (value: number) => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, idx) => ({
  value: String(idx).padStart(2, "0"),
  label: String(idx).padStart(2, "0"),
}));

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, idx) => ({
  value: String(idx).padStart(2, "0"),
  label: String(idx).padStart(2, "0"),
}));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function wrapNumber(value: number, min: number, max: number): number {
  const range = max - min + 1;
  return ((((value - min) % range) + range) % range) + min;
}

function toTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function parseTimeParts(value: string): { hours: number; minutes: number } {
  const [hourPart = "00", minutePart = "00"] = (value || "00:00").split(":");
  const parsedHour = Number(hourPart);
  const parsedMinute = Number(minutePart);

  return {
    hours: Number.isFinite(parsedHour) ? clamp(Math.trunc(parsedHour), 0, 23) : 0,
    minutes: Number.isFinite(parsedMinute)
      ? clamp(Math.trunc(parsedMinute), 0, 59)
      : 0,
  };
}

function formatTime(hours: number, minutes: number): string {
  return `${toTwoDigits(hours)}:${toTwoDigits(minutes)}`;
}

function TimeSpinSelect({
  value,
  min,
  max,
  options,
  onChange,
}: TimeSpinSelectProps): React.ReactNode {
  const dragRef = React.useRef<{
    pointerId: number;
    startY: number;
    startValue: number;
  } | null>(null);
  const lastValueRef = React.useRef(value);

  React.useEffect(() => {
    lastValueRef.current = value;
  }, [value]);

  const commitDrag = React.useCallback(
    (clientY: number): void => {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = Math.trunc((drag.startY - clientY) / 10);
      const nextValue = wrapNumber(drag.startValue + delta, min, max);
      if (nextValue === lastValueRef.current) return;
      lastValueRef.current = nextValue;
      onChange(nextValue);
    },
    [max, min, onChange],
  );

  return (
    <Select.Root
      value={toTwoDigits(value)}
      onValueChange={(nextValue) => onChange(Number(nextValue))}
    >
      <Select.Trigger
        className={cn(
          "inline-flex min-h-10 items-center justify-between rounded-lg border border-white/10 bg-white/6 px-2 py-1.5 text-sm text-foreground",
          "outline-none transition-colors data-[state=open]:border-[rgba(var(--accent),0.45)]",
          "cursor-ns-resize touch-none select-none",
        )}
        onPointerDown={(event) => {
          dragRef.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startValue: value,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          if (dragRef.current.pointerId !== event.pointerId) return;
          commitDrag(event.clientY);
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
          }
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
          }
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onWheel={(event) => {
          event.preventDefault();
          const direction = event.deltaY < 0 ? 1 : -1;
          onChange(wrapNumber(value + direction, min, max));
        }}
      >
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
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm text-foreground/90 cursor-pointer outline-none",
                  "data-[highlighted]:bg-[rgba(var(--accent),0.15)] data-[highlighted]:text-foreground",
                )}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

export function ThemedDateInput({
  value,
  onChange,
  className,
}: ThemedDateInputProps): React.ReactNode {
  const selectedDate = React.useMemo(
    () => (value ? new Date(`${value}T00:00:00`) : undefined),
    [value],
  );
  const display = selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date";
  const [month, setMonth] = React.useState<Date>(() => selectedDate ?? new Date());
  const swipeStartXRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate);
    }
  }, [selectedDate]);

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
            className,
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
            "text-foreground",
          )}
        >
          <div
            className="touch-none"
            onPointerDown={(event) => {
              swipeStartXRef.current = event.clientX;
            }}
            onPointerUp={(event) => {
              const startX = swipeStartXRef.current;
              swipeStartXRef.current = null;
              if (startX === null) return;
              const deltaX = event.clientX - startX;
              if (deltaX > 56) {
                setMonth((prev) => subMonths(prev, 1));
              } else if (deltaX < -56) {
                setMonth((prev) => addMonths(prev, 1));
              }
            }}
            onPointerCancel={() => {
              swipeStartXRef.current = null;
            }}
          >
            <DayPicker
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                onChange(format(date, "yyyy-MM-dd"));
              }}
              className="rdp-themed"
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ThemedTimeInput({
  value,
  onChange,
  className,
}: ThemedTimeInputProps): React.ReactNode {
  const { hours, minutes } = React.useMemo(() => parseTimeParts(value), [value]);

  const updateHour = React.useCallback(
    (nextHour: number): void => {
      onChange(formatTime(nextHour, minutes));
    },
    [minutes, onChange],
  );

  const updateMinute = React.useCallback(
    (nextMinute: number): void => {
      onChange(formatTime(hours, nextMinute));
    },
    [hours, onChange],
  );

  return (
    <div
      className={cn(
        "w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-xl",
        "bg-white/6 border border-white/10 text-foreground interactive-surface interactive-focus",
        "focus-within:ring-2 focus-within:ring-[rgba(var(--accent),0.5)]",
        className,
      )}
    >
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TimeSpinSelect
          value={hours}
          min={0}
          max={23}
          options={HOUR_OPTIONS}
          onChange={updateHour}
        />
        <span className="text-muted-foreground text-sm">:</span>
        <TimeSpinSelect
          value={minutes}
          min={0}
          max={59}
          options={MINUTE_OPTIONS}
          onChange={updateMinute}
        />
      </div>
      <span className="sr-only">Drag up/down or scroll to adjust time</span>
    </div>
  );
}

export function ThemedDateTimeInput({
  value,
  onChange,
  className,
}: ThemedDateTimeInputProps): React.ReactNode {
  const [datePart, timePart] = value.split("T");
  const dateValue = datePart ?? "";
  const { hours, minutes } = parseTimeParts(timePart ?? "00:00");
  const timeValue = formatTime(hours, minutes);

  return (
    <div className={cn("grid grid-cols-[1fr_auto_1fr] gap-2", className)}>
      <ThemedDateInput
        value={dateValue}
        onChange={(nextDate) => onChange(`${nextDate}T${timeValue}`)}
      />
      <span className="self-center text-muted-foreground text-sm">at</span>
      <ThemedTimeInput
        value={timeValue}
        onChange={(nextTime) =>
          onChange(
            `${dateValue || format(new Date(), "yyyy-MM-dd")}T${nextTime}`,
          )
        }
      />
    </div>
  );
}

