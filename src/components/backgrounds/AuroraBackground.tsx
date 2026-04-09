"use client";

import { motion } from "framer-motion";

/**
 * AuroraBackground - flowing aurora style ribbons.
 */
export function AuroraBackground(): React.ReactNode {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />
      <div
        className="absolute -inset-[20%]"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(var(--accent-rgb), 0.28) 0%, transparent 45%),
            radial-gradient(ellipse at 80% 20%, rgba(var(--accent-rgb), 0.18) 0%, transparent 42%),
            radial-gradient(ellipse at 50% 80%, rgba(var(--accent-rgb), 0.14) 0%, transparent 48%)
          `,
          filter: "blur(40px)",
          animation: "auroraShift 14s linear infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(var(--foreground), 0.03), transparent 35%, rgba(var(--foreground),0.02))",
          mixBlendMode: "screen",
        }}
      />
    </motion.div>
  );
}

