"use client";

import { motion } from "framer-motion";

/**
 * NoiseGridBackground - static grain + grid overlay.
 */
export function NoiseGridBackground(): React.ReactNode {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--foreground), 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--foreground), 0.06) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(rgba(var(--accent-rgb),0.24) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px",
        }}
      />
    </motion.div>
  );
}

