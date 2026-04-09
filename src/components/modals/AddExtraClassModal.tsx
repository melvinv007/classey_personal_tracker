"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useCreateClassOccurrence } from "@/hooks/use-appwrite";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { ThemedDateInput, ThemedTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import type { Subject } from "@/types/database";

const extraClassSchema = z.object({
  subject_id: z.string().min(1, "Subject is required"),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  room: z.string().max(50).optional(),
});

type ExtraClassFormData = z.infer<typeof extraClassSchema>;

export interface AddExtraClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
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

/**
 * AddExtraClassModal - Modal for creating one-off extra classes
 */
export function AddExtraClassModal({
  isOpen,
  onClose,
  subjects,
  preselectedSubjectId,
}: AddExtraClassModalProps): React.ReactNode {
  const createClassOccurrence = useCreateClassOccurrence();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = format(new Date(), "HH:00");
  const nextHour = format(new Date(Date.now() + 3600000), "HH:00");

  const semesterSubjects = subjects.filter((s) => !s.deleted_at);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExtraClassFormData>({
    resolver: zodResolver(extraClassSchema),
    defaultValues: {
      subject_id: preselectedSubjectId || "",
      date: today,
      start_time: currentHour,
      end_time: nextHour,
      room: "",
    },
  });

  const selectedSubjectId = watch("subject_id");
  const selectedSubject = semesterSubjects.find((s) => s.$id === selectedSubjectId);

  const onSubmit = async (data: ExtraClassFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await createClassOccurrence.mutateAsync({
        subject_id: data.subject_id,
        schedule_id: null,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        attendance: null,
        status: "scheduled",
        is_extra_class: true,
        cancellation_reason: null,
        rescheduled_to: null,
        attendance_marked_at: null,
        attendance_note: null,
      });

      toast.success("Extra class added!", {
        description: `${selectedSubject?.short_name || "Class"} on ${format(new Date(data.date), "MMM d")} at ${data.start_time}`,
      });
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to add extra class:", error);
      toast.error("Failed to add extra class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div
              className={cn(
                "bg-white/8 backdrop-blur-2xl",
                "border border-white/12 rounded-3xl",
                "p-6 max-h-[90vh] overflow-y-auto"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: selectedSubject
                        ? `${selectedSubject.color}20`
                        : "rgba(var(--accent), 0.2)",
                    }}
                  >
                    <Calendar
                      className="w-5 h-5"
                      style={{
                        color: selectedSubject?.color || "rgb(var(--accent))",
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Add Extra Class
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      One-time class outside regular schedule
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    Subject
                  </label>
                  <ThemedSelect
                    value={watch("subject_id") || "__none__"}
                    onChange={(value) => setValue("subject_id", value === "__none__" ? "" : value, { shouldValidate: true })}
                    options={[
                      { value: "__none__", label: "Select subject..." },
                      ...semesterSubjects.map((subject) => ({
                        value: subject.$id,
                        label: `${subject.short_name} - ${subject.name}`,
                      })),
                    ]}
                    className={cn(errors.subject_id && "border-red-500/50")}
                  />
                  <input type="hidden" {...register("subject_id")} />
                  {errors.subject_id && (
                    <p className="text-sm text-red-400">
                      {errors.subject_id.message}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Date
                  </label>
                  <ThemedDateInput
                    value={watch("date")}
                    onChange={(value) => setValue("date", value, { shouldValidate: true })}
                    className={cn(errors.date && "border-red-500/50")}
                  />
                  <input type="hidden" {...register("date")} />
                  {errors.date && (
                    <p className="text-sm text-red-400">{errors.date.message}</p>
                  )}
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Start Time
                    </label>
                    <ThemedTimeInput
                      value={watch("start_time")}
                      onChange={(value) => setValue("start_time", value, { shouldValidate: true })}
                      className={cn(errors.start_time && "border-red-500/50")}
                    />
                    <input type="hidden" {...register("start_time")} />
                    {errors.start_time && (
                      <p className="text-sm text-red-400">
                        {errors.start_time.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      End Time
                    </label>
                    <ThemedTimeInput
                      value={watch("end_time")}
                      onChange={(value) => setValue("end_time", value, { shouldValidate: true })}
                      className={cn(errors.end_time && "border-red-500/50")}
                    />
                    <input type="hidden" {...register("end_time")} />
                    {errors.end_time && (
                      <p className="text-sm text-red-400">
                        {errors.end_time.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Room (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Room
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    {...register("room")}
                    placeholder="e.g., Room 301, Lab 2"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl",
                      "bg-white/6 border border-white/10",
                      "text-foreground placeholder:text-white/30",
                      "focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]",
                      "transition-all duration-150"
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl",
                      "bg-white/5 hover:bg-white/10",
                      "text-foreground font-medium",
                      "transition-colors"
                    )}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl",
                      "bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/90",
                      "text-white font-medium",
                      "transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? "Adding..." : "Add Extra Class"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
