"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  FileText, 
  FolderOpen,
  GraduationCap,
  Plus,
  type LucideIcon
} from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Generic empty state component
 */
export function EmptyState({ 
  icon: Icon = FileText, 
  title, 
  description, 
  action 
}: EmptyStateProps): React.ReactNode {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "rgba(var(--accent-rgb), 0.1)" }}
      >
        <Icon className="h-8 w-8 text-accent" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

/**
 * Empty state for no semesters
 */
export function NoSemesters({ onAdd }: { onAdd: () => void }): React.ReactNode {
  return (
    <EmptyState
      icon={GraduationCap}
      title="No semesters yet"
      description="Create your first semester to start tracking your classes, exams, and attendance."
      action={{ label: "Create Semester", onClick: onAdd }}
    />
  );
}

/**
 * Empty state for no subjects
 */
export function NoSubjects({ onAdd }: { onAdd: () => void }): React.ReactNode {
  return (
    <EmptyState
      icon={BookOpen}
      title="No subjects yet"
      description="Add subjects to this semester to track attendance, exams, and resources."
      action={{ label: "Add Subject", onClick: onAdd }}
    />
  );
}

/**
 * Empty state for no exams
 */
export function NoExams({ onAdd }: { onAdd: () => void }): React.ReactNode {
  return (
    <EmptyState
      icon={Calendar}
      title="No exams scheduled"
      description="Add upcoming exams, quizzes, or assignments to keep track of your deadlines."
      action={{ label: "Add Exam", onClick: onAdd }}
    />
  );
}

/**
 * Empty state for no tasks
 */
export function NoTasks({ onAdd }: { onAdd: () => void }): React.ReactNode {
  return (
    <EmptyState
      icon={CheckSquare}
      title="All caught up!"
      description="You have no pending tasks. Add new tasks to stay organized."
      action={{ label: "Add Task", onClick: onAdd }}
    />
  );
}

/**
 * Empty state for no files
 */
export function NoFiles({ onAdd }: { onAdd: () => void }): React.ReactNode {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No files uploaded"
      description="Upload lecture notes, past papers, or other resources for easy access."
      action={{ label: "Upload File", onClick: onAdd }}
    />
  );
}

/**
 * Empty state for search results
 */
export function NoSearchResults({ query }: { query: string }): React.ReactNode {
  return (
    <EmptyState
      icon={FileText}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
}

/**
 * Empty state for no attendance records
 */
export function NoAttendance(): React.ReactNode {
  return (
    <EmptyState
      icon={Calendar}
      title="No attendance records"
      description="Attendance will appear here once you start marking classes as present or absent."
    />
  );
}
