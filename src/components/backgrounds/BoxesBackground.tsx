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
 * BoxesBackground - Animated mesh gradient with drifting constellation lines.
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
      {/* Mesh gradient base */}
      <motion.div
        className="absolute -inset-[20%]"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(var(--accent-rgb), 0.22), transparent 45%),
            radial-gradient(circle at 80% 25%, rgba(var(--accent-rgb), 0.16), transparent 42%),
            radial-gradient(circle at 60% 75%, rgba(var(--accent-rgb), 0.18), transparent 48%),
            radial-gradient(circle at 35% 70%, rgba(var(--accent-rgb), 0.12), transparent 50%)
          `,
          filter: "blur(22px)",
        }}
        animate={{
          backgroundPosition: ["0% 0%, 100% 0%, 100% 100%, 0% 100%", "8% -5%, 95% 8%, 92% 94%, -6% 92%", "0% 0%, 100% 0%, 100% 100%, 0% 100%"],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

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

      {/* Constellation lines + nodes */}
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 1000 600" preserveAspectRatio="none">
        <g stroke="rgba(var(--accent-rgb),0.28)" strokeWidth="1.1" fill="none">
          <motion.path
            d="M40 120 L220 160 L390 110 L600 180 L820 140 L960 210"
            animate={{ d: ["M40 120 L220 160 L390 110 L600 180 L820 140 L960 210", "M40 140 L220 130 L390 170 L600 120 L820 190 L960 150", "M40 120 L220 160 L390 110 L600 180 L820 140 L960 210"] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M60 360 L250 300 L430 350 L650 290 L860 340"
            animate={{ d: ["M60 360 L250 300 L430 350 L650 290 L860 340", "M60 320 L250 370 L430 300 L650 360 L860 310", "M60 360 L250 300 L430 350 L650 290 L860 340"] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
        <g fill="rgba(var(--accent-rgb),0.68)">
          {[{ x: 220, y: 160 }, { x: 390, y: 110 }, { x: 600, y: 180 }, { x: 250, y: 300 }, { x: 430, y: 350 }, { x: 650, y: 290 }].map((node, index) => (
            <motion.circle
              key={index}
              cx={node.x}
              cy={node.y}
              r="2.8"
              animate={{ opacity: [0.35, 1, 0.35], r: [2.2, 3.2, 2.2] }}
              transition={{ duration: 2.6 + (index % 3), repeat: Infinity, delay: index * 0.25 }}
            />
          ))}
        </g>
      </svg>

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
              y: [0, -120, 0],
              x: [0, particle.xOffset, 0],
              rotate: [0, 180, 360],
              opacity: [0.25, 0.72, 0.25],
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
