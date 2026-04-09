"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { useSettings, useUpdateExam } from "@/hooks/use-appwrite";
import type { Exam, ReminderOffset } from "@/types/database";
import { ReminderOffsetsEditor } from "@/components/forms/ReminderOffsetsEditor";
import { parseReminderOffsetsJson, serializeReminderOffsetsJson } from "@/lib/appwrite-db";

interface EditExamMarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
}

export function EditExamMarksModal({
  isOpen,
  onClose,
  exam,
}: EditExamMarksModalProps): React.ReactNode {
  const { data: settings } = useSettings();
  const [marksObtained, setMarksObtained] = useState<string>(
    exam?.marks_obtained?.toString() ?? ""
  );
  const [reminderOffsets, setReminderOffsets] = useState<ReminderOffset[] | null>(null);
  const updateExamMutation = useUpdateExam();

  const effectiveReminderOffsets = useMemo<ReminderOffset[]>(() => {
    if (!exam) return [{ value: 24, unit: "hours" }, { value: 2, unit: "hours" }];
    const examOffsets = parseReminderOffsetsJson(exam.reminder_offsets_json);
    if (examOffsets.length > 0) {
      return examOffsets;
    }
    const defaults = parseReminderOffsetsJson(settings?.exam_default_reminder_offsets_json ?? null);
    return defaults.length > 0 ? defaults : [{ value: 24, unit: "hours" }, { value: 2, unit: "hours" }];
  }, [exam, settings?.exam_default_reminder_offsets_json]);

  if (!isOpen || !exam) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const marks = marksObtained ? parseFloat(marksObtained) : null;

    if (marks !== null && (marks < 0 || marks > exam.marks_total)) {
      toast.error(`Marks must be between 0 and ${exam.marks_total}`);
      return;
    }

    try {
      await updateExamMutation.mutateAsync({
        id: exam.$id,
        data: {
          marks_obtained: marks,
          reminder_offsets_json: serializeReminderOffsetsJson(reminderOffsets ?? effectiveReminderOffsets),
        },
      });
      toast.success("Marks updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update marks");
      console.error(error);
    }
  };

  const percentage = marksObtained
    ? ((parseFloat(marksObtained) / exam.marks_total) * 100).toFixed(1)
    : null;

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "text-green-400";
    if (pct >= 60) return "text-yellow-400";
    if (pct >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getGradeIndicator = (pct: number) => {
    if (pct >= 80) return { icon: TrendingUp, text: "Excellent", color: "text-green-400" };
    if (pct >= 60) return { icon: Minus, text: "Good", color: "text-yellow-400" };
    if (pct >= 40) return { icon: TrendingDown, text: "Needs Improvement", color: "text-orange-400" };
    return { icon: TrendingDown, text: "At Risk", color: "text-red-400" };
  };

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
          className="w-full max-w-md bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent),0.2)] flex items-center justify-center">
                <Award className="w-5 h-5 text-[rgb(var(--accent))]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Enter Marks</h2>
                <p className="text-sm text-muted-foreground">{exam.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Marks Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Marks Obtained
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={exam.marks_total}
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(e.target.value)}
                  placeholder="Enter marks"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-2xl font-bold text-center placeholder:text-muted-foreground placeholder:font-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  / {exam.marks_total}
                </span>
              </div>
            </div>

            {/* Percentage Display */}
            {percentage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Percentage</span>
                  <span className={`text-2xl font-bold ${getPercentageColor(parseFloat(percentage))}`}>
                    {percentage}%
                  </span>
                </div>
                {(() => {
                  const grade = getGradeIndicator(parseFloat(percentage));
                  const GradeIcon = grade.icon;
                  return (
                    <div className={`flex items-center gap-2 mt-2 ${grade.color}`}>
                      <GradeIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{grade.text}</span>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMarksObtained("")}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setMarksObtained(exam.marks_total.toString())}
                className="flex-1 px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-medium transition-colors"
              >
                Full Marks
              </button>
            </div>

            <ReminderOffsetsEditor
              label="Exam reminders"
              description="Custom offsets for this exam."
              value={reminderOffsets ?? effectiveReminderOffsets}
              onChange={setReminderOffsets}
            />

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateExamMutation.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updateExamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Marks"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
