"use client";

import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { type SemesterDisplayStatus } from "@/lib/semester-status";
import { cn, hexToRgbComma } from "@/lib/utils";
import type { Semester } from "@/types/database";
import { differenceInDays, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  Archive,
  BarChart2,
  BookOpen,
  Calendar,
  Edit3,
  MoreHorizontal,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SemesterCardProps {
  semester: Semester;
  displayStatus?: SemesterDisplayStatus;
  subjectCount?: number;
  onEdit?: (semester: Semester) => void;
  onDelete?: (semester: Semester) => void;
  onArchive?: (semester: Semester) => void;
  onManageHolidays?: (semester: Semester) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const statusConfig = {
  ongoing: {
    label: "Ongoing",
    className:
      "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))] border-[rgba(var(--accent-rgb),0.3)]",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  over: {
    label: "Over",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
};

export function SemesterCard({
  semester,
  displayStatus,
  subjectCount = 0,
  onEdit,
  onDelete,
  onArchive,
  onManageHolidays,
}: SemesterCardProps) {
  const router = useRouter();

  const startDate = parseISO(semester.start_date);
  const endDate = parseISO(semester.end_date);
  const today = new Date();
  const resolvedStatus = displayStatus ?? semester.status;

  // Calculate progress for ongoing semester
  const totalDays = differenceInDays(endDate, startDate);
  const daysElapsed = differenceInDays(today, startDate);
  const progress =
    resolvedStatus === "ongoing"
      ? Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100))
      : resolvedStatus === "completed"
        ? 100
        : 0;

  // Days remaining for ongoing
  const daysRemaining =
    resolvedStatus === "ongoing"
      ? Math.max(0, differenceInDays(endDate, today))
      : null;

  const accentRgb = hexToRgbComma(semester.color);

  const handleClick = () => {
    router.push(`/semester/${semester.$id}`);
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Edit Semester",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => onEdit?.(semester),
    },
    {
      label: semester.is_archived ? "Unarchive" : "Archive",
      icon: <Archive className="w-4 h-4" />,
      onClick: () => onArchive?.(semester),
    },
    {
      label: "Semester Holidays",
      icon: <Calendar className="w-4 h-4" />,
      onClick: () => onManageHolidays?.(semester),
    },
    {
      label: "View Analytics",
      icon: <BarChart2 className="w-4 h-4" />,
      onClick: () => router.push(`/analytics/cgpa`),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete?.(semester),
      variant: "danger",
    },
  ];

  return (
    <ContextMenu items={contextMenuItems}>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={handleClick}
        className={cn(
          "group interactive-surface interactive-glow relative cursor-pointer",
          "glass-card",
          "rounded-2xl p-5",
          "duration-200",
        )}
        whileHover={{
          scale: 1.02,
          y: -2,
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Color accent bar */}
        <div
          className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
          style={{ backgroundColor: semester.color }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {semester.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-full border",
              semester.is_archived
                ? "bg-white/5 text-muted-foreground border-white/10"
                : statusConfig[resolvedStatus].className,
            )}
            style={
              resolvedStatus === "ongoing" && !semester.is_archived
                ? {
                    backgroundColor: `rgba(${accentRgb}, 0.2)`,
                    color: semester.color,
                    borderColor: `rgba(${accentRgb}, 0.3)`,
                  }
                : undefined
            }
          >
            {semester.is_archived
              ? "Archived"
              : statusConfig[resolvedStatus].label}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Subjects */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
            >
              <BookOpen className="w-4 h-4" style={{ color: semester.color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {subjectCount}
              </p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
          </div>

          {/* Target SPI */}
          {semester.target_spi && (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
              >
                <Target className="w-4 h-4" style={{ color: semester.color }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {semester.target_spi.toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground">Target</p>
              </div>
            </div>
          )}

          {/* SPI (for completed) or Credits */}
          {semester.spi ? (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
              >
                <TrendingUp
                  className="w-4 h-4"
                  style={{ color: semester.color }}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {semester.spi.toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground">SPI</p>
              </div>
            </div>
          ) : semester.credits_total ? (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
              >
                <TrendingUp
                  className="w-4 h-4"
                  style={{ color: semester.color }}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {semester.credits_total}
                </p>
                <p className="text-xs text-muted-foreground">Credits</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Progress bar (for ongoing) */}
        {resolvedStatus === "ongoing" && !semester.is_archived && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">
                {daysRemaining} days left
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: semester.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Quick actions (visible on hover - desktop only) */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.(semester);
            }}
            className="p-1.5 rounded-lg btn-muted-themed interactive-focus text-muted-foreground hover:text-foreground transition-colors"
            title={semester.is_archived ? "Unarchive" : "Archive"}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1.5 rounded-lg btn-muted-themed interactive-focus text-muted-foreground hover:text-foreground transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </ContextMenu>
  );
}
