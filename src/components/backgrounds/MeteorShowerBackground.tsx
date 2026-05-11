"use client";

import { motion } from "framer-motion";

/**
 * MeteorShowerBackground - diagonal light streaks crossing the view.
 */
export function MeteorShowerBackground(): React.ReactNode {
  const meteors = Array.from({ length: 12 }, (_, index) => {
    const seed = index + 21;
    const fract = (value: number): number => value - Math.floor(value);
    const pseudo = (offset: number): number =>
      fract(Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453);
    return {
      top: pseudo(1) * 100,
      delay: pseudo(2) * 8,
      duration: 5 + pseudo(3) * 4,
      length: 120 + pseudo(4) * 120,
      opacity: 0.28 + pseudo(5) * 0.35,
    };
  });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 15%, rgba(var(--accent-rgb), 0.2), transparent 42%), radial-gradient(circle at 75% 78%, rgba(var(--accent-rgb), 0.14), transparent 44%)",
        }}
      />

      {meteors.map((meteor, index) => (
        <motion.span
          key={index}
          className="absolute left-[-25%] block h-[2px] rounded-full"
          style={{
            top: `${meteor.top}%`,
            width: meteor.length,
            background:
              "linear-gradient(90deg, rgba(var(--accent-rgb), 0), rgba(var(--accent-rgb), 0.95), rgba(var(--accent-rgb), 0))",
            opacity: meteor.opacity,
            transform: "rotate(-24deg)",
            filter: "blur(0.25px)",
          }}
          animate={{ x: ["0vw", "150vw"], opacity: [0, meteor.opacity, 0] }}
          transition={{
            duration: meteor.duration,
            repeat: Infinity,
            delay: meteor.delay,
            ease: "linear",
          }}
        />
      ))}
    </motion.div>
  );
}

