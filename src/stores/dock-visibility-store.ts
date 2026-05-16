import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** All navigation tab hrefs */
export const ALL_TABS = [
  "/",
  "/calendar",
  "/timetable",
  "/tasks",
  "/files",
  "/analytics/cgpa",
  "/minor",
  "/settings",
] as const;

export type TabHref = (typeof ALL_TABS)[number];

export const TAB_LABELS: Record<TabHref, string> = {
  "/": "Home",
  "/calendar": "Calendar",
  "/timetable": "Timetable",
  "/tasks": "Tasks",
  "/files": "Files",
  "/analytics/cgpa": "Analytics",
  "/minor": "Minor",
  "/settings": "Settings",
};

/** Tabs that can never be hidden */
const LOCKED_TABS = new Set<string>(["/", "/settings"]);

interface DockVisibilityState {
  /** Set of visible tab hrefs */
  visibleTabs: string[];
}

interface DockVisibilityActions {
  /** Toggle a tab's visibility */
  toggleTab: (href: string) => void;
  /** Check if a tab is visible */
  isTabVisible: (href: string) => boolean;
  /** Check if a tab is locked (always visible) */
  isTabLocked: (href: string) => boolean;
}

type DockVisibilityStore = DockVisibilityState & DockVisibilityActions;

/**
 * Dock tab visibility store.
 * Persisted to localStorage (device-specific).
 * Uses Zustand so Dock and Settings re-render instantly on change.
 */
export const useDockVisibilityStore = create<DockVisibilityStore>()(
  persist(
    (set, get) => ({
      visibleTabs: [...ALL_TABS],

      toggleTab: (href) => {
        if (LOCKED_TABS.has(href)) return;
        set((state) => {
          const current = new Set(state.visibleTabs);
          if (current.has(href)) {
            current.delete(href);
          } else {
            current.add(href);
          }
          // Always keep locked tabs
          for (const locked of LOCKED_TABS) current.add(locked);
          return { visibleTabs: Array.from(current) };
        });
      },

      isTabVisible: (href) => {
        return get().visibleTabs.includes(href);
      },

      isTabLocked: (href) => LOCKED_TABS.has(href),
    }),
    {
      name: "classey-dock-visibility",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        visibleTabs: state.visibleTabs,
      }),
    },
  ),
);
