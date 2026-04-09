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
  | "noise-grid"
  | "aurora"
  | "beams"
  | "animated-grid";

/**
 * Available font families
 */
export type FontFamily = "nunito" | "poppins" | "quicksand";

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
  aurora: "Aurora",
  beams: "Background Beams",
  "animated-grid": "Animated Grid",
};
