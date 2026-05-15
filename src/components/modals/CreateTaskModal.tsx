"use client";

import { ReminderOffsetsEditor } from "@/components/forms/ReminderOffsetsEditor";
import { ThemedDateTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import {
  queryKeys,
  useCreateTask,
  useSettings,
  useSubjects,
} from "@/hooks/use-appwrite";
import {
  parseReminderOffsetsJson,
  serializeReminderOffsetsJson,
} from "@/lib/appwrite-db";
import { formatFileSize, uploadFile } from "@/lib/appwrite-storage";
import type { ReminderOffset } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  Calendar,
  Flag,
  Folder,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  subject_id: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesterId: string;
  preselectedSubjectId?: string;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const PRIORITIES = [
  { value: "low", label: "Low", color: "#6B7280", bg: "rgba(107,114,128,0.2)" },
  {
    value: "medium",
    label: "Medium",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.2)",
  },
  {
    value: "high",
    label: "High",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.2)",
  },
  {
    value: "urgent",
    label: "Urgent",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.2)",
  },
];

export function CreateTaskModal({
  isOpen,
  onClose,
  semesterId,
  preselectedSubjectId,
}: CreateTaskModalProps): React.ReactNode {
  const createTask = useCreateTask();
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const { data: subjectsData } = useSubjects(semesterId);
  const subjects = subjectsData?.filter((sub) => !sub.deleted_at) ?? [];
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [customReminderOffsets, setCustomReminderOffsets] = useState<
    ReminderOffset[] | null
  >(null);
  const configuredReminderOffsets = parseReminderOffsetsJson(
    settings?.task_default_reminder_offsets_json ?? null,
  );
  const reminderOffsets =
    customReminderOffsets ??
    (configuredReminderOffsets.length > 0
      ? configuredReminderOffsets
      : [
          { value: 24, unit: "hours" as const },
          { value: 2, unit: "hours" as const },
        ]);
  const [attachments, setAttachments] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "medium",
      subject_id: preselectedSubjectId || "",
    },
  });

  const selectedPriority = useWatch({ control, name: "priority" });
  const selectedSubjectId =
    useWatch({ control, name: "subject_id" }) || "__none__";
  const deadlineValue = useWatch({ control, name: "deadline" }) ?? "";

  const onSubmit = async (data: TaskFormData) => {
    try {
      const normalizedDeadline = data.deadline
        ? new Date(data.deadline).toISOString()
        : null;
      const createdTask = await createTask.mutateAsync({
        semester_id: semesterId,
        subject_id: data.subject_id || null,
        title: data.title,
        description: data.description || null,
        notes: null,
        deadline: normalizedDeadline,
        reminder_at: null,
        reminder_offsets_json: serializeReminderOffsetsJson(reminderOffsets),
        priority: data.priority,
        is_completed: false,
        completed_at: null,
        sort_order: 0,
        deleted_at: null,
      });

      let failedUploads = 0;
      if (attachments.length > 0) {
        const uploadResults = await Promise.allSettled(
          attachments.map((file) =>
            uploadFile(file, {
              file_name: file.name,
              subject_id: data.subject_id || undefined,
              task_id: createdTask.$id,
            }),
          ),
        );
        failedUploads = uploadResults.filter(
          (result) => result.status === "rejected",
        ).length;
      }

      // Invalidate caches so files and tasks reflect the new uploads
      try {
        queryClient.invalidateQueries({ queryKey: queryKeys.files() });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      } catch (e) {
        console.warn("Failed to invalidate queries after task creation", e);
      }

      if (attachments.length > 0 && failedUploads === 0) {
        toast.success(
          `Task created with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}`,
        );
      } else if (attachments.length > 0 && failedUploads > 0) {
        toast.warning(
          `Task created, but ${failedUploads} attachment${failedUploads > 1 ? "s" : ""} failed to upload.`,
        );
      } else {
        toast.success("Task created");
      }
      setAttachments([]);
      setCustomReminderOffsets(null);
      reset();
      onClose();
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleClose = () => {
    setAttachments([]);
    setCustomReminderOffsets(null);
    reset();
    onClose();
  };

  const handleAttachmentSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length === 0) return;
    setAttachments((prev) => [...prev, ...selected]);
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Add Task</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  {...register("title")}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all"
                />
                {errors.title && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Flag className="w-4 h-4 inline mr-1.5" />
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() =>
                        setValue(
                          "priority",
                          priority.value as TaskFormData["priority"],
                        )
                      }
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedPriority === priority.value
                          ? "ring-2 ring-offset-2 ring-offset-background"
                          : "hover:bg-white/10"
                      }`}
                      style={{
                        backgroundColor:
                          selectedPriority === priority.value
                            ? priority.bg
                            : "rgba(255,255,255,0.05)",
                        color:
                          selectedPriority === priority.value
                            ? priority.color
                            : "inherit",
                        // @ts-expect-error CSS custom property
                        "--tw-ring-color": priority.color,
                      }}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              {subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Folder className="w-4 h-4 inline mr-1.5" />
                    Subject (optional)
                  </label>
                  <ThemedSelect
                    value={selectedSubjectId}
                    onChange={(value) =>
                      setValue(
                        "subject_id",
                        value === "__none__" ? "" : value,
                        { shouldValidate: true },
                      )
                    }
                    options={[
                      { value: "__none__", label: "No subject" },
                      ...subjects.map((subject) => ({
                        value: subject.$id,
                        label: subject.name,
                      })),
                    ]}
                  />
                  <input type="hidden" {...register("subject_id")} />
                </div>
              )}

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Calendar className="w-4 h-4 inline mr-1.5" />
                  Deadline
                </label>
                <ThemedDateTimeInput
                  value={deadlineValue}
                  onChange={(value) =>
                    setValue("deadline", value, { shouldValidate: true })
                  }
                />
                <input type="hidden" {...register("deadline")} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <AlignLeft className="w-4 h-4 inline mr-1.5" />
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Add more details..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all resize-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Paperclip className="w-4 h-4 inline mr-1.5" />
                  Attachments (optional)
                </label>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentSelect}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  Add file attachments
                </button>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/15 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <p className="text-[11px] text-muted-foreground">
                      Attachments are uploaded after task creation and shown
                      under Task Attachments in Files.
                    </p>
                  </div>
                )}
              </div>

              <ReminderOffsetsEditor
                label="Task reminders"
                description="Per-task offsets. These override defaults from Settings."
                value={reminderOffsets}
                onChange={setCustomReminderOffsets}
              />

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(var(--accent),0.2)] hover:bg-[rgba(var(--accent),0.3)] text-[rgb(var(--accent))] font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
