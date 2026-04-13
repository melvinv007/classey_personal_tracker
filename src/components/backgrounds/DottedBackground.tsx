"use client";

import { motion } from "framer-motion";

interface DotParticle {
  backgroundOpacity: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
}

/**
 * DottedBackground - subtle animated dotted surface.
 */
export function DottedBackground(): React.ReactNode {
  const fract = (value: number): number => value - Math.floor(value);
  const pseudo = (seed: number, offset: number): number =>
    fract(Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453);

  const particles: DotParticle[] = Array.from({ length: 20 }, (_, index) => {
    const seed = index + 101;
    return {
      backgroundOpacity: 0.2 + pseudo(seed, 1) * 0.3,
      left: pseudo(seed, 2) * 100,
      top: pseudo(seed, 3) * 100,
      duration: 3 + pseudo(seed, 4) * 2,
      delay: pseudo(seed, 5) * 2,
    };
  });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(rgba(var(--accent-rgb), 0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      {/* Animated floating dots */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full"
          style={{
            background: `rgba(var(--accent-rgb), ${particle.backgroundOpacity})`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}
