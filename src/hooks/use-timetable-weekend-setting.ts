import { useSyncExternalStore } from "react";

const STORAGE_KEY = "classey:timetable:show-weekends";
const CHANGE_EVENT = "classey:timetable:show-weekends:change";

function readSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    onStoreChange();
  };

  const handleCustomChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, handleCustomChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, handleCustomChange);
  };
}

export function useTimetableWeekendSetting(): boolean {
  return useSyncExternalStore(subscribe, readSnapshot, () => false);
}

export function setTimetableWeekendSetting(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
