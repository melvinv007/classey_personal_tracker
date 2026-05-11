import { useSyncExternalStore } from "react";

const CALENDAR_WEEKENDS_STORAGE_KEY = "classey:calendar:show-weekends";
const CALENDAR_WEEKENDS_CHANGE_EVENT = "classey:calendar:show-weekends:change";
const TIMETABLE_WEEKENDS_STORAGE_KEY = "classey:timetable:show-weekends";
const TIMETABLE_WEEKENDS_CHANGE_EVENT =
  "classey:timetable:show-weekends:change";

const CALENDAR_HOUR_HEIGHT_STORAGE_KEY = "classey:calendar:hour-row-height";
const CALENDAR_HOUR_HEIGHT_CHANGE_EVENT = "classey:calendar:hour-row-height:change";
const TIMETABLE_HOUR_HEIGHT_STORAGE_KEY = "classey:timetable:hour-row-height";
const TIMETABLE_HOUR_HEIGHT_CHANGE_EVENT =
  "classey:timetable:hour-row-height:change";

const CALENDAR_COLUMN_WIDTH_STORAGE_KEY = "classey:calendar:column-min-width";
const CALENDAR_COLUMN_WIDTH_CHANGE_EVENT =
  "classey:calendar:column-min-width:change";
const TIMETABLE_COLUMN_WIDTH_STORAGE_KEY = "classey:timetable:column-min-width";
const TIMETABLE_COLUMN_WIDTH_CHANGE_EVENT =
  "classey:timetable:column-min-width:change";

const DEFAULT_HOUR_ROW_HEIGHT = 100;
const DEFAULT_COLUMN_MIN_WIDTH = 140;

function createBooleanStore(storageKey: string, changeEvent: string) {
  const readSnapshot = (): boolean => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) === "1";
  };

  const subscribe = (onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      onStoreChange();
    };

    const handleCustomChange = () => {
      onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(changeEvent, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(changeEvent, handleCustomChange);
    };
  };

  const setValue = (value: boolean): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, value ? "1" : "0");
    window.dispatchEvent(new Event(changeEvent));
  };

  return { readSnapshot, subscribe, setValue };
}

function createNumberStore(
  storageKey: string,
  changeEvent: string,
  fallbackValue: number,
  min: number,
  max: number,
) {
  const clamp = (value: number): number => Math.min(max, Math.max(min, value));

  const readSnapshot = (): number => {
    if (typeof window === "undefined") return fallbackValue;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallbackValue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return fallbackValue;
    return clamp(parsed);
  };

  const subscribe = (onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      onStoreChange();
    };

    const handleCustomChange = () => {
      onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(changeEvent, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(changeEvent, handleCustomChange);
    };
  };

  const setValue = (value: number): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, String(clamp(value)));
    window.dispatchEvent(new Event(changeEvent));
  };

  return { readSnapshot, subscribe, setValue, clamp };
}

const calendarWeekendStore = createBooleanStore(
  CALENDAR_WEEKENDS_STORAGE_KEY,
  CALENDAR_WEEKENDS_CHANGE_EVENT,
);
const timetableWeekendStore = createBooleanStore(
  TIMETABLE_WEEKENDS_STORAGE_KEY,
  TIMETABLE_WEEKENDS_CHANGE_EVENT,
);
const calendarHourHeightStore = createNumberStore(
  CALENDAR_HOUR_HEIGHT_STORAGE_KEY,
  CALENDAR_HOUR_HEIGHT_CHANGE_EVENT,
  DEFAULT_HOUR_ROW_HEIGHT,
  72,
  140,
);
const timetableHourHeightStore = createNumberStore(
  TIMETABLE_HOUR_HEIGHT_STORAGE_KEY,
  TIMETABLE_HOUR_HEIGHT_CHANGE_EVENT,
  DEFAULT_HOUR_ROW_HEIGHT,
  72,
  140,
);
const calendarColumnWidthStore = createNumberStore(
  CALENDAR_COLUMN_WIDTH_STORAGE_KEY,
  CALENDAR_COLUMN_WIDTH_CHANGE_EVENT,
  DEFAULT_COLUMN_MIN_WIDTH,
  110,
  220,
);
const timetableColumnWidthStore = createNumberStore(
  TIMETABLE_COLUMN_WIDTH_STORAGE_KEY,
  TIMETABLE_COLUMN_WIDTH_CHANGE_EVENT,
  DEFAULT_COLUMN_MIN_WIDTH,
  110,
  220,
);

export function useCalendarWeekendsSetting(): boolean {
  return useSyncExternalStore(
    calendarWeekendStore.subscribe,
    calendarWeekendStore.readSnapshot,
    () => false,
  );
}

export function setCalendarWeekendsSetting(value: boolean): void {
  calendarWeekendStore.setValue(value);
}

export function useTimetableWeekendSetting(): boolean {
  return useSyncExternalStore(
    timetableWeekendStore.subscribe,
    timetableWeekendStore.readSnapshot,
    () => false,
  );
}

export function setTimetableWeekendSetting(value: boolean): void {
  timetableWeekendStore.setValue(value);
}

export function useCalendarHourRowHeightSetting(): number {
  return useSyncExternalStore(
    calendarHourHeightStore.subscribe,
    calendarHourHeightStore.readSnapshot,
    () => DEFAULT_HOUR_ROW_HEIGHT,
  );
}

export function setCalendarHourRowHeightSetting(value: number): void {
  calendarHourHeightStore.setValue(value);
}

export function useTimetableHourRowHeightSetting(): number {
  return useSyncExternalStore(
    timetableHourHeightStore.subscribe,
    timetableHourHeightStore.readSnapshot,
    () => DEFAULT_HOUR_ROW_HEIGHT,
  );
}

export function setTimetableHourRowHeightSetting(value: number): void {
  timetableHourHeightStore.setValue(value);
}

export function useCalendarColumnWidthSetting(): number {
  return useSyncExternalStore(
    calendarColumnWidthStore.subscribe,
    calendarColumnWidthStore.readSnapshot,
    () => DEFAULT_COLUMN_MIN_WIDTH,
  );
}

export function setCalendarColumnWidthSetting(value: number): void {
  calendarColumnWidthStore.setValue(value);
}

export function useTimetableColumnWidthSetting(): number {
  return useSyncExternalStore(
    timetableColumnWidthStore.subscribe,
    timetableColumnWidthStore.readSnapshot,
    () => DEFAULT_COLUMN_MIN_WIDTH,
  );
}

export function setTimetableColumnWidthSetting(value: number): void {
  timetableColumnWidthStore.setValue(value);
}

