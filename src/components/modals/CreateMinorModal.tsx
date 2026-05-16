"use client";

import { cn } from "@/lib/utils";
import { useCreateMinor } from "@/hooks/use-appwrite";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, X, Loader2 } from "lucide-react";
import { useState } from "react";

interface CreateMinorModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateMinorModal({ open, onClose }: CreateMinorModalProps) {
  const [name, setName] = useState("");
  const [creditsRequired, setCreditsRequired] = useState(30);
  const [coursesRequired, setCoursesRequired] = useState(5);
  const createMinor = useCreateMinor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createMinor.mutateAsync({
      name: name.trim(),
      credits_required: creditsRequired,
      courses_required: coursesRequired,
    });

    setName("");
    setCreditsRequired(30);
    setCoursesRequired(5);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="glass-elevated relative z-10 w-full max-w-md overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "rgba(var(--accent-rgb), 0.15)" }}
                >
                  <GraduationCap className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold">Create Minor</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Minor Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                  autoFocus
                  required
                />
              </div>

              {/* Credits & Courses row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Credits Required
                  </label>
                  <input
                    type="number"
                    value={creditsRequired}
                    onChange={(e) => setCreditsRequired(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Courses Required
                  </label>
                  <input
                    type="number"
                    value={coursesRequired}
                    onChange={(e) => setCoursesRequired(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-muted-themed px-4 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || createMinor.isPending}
                  className={cn(
                    "btn-themed flex items-center gap-2 px-5 py-2.5 text-sm font-medium",
                    (!name.trim() || createMinor.isPending) && "opacity-50 pointer-events-none",
                  )}
                >
                  {createMinor.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Minor
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
