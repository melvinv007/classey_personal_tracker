"use client";

import { useEffect } from "react";
import {
  useThemeStore,
  fontFamilyMap,
  type ThemeMode,
  type FontFamily,
} from "@/stores/theme-store";
import { hexToRgbString, hexToRgbComma } from "@/lib/utils";

/**
 * Props for ThemeProvider component
 */
interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Hook that works like useLayoutEffect on client, useEffect on server.
 * Prevents SSR warnings.
 */
const useIsomorphicLayoutEffect = useEffect;

/**
 * Applies theme variables to the document.
 * Updates CSS custom properties and class names.
 */
function applyTheme(
  mode: ThemeMode,
  accentColor: string,
  fontFamily: FontFamily
): void {
  const root = document.documentElement;
  const body = document.body;

  // Apply theme mode class
  root.classList.remove("dark", "light");
  root.classList.add(mode);
  root.setAttribute("data-theme", mode);

  // Apply accent color CSS variables
  const rgbStr = hexToRgbString(accentColor);
  const rgbComma = hexToRgbComma(accentColor);

  root.style.setProperty("--accent", rgbStr);
  root.style.setProperty("--accent-rgb", rgbComma);

  // Calculate hover color (slightly darker)
  const r = parseInt(accentColor.slice(1, 3), 16);
  const g = parseInt(accentColor.slice(3, 5), 16);
  const b = parseInt(accentColor.slice(5, 7), 16);
  const hoverRgb = `${Math.max(0, r - 15)} ${Math.max(0, g - 15)} ${Math.max(0, b - 15)}`;
  root.style.setProperty("--accent-hover", hoverRgb);

  // Apply font family
  body.style.fontFamily = fontFamilyMap[fontFamily];

  // Mark as hydrated (removes FOUC prevention)
  body.classList.add("hydrated");
}

/**
 * ThemeProvider component.
 * Handles theme synchronization between Zustand store and DOM.
 * Must wrap the entire app.
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.ReactNode {
  const { mode, accentColor, fontFamily, hydrated } = useThemeStore();

  // Apply theme on mount and when values change
  useIsomorphicLayoutEffect(() => {
    if (hydrated) {
      applyTheme(mode, accentColor, fontFamily);
    }
  }, [mode, accentColor, fontFamily, hydrated]);

  // Handle initial theme application before hydration
  useIsomorphicLayoutEffect(() => {
    // Set initial dark mode to prevent flash
    const root = document.documentElement;
    if (!root.classList.contains("dark") && !root.classList.contains("light")) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    }
  }, []);

  return <>{children}</>;
}

/**
 * Script to inject into head for preventing FOUC (Flash of Unstyled Content).
 * This runs before React hydration to set the initial theme.
 */
export const themeScript = `
(function() {
  try {
    const stored = localStorage.getItem('classey-theme');
    if (stored) {
      const { state } = JSON.parse(stored);
      const mode = state?.mode || 'dark';
      document.documentElement.classList.add(mode);
      document.documentElement.setAttribute('data-theme', mode);
      
      if (state?.accentColor) {
        const hex = state.accentColor;
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        document.documentElement.style.setProperty('--accent', r + ' ' + g + ' ' + b);
        document.documentElement.style.setProperty('--accent-rgb', r + ', ' + g + ', ' + b);
      }
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
