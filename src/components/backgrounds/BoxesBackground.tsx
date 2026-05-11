"use client";

import { motion } from "framer-motion";

/**
 * BoxesBackground - static soft box grid with accent tint.
 */
export function BoxesBackground(): React.ReactNode {
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
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb), 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb), 0.1) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 25%, rgba(var(--accent-rgb), 0.16), transparent 46%), radial-gradient(circle at 78% 68%, rgba(var(--accent-rgb), 0.14), transparent 44%)",
        }}
      />
    </motion.div>
  );
}

