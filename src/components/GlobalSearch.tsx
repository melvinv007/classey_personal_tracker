"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import {
  Search,
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  GraduationCap,
  Clock,
  Settings,
  BarChart3,
  FolderOpen,
  Home,
  X,
  ArrowRight,
} from "lucide-react";
import { useData } from "@/hooks/use-data";

interface SearchItem {
  id: string;
  type: "semester" | "subject" | "exam" | "task" | "file" | "page";
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ReactNode;
  keywords?: string[];
}

// Quick navigation pages
const PAGES: SearchItem[] = [
  {
    id: "page-home",
    type: "page",
    title: "Dashboard",
    subtitle: "Home page",
    href: "/",
    icon: <Home className="h-4 w-4" />,
    keywords: ["home", "dashboard", "main"],
  },
  {
    id: "page-calendar",
    type: "page",
    title: "Calendar",
    subtitle: "View your schedule",
    href: "/calendar",
    icon: <Calendar className="h-4 w-4" />,
    keywords: ["calendar", "schedule", "week"],
  },
  {
    id: "page-tasks",
    type: "page",
    title: "Tasks",
    subtitle: "Manage your to-dos",
    href: "/tasks",
    icon: <CheckSquare className="h-4 w-4" />,
    keywords: ["tasks", "todo", "checklist"],
  },
  {
    id: "page-files",
    type: "page",
    title: "Files",
    subtitle: "Browse your files",
    href: "/files",
    icon: <FolderOpen className="h-4 w-4" />,
    keywords: ["files", "documents", "uploads"],
  },
  {
    id: "page-timetable",
    type: "page",
    title: "Timetable",
    subtitle: "Weekly class schedule",
    href: "/timetable",
    icon: <Clock className="h-4 w-4" />,
    keywords: ["timetable", "classes", "slots"],
  },
  {
    id: "page-cgpa",
    type: "page",
    title: "CGPA Tracker",
    subtitle: "Track your grades",
    href: "/analytics/cgpa",
    icon: <BarChart3 className="h-4 w-4" />,
    keywords: ["cgpa", "gpa", "grades", "analytics"],
  },
  {
    id: "page-attendance",
    type: "page",
    title: "Attendance Calculator",
    subtitle: "Bunk planner & calculator",
    href: "/tools/attendance-calculator",
    icon: <GraduationCap className="h-4 w-4" />,
    keywords: ["attendance", "bunk", "calculator"],
  },
  {
    id: "page-settings",
    type: "page",
    title: "Settings",
    subtitle: "App preferences",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
    keywords: ["settings", "preferences", "theme"],
  },
];

/**
 * Global Search Command Palette
 * Opens with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
 */
export function GlobalSearch(): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Get data from Appwrite via useData hook
  const { semesters, subjects, exams, tasks, files } = useData();

  // Build search items
  const buildSearchItems = useCallback((): SearchItem[] => {
    const items: SearchItem[] = [...PAGES];

    // Add semesters
    semesters
      .filter((s) => !s.deleted_at)
      .forEach((semester) => {
        items.push({
          id: `semester-${semester.$id}`,
          type: "semester",
          title: semester.name,
          subtitle: `${semester.status} semester`,
          href: `/semester/${semester.$id}`,
          icon: <GraduationCap className="h-4 w-4" />,
          keywords: [semester.name.toLowerCase()],
        });
      });

    // Add subjects
    subjects
      .filter((s) => !s.deleted_at)
      .forEach((subject) => {
        const semester = semesters.find((s) => s.$id === subject.semester_id);
        items.push({
          id: `subject-${subject.$id}`,
          type: "subject",
          title: subject.name,
          subtitle: `${subject.short_name} • ${semester?.name || ""}`,
          href: `/semester/${subject.semester_id}/subject/${subject.$id}`,
          icon: <BookOpen className="h-4 w-4" />,
          keywords: [
            subject.name.toLowerCase(),
            subject.short_name.toLowerCase(),
            subject.code?.toLowerCase() || "",
          ],
        });
      });

    // Add exams
    exams
      .filter((e) => !e.deleted_at)
      .forEach((exam) => {
        const subject = subjects.find((s) => s.$id === exam.subject_id);
        items.push({
          id: `exam-${exam.$id}`,
          type: "exam",
          title: exam.name,
          subtitle: `${subject?.short_name || ""} • ${exam.date}`,
          href: `/semester/${subject?.semester_id}/subject/${exam.subject_id}`,
          icon: <FileText className="h-4 w-4" />,
          keywords: [exam.name.toLowerCase(), exam.type],
        });
      });

    // Add tasks
    tasks
      .filter((t) => !t.deleted_at && !t.is_completed)
      .forEach((task) => {
        items.push({
          id: `task-${task.$id}`,
          type: "task",
          title: task.title,
          subtitle: task.deadline ? `Due: ${task.deadline}` : "No deadline",
          href: "/tasks",
          icon: <CheckSquare className="h-4 w-4" />,
          keywords: [task.title.toLowerCase()],
        });
      });

    // Add files
    files
      .filter((f) => !f.deleted_at)
      .forEach((file) => {
        const subject = subjects.find((s) => s.$id === file.subject_id);
        items.push({
          id: `file-${file.$id}`,
          type: "file",
          title: file.file_name,
          subtitle: subject?.short_name || "General",
          href: "/files",
          icon: <FolderOpen className="h-4 w-4" />,
          keywords: [file.file_name.toLowerCase()],
        });
      });

    return items;
  }, [semesters, subjects, exams, tasks, files]);

  // Fuzzy search with Fuse.js
  const searchItems = buildSearchItems();
  const fuse = new Fuse(searchItems, {
    keys: ["title", "subtitle", "keywords"],
    threshold: 0.4,
    includeScore: true,
  });

  const results = search
    ? fuse.search(search).map((r) => r.item)
    : searchItems.slice(0, 8); // Show first 8 items when no search

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };

  // Group results by type
  const groupedResults = results.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, SearchItem[]>
  );

  const typeLabels: Record<string, string> = {
    page: "Pages",
    semester: "Semesters",
    subject: "Subjects",
    exam: "Exams",
    task: "Tasks",
    file: "Files",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Command Palette */}
          <motion.div
            className="fixed left-1/2 top-[20%] z-[100] w-full max-w-lg -translate-x-1/2 px-4"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Command className="glass-elevated overflow-hidden rounded-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-border px-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search anything..."
                  className="flex-1 bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results */}
              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No results found for &quot;{search}&quot;
                </Command.Empty>

                {Object.entries(groupedResults).map(([type, items]) => (
                  <Command.Group
                    key={type}
                    heading={typeLabels[type] || type}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {items.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item.href)}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors aria-selected:bg-accent/10"
                      >
                        <span className="text-accent">{item.icon}</span>
                        <div className="flex-1 truncate">
                          <p className="font-medium">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-aria-selected:opacity-100" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Search trigger button for header/navbar
 */
export function SearchTrigger(): React.ReactNode {
  const handleClick = () => {
    // Dispatch keyboard event to open search
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 font-mono text-xs sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
