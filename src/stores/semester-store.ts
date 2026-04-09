"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SemesterState {
  activeSemesterId: string | null;
  setActiveSemesterId: (semesterId: string | null) => void;
}

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set) => ({
      activeSemesterId: null,
      setActiveSemesterId: (activeSemesterId) => set({ activeSemesterId }),
    }),
    {
      name: "classey-active-semester",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

