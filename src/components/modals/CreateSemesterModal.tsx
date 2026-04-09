"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Palette, Target, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMonths } from "date-fns";
import { useCreateSemester } from "@/hooks/use-appwrite";
import { useThemeStore } from "@/stores/theme-store";
import { ThemedDateInput } from "@/components/ui/ThemedDateTimeInput";
import { ThemedColorPicker } from "@/components/ui/ThemedColorPicker";
import { toast } from "sonner";

const semesterSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
  target_spi: z.string().optional(),
  credits_total: z.string().optional(),
  status: z.enum(["upcoming", "ongoing", "completed"]),
  is_quick_input: z.boolean(),
  spi: z.string().optional(),
});

type SemesterFormData = z.infer<typeof semesterSchema>;

const PRESET_COLORS = [
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#84CC16", // Lime
  "#F97316", // Orange
];

interface CreateSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

export function CreateSemesterModal({ isOpen, onClose }: CreateSemesterModalProps) {
  const createSemester = useCreateSemester();
  const setAccentColor = useThemeStore((s) => s.setAccentColor);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SemesterFormData>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      name: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(addMonths(new Date(), 4), "yyyy-MM-dd"),
      color: PRESET_COLORS[0],
      target_spi: "",
      credits_total: "",
      status: "ongoing",
      is_quick_input: false,
      spi: "",
    },
  });

  const selectedColor = watch("color");
  const status = watch("status");
  const isQuickInput = watch("is_quick_input");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Helper to parse optional number strings
  const parseOptionalNumber = (value: string | undefined): number | null => {
    if (!value || value.trim() === "") return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const onSubmit = async (data: SemesterFormData) => {
    try {
      const targetSpi = parseOptionalNumber(data.target_spi);
      const spi = parseOptionalNumber(data.spi);
      const creditsTotal = parseOptionalNumber(data.credits_total);

      const newSemester = await createSemester.mutateAsync({
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        color: data.color,
        icon: null,
        target_spi: targetSpi,
        spi: data.is_quick_input ? spi : null,
        credits_earned: null,
        credits_total: creditsTotal,
        is_quick_input: data.is_quick_input,
        status: data.status,
        is_archived: data.status === "completed",
        sort_order: 0,
        deleted_at: null,
      });

      // If ongoing, apply accent color
      if (data.status === "ongoing") {
        setAccentColor(data.color);
      }

      toast.success(`Created ${data.name}`);
      onClose();
    } catch {
      toast.error("Failed to create semester");
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white/8 dark:bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-6 m-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedColor}20` }}
                  >
                    <GraduationCap className="w-5 h-5" style={{ color: selectedColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">New Semester</h2>
                    <p className="text-xs text-muted-foreground">Add a new semester to track</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Semester Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="e.g., Semester 6"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Calendar className="inline w-3.5 h-3.5 mr-1.5" />
                      Start Date
                    </label>
                    <ThemedDateInput
                      value={watch("start_date")}
                      onChange={(value) => setValue("start_date", value, { shouldValidate: true })}
                    />
                    <input type="hidden" {...register("start_date")} />
                    {errors.start_date && (
                      <p className="mt-1 text-xs text-red-400">{errors.start_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Date
                    </label>
                    <ThemedDateInput
                      value={watch("end_date")}
                      onChange={(value) => setValue("end_date", value, { shouldValidate: true })}
                    />
                    <input type="hidden" {...register("end_date")} />
                    {errors.end_date && (
                      <p className="mt-1 text-xs text-red-400">{errors.end_date.message}</p>
                    )}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Palette className="inline w-3.5 h-3.5 mr-1.5" />
                    Accent Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue("color", color)}
                        className="relative w-8 h-8 rounded-lg transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <motion.div
                            layoutId="color-selected"
                            className="absolute inset-0 rounded-lg ring-2 ring-white ring-offset-2 ring-offset-[rgb(var(--background))]"
                          />
                        )}
                      </button>
                    ))}
                    <ThemedColorPicker
                      value={selectedColor}
                      onChange={(value) => setValue("color", value, { shouldValidate: true })}
                      colors={PRESET_COLORS}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {(["upcoming", "ongoing", "completed"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setValue("status", s)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                          status === s
                            ? "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))] ring-1 ring-[rgba(var(--accent-rgb),0.3)]"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick input toggle (for completed semesters) */}
                {status === "completed" && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <input
                      type="checkbox"
                      {...register("is_quick_input")}
                      id="quick-input"
                      className="w-4 h-4 rounded accent-[rgb(var(--accent))]"
                    />
                    <label htmlFor="quick-input" className="text-sm text-foreground">
                      Quick input (skip subjects, enter SPI directly)
                    </label>
                  </div>
                )}

                {/* SPI for quick input */}
                {status === "completed" && isQuickInput && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SPI Obtained
                    </label>
                    <input
                      {...register("spi")}
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g., 8.5"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all"
                    />
                  </div>
                )}

                {/* Target SPI and Credits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Target className="inline w-3.5 h-3.5 mr-1.5" />
                      Target SPI
                    </label>
                    <input
                      {...register("target_spi")}
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="e.g., 8.5"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Total Credits
                    </label>
                    <input
                      {...register("credits_total")}
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 24"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(var(--accent-rgb),0.2)] hover:bg-[rgba(var(--accent-rgb),0.3)] text-[rgb(var(--accent))] font-medium transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Semester"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
