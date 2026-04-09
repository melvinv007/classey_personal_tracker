"use client";

import { motion } from "framer-motion";
import { FileText, Calendar, Clock, Award, MoreHorizontal } from "lucide-react";
import { format, isPast, isFuture, differenceInDays, differenceInHours } from "date-fns";
import type { Exam } from "@/types/database";
import { cn } from "@/lib/utils";

export interface ExamCardProps {
  exam: Exam;
  subjectName?: string;
  subjectColor?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddMarks?: () => void;
  onClick?: () => void;
}

const examTypeIcons: Record<Exam["type"], string> = {
  quiz: "📝",
  assignment: "📋",
  midterm: "📚",
  final: "🎓",
  practical: "🔬",
  other: "📄",
};

/**
 * ExamCard - Displays exam information with marks, date, and status
 */
export function ExamCard({
  exam,
  subjectName,
  subjectColor,
  onEdit,
  onDelete,
  onAddMarks,
  onClick,
}: ExamCardProps): React.ReactNode {
  const examDate = new Date(exam.date);
  const isUpcoming = isFuture(examDate);
  const isPastExam = isPast(examDate);
  const hasMarks = exam.marks_obtained !== null;

  // Time until exam
  const getTimeUntil = (): string => {
    if (isPastExam) return "Completed";
    const days = differenceInDays(examDate, new Date());
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    const hours = differenceInHours(examDate, new Date());
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
    return "Today";
  };

  // Get urgency color
  const getUrgencyColor = (): string => {
    if (isPastExam) return "text-muted-foreground";
    const days = differenceInDays(examDate, new Date());
    if (days <= 1) return "text-red-400";
    if (days <= 3) return "text-orange-400";
    if (days <= 7) return "text-yellow-400";
    return "text-green-400";
  };

  // Calculate percentage if marks exist
  const percentage = hasMarks
    ? Math.round((exam.marks_obtained! / exam.marks_total) * 100)
    : null;

  const getPercentageColor = (pct: number): string => {
    if (pct >= 80) return "text-green-400";
    if (pct >= 60) return "text-yellow-400";
    if (pct >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-xl p-4 cursor-pointer transition-all duration-200",
        "bg-white/5 backdrop-blur-xl border border-white/10",
        "hover:bg-white/8 hover:border-white/15"
      )}
      style={{
        boxShadow: subjectColor
          ? `0 0 20px ${subjectColor}15, inset 0 0 30px ${subjectColor}05`
          : undefined,
      }}
    >
      {/* Subject color indicator */}
      {subjectColor && (
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
          style={{ backgroundColor: subjectColor }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon + Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Type icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">
            {examTypeIcons[exam.type]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{exam.name}</h4>
            {subjectName && (
              <p className="text-xs text-muted-foreground truncate">{subjectName}</p>
            )}
            
            {/* Date and time */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(examDate, "MMM d, yyyy")}
              </span>
              {exam.start_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {exam.start_time}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Marks or Time until */}
        <div className="flex flex-col items-end gap-1">
          {hasMarks ? (
            <>
              <div className={cn("text-lg font-bold", getPercentageColor(percentage!))}>
                {percentage}%
              </div>
              <div className="text-xs text-muted-foreground">
                {exam.marks_obtained}/{exam.marks_total}
              </div>
            </>
          ) : (
            <>
              <div className={cn("text-sm font-medium", getUrgencyColor())}>
                {getTimeUntil()}
              </div>
              <div className="text-xs text-muted-foreground">
                Max: {exam.marks_total}
              </div>
            </>
          )}
        </div>

        {/* More button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Context menu would open here
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weightage badge */}
      {exam.weightage_percent && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-medium">
          {exam.weightage_percent}% weight
        </div>
      )}
    </motion.div>
  );
}
