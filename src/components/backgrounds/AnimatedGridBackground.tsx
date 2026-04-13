"use client";

import { motion } from "framer-motion";

/**
 * AnimatedGridBackground - enhanced animated grid with mesh drift and constellation nodes.
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
      <motion.div
        className="absolute -inset-[18%]"
        style={{
          background: `
            radial-gradient(circle at 15% 25%, rgba(var(--accent-rgb), 0.24), transparent 45%),
            radial-gradient(circle at 80% 22%, rgba(var(--accent-rgb), 0.16), transparent 45%),
            radial-gradient(circle at 65% 78%, rgba(var(--accent-rgb), 0.18), transparent 50%)
          `,
          filter: "blur(22px)",
        }}
        animate={{
          transform: ["translate3d(0,0,0) scale(1)", "translate3d(-2%,1.5%,0) scale(1.03)", "translate3d(0,0,0) scale(1)"],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
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

      <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 1000 600" preserveAspectRatio="none">
        <g stroke="rgba(var(--accent-rgb),0.28)" strokeWidth="1.1" fill="none">
          <motion.path
            d="M80 120 L230 160 L390 115 L590 190 L810 150 L940 220"
            animate={{ d: ["M80 120 L230 160 L390 115 L590 190 L810 150 L940 220", "M80 145 L230 130 L390 170 L590 120 L810 195 L940 165", "M80 120 L230 160 L390 115 L590 190 L810 150 L940 220"] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M120 390 L300 330 L460 380 L680 325 L900 370"
            animate={{ d: ["M120 390 L300 330 L460 380 L680 325 L900 370", "M120 345 L300 385 L460 330 L680 375 L900 335", "M120 390 L300 330 L460 380 L680 325 L900 370"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
        <g fill="rgba(var(--accent-rgb),0.75)">
          {[{ x: 230, y: 160 }, { x: 390, y: 115 }, { x: 590, y: 190 }, { x: 300, y: 330 }, { x: 460, y: 380 }, { x: 680, y: 325 }].map((node, index) => (
            <motion.circle
              key={index}
              cx={node.x}
              cy={node.y}
              r="2.7"
              animate={{ opacity: [0.35, 1, 0.35], r: [2.1, 3.3, 2.1] }}
              transition={{ duration: 2.2 + (index % 3), repeat: Infinity, delay: index * 0.2 }}
            />
          ))}
        </g>
      </svg>

      <div className="glass-ripple-overlay absolute inset-0" />
    </motion.div>
  );
}

