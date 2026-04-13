"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * NoiseGridBackground - Animated noise texture with grid overlay.
 */
export function NoiseGridBackground(): React.ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastFrameTime = 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetFps = prefersReducedMotion ? 10 : 20;
    const frameInterval = 1000 / targetFps;

    const resize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const generateNoise = (): void => {
      if (!ctx) return;

      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        // Use accent color tint (purple-ish)
        data[i] = noise * 0.55; // R (139/255)
        data[i + 1] = noise * 0.36; // G (92/255)
        data[i + 2] = noise * 0.96; // B (246/255)
        data[i + 3] = 8; // Very low opacity
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const animate = (timestamp: number): void => {
      if (timestamp - lastFrameTime >= frameInterval) {
        lastFrameTime = timestamp;
        generateNoise();
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-hidden="true"
    >
      {/* Noise canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--accent-rgb), 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--accent-rgb), 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Pointer ripple sheen */}
      <div className="glass-ripple-overlay absolute inset-0" />
    </motion.div>
  );
}
