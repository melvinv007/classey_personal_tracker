"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps): React.ReactNode {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-muted/50",
        className
      )}
    />
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton(): React.ReactNode {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Semester card skeleton
 */
export function SemesterCardSkeleton(): React.ReactNode {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mb-3 h-4 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

/**
 * Subject card skeleton
 */
export function SubjectCardSkeleton(): React.ReactNode {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

/**
 * List skeleton for tasks, exams, etc.
 */
export function ListSkeleton({ count = 3 }: { count?: number }): React.ReactNode {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <CardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Table skeleton for data tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }): React.ReactNode {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 border-b border-border p-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border/50 p-4 last:border-0">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton(): React.ReactNode {
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SemesterCardSkeleton />
        <SemesterCardSkeleton />
        <SemesterCardSkeleton />
      </div>
    </div>
  );
}
