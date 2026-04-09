"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isDanger?: boolean;
  isProcessing?: boolean;
}

export function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDanger = true,
  isProcessing = false,
}: ConfirmActionModalProps): React.ReactNode {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-3xl border border-white/12 bg-white/8 p-6 backdrop-blur-2xl">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="interactive-focus flex-1 rounded-xl bg-white/6 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void onConfirm();
                  }}
                  disabled={isProcessing}
                  className={`interactive-focus flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    isDanger
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-[rgba(var(--accent),0.2)] text-[rgb(var(--accent))] hover:bg-[rgba(var(--accent),0.3)]"
                  }`}
                >
                  {isProcessing ? "Processing..." : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

