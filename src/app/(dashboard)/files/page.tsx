"use client";

import { UploadFileModal } from "@/components/modals/UploadFileModal";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { useData } from "@/hooks/use-data";
import {
  deleteFile,
  getFileDownloadUrl,
  getFileViewUrl,
} from "@/lib/appwrite-storage";
import { cn } from "@/lib/utils";
import type { ClasseyFile } from "@/types/database";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  Eye,
  File,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Loader2,
  Presentation,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// File type to icon mapping
const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  ppt: Presentation,
  pptx: Presentation,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  py: FileCode,
  js: FileCode,
  ts: FileCode,
  c: FileCode,
  cpp: FileCode,
  h: FileCode,
  java: FileCode,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
};

// File type to color mapping
const FILE_COLORS: Record<string, string> = {
  pdf: "#EF4444",
  doc: "#3B82F6",
  docx: "#3B82F6",
  txt: "#6B7280",
  ppt: "#F97316",
  pptx: "#F97316",
  xls: "#22C55E",
  xlsx: "#22C55E",
  py: "#3B82F6",
  js: "#EAB308",
  ts: "#3B82F6",
  c: "#6366F1",
  cpp: "#6366F1",
  h: "#6366F1",
  java: "#F97316",
  jpg: "#EC4899",
  jpeg: "#EC4899",
  png: "#EC4899",
  gif: "#EC4899",
  webp: "#EC4899",
  svg: "#EC4899",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type FilterType = "all" | "documents" | "code" | "images" | "past-papers";
type FileScope = "active-semester" | "global-files";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Files" },
  { value: "documents", label: "Documents" },
  { value: "code", label: "Code" },
  { value: "images", label: "Images" },
  { value: "past-papers", label: "Past Papers" },
];

const DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
];
const CODE_EXTENSIONS = ["py", "js", "ts", "c", "cpp", "h", "java"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

export default function FilesPage(): React.ReactNode {
  const {
    files,
    subjects,
    exams,
    tasks,
    events,
    classOccurrences,
    activeSemester,
    isLoading,
    refetch,
  } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [fileScope, setFileScope] = useState<FileScope>("active-semester");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeSemesterId = activeSemester?.$id ?? null;
  const canUpload = fileScope === "global-files" || Boolean(activeSemesterId);
  const subjectSemesterMap = useMemo(
    () =>
      new Map(
        subjects
          .filter((subject) => !subject.deleted_at)
          .map((subject) => [subject.$id, subject.semester_id]),
      ),
    [subjects],
  );
  const examSemesterMap = useMemo(
    () =>
      new Map(
        exams
          .filter((exam) => !exam.deleted_at)
          .map((exam) => [
            exam.$id,
            subjectSemesterMap.get(exam.subject_id) ?? null,
          ]),
      ),
    [exams, subjectSemesterMap],
  );
  const taskSemesterMap = useMemo(
    () =>
      new Map(
        tasks
          .filter((task) => !task.deleted_at)
          .map((task) => [task.$id, task.semester_id]),
      ),
    [tasks],
  );
  const eventSemesterMap = useMemo(
    () =>
      new Map(
        events
          .filter((event) => !event.deleted_at)
          .map((event) => [event.$id, event.semester_id]),
      ),
    [events],
  );
  const occurrenceSemesterMap = useMemo(
    () =>
      new Map(
        classOccurrences.map((occurrence) => [
          occurrence.$id,
          subjectSemesterMap.get(occurrence.subject_id) ?? null,
        ]),
      ),
    [classOccurrences, subjectSemesterMap],
  );

  const resolveFileSemesterId = useCallback(
    (file: ClasseyFile): string | null => {
      if (file.subject_id) {
        return subjectSemesterMap.get(file.subject_id) ?? null;
      }
      if (file.task_id) {
        return taskSemesterMap.get(file.task_id) ?? null;
      }
      if (file.exam_id) {
        return examSemesterMap.get(file.exam_id) ?? null;
      }
      if (file.event_id) {
        return eventSemesterMap.get(file.event_id) ?? null;
      }
      if (file.occurrence_id) {
        return occurrenceSemesterMap.get(file.occurrence_id) ?? null;
      }
      return null;
    },
    [
      subjectSemesterMap,
      taskSemesterMap,
      examSemesterMap,
      eventSemesterMap,
      occurrenceSemesterMap,
    ],
  );

  const allFiles = useMemo(() => {
    if (fileScope === "global-files") {
      return files.filter((file) => resolveFileSemesterId(file) === null);
    }
    if (!activeSemesterId) return [];
    return files.filter(
      (file) => resolveFileSemesterId(file) === activeSemesterId,
    );
  }, [activeSemesterId, fileScope, files, resolveFileSemesterId]);

  const activeSubjects = subjects.filter(
    (s) =>
      !s.deleted_at && !!activeSemesterId && s.semester_id === activeSemesterId,
  );

  useEffect(() => {
    setSelectedSubjectId(null);
  }, [fileScope]);

  // Filter files
  const filteredFiles = useMemo(() => {
    let result = allFiles;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.file_name.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query),
      );
    }

    // Filter by subject
    if (selectedSubjectId) {
      result = result.filter((f) => f.subject_id === selectedSubjectId);
    }

    // Filter by type
    switch (filter) {
      case "documents":
        result = result.filter((f) =>
          DOCUMENT_EXTENSIONS.includes(f.file_extension),
        );
        break;
      case "code":
        result = result.filter((f) =>
          CODE_EXTENSIONS.includes(f.file_extension),
        );
        break;
      case "images":
        result = result.filter((f) =>
          IMAGE_EXTENSIONS.includes(f.file_extension),
        );
        break;
      case "past-papers":
        result = result.filter((f) => f.is_past_paper);
        break;
    }

    return result;
  }, [allFiles, searchQuery, filter, selectedSubjectId]);

  const taskAttachmentFiles = useMemo(
    () => filteredFiles.filter((file) => Boolean(file.task_id)),
    [filteredFiles],
  );

  // Group non-task files by subject
  const filesBySubject = useMemo(() => {
    const grouped: Record<string, ClasseyFile[]> = {};
    filteredFiles
      .filter((file) => !file.task_id)
      .forEach((file) => {
        const key = file.subject_id || "general";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(file);
      });
    return grouped;
  }, [filteredFiles]);

  // Handle file view in browser
  const handleView = useCallback((file: ClasseyFile): void => {
    if (!file.storage_file_id) {
      toast.error("File not available for viewing");
      return;
    }
    const viewUrl = getFileViewUrl(file.storage_file_id);
    window.open(viewUrl, "_blank");
  }, []);

  // Handle file download
  const handleDownload = useCallback((file: ClasseyFile): void => {
    if (!file.storage_file_id) {
      toast.error("File not available for download");
      return;
    }
    const downloadUrl = getFileDownloadUrl(file.storage_file_id);

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Downloading ${file.file_name}`);
  }, []);

  // Handle file deletion with undo support
  const handleDelete = useCallback(
    async (file: ClasseyFile): Promise<void> => {
      if (!file.storage_file_id) {
        toast.error("Cannot delete file without storage reference");
        return;
      }

      setDeletingFileId(file.$id);

      try {
        await deleteFile(file.$id, file.storage_file_id);

        // Refetch files to update the list
        refetch?.();

        toast.success(`Deleted ${file.file_name}`, {
          action: {
            label: "Undo",
            onClick: () => {
              // Note: True undo would require restoring from storage
              // For now, show info that file was permanently deleted
              toast.info("File deletion cannot be undone");
            },
          },
          duration: 5000,
        });
      } catch (error) {
        toast.error(
          `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setDeletingFileId(null);
      }
    },
    [refetch],
  );

  // Drag and drop handlers for quick upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!canUpload) {
        toast.error("No active semester selected.");
        return;
      }
      if (e.dataTransfer.files.length > 0) {
        // Open upload modal with dropped files
        setIsUploadModalOpen(true);
      }
    },
    [canUpload],
  );

  const getSubjectName = (subjectId: string | null): string => {
    if (!subjectId) return "Global";
    const subject = subjects.find((s) => s.$id === subjectId);
    return subject?.short_name || subject?.name || "Unknown";
  };

  const getSubjectColor = (subjectId: string | null): string => {
    if (!subjectId) return "#6B7280";
    const subject = subjects.find((s) => s.$id === subjectId);
    return subject?.color || "#6B7280";
  };

  const getTaskTitle = (taskId: string | null): string => {
    if (!taskId) return "Task";
    const task = tasks.find((item) => item.$id === taskId);
    return task?.title || "Task";
  };

  // Loading state - AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--accent))]" />
      </div>
    );
  }

  return (
    <div
      className="page-wide min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-[rgba(var(--accent),0.1)] border-4 border-dashed border-[rgb(var(--accent))] pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--accent))]" />
            <p className="text-2xl font-bold text-[rgb(var(--accent))]">
              Drop files to upload
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            href="/"
            className="interactive-surface interactive-focus p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Files
            </h1>
            <p className="text-muted-foreground text-sm">
              {fileScope === "global-files"
                ? "Global Files"
                : "Active Semester"}{" "}
              • {filteredFiles.length} file
              {filteredFiles.length !== 1 ? "s" : ""} •{" "}
              {formatFileSize(
                filteredFiles.reduce((acc, f) => acc + f.file_size, 0),
              )}{" "}
              total
            </p>
          </div>
          {/* Upload button in header */}
          <button
            onClick={() => {
              if (!canUpload) {
                toast.error("No active semester selected.");
                return;
              }
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/90 text-white font-medium transition-colors disabled:opacity-60"
            disabled={!canUpload}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6"
        >
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
            />
          </div>

          <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setFileScope("active-semester")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                fileScope === "active-semester"
                  ? "bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Active Semester
            </button>
            <button
              type="button"
              onClick={() => setFileScope("global-files")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                fileScope === "global-files"
                  ? "bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Global Files
            </button>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filter === option.value
                    ? "bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))]"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Subject filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <ThemedSelect
                value={selectedSubjectId || "__all__"}
                onChange={(value) =>
                  setSelectedSubjectId(value === "__all__" ? null : value)
                }
                options={[
                  { value: "__all__", label: "All Subjects" },
                  ...(fileScope === "global-files"
                    ? []
                    : activeSubjects.map((subject) => ({
                        value: subject.$id,
                        label: subject.name,
                      }))),
                ]}
                disabled={fileScope === "global-files"}
              />
            </div>
          </div>
        </motion.div>

        {/* Drop zone for quick upload */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          onClick={() => {
            if (!canUpload) {
              toast.error("No active semester selected.");
              return;
            }
            setIsUploadModalOpen(true);
          }}
          className="w-full mb-6 py-6 rounded-2xl border-2 border-dashed border-white/20 bg-white/3 hover:bg-white/5 hover:border-[rgba(var(--accent),0.5)] transition-all flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">
            Drag & drop files here or click to upload
          </span>
        </motion.div>

        {/* Empty state */}
        {filteredFiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No files found
            </h3>
            <p className="text-muted-foreground text-sm">
              {!activeSemesterId
                ? fileScope === "global-files"
                  ? "No global files yet. Upload one to get started."
                  : "No active semester. Switch to Global Files or activate a semester."
                : searchQuery || filter !== "all" || selectedSubjectId
                  ? "Try adjusting your filters"
                  : "Upload your first file to get started"}
            </p>
          </motion.div>
        )}

        {/* Task attachments section */}
        {taskAttachmentFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--accent),0.18)]">
                <Folder className="h-4 w-4 text-[rgb(var(--accent))]" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Task Attachments
              </h2>
              <span className="text-sm text-muted-foreground">
                ({taskAttachmentFiles.length})
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {taskAttachmentFiles.map((file, fileIndex) => {
                const FileIcon = FILE_ICONS[file.file_extension] || File;
                const fileColor = FILE_COLORS[file.file_extension] || "#6B7280";

                return (
                  <motion.div
                    key={file.$id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.22 + fileIndex * 0.03 }}
                    className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all hover:border-white/15 hover:bg-white/8"
                  >
                    {file.is_past_paper && (
                      <div className="absolute right-2 top-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                        Past Paper
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${fileColor}20` }}
                      >
                        <FileIcon
                          className="h-6 w-6"
                          style={{ color: fileColor }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate pr-8 font-medium text-foreground">
                          {file.file_name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium uppercase">
                            {file.file_extension}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(file.file_size)}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-[rgb(var(--accent))]">
                          Task: {getTaskTitle(file.task_id)}
                        </p>
                        {file.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {file.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(file.$createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleView(file)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                          title="View in browser"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          disabled={deletingFileId === file.$id}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingFileId === file.$id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Files grouped by subject */}
        {Object.keys(filesBySubject).length > 0 && (
          <div className="space-y-8">
            {Object.entries(filesBySubject).map(
              ([subjectId, subjectFiles], groupIndex) => (
                <motion.div
                  key={subjectId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + groupIndex * 0.05 }}
                >
                  {/* Subject header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${getSubjectColor(subjectId === "general" ? null : subjectId)}20`,
                      }}
                    >
                      <BookOpen
                        className="w-4 h-4"
                        style={{
                          color: getSubjectColor(
                            subjectId === "general" ? null : subjectId,
                          ),
                        }}
                      />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {getSubjectName(
                        subjectId === "general" ? null : subjectId,
                      )}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      ({subjectFiles.length})
                    </span>
                  </div>

                  {/* Files grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectFiles.map((file, fileIndex) => {
                      const FileIcon = FILE_ICONS[file.file_extension] || File;
                      const fileColor =
                        FILE_COLORS[file.file_extension] || "#6B7280";

                      return (
                        <motion.div
                          key={file.$id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.25 + fileIndex * 0.03 }}
                          className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 hover:border-white/15 transition-all"
                        >
                          {/* Past paper badge */}
                          {file.is_past_paper && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                              Past Paper
                            </div>
                          )}

                          {/* File icon and info */}
                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${fileColor}20` }}
                            >
                              <FileIcon
                                className="w-6 h-6"
                                style={{ color: fileColor }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground truncate pr-8">
                                {file.file_name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="uppercase font-medium">
                                  {file.file_extension}
                                </span>
                                <span>•</span>
                                <span>{formatFileSize(file.file_size)}</span>
                              </div>
                              {file.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {file.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Date and actions */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(file.$createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* View in browser */}
                              <button
                                onClick={() => handleView(file)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                title="View in browser"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Download */}
                              <button
                                onClick={() => handleDownload(file)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(file)}
                                disabled={deletingFileId === file.$id}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingFileId === file.$id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          refetch?.();
        }}
      />
    </div>
  );
}
