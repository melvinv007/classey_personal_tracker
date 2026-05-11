"use client";

import { motion } from "framer-motion";

/**
 * DotPatternBackground - static dot matrix with soft glass blobs.
 */
export function DotPatternBackground(): React.ReactNode {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.12)_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
      <div
        className="absolute left-[10%] top-[12%] h-[360px] w-[360px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(var(--accent-rgb), 0.22), rgba(var(--accent-rgb), 0.03) 70%, transparent 100%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="absolute right-[8%] top-[50%] h-[300px] w-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(var(--accent-rgb), 0.18), rgba(var(--accent-rgb), 0.02) 72%, transparent 100%)",
          filter: "blur(24px)",
        }}
      />
    </motion.div>
  );
}

