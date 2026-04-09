"use client";

import { motion } from "framer-motion";

/**
 * BeamsBackground - vertical animated beams with accent tint.
 */
export function BeamsBackground(): React.ReactNode {
  const beams = Array.from({ length: 8 }, (_, i) => i);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />
      {beams.map((beam) => (
        <motion.div
          key={beam}
          className="absolute top-[-20%] h-[140%] w-[18vw]"
          style={{
            left: `${beam * 14 - 5}%`,
            background:
              "linear-gradient(180deg, rgba(var(--accent-rgb), 0.0), rgba(var(--accent-rgb), 0.24), rgba(var(--accent-rgb), 0.0))",
            filter: "blur(24px)",
            transform: "skewX(-8deg)",
          }}
          animate={{ y: ["-4%", "4%", "-4%"], opacity: [0.35, 0.65, 0.35] }}
          transition={{
            duration: 6 + beam * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: beam * 0.25,
          }}
        />
      ))}
    </motion.div>
  );
}

