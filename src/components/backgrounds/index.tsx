"use client";

import { useThemeStore, type BackgroundStyle } from "@/stores/theme-store";
import { DottedBackground } from "./DottedBackground";
import { DotPatternBackground } from "./DotPatternBackground";
import { SpookySmokeBackground } from "./SpookySmokeBackground";
import { NoiseGridBackground } from "./NoiseGridBackground";
import { AnimatedGridBackground } from "./AnimatedGridBackground";

/**
 * Background component map
 */
const backgroundComponents: Record<BackgroundStyle, React.ComponentType> = {
  "spooky-smoke": SpookySmokeBackground,
  dotted: DottedBackground,
  boxes: AnimatedGridBackground,
  "dot-pattern": DotPatternBackground,
  "noise-grid": NoiseGridBackground,
};

/**
 * DynamicBackground - Renders the selected background style.
 * Automatically syncs with theme store.
 */
export function DynamicBackground(): React.ReactNode {
  const background = useThemeStore((state) => state.background);
  const hydrated = useThemeStore((state) => state.hydrated);

  // Don't render until hydrated to prevent mismatch
  if (!hydrated) {
    return null;
  }

  const BackgroundComponent = backgroundComponents[background] ?? DottedBackground;

  return <BackgroundComponent />;
}

// Re-export individual backgrounds for direct use
export { SpookySmokeBackground } from "./SpookySmokeBackground";
export { DottedBackground } from "./DottedBackground";
export { BoxesBackground } from "./BoxesBackground";
export { AnimatedGridBackground } from "./AnimatedGridBackground";
export { DotPatternBackground } from "./DotPatternBackground";
export { NoiseGridBackground } from "./NoiseGridBackground";
