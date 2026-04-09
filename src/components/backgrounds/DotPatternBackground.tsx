"use client";

import { motion } from "framer-motion";

/**
 * DotPatternBackground - Static dot grid pattern.
 */
export function DotPatternBackground(): React.ReactNode {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(var(--accent-rgb), 0.12) 1.5px, transparent 1.5px)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(var(--accent-rgb), 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(var(--accent-rgb), 0.05) 0%, transparent 50%)
          `,
        }}
      />
    </motion.div>
  );
}
