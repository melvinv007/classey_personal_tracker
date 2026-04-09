"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface SmokeParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  decay: number;
}

function createSmokeParticle(width: number, height: number): SmokeParticle {
  return {
    x: Math.random() * width,
    y: height + 100,
    size: Math.random() * 100 + 50,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: -Math.random() * 0.8 - 0.2,
    opacity: Math.random() * 0.15 + 0.05,
    decay: Math.random() * 0.0003 + 0.0001,
  };
}

function updateSmokeParticle(particle: SmokeParticle, time: number): void {
  particle.x += particle.speedX + Math.sin(time * 0.001 + particle.y * 0.01) * 0.3;
  particle.y += particle.speedY;
  particle.opacity -= particle.decay;
  particle.size += 0.2;
}

function drawSmokeParticle(
  context: CanvasRenderingContext2D,
  particle: SmokeParticle
): void {
  const gradient = context.createRadialGradient(
    particle.x,
    particle.y,
    0,
    particle.x,
    particle.y,
    particle.size
  );
  gradient.addColorStop(0, `rgba(139, 92, 246, ${particle.opacity * 0.5})`);
  gradient.addColorStop(0.5, `rgba(139, 92, 246, ${particle.opacity * 0.2})`);
  gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  context.fill();
}

/**
 * SpookySmokeBackground - Default animated smoke effect.
 * Creates a flowing smoke-like animation using canvas.
 */
export function SpookySmokeBackground(): React.ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let lastFrameTime = 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const targetFps = prefersReducedMotion ? 20 : isMobile ? 45 : 60;
    const frameInterval = 1000 / targetFps;
    const maxParticles = prefersReducedMotion ? 18 : isMobile ? 30 : 50;
    const spawnChance = prefersReducedMotion ? 0.03 : isMobile ? 0.06 : 0.1;

    const resize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const particles: SmokeParticle[] = [];

    const animate = (timestamp: number): void => {
      if (timestamp - lastFrameTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;

      // Add new particles
      if (particles.length < maxParticles && Math.random() < spawnChance) {
        particles.push(createSmokeParticle(canvas.width, canvas.height));
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        updateSmokeParticle(particles[i], time);
        drawSmokeParticle(ctx, particles[i]);

        // Remove dead particles
        if (particles[i].opacity <= 0 || particles[i].y < -100) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      aria-hidden="true"
    />
  );
}
