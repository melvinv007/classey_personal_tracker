"use client";

import type { Minor } from "@/types/database";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

interface MinorCardProps {
  minor: Minor;
  completedCredits: number;
  completedCourses: number;
}

export function MinorCard({ minor, completedCredits, completedCourses }: MinorCardProps) {
  const creditPercent = minor.credits_required > 0
    ? Math.min(100, Math.round((completedCredits / minor.credits_required) * 100))
    : 0;
  const coursePercent = minor.courses_required > 0
    ? Math.min(100, Math.round((completedCourses / minor.courses_required) * 100))
    : 0;

  const isDone = creditPercent >= 100 && coursePercent >= 100;

  return (
    <Link href={`/minor/${minor.$id}`}>
      <motion.div
        className="glass-card interactive-surface interactive-glow group relative overflow-hidden p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
      >
        {/* Done badge */}
        {isDone && (
          <div className="absolute right-3 top-3 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Completed ✓
          </div>
        )}

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(var(--accent-rgb), 0.15)" }}
          >
            <GraduationCap className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{minor.name}</h3>
            <p className="text-xs text-muted-foreground">
              {minor.courses_required} courses · {minor.credits_required} credits
            </p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          {/* Credits */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-medium">
                {completedCredits}/{minor.credits_required}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: creditPercent >= 100
                    ? "rgb(52, 211, 153)"
                    : "rgb(var(--accent))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${creditPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Courses */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Courses</span>
              <span className="font-medium">
                {completedCourses}/{minor.courses_required}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: coursePercent >= 100
                    ? "rgb(52, 211, 153)"
                    : "rgb(var(--accent))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${coursePercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
