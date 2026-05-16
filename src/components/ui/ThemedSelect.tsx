"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemedSelectOption {
  value: string;
  label: string;
}

export interface ThemedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function ThemedSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className,
  contentClassName,
  disabled,
}: ThemedSelectProps): React.ReactNode {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          "w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl",
          "bg-white/6 border border-white/10 text-foreground interactive-surface interactive-focus",
          "hover:border-white/20 hover:bg-white/8",
          "focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] focus:border-[rgba(var(--accent),0.3)]",
          "data-[state=open]:border-[rgba(var(--accent),0.4)] data-[state=open]:bg-white/8 data-[state=open]:ring-1 data-[state=open]:ring-[rgba(var(--accent),0.3)]",
          "transition-all duration-150 disabled:opacity-50",
          className
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-150 [[data-state=open]_&]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            "z-[300] min-w-[var(--radix-select-trigger-width)] max-w-[min(92vw,var(--radix-select-trigger-width))] overflow-hidden",
            "max-h-[min(360px,var(--radix-select-content-available-height))]",
            "rounded-2xl bg-[var(--glass-bg-elevated)] backdrop-blur-2xl border border-white/12 shadow-xl",
            contentClassName
          )}
        >
          <Select.ScrollUpButton className="flex h-6 items-center justify-center bg-white/6 text-muted-foreground">
            <ChevronUp className="h-4 w-4" />
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1.5 overflow-y-auto">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm",
                  "text-foreground/90 cursor-pointer select-none outline-none interactive-surface",
                  "data-[highlighted]:bg-[rgba(var(--accent),0.15)] data-[highlighted]:text-foreground"
                )}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-3">
                  <Check className="h-4 w-4 text-[rgb(var(--accent))]" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex h-6 items-center justify-center bg-white/6 text-muted-foreground">
            <ChevronDown className="h-4 w-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

