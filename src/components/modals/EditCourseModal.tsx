"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface EditCourseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** The raw course data being edited */
  data: Record<string, unknown> | null;
  /** Field definitions to render */
  fields: FieldDef[];
  /** Called with updated key-value pairs */
  onSave: (updates: Record<string, unknown>) => Promise<void>;
  isPending?: boolean;
}

export function EditCourseModal({
  open,
  onClose,
  title,
  data,
  fields,
  onSave,
  isPending = false,
}: EditCourseModalProps) {
  const [form, setForm] = useState<Record<string, unknown>>({});

  // Sync form state when data changes
  useEffect(() => {
    if (data) {
      const init: Record<string, unknown> = {};
      for (const f of fields) {
        init[f.key] = data[f.key] ?? (f.type === "number" ? 0 : f.type === "boolean" ? false : "");
      }
      setForm(init);
    }
  }, [data, fields]);

  const handleSave = useCallback(async () => {
    // Build updates — only changed fields
    const updates: Record<string, unknown> = {};
    for (const f of fields) {
      const newVal = form[f.key];
      const oldVal = data?.[f.key];
      if (newVal !== oldVal) {
        updates[f.key] = newVal;
      }
    }
    if (Object.keys(updates).length > 0) {
      await onSave(updates);
    }
    onClose();
  }, [form, data, fields, onSave, onClose]);

  if (!open || !data) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="glass-elevated relative z-10 w-full max-w-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="space-y-4">
                {fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {f.label}
                    </label>
                    {f.type === "text" && (
                      <input
                        type="text"
                        value={String(form[f.key] ?? "")}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value || null }))}
                        placeholder={f.placeholder}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-accent/50"
                      />
                    )}
                    {f.type === "number" && (
                      <input
                        type="number"
                        value={Number(form[f.key] ?? 0)}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors focus:border-accent/50"
                      />
                    )}
                    {f.type === "boolean" && (
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, [f.key]: !p[f.key] }))}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={cn(
                            "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                            form[f.key] ? "bg-accent" : "bg-white/20",
                          )}
                        >
                          <motion.div
                            className="h-4 w-4 rounded-full bg-white shadow-sm"
                            animate={{ x: form[f.key] ? 14 : 0 }}
                          />
                        </div>
                        <span className="text-sm">{form[f.key] ? "Yes" : "No"}</span>
                      </button>
                    )}
                    {f.type === "select" && f.options && (
                      <select
                        value={String(form[f.key] ?? "")}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value || null }))}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      >
                        <option value="">—</option>
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={onClose}
                className="btn-muted-themed px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="btn-themed flex items-center gap-2 px-4 py-2 text-sm"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
