"use client";

import { motion } from "framer-motion";

/**
 * StarfieldBackground - static star scatter with accent haze.
 */
export function StarfieldBackground(): React.ReactNode {
  const stars = Array.from({ length: 64 }, (_, index) => {
    const seed = index + 17;
    const fract = (value: number): number => value - Math.floor(value);
    const pseudo = (offset: number): number =>
      fract(Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453);
    return {
      left: pseudo(1) * 100,
      top: pseudo(2) * 100,
      size: 1 + pseudo(3) * 2.2,
      opacity: 0.35 + pseudo(4) * 0.5,
    };
  });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(var(--accent-rgb), 0.18), transparent 48%), radial-gradient(circle at 28% 82%, rgba(var(--accent-rgb), 0.1), transparent 45%)",
        }}
      />
      {stars.map((star, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-[rgb(var(--foreground))]"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            boxShadow: "0 0 8px rgba(var(--accent-rgb), 0.25)",
          }}
        />
      ))}
    </motion.div>
  );
}

