"use client";

import { motion } from "framer-motion";

/**
 * MeshGradientBackground - static layered mesh gradients.
 */
export function MeshGradientBackground(): React.ReactNode {
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
        className="absolute -inset-[20%]"
        style={{
          background: `
            radial-gradient(circle at 14% 20%, rgba(var(--accent-rgb), 0.26), transparent 42%),
            radial-gradient(circle at 80% 22%, rgba(var(--accent-rgb), 0.18), transparent 40%),
            radial-gradient(circle at 24% 82%, rgba(var(--accent-rgb), 0.16), transparent 45%),
            radial-gradient(circle at 84% 78%, rgba(var(--accent-rgb), 0.14), transparent 44%)
          `,
          filter: "blur(34px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--foreground),0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--foreground),0.03) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
    </motion.div>
  );
}

