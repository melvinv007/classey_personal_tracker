import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * All page/tab paths that can have independent scales.
 */
export const SCALE_PAGES = [
  "/",
  "/calendar",
  "/timetable",
  "/tasks",
  "/files",
  "/analytics/cgpa",
  "/minor",
  "/settings",
] as const;

export type ScalePage = (typeof SCALE_PAGES)[number];

export const SCALE_PAGE_LABELS: Record<ScalePage, string> = {
  "/": "Home",
  "/calendar": "Calendar",
  "/timetable": "Timetable",
  "/tasks": "Tasks",
  "/files": "Files",
  "/analytics/cgpa": "Analytics",
  "/minor": "Minor",
  "/settings": "Settings",
};

const DEFAULT_GLOBAL_SCALE = 100;

interface UIScaleState {
  /** Global fallback scale percentage */
  globalScale: number;
  /** Per-page overrides (only stored if different from global) */
  pageScales: Partial<Record<ScalePage, number>>;
}

interface UIScaleActions {
  /** Set the global scale */
  setGlobalScale: (value: number) => void;
  /** Set scale for a specific page */
  setPageScale: (page: ScalePage, value: number) => void;
  /** Clear a page override (fall back to global) */
  clearPageScale: (page: ScalePage) => void;
  /** Get the effective scale for a specific page */
  getEffectiveScale: (page: ScalePage) => number;
}

type UIScaleStore = UIScaleState & UIScaleActions;

function clampScale(value: number): number {
  return Math.max(50, Math.min(200, Math.round(value)));
}

/**
 * Per-page UI scale store.
 * Persisted to localStorage (device-specific).
 * Uses Zustand so all consumers re-render instantly on change.
 */
export const useUIScaleStore = create<UIScaleStore>()(
  persist(
    (set, get) => ({
      globalScale: DEFAULT_GLOBAL_SCALE,
      pageScales: {},

      setGlobalScale: (value) => set({ globalScale: clampScale(value) }),

      setPageScale: (page, value) =>
        set((state) => ({
          pageScales: { ...state.pageScales, [page]: clampScale(value) },
        })),

      clearPageScale: (page) =>
        set((state) => {
          const next = { ...state.pageScales };
          delete next[page];
          return { pageScales: next };
        }),

      getEffectiveScale: (page) => {
        const state = get();
        return state.pageScales[page] ?? state.globalScale;
      },
    }),
    {
      name: "classey-ui-scale",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        globalScale: state.globalScale,
        pageScales: state.pageScales,
      }),
    },
  ),
);
