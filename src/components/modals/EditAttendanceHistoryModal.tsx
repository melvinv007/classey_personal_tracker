"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import type { ClassOccurrence } from "@/types/database";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { ThemedDateInput, ThemedTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { cn } from "@/lib/utils";

interface AttendanceDraft {
  date: string;
  start_time: string;
  end_time: string;
  attendanceState: "present" | "absent" | "cancelled" | "unmarked";
  attendance_note: string;
}

interface EditAttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectColor: string;
  occurrences: ClassOccurrence[];
  onSave: (occurrenceId: string, changes: Partial<ClassOccurrence>) => Promise<void>;
  onDelete: (occurrenceId: string) => Promise<void>;
}

export function EditAttendanceHistoryModal({
  isOpen,
  onClose,
  subjectColor,
  occurrences,
  onSave,
  onDelete,
}: EditAttendanceHistoryModalProps): React.ReactNode {
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedOccurrences = useMemo(() => {
    return [...occurrences].sort((a, b) => {
      const left = `${a.date}T${a.start_time}`;
      const right = `${b.date}T${b.start_time}`;
      return right.localeCompare(left);
    });
  }, [occurrences]);

  const getDraft = (occurrence: ClassOccurrence): AttendanceDraft => {
    const existing = drafts[occurrence.$id];
    if (existing) return existing;

    return {
      date: occurrence.date,
      start_time: occurrence.start_time,
      end_time: occurrence.end_time,
      attendanceState:
        occurrence.status === "cancelled"
          ? "cancelled"
          : occurrence.attendance ?? "unmarked",
      attendance_note: occurrence.attendance_note ?? "",
    };
  };

  const updateDraft = (
    occurrenceId: string,
    updater: (previous: AttendanceDraft) => AttendanceDraft
  ): void => {
    setDrafts((previous) => {
      const currentOccurrence = occurrences.find((item) => item.$id === occurrenceId);
      if (!currentOccurrence) return previous;
      const currentDraft = previous[occurrenceId] ?? getDraft(currentOccurrence);
      return {
        ...previous,
        [occurrenceId]: updater(currentDraft),
      };
    });
  };

  const buildChanges = (draft: AttendanceDraft): Partial<ClassOccurrence> => {
    if (draft.attendanceState === "cancelled") {
      return {
        date: draft.date,
        start_time: draft.start_time,
        end_time: draft.end_time,
        status: "cancelled",
        attendance: null,
        cancellation_reason: "Edited as cancelled",
        attendance_marked_at: null,
        attendance_note: draft.attendance_note.trim() || null,
      };
    }

    if (draft.attendanceState === "unmarked") {
      return {
        date: draft.date,
        start_time: draft.start_time,
        end_time: draft.end_time,
        status: "scheduled",
        attendance: null,
        cancellation_reason: null,
        attendance_marked_at: null,
        attendance_note: draft.attendance_note.trim() || null,
      };
    }

    return {
      date: draft.date,
      start_time: draft.start_time,
      end_time: draft.end_time,
      status: "completed",
      attendance: draft.attendanceState,
      cancellation_reason: null,
      attendance_marked_at: new Date().toISOString(),
      attendance_note: draft.attendance_note.trim() || null,
    };
  };

  const handleSave = async (occurrenceId: string, draft: AttendanceDraft): Promise<void> => {
    setSavingId(occurrenceId);
    try {
      await onSave(occurrenceId, buildChanges(draft));
      toast.success("Attendance updated");
    } catch (error) {
      toast.error("Failed to update attendance");
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (occurrenceId: string): Promise<void> => {
    setDeletingId(occurrenceId);
    try {
      await onDelete(occurrenceId);
      toast.success("Attendance entry deleted");
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[occurrenceId];
        return next;
      });
    } catch (error) {
      toast.error("Failed to delete attendance entry");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 md:p-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="mx-auto mt-4 md:mt-10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Edit Attendance History</h2>
              <p className="text-sm text-muted-foreground">Update or delete past attendance records.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 md:p-5 overflow-y-auto max-h-[calc(90vh-74px)] space-y-3">
            {sortedOccurrences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              sortedOccurrences.map((occurrence) => {
                const draft = getDraft(occurrence);
                const dateLabel = format(parseISO(draft.date), "MMM d, yyyy");

                return (
                  <div
                    key={occurrence.$id}
                    className="rounded-2xl border border-white/10 bg-white/4 p-3 md:p-4"
                    style={{ boxShadow: `0 0 0 1px ${subjectColor}22 inset` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-foreground">{dateLabel}</p>
                      <button
                        onClick={() => void handleDelete(occurrence.$id)}
                        disabled={deletingId === occurrence.$id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                      <ThemedDateInput
                        value={draft.date}
                        onChange={(value) => updateDraft(occurrence.$id, (prev) => ({ ...prev, date: value }))}
                      />
                      <ThemedTimeInput
                        value={draft.start_time}
                        onChange={(value) => updateDraft(occurrence.$id, (prev) => ({ ...prev, start_time: value }))}
                      />
                      <ThemedTimeInput
                        value={draft.end_time}
                        onChange={(value) => updateDraft(occurrence.$id, (prev) => ({ ...prev, end_time: value }))}
                      />
                      <ThemedSelect
                        value={draft.attendanceState}
                        onChange={(value) =>
                          updateDraft(occurrence.$id, (prev) => ({
                            ...prev,
                            attendanceState: value as AttendanceDraft["attendanceState"],
                          }))
                        }
                        options={[
                          { value: "present", label: "Present" },
                          { value: "absent", label: "Absent" },
                          { value: "cancelled", label: "Cancelled" },
                          { value: "unmarked", label: "Unmarked" },
                        ]}
                      />
                      <button
                        onClick={() => void handleSave(occurrence.$id, draft)}
                        disabled={savingId === occurrence.$id}
                        className={cn(
                          "px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                          "bg-[rgba(var(--accent),0.2)] hover:bg-[rgba(var(--accent),0.3)] text-[rgb(var(--accent))]",
                          "disabled:opacity-50"
                        )}
                      >
                        {savingId === occurrence.$id ? "Saving..." : "Save"}
                      </button>
                    </div>

                    <input
                      value={draft.attendance_note}
                      onChange={(event) =>
                        updateDraft(occurrence.$id, (prev) => ({
                          ...prev,
                          attendance_note: event.target.value,
                        }))
                      }
                      placeholder="Attendance note (optional)"
                      className="w-full px-3 py-2 rounded-xl bg-white/6 border border-white/10 text-sm text-foreground placeholder:text-white/40"
                    />
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

