"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemedColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  colors: string[];
  className?: string;
}

export function ThemedColorPicker({
  value,
  onChange,
  colors,
  className,
}: ThemedColorPickerProps): React.ReactNode {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/12 bg-white/6",
            "text-foreground hover:bg-white/10 transition-colors",
            className
          )}
        >
          <span className="inline-block w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: value }} />
          <Palette className="h-4 w-4 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-[300] rounded-2xl p-3 bg-[var(--glass-bg-elevated)] backdrop-blur-2xl border border-white/12 shadow-xl"
        >
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange(color)}
                className="relative w-8 h-8 rounded-lg border border-white/15"
                style={{ backgroundColor: color }}
              >
                {value === color && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

