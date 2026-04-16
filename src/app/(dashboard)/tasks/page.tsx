"use client";

import { motion } from "framer-motion";
import {
  Plus, CheckCircle2, Flag, Clock,
  Folder, Trash2, Loader2, Pencil
} from "lucide-react";
import { useState, useMemo } from "react";
import { useData } from "@/hooks/use-data";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { EditTaskModal } from "@/components/modals/EditTaskModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import type { Task } from "@/types/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO, isPast, isToday, isTomorrow } from "date-fns";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const PRIORITY_CONFIG = {
  urgent: { color: "#EF4444", bg: "rgba(239,68,68,0.15)", label: "Urgent" },
  high: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)", label: "High" },
  medium: { color: "#3B82F6", bg: "rgba(59,130,246,0.15)", label: "Medium" },
  low: { color: "#6B7280", bg: "rgba(107,114,128,0.15)", label: "Low" },
};

type FilterType = "all" | "pending" | "completed" | "overdue";

export default function TasksPage(): React.ReactNode {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  
  const { tasks: allTasks, subjects, toggleTaskComplete, deleteTask, ongoingSemester, isLoading } = useData();
  
  const activeSemesterFilterId = ongoingSemester?.$id ?? null;
  const tasks = allTasks.filter(
    (t) => !t.deleted_at && (!activeSemesterFilterId || t.semester_id === activeSemesterFilterId)
  );
  const now = new Date().toISOString();

  // Categorize and filter tasks
  const { filteredTasks, counts } = useMemo(() => {
    const pending = tasks.filter((t) => !t.is_completed);
    const completed = tasks.filter((t) => t.is_completed);
    const overdue = pending.filter(
      (t) => t.deadline && t.deadline < now
    );

    let filtered = tasks;
    switch (filter) {
      case "all":
        filtered = pending;
        break;
      case "pending":
        filtered = pending;
        break;
      case "completed":
        filtered = completed;
        break;
      case "overdue":
        filtered = overdue;
        break;
    }

    // Sort: overdue first, then by deadline, then by priority
    filtered = [...filtered].sort((a, b) => {
      // Completed tasks at the end
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      // Overdue first
      const aOverdue = a.deadline && a.deadline < now;
      const bOverdue = b.deadline && b.deadline < now;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      // By deadline
      if (a.deadline && b.deadline) {
        return a.deadline.localeCompare(b.deadline);
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      // By priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority ?? "low"] ?? 4) - (priorityOrder[b.priority ?? "low"] ?? 4);
    });

    return {
      filteredTasks: filtered,
      counts: {
        all: pending.length,
        pending: pending.length,
        completed: completed.length,
        overdue: overdue.length,
      },
    };
  }, [tasks, filter, now]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find((s) => s.$id === subjectId)?.short_name;
  };

  const getDeadlineDisplay = (deadline: string | null) => {
    if (!deadline) return null;
    const date = parseISO(deadline);
    if (isPast(date) && !isToday(date)) {
      return { text: "Overdue", className: "text-red-400" };
    }
    if (isToday(date)) {
      return { text: `Today ${format(date, "h:mm a")}`, className: "text-amber-400" };
    }
    if (isTomorrow(date)) {
      return { text: `Tomorrow ${format(date, "h:mm a")}`, className: "text-amber-400" };
    }
    return { text: format(date, "MMM d, h:mm a"), className: "text-muted-foreground" };
  };

  const handleToggleComplete = (taskId: string, wasCompleted: boolean) => {
    toggleTaskComplete(taskId);
    if (!wasCompleted) {
      toast.success("Task completed!", {
        action: {
          label: "Undo",
          onClick: () => toggleTaskComplete(taskId),
        },
      });
    }
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
    toast.success("Task deleted", {
      description: "Task deleted permanently.",
      duration: 5000,
    });
  };

  const handleClearCompleted = () => {
    const completedTasks = tasks.filter((task) => task.is_completed);
    completedTasks.forEach((task) => deleteTask(task.$id));
    toast.success(`Cleared ${completedTasks.length} completed task${completedTasks.length !== 1 ? "s" : ""}`);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "overdue", label: "Overdue" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <motion.main
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-8 pb-32 px-4 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {counts.pending} pending • {counts.overdue > 0 && (
                <span className="text-red-400">{counts.overdue} overdue</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="interactive-surface interactive-focus flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(var(--accent),0.15)] hover:bg-[rgba(var(--accent),0.25)] text-[rgb(var(--accent))] font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
                className={cn(
                  "interactive-surface interactive-focus px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  filter === f.key
                    ? "bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))]"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                )}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">
                ({counts[f.key]})
              </span>
            </button>
          ))}
          {filter === "completed" && counts.completed > 0 && (
            <button
              onClick={handleClearCompleted}
              className="interactive-surface interactive-focus px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-all"
            >
              Clear Completed ({counts.completed})
            </button>
          )}
        </motion.div>

        {/* Task List */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === "all"
                  ? "Create your first task to get started"
                  : filter === "completed"
                  ? "Complete some tasks to see them here"
                  : filter === "overdue"
                  ? "Great! You have no overdue tasks"
                  : "All tasks are completed!"}
              </p>
              {filter === "all" && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[rgba(var(--accent),0.15)] text-[rgb(var(--accent))] font-medium transition-colors hover:bg-[rgba(var(--accent),0.25)]"
                >
                  Create Task
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((task, index) => {
              const deadline = getDeadlineDisplay(task.deadline);
              const subject = getSubjectName(task.subject_id);
              const priority = task.priority ? PRIORITY_CONFIG[task.priority] : null;
              const isOverdue = task.deadline && task.deadline < now && !task.is_completed;

              return (
                <motion.div
                  key={task.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "group interactive-surface flex items-start gap-3 p-4 rounded-2xl border transition-all",
                    task.is_completed
                      ? "bg-white/3 border-white/5 opacity-60"
                      : isOverdue
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-white/5 border-white/10 hover:bg-white/8"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task.$id, task.is_completed)}
                    className={cn(
                      "interactive-surface interactive-focus mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      task.is_completed
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "border-white/30 hover:border-[rgb(var(--accent))] hover:bg-[rgba(var(--accent),0.1)]"
                    )}
                  >
                    {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium mb-1",
                        task.is_completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    
                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {priority && (
                        <span
                          className="px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: priority.bg, color: priority.color }}
                        >
                          <Flag className="w-3 h-3 inline mr-1" />
                          {priority.label}
                        </span>
                      )}
                      
                      {subject && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                          <Folder className="w-3 h-3 inline mr-1" />
                          {subject}
                        </span>
                      )}
                      
                      {deadline && (
                        <span className={cn("flex items-center gap-1", deadline.className)}>
                          <Clock className="w-3 h-3" />
                          {deadline.text}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="interactive-surface interactive-focus p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingTask(task)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Create Task Modal */}
      {ongoingSemester && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          semesterId={ongoingSemester.$id}
        />
      )}

      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />

      <ConfirmActionModal
        isOpen={deletingTask !== null}
        title="Delete task?"
        description={deletingTask ? `Delete "${deletingTask.title}" permanently.` : ""}
        confirmText="Delete Task"
        onConfirm={async () => {
          if (!deletingTask) return;
          handleDelete(deletingTask.$id);
          setDeletingTask(null);
        }}
        onCancel={() => setDeletingTask(null)}
      />
    </motion.main>
  );
}
