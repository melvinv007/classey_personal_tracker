"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Calendar, Clock, MapPin, BookOpen, Award } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateExam, useSettings } from "@/hooks/use-appwrite";
import { ThemedDateInput, ThemedTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { toast } from "sonner";
import { ReminderOffsetsEditor } from "@/components/forms/ReminderOffsetsEditor";
import type { ReminderOffset } from "@/types/database";
import { parseReminderOffsetsJson, serializeReminderOffsetsJson } from "@/lib/appwrite-db";

const examSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["quiz", "assignment", "midterm", "final", "practical", "other"]),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().optional(),
  duration_minutes: z.string().optional(),
  location: z.string().optional(),
  marks_total: z.string().min(1, "Total marks is required"),
  weightage_percent: z.string().optional(),
  syllabus: z.string().optional(),
  notes: z.string().optional(),
});

type ExamFormData = z.infer<typeof examSchema>;

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
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

const EXAM_TYPES = [
  { value: "quiz", label: "Quiz", color: "#8B5CF6" },
  { value: "assignment", label: "Assignment", color: "#10B981" },
  { value: "midterm", label: "Midterm", color: "#F59E0B" },
  { value: "final", label: "Final", color: "#EF4444" },
  { value: "practical", label: "Practical", color: "#06B6D4" },
  { value: "other", label: "Other", color: "#6B7280" },
];

export function CreateExamModal({ isOpen, onClose, subjectId }: CreateExamModalProps): React.ReactNode {
  const createExam = useCreateExam();
  const { data: settings } = useSettings();
  const [reminderOffsets, setReminderOffsets] = useState<ReminderOffset[]>([
    { value: 24, unit: "hours" },
    { value: 2, unit: "hours" },
  ]);

  useEffect(() => {
    const parsed = parseReminderOffsetsJson(settings?.exam_default_reminder_offsets_json ?? null);
    if (parsed.length > 0) {
      setReminderOffsets(parsed);
    }
  }, [settings?.exam_default_reminder_offsets_json]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      type: "quiz",
      marks_total: "100",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: ExamFormData) => {
    try {
      await createExam.mutateAsync({
        subject_id: subjectId,
        name: data.name,
        type: data.type,
        date: data.date,
        start_time: data.start_time || null,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
        location: data.location || null,
        marks_obtained: null,
        marks_total: parseInt(data.marks_total),
        weightage_percent: data.weightage_percent ? parseFloat(data.weightage_percent) : null,
        syllabus: data.syllabus || null,
        notes: data.notes || null,
        reminder_offsets_json: serializeReminderOffsetsJson(reminderOffsets),
        status: "upcoming",
        deleted_at: null,
      });

      toast.success("Exam created");
      reset();
      onClose();
    } catch {
      toast.error("Failed to create exam");
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Add Exam</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Exam Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXAM_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setValue("type", type.value as ExamFormData["type"])}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedType === type.value
                          ? "ring-2 ring-offset-2 ring-offset-background"
                          : "hover:bg-white/10"
                      }`}
                      style={{
                        backgroundColor: selectedType === type.value ? `${type.color}30` : "rgba(255,255,255,0.05)",
                        color: selectedType === type.value ? type.color : "inherit",
                        // @ts-expect-error CSS custom property
                        "--tw-ring-color": type.color,
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g., Quiz 1, Midterm Exam"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-1.5" />
                    Date <span className="text-red-400">*</span>
                  </label>
                  <ThemedDateInput
                    value={watch("date") || ""}
                    onChange={(value) => setValue("date", value, { shouldValidate: true })}
                  />
                  <input type="hidden" {...register("date")} />
                  {errors.date && (
                    <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Clock className="w-4 h-4 inline mr-1.5" />
                    Start Time
                  </label>
                  <ThemedTimeInput
                    value={watch("start_time") || ""}
                    onChange={(value) => setValue("start_time", value, { shouldValidate: true })}
                  />
                  <input type="hidden" {...register("start_time")} />
                </div>
              </div>

              {/* Duration & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    {...register("duration_minutes")}
                    placeholder="60"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1.5" />
                    Location
                  </label>
                  <input
                    type="text"
                    {...register("location")}
                    placeholder="Room / Hall"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all"
                  />
                </div>
              </div>

              {/* Marks & Weightage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Award className="w-4 h-4 inline mr-1.5" />
                    Total Marks <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("marks_total")}
                    placeholder="100"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all"
                  />
                  {errors.marks_total && (
                    <p className="text-red-400 text-xs mt-1">{errors.marks_total.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Weightage (%)
                  </label>
                  <input
                    type="number"
                    {...register("weightage_percent")}
                    placeholder="30"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all"
                  />
                </div>
              </div>

              {/* Syllabus */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1.5" />
                  Syllabus / Topics
                </label>
                <textarea
                  {...register("syllabus")}
                  rows={2}
                  placeholder="Topics covered in this exam..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] transition-all resize-none"
                />
              </div>

              <ReminderOffsetsEditor
                label="Exam reminders"
                description="Per-exam offsets. These override defaults from Settings."
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
                  {isSubmitting ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
