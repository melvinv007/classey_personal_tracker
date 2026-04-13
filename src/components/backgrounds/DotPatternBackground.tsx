"use client";

import { motion } from "framer-motion";

/**
 * DotPatternBackground - Gradient blobs with parallax drift.
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
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.10)_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
      {[
        { left: "8%", top: "10%", size: 420, opacity: 0.2, duration: 18 },
        { left: "58%", top: "18%", size: 360, opacity: 0.18, duration: 21 },
        { left: "22%", top: "58%", size: 460, opacity: 0.16, duration: 24 },
        { left: "68%", top: "62%", size: 320, opacity: 0.2, duration: 19 },
      ].map((blob, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            left: blob.left,
            top: blob.top,
            width: blob.size,
            height: blob.size,
            background: `radial-gradient(circle at 30% 30%, rgba(var(--accent-rgb), ${blob.opacity}), rgba(var(--accent-rgb), 0.02) 70%, transparent 100%)`,
            filter: "blur(28px)",
          }}
          animate={{
            x: [0, 24, -16, 0],
            y: [0, -18, 22, 0],
            scale: [1, 1.04, 0.97, 1],
          }}
          transition={{ duration: blob.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}
