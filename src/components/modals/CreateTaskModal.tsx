"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Calendar, Flag, Folder, AlignLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTask, useSettings, useSubjects } from "@/hooks/use-appwrite";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { ThemedDateTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { toast } from "sonner";
import { ReminderOffsetsEditor } from "@/components/forms/ReminderOffsetsEditor";
import type { ReminderOffset } from "@/types/database";
import { parseReminderOffsetsJson, serializeReminderOffsetsJson } from "@/lib/appwrite-db";

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
  { value: "medium", label: "Medium", color: "#3B82F6", bg: "rgba(59,130,246,0.2)" },
  { value: "high", label: "High", color: "#F59E0B", bg: "rgba(245,158,11,0.2)" },
  { value: "urgent", label: "Urgent", color: "#EF4444", bg: "rgba(239,68,68,0.2)" },
];

export function CreateTaskModal({ isOpen, onClose, semesterId, preselectedSubjectId }: CreateTaskModalProps): React.ReactNode {
  const createTask = useCreateTask();
  const { data: settings } = useSettings();
  const { data: subjectsData } = useSubjects(semesterId);
  const subjects = subjectsData?.filter((sub) => !sub.deleted_at) ?? [];
  const [reminderOffsets, setReminderOffsets] = useState<ReminderOffset[]>([
    { value: 24, unit: "hours" },
    { value: 2, unit: "hours" },
  ]);

  useEffect(() => {
    const parsed = parseReminderOffsetsJson(settings?.task_default_reminder_offsets_json ?? null);
    if (parsed.length > 0) {
      setReminderOffsets(parsed);
    }
  }, [settings?.task_default_reminder_offsets_json]);

  const {
    register,
    handleSubmit,
    watch,
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

  const selectedPriority = watch("priority");
  const selectedSubjectId = watch("subject_id") || "__none__";
  const deadlineValue = watch("deadline") ?? "";

  const onSubmit = async (data: TaskFormData) => {
    try {
      const normalizedDeadline = data.deadline
        ? new Date(data.deadline).toISOString()
        : null;
      await createTask.mutateAsync({
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

      toast.success("Task created");
      reset();
      onClose();
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
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
                  <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
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
                      onClick={() => setValue("priority", priority.value as TaskFormData["priority"])}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedPriority === priority.value
                          ? "ring-2 ring-offset-2 ring-offset-background"
                          : "hover:bg-white/10"
                      }`}
                      style={{
                        backgroundColor: selectedPriority === priority.value ? priority.bg : "rgba(255,255,255,0.05)",
                        color: selectedPriority === priority.value ? priority.color : "inherit",
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
                    onChange={(value) => setValue("subject_id", value === "__none__" ? "" : value, { shouldValidate: true })}
                    options={[
                      { value: "__none__", label: "No subject" },
                      ...subjects.map((subject) => ({ value: subject.$id, label: subject.name })),
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
                  onChange={(value) => setValue("deadline", value, { shouldValidate: true })}
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

              <ReminderOffsetsEditor
                label="Task reminders"
                description="Per-task offsets. These override defaults from Settings."
                value={reminderOffsets}
                onChange={setReminderOffsets}
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
