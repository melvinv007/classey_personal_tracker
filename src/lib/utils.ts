import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx, handling conflicts properly.
 * Use this for ALL className compositions in the app.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Converts a hex color to RGB values.
 * Used for setting accent colors dynamically.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts hex color to CSS RGB values string for CSS variables.
 * Example: "#8b5cf6" -> "139 92 246"
 */
export function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "139 92 246"; // Default purple fallback
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

/**
 * Converts hex color to CSS rgb() comma format for rgba().
 * Example: "#8b5cf6" -> "139, 92, 246"
 */
export function hexToRgbComma(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "139, 92, 246"; // Default purple fallback
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * Generates CSS variables object for a semester accent color.
 * Apply this to a container element to theme all children.
 */
export function getAccentCssVars(hex: string): Record<string, string> {
  const rgbStr = hexToRgbString(hex);
  const rgbComma = hexToRgbComma(hex);
  
  // Calculate a slightly darker hover color
  const rgb = hexToRgb(hex);
  const hoverRgb = rgb
    ? `${Math.max(0, rgb.r - 15)} ${Math.max(0, rgb.g - 15)} ${Math.max(0, rgb.b - 15)}`
    : rgbStr;

  return {
    "--accent": rgbStr,
    "--accent-hover": hoverRgb,
    "--accent-muted": rgbStr,
    "--accent-subtle": rgbStr,
    "--accent-rgb": rgbComma,
  };
}

/**
 * Formats a number with commas for display.
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Day of week short names.
 * Keys are ISO day numbers (1=Monday, 7=Sunday).
 */
export const DAY_SHORT_NAMES: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

/**
 * Truncates a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Creates a delay promise for animations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if code is running on the client side.
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Checks if code is running on the server side.
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Normalizes a time string to HH:mm format.
 * Accepts HH:mm or HH:mm:ss.
 */
export function normalizeTimeHM(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return "00:00";
  const hours = String(Number(match[1])).padStart(2, "0");
  return `${hours}:${match[2]}`;
}

/**
 * Normalizes a time string to HH:mm:ss format.
 * Accepts HH:mm or HH:mm:ss.
 */
export function normalizeTimeHMS(time: string): string {
  const hm = normalizeTimeHM(time);
  return `${hm}:00`;
}
