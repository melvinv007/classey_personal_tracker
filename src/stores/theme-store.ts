import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Theme mode options
 */
export type ThemeMode = "dark" | "light";

/**
 * Available background styles
 */
export type BackgroundStyle =
  | "spooky-smoke"
  | "dotted"
  | "boxes"
  | "dot-pattern"
  | "noise-grid"
  | "aurora"
  | "beams"
  | "animated-grid"
  | "mesh-gradient"
  | "starfield"
  | "spiral-bloom"
  | "meteor-shower";

/**
 * Available font families
 */
export type FontFamily =
  | "nunito"
  | "poppins"
  | "quicksand"
  | "inter"
  | "manrope"
  | "space-grotesk";
export type UIStyle =
  | "classic-glass"
  | "organic-glass"
  | "frosted-prism-glass"
  | "liquid-glass"
  | "layered-pane-glass"
  | "iridescent-glass"
  | "smoked-matte-glass";

/**
 * Theme store state interface
 */
interface ThemeState {
  /** Current theme mode (dark/light) */
  mode: ThemeMode;
  /** Current background style */
  background: BackgroundStyle;
  /** Current font family */
  fontFamily: FontFamily;
  /** Current accent color hex (default or semester-specific) */
  accentColor: string;
  /** Global UI style mode */
  uiStyle: UIStyle;
  /** Whether the store has been hydrated from localStorage */
  hydrated: boolean;
}

/**
 * Theme store actions interface
 */
interface ThemeActions {
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between dark and light mode */
  toggleMode: () => void;
  /** Set the background style */
  setBackground: (background: BackgroundStyle) => void;
  /** Set the font family */
  setFontFamily: (fontFamily: FontFamily) => void;
  /** Set the accent color (hex) */
  setAccentColor: (color: string) => void;
  /** Set global UI style */
  setUIStyle: (uiStyle: UIStyle) => void;
  /** Reset accent to default */
  resetAccentColor: () => void;
  /** Mark store as hydrated */
  setHydrated: (hydrated: boolean) => void;
}

type ThemeStore = ThemeState & ThemeActions;

/** Default accent color (purple) */
const DEFAULT_ACCENT_COLOR = "#8b5cf6";

/**
 * Theme store with persistence to localStorage.
 * Dark mode is the default.
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      // Initial state - Dark mode default
      mode: "dark",
      background: "spooky-smoke",
      fontFamily: "nunito",
      accentColor: DEFAULT_ACCENT_COLOR,
      uiStyle: "classic-glass",
      hydrated: false,

      // Actions
      setMode: (mode) => set({ mode }),

      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "dark" ? "light" : "dark",
        })),

      setBackground: (background) => set({ background }),

      setFontFamily: (fontFamily) => set({ fontFamily }),

      setAccentColor: (accentColor) => set({ accentColor }),
      setUIStyle: (uiStyle) => set({ uiStyle }),

      resetAccentColor: () => set({ accentColor: DEFAULT_ACCENT_COLOR }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "classey-theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        background: state.background,
        fontFamily: state.fontFamily,
        accentColor: state.accentColor,
        uiStyle: state.uiStyle,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/**
 * Font family CSS value mapping
 */
export const fontFamilyMap: Record<FontFamily, string> = {
  nunito: '"Nunito", ui-sans-serif, system-ui, sans-serif',
  poppins: '"Poppins", ui-sans-serif, system-ui, sans-serif',
  quicksand: '"Quicksand", ui-sans-serif, system-ui, sans-serif',
  inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  manrope: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  "space-grotesk": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
};

export function isFontFamily(value: unknown): value is FontFamily {
  return (
    value === "nunito" ||
    value === "poppins" ||
    value === "quicksand" ||
    value === "inter" ||
    value === "manrope" ||
    value === "space-grotesk"
  );
}

/**
 * Background style display names
 */
export const backgroundDisplayNames: Record<BackgroundStyle, string> = {
  "spooky-smoke": "Spooky Smoke (Dynamic)",
  dotted: "Dotted Grid",
  boxes: "Soft Boxes",
  "dot-pattern": "Dot Pattern",
  "noise-grid": "Noise Grid",
  aurora: "Aurora Flow (Dynamic)",
  beams: "Light Beams",
  "animated-grid": "Pulse Grid (Dynamic)",
  "mesh-gradient": "Mesh Gradient",
  starfield: "Starfield",
  "spiral-bloom": "Spiral Bloom (Dynamic)",
  "meteor-shower": "Meteor Shower (Dynamic)",
};

/**
 * Runtime guard for persisted/server background values.
 */
export function isBackgroundStyle(value: unknown): value is BackgroundStyle {
  return (
    value === "spooky-smoke" ||
    value === "dotted" ||
    value === "boxes" ||
    value === "dot-pattern" ||
    value === "noise-grid" ||
    value === "aurora" ||
    value === "beams" ||
    value === "animated-grid" ||
    value === "mesh-gradient" ||
    value === "starfield" ||
    value === "spiral-bloom" ||
    value === "meteor-shower"
  );
}

/**
 * Runtime guard for settings.background_style safe persisted values.
 */
export function isPersistedBackgroundStyle(
  value: unknown,
): value is "spooky-smoke" | "dotted" | "boxes" | "dot-pattern" | "noise-grid" {
  return (
    value === "spooky-smoke" ||
    value === "dotted" ||
    value === "boxes" ||
    value === "dot-pattern" ||
    value === "noise-grid"
  );
}

/**
 * Runtime guard for UI style values.
 */
export function isUIStyle(value: unknown): value is UIStyle {
  return (
    value === "classic-glass" ||
    value === "organic-glass" ||
    value === "frosted-prism-glass" ||
    value === "liquid-glass" ||
    value === "layered-pane-glass" ||
    value === "iridescent-glass" ||
    value === "smoked-matte-glass"
  );
}

/**
 * Parse UI style token from settings.background_custom_css.
 * Supported values:
 * - "ui-style:classic-glass"
 * - "ui-style:organic-glass"
 * - "ui-style:frosted-prism-glass"
 * - "ui-style:liquid-glass"
 * - "ui-style:layered-pane-glass"
 * - "ui-style:iridescent-glass"
 * - "ui-style:smoked-matte-glass"
 */
export function parseUIStyleToken(value: string | null): UIStyle | null {
  if (!value) return null;
  const tokens = value
    .toLowerCase()
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const uiToken = tokens.find((token) => token.startsWith("ui-style:"));
  if (!uiToken) return null;
  const candidate = uiToken.replace("ui-style:", "");
  if (isUIStyle(candidate)) return candidate;
  return null;
}

/**
 * Serialize UI style token for settings.background_custom_css.
 */
export function toUIStyleToken(uiStyle: UIStyle): string {
  return `ui-style:${uiStyle}`;
}

/**
 * Parse background style token from settings.background_custom_css.
 */
export function parseBackgroundStyleToken(
  value: string | null,
): BackgroundStyle | null {
  if (!value) return null;
  const tokens = value
    .toLowerCase()
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const backgroundToken = tokens.find((token) => token.startsWith("bg-style:"));
  if (!backgroundToken) return null;
  const candidate = backgroundToken.replace("bg-style:", "");
  if (isBackgroundStyle(candidate)) return candidate;
  return null;
}

/**
 * Serialize background style token for settings.background_custom_css.
 */
export function toBackgroundStyleToken(backgroundStyle: BackgroundStyle): string {
  return `bg-style:${backgroundStyle}`;
}
