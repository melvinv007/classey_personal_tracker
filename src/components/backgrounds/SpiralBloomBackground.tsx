"use client";

import { motion } from "framer-motion";

/**
 * SpiralBloomBackground - concentric hollow rings expanding from center.
 */
export function SpiralBloomBackground(): React.ReactNode {
  const rings = Array.from({ length: 9 }, (_, index) => index);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[rgb(var(--background))]" />

      {rings.map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: 12,
            height: 12,
            marginLeft: -6,
            marginTop: -6,
            borderColor: "rgba(var(--accent-rgb), 0.45)",
            boxShadow: "0 0 30px rgba(var(--accent-rgb), 0.2)",
          }}
          animate={{
            scale: [1, 35 + ring * 4],
            opacity: [0.55, 0],
            rotate: [0, 120],
          }}
          transition={{
            duration: 8.5,
            ease: "linear",
            repeat: Infinity,
            delay: ring * 0.75,
          }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(var(--accent-rgb),0.75)]"
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.2, 0.85] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

