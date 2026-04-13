import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  | "noise-grid";

/**
 * Available font families
 */
export type FontFamily = "nunito" | "poppins" | "quicksand";
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
    }
  )
);

/**
 * Font family CSS value mapping
 */
export const fontFamilyMap: Record<FontFamily, string> = {
  nunito: '"Nunito", ui-sans-serif, system-ui, sans-serif',
  poppins: '"Poppins", ui-sans-serif, system-ui, sans-serif',
  quicksand: '"Quicksand", ui-sans-serif, system-ui, sans-serif',
};

/**
 * Background style display names
 */
export const backgroundDisplayNames: Record<BackgroundStyle, string> = {
  "spooky-smoke": "Spooky Smoke",
  dotted: "Dotted",
  boxes: "Animated Boxes",
  "dot-pattern": "Dot Pattern",
  "noise-grid": "Noise Grid",
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
  const token = value.trim().toLowerCase();
  if (token === "ui-style:classic-glass") return "classic-glass";
  if (token === "ui-style:organic-glass") return "organic-glass";
  if (token === "ui-style:frosted-prism-glass") return "frosted-prism-glass";
  if (token === "ui-style:liquid-glass") return "liquid-glass";
  if (token === "ui-style:layered-pane-glass") return "layered-pane-glass";
  if (token === "ui-style:iridescent-glass") return "iridescent-glass";
  if (token === "ui-style:smoked-matte-glass") return "smoked-matte-glass";
  return null;
}

/**
 * Serialize UI style token for settings.background_custom_css.
 */
export function toUIStyleToken(uiStyle: UIStyle): string {
  return `ui-style:${uiStyle}`;
}
