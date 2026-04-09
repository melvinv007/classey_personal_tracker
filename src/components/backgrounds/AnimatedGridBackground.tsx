"use client";

import { motion } from "framer-motion";

/**
 * AnimatedGridBackground - moving grid highlight pulses.
 */
export function AnimatedGridBackground(): React.ReactNode {
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
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--foreground),0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--foreground),0.08) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
      />
      <motion.div
        className="absolute -left-1/4 top-0 h-full w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.18), transparent)",
          filter: "blur(10px)",
        }}
        animate={{ x: ["0%", "280%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-0 -top-1/4 h-1/3 w-full"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(var(--accent-rgb), 0.12), transparent)",
          filter: "blur(8px)",
        }}
        animate={{ y: ["0%", "280%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

