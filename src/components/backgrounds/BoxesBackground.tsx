"use client";

import { motion } from "framer-motion";

interface BoxParticle {
  size: number;
  duration: number;
  delay: number;
  left: number;
  top: number;
  backgroundOpacity: number;
  borderOpacity: number;
  xOffset: number;
}

/**
 * BoxesBackground - Animated grid of floating boxes.
 */
export function BoxesBackground(): React.ReactNode {
  const fract = (value: number): number => value - Math.floor(value);
  const pseudo = (seed: number, offset: number): number =>
    fract(Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453);

  const particles: BoxParticle[] = Array.from({ length: 40 }, (_, index) => {
    const seed = index + 1;
    return {
      size: 20 + pseudo(seed, 1) * 40,
      duration: 10 + pseudo(seed, 2) * 20,
      delay: pseudo(seed, 3) * 5,
      left: pseudo(seed, 4) * 100,
      top: pseudo(seed, 5) * 100,
      backgroundOpacity: 0.03 + pseudo(seed, 6) * 0.05,
      borderOpacity: 0.05 + pseudo(seed, 7) * 0.1,
      xOffset: pseudo(seed, 8) * 50 - 25,
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
      {/* Base grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--accent-rgb), 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--accent-rgb), 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Animated floating boxes */}
      {particles.map((particle, i) => {
        return (
          <motion.div
            key={i}
            className="absolute rounded-lg"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: `rgba(var(--accent-rgb), ${particle.backgroundOpacity})`,
              border: `1px solid rgba(var(--accent-rgb), ${particle.borderOpacity})`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, particle.xOffset, 0],
              rotate: [0, 180, 360],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear",
            }}
          />
        );
      })}
    </motion.div>
  );
}
