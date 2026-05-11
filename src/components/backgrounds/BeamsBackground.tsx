"use client";

import { motion } from "framer-motion";

/**
 * BeamsBackground - static light beam columns.
 */
export function BeamsBackground(): React.ReactNode {
  const beams = Array.from({ length: 8 }, (_, index) => index);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />
      {beams.map((beam) => (
        <span
          key={beam}
          className="absolute top-[-10%] h-[120%] w-[18vw]"
          style={{
            left: `${beam * 14 - 4}%`,
            background:
              "linear-gradient(180deg, rgba(var(--accent-rgb), 0), rgba(var(--accent-rgb), 0.2), rgba(var(--accent-rgb), 0))",
            filter: "blur(18px)",
            transform: "skewX(-8deg)",
          }}
        />
      ))}
    </motion.div>
  );
}

