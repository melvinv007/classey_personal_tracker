"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Calendar, Flag, MoreHorizontal } from "lucide-react";
import { format, isPast, differenceInDays, differenceInHours } from "date-fns";
import type { Task } from "@/types/database";
import { cn } from "@/lib/utils";

export interface TaskCardProps {
  task: Task;
  subjectName?: string;
  subjectColor?: string;
  onToggleComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

const priorityConfig: Record<NonNullable<Task["priority"]>, { color: string; bg: string; label: string }> = {
  urgent: { color: "text-red-400", bg: "bg-red-400/20", label: "Urgent" },
  high: { color: "text-orange-400", bg: "bg-orange-400/20", label: "High" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-400/20", label: "Medium" },
  low: { color: "text-green-400", bg: "bg-green-400/20", label: "Low" },
};

/**
 * TaskCard - Displays task with completion toggle, deadline, and priority
 */
export function TaskCard({
  task,
  subjectName,
  subjectColor,
  onToggleComplete,
  onEdit,
  onDelete,
  onClick,
}: TaskCardProps): React.ReactNode {
  const isCompleted = task.is_completed;
  const hasDeadline = !!task.deadline;
  const deadlineDate = hasDeadline ? new Date(task.deadline!) : null;
  const isOverdue = hasDeadline && !isCompleted && isPast(deadlineDate!);

  // Time until deadline
  const getTimeUntil = (): string | null => {
    if (!deadlineDate) return null;
    if (isCompleted) return "Completed";
    if (isPast(deadlineDate)) return "Overdue";
    
    const days = differenceInDays(deadlineDate, new Date());
    if (days > 0) return `${days}d left`;
    const hours = differenceInHours(deadlineDate, new Date());
    if (hours > 0) return `${hours}h left`;
    return "Due soon";
  };

  const priority = task.priority ? priorityConfig[task.priority] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-xl p-4 cursor-pointer transition-all duration-200",
        "bg-white/5 backdrop-blur-xl border border-white/10",
        "hover:bg-white/8 hover:border-white/15",
        isCompleted && "opacity-60"
      )}
      style={{
        boxShadow: subjectColor && !isCompleted
          ? `0 0 20px ${subjectColor}15, inset 0 0 30px ${subjectColor}05`
          : undefined,
      }}
    >
      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute inset-0 rounded-xl border-2 border-red-400/30 pointer-events-none" />
      )}

      <div className="flex items-start gap-3">
        {/* Completion toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.();
          }}
          className={cn(
            "flex-shrink-0 mt-0.5 transition-colors",
            isCompleted ? "text-green-400" : "text-muted-foreground hover:text-accent"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-medium truncate",
              isCompleted ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {task.title}
          </h4>

          {/* Subject and description */}
          {(subjectName || task.description) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {subjectName}
              {subjectName && task.description && " • "}
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2">
            {/* Deadline */}
            {hasDeadline && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-red-400" : "text-muted-foreground"
                )}
              >
                <Calendar className="w-3 h-3" />
                {format(deadlineDate!, "MMM d")}
                {getTimeUntil() && (
                  <span className={cn(
                    "ml-1",
                    isOverdue ? "text-red-400 font-medium" : ""
                  )}>
                    ({getTimeUntil()})
                  </span>
                )}
              </span>
            )}

            {/* Priority badge */}
            {priority && (
              <span
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                  priority.bg,
                  priority.color
                )}
              >
                <Flag className="w-2.5 h-2.5" />
                {priority.label}
              </span>
            )}
          </div>
        </div>

        {/* Subject color dot */}
        {subjectColor && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: subjectColor }}
          />
        )}

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
    </motion.div>
  );
}
