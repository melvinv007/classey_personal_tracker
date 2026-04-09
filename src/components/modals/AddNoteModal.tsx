"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, StickyNote, Pin } from "lucide-react";
import { useState } from "react";
import { useCreateNote } from "@/hooks/use-appwrite";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  occurrenceId?: string | null;
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

export function AddNoteModal({
  isOpen,
  onClose,
  subjectId,
  occurrenceId = null,
}: AddNoteModalProps): React.ReactNode {
  const createNote = useCreateNote();

  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Note content is required");
      return;
    }

    createNote.mutate({
      subject_id: subjectId,
      occurrence_id: occurrenceId,
      content: content.trim(),
      is_pinned: isPinned,
      deleted_at: null,
    }, {
      onSuccess: () => {
        toast.success("Note added!");
        handleClose();
      },
      onError: () => {
        toast.error("Failed to create note");
      },
    });
  };

  const handleClose = (): void => {
    setContent("");
    setIsPinned(false);
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent),0.15)] flex items-center justify-center">
                  <StickyNote className="w-5 h-5 text-[rgb(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Add Note</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Note *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={6}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] resize-none"
                />
              </div>

              {/* Pin toggle */}
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-xl transition-all",
                  isPinned
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                <Pin className={cn("w-5 h-5", isPinned && "fill-current")} />
                <span className="font-medium">{isPinned ? "Pinned" : "Pin this note"}</span>
              </button>

              {/* Occurrence context */}
              {occurrenceId && (
                <p className="text-xs text-muted-foreground bg-white/5 px-3 py-2 rounded-lg">
                  This note will be attached to a specific class session.
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[rgb(var(--accent))] hover:opacity-90 text-white font-semibold transition-opacity"
              >
                Add Note
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
