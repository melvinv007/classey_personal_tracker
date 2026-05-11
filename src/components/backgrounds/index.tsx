"use client";

import { useThemeStore, type BackgroundStyle } from "@/stores/theme-store";
import { DottedBackground } from "./DottedBackground";
import { DotPatternBackground } from "./DotPatternBackground";
import { SpookySmokeBackground } from "./SpookySmokeBackground";
import { NoiseGridBackground } from "./NoiseGridBackground";
import { AnimatedGridBackground } from "./AnimatedGridBackground";
import { BoxesBackground } from "./BoxesBackground";
import { AuroraBackground } from "./AuroraBackground";
import { BeamsBackground } from "./BeamsBackground";
import { MeshGradientBackground } from "./MeshGradientBackground";
import { StarfieldBackground } from "./StarfieldBackground";
import { SpiralBloomBackground } from "./SpiralBloomBackground";
import { MeteorShowerBackground } from "./MeteorShowerBackground";

/**
 * Background component map
 */
const backgroundComponents: Record<BackgroundStyle, React.ComponentType> = {
  "spooky-smoke": SpookySmokeBackground,
  dotted: DottedBackground,
  boxes: BoxesBackground,
  "dot-pattern": DotPatternBackground,
  "noise-grid": NoiseGridBackground,
  aurora: AuroraBackground,
  beams: BeamsBackground,
  "animated-grid": AnimatedGridBackground,
  "mesh-gradient": MeshGradientBackground,
  starfield: StarfieldBackground,
  "spiral-bloom": SpiralBloomBackground,
  "meteor-shower": MeteorShowerBackground,
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
export { AuroraBackground } from "./AuroraBackground";
export { BeamsBackground } from "./BeamsBackground";
export { MeshGradientBackground } from "./MeshGradientBackground";
export { StarfieldBackground } from "./StarfieldBackground";
export { SpiralBloomBackground } from "./SpiralBloomBackground";
export { MeteorShowerBackground } from "./MeteorShowerBackground";
