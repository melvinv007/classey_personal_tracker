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

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): RgbColor {
  const value = hex.startsWith("#") ? hex.slice(1) : hex;
  const normalized = value.length === 6 ? value : "8B5CF6";
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsv({ r, g, b }: RgbColor): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number): RgbColor {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function ThemedColorPicker({ value, onChange, colors, className }: ThemedColorPickerProps): React.ReactNode {
  const initialHsv = React.useMemo(() => rgbToHsv(hexToRgb(value)), [value]);
  const [h, setH] = React.useState(initialHsv.h);
  const [s, setS] = React.useState(initialHsv.s);
  const [v, setV] = React.useState(initialHsv.v);
  const [hexInput, setHexInput] = React.useState(value.toUpperCase());
  const svRef = React.useRef<HTMLDivElement | null>(null);
  const hueRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const next = rgbToHsv(hexToRgb(value));
    setH(next.h);
    setS(next.s);
    setV(next.v);
    setHexInput(value.toUpperCase());
  }, [value]);

  const currentHex = React.useMemo(() => rgbToHex(hsvToRgb(h, s, v)).toUpperCase(), [h, s, v]);

  const applySvFromPointer = (clientX: number, clientY: number): void => {
    const node = svRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const nextS = clamp((clientX - rect.left) / rect.width, 0, 1);
    const nextV = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    setS(nextS);
    setV(nextV);
    const nextHex = rgbToHex(hsvToRgb(h, nextS, nextV)).toUpperCase();
    setHexInput(nextHex);
    onChange(nextHex);
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-foreground transition-colors hover:bg-white/10 interactive-surface interactive-focus",
            className
          )}
        >
          <span className="inline-block h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: value }} />
          <Palette className="h-4 w-4 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-[300] w-72 rounded-2xl border border-white/12 bg-[var(--glass-bg-elevated)] p-3 shadow-xl backdrop-blur-2xl"
        >
          <div className="mb-3 grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange(color)}
                className="relative h-8 w-8 rounded-lg border border-white/15 interactive-surface interactive-focus"
                style={{ backgroundColor: color }}
              >
                {value.toLowerCase() === color.toLowerCase() && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div
            ref={svRef}
            className="relative mb-3 h-36 w-full cursor-crosshair rounded-xl"
            style={{
              backgroundColor: `hsl(${h}, 100%, 50%)`,
              backgroundImage: "linear-gradient(to right, #fff, rgba(255,255,255,0)), linear-gradient(to top, #000, rgba(0,0,0,0))",
            }}
            onPointerDown={(event) => {
              (event.target as HTMLElement).setPointerCapture(event.pointerId);
              applySvFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return;
              applySvFromPointer(event.clientX, event.clientY);
            }}
          >
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow"
              style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
            />
          </div>

          <input
            ref={hueRef}
            type="range"
            min={0}
            max={360}
            value={h}
            onChange={(event) => {
              const nextH = Number(event.target.value);
              setH(nextH);
              const nextHex = rgbToHex(hsvToRgb(nextH, s, v)).toUpperCase();
              setHexInput(nextHex);
              onChange(nextHex);
            }}
            className="mb-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
          />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={hexInput}
              onChange={(event) => {
                const next = event.target.value.toUpperCase();
                setHexInput(next);
                const match = next.match(/^#?[0-9A-F]{6}$/);
                if (!match) return;
                const normalized = next.startsWith("#") ? next : `#${next}`;
                onChange(normalized);
              }}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.4)]"
              placeholder="#8B5CF6"
            />
            <div className="h-8 w-8 rounded-lg border border-white/15" style={{ backgroundColor: currentHex }} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

