"use client";

import { motion } from "framer-motion";
import { Clock, User, AlertCircle, CheckCircle2, MoreHorizontal, Edit3, Trash2, CalendarPlus, CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Subject, AttendanceStats } from "@/types/database";
import { cn, hexToRgbComma } from "@/lib/utils";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";

interface SubjectCardProps {
  subject: Subject;
  semesterId: string;
  stats?: AttendanceStats;
  nextClassTime?: string;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  onAddExtraClass?: (subject: Subject) => void;
  onMarkAllPresent?: (subject: Subject) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

/**
 * Circular progress ring component
 */
function AttendanceRing({ 
  percentage, 
  requirement = 75,
  color,
  size = 56,
}: { 
  percentage: number; 
  requirement?: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine ring color based on attendance
  const getStatusColor = () => {
    if (percentage >= requirement) return color; // Safe - use accent
    if (percentage >= requirement - 5) return "#F59E0B"; // Warning - yellow
    return "#EF4444"; // Danger - red
  };

  const statusColor = getStatusColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={statusColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-foreground">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

export function SubjectCard({
  subject,
  semesterId,
  stats,
  nextClassTime,
  onEdit,
  onDelete,
  onAddExtraClass,
  onMarkAllPresent,
}: SubjectCardProps) {
  const router = useRouter();

  const accentRgb = hexToRgbComma(subject.color);
  const requirement = subject.attendance_requirement_percent ?? 75;

  const handleClick = () => {
    router.push(`/semester/${semesterId}/subject/${subject.$id}`);
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Edit Subject",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => onEdit?.(subject),
    },
    {
      label: "Add Extra Class",
      icon: <CalendarPlus className="w-4 h-4" />,
      onClick: () => onAddExtraClass?.(subject),
    },
    {
      label: "Mark All Present Today",
      icon: <CheckSquare className="w-4 h-4" />,
      onClick: () => onMarkAllPresent?.(subject),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete?.(subject),
      variant: "danger",
    },
  ];

  // Attendance status indicator
  const getAttendanceStatus = () => {
    if (!stats) return null;
    if (stats.percentage >= requirement) {
      return {
        icon: CheckCircle2,
        text: `Can bunk ${stats.canBunk} classes`,
        className: "text-emerald-400",
      };
    }
    return {
      icon: AlertCircle,
      text: `Need ${stats.classesNeeded} more classes`,
      className: "text-amber-400",
    };
  };

  const attendanceStatus = getAttendanceStatus();

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
        "rounded-2xl p-4",
        "duration-200"
      )}
      whileHover={{
        scale: 1.02,
        y: -2,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Color dot indicator */}
      <div
        className="absolute top-4 left-4 w-2 h-2 rounded-full"
        style={{ backgroundColor: subject.color }}
      />

      <div className="flex items-start gap-4 pl-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-md"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.2)`,
                    color: subject.color,
                  }}
                >
                  {subject.short_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subject.credits} cr
                </span>
              </div>
              <h3 className="text-sm font-medium text-foreground truncate">
                {subject.name}
              </h3>
            </div>
          </div>

          {/* Info row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {/* Teacher */}
            {subject.teacher_name && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{subject.teacher_name}</span>
              </div>
            )}

            {/* Next class */}
            {nextClassTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{nextClassTime}</span>
              </div>
            )}

            {/* Type badge */}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-xs capitalize",
                subject.type === "lab" && "bg-amber-500/20 text-amber-400",
                subject.type === "theory" && "bg-blue-500/20 text-blue-400",
                subject.type === "practical" && "bg-purple-500/20 text-purple-400",
                subject.type === "project" && "bg-emerald-500/20 text-emerald-400",
                subject.type === "other" && "bg-white/10 text-muted-foreground"
              )}
            >
              {subject.type}
            </span>
          </div>

          {/* Attendance status */}
          {attendanceStatus && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs", attendanceStatus.className)}>
              <attendanceStatus.icon className="w-3 h-3" />
              <span>{attendanceStatus.text}</span>
            </div>
          )}
        </div>

        {/* Attendance ring */}
        {stats && (
          <AttendanceRing
            percentage={stats.percentage}
            requirement={requirement}
            color={subject.color}
          />
        )}
      </div>

      {/* Quick actions (visible on hover - desktop only) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(subject);
          }}
          className="p-1.5 rounded-lg btn-muted-themed interactive-focus text-muted-foreground hover:text-foreground transition-colors"
          title="Edit subject"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
    </ContextMenu>
  );
}
