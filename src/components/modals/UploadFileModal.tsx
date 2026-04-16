"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  FileImage,
  FileCode,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { uploadFile, validateFile, formatFileSize } from "@/lib/appwrite-storage";
import { cn } from "@/lib/utils";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
  defaultExamId?: string;
  defaultTaskId?: string;
}

interface FileToUpload {
  file: File;
  displayName: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  progress?: number;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  py: FileCode,
  js: FileCode,
  ts: FileCode,
  c: FileCode,
  cpp: FileCode,
  java: FileCode,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  webp: FileImage,
};

export function UploadFileModal({
  isOpen,
  onClose,
  defaultSubjectId,
  defaultExamId,
  defaultTaskId,
}: UploadFileModalProps): React.ReactNode {
  const { subjects = [], exams = [], ongoingSemester } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [subjectId, setSubjectId] = useState(defaultSubjectId || "");
  const [examId, setExamId] = useState(defaultExamId || "");
  const [taskId, setTaskId] = useState(defaultTaskId || "");
  const [isPastPaper, setIsPastPaper] = useState(false);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const activeSemesterId = ongoingSemester?.$id ?? null;
  const activeSubjects = subjects.filter(
    (s) => !s.deleted_at && (!activeSemesterId || s.semester_id === activeSemesterId)
  );
  const subjectExams = subjectId
    ? exams.filter((e) => e.subject_id === subjectId && !e.deleted_at)
    : [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validatedFiles: FileToUpload[] = [];

    fileArray.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validatedFiles.push({ file, displayName: file.name, status: "pending" });
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    });

    setFiles((prev) => [...prev, ...validatedFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const fileToUpload = files[i];
      if (fileToUpload.status !== "pending") continue;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f))
      );

      try {
        await uploadFile(fileToUpload.file, {
          file_name: fileToUpload.displayName.trim() || fileToUpload.file.name,
          subject_id: subjectId || undefined,
          exam_id: examId || undefined,
          task_id: taskId || undefined,
          is_past_paper: isPastPaper,
          description: description || undefined,
        });

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "success" } : f))
        );
        successCount++;
      } catch (error) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
        errorCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} file${errorCount > 1 ? "s" : ""} failed`);
    }

    // Close modal if all succeeded
    if (errorCount === 0 && successCount > 0) {
      setTimeout(() => {
        onClose();
        setFiles([]);
        setDescription("");
        setIsPastPaper(false);
      }, 500);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return FILE_ICONS[ext] || File;
  };

  const pendingFiles = files.filter((f) => f.status === "pending");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">Upload Files</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-[rgb(var(--accent))] bg-[rgba(var(--accent),0.1)]"
                  : "border-white/20 hover:border-white/40 hover:bg-white/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.py,.js,.ts,.c,.cpp,.h,.java,.jsx,.tsx,.jpg,.jpeg,.png,.gif,.webp"
              />
              <Upload
                className={cn(
                  "w-10 h-10 mx-auto mb-3",
                  isDragging ? "text-[rgb(var(--accent))]" : "text-muted-foreground"
                )}
              />
              <p className="font-medium">
                {isDragging ? "Drop files here" : "Drag & drop files or click to browse"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, DOC, TXT, Code files, Images • Max 100MB each
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((f, idx) => {
                    const Icon = getFileIcon(f.file.name);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                      >
                        <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.file.name}</p>
                          {f.status === "pending" && (
                            <input
                              value={f.displayName}
                              onChange={(event) =>
                                setFiles((prev) =>
                                  prev.map((file, fileIdx) =>
                                    fileIdx === idx ? { ...file, displayName: event.target.value } : file
                                  )
                                )
                              }
                              className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                              placeholder="Rename file (optional)"
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(f.file.size)}
                          </p>
                        </div>
                        {f.status === "pending" && (
                          <button
                            onClick={() => removeFile(idx)}
                            className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {f.status === "uploading" && (
                          <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--accent))]" />
                        )}
                        {f.status === "success" && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {f.status === "error" && (
                          <span title={f.error}>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Context selectors */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <p className="text-sm font-medium text-muted-foreground">
                Link to (optional)
              </p>

              {/* Subject */}
              <ThemedSelect
                value={subjectId || "__none__"}
                onChange={(value) => {
                  setSubjectId(value === "__none__" ? "" : value);
                  setExamId("");
                }}
                options={[
                  { value: "__none__", label: "No subject (general)" },
                  ...activeSubjects.map((s) => ({ value: s.$id, label: s.name })),
                ]}
              />

              {/* Exam (if subject selected) */}
              {subjectId && subjectExams.length > 0 && (
                <ThemedSelect
                  value={examId || "__none__"}
                  onChange={(value) => setExamId(value === "__none__" ? "" : value)}
                  options={[
                    { value: "__none__", label: "No specific exam" },
                    ...subjectExams.map((e) => ({ value: e.$id, label: e.name })),
                  ]}
                />
              )}

              {/* Past paper toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    isPastPaper ? "bg-[rgb(var(--accent))]" : "bg-white/20"
                  )}
                  onClick={() => setIsPastPaper(!isPastPaper)}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      isPastPaper ? "translate-x-5" : "translate-x-1"
                    )}
                  />
                </div>
                <span className="text-sm">This is a past exam paper</span>
              </label>

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={pendingFiles.length === 0 || isUploading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ""}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
