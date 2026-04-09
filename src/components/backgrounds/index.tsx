"use client";

import { useThemeStore, type BackgroundStyle } from "@/stores/theme-store";
import { DottedBackground } from "./DottedBackground";
import { BoxesBackground } from "./BoxesBackground";
import { DotPatternBackground } from "./DotPatternBackground";
import { AuroraBackground } from "./AuroraBackground";
import { BeamsBackground } from "./BeamsBackground";
import { AnimatedGridBackground } from "./AnimatedGridBackground";

/**
 * Background component map
 */
const backgroundComponents: Record<BackgroundStyle, React.ComponentType> = {
  dotted: DottedBackground,
  boxes: BoxesBackground,
  "dot-pattern": DotPatternBackground,
  aurora: AuroraBackground,
  beams: BeamsBackground,
  "animated-grid": AnimatedGridBackground,
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
export { DottedBackground } from "./DottedBackground";
export { BoxesBackground } from "./BoxesBackground";
export { DotPatternBackground } from "./DotPatternBackground";
export { AuroraBackground } from "./AuroraBackground";
export { BeamsBackground } from "./BeamsBackground";
export { AnimatedGridBackground } from "./AnimatedGridBackground";
