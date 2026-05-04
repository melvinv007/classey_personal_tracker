"use client";

import type { Holiday, Semester } from "@/types/database";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface SemesterHolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  semester: Semester | null;
  holidays: Holiday[];
  onCreateHoliday: (
    payload: Omit<
      Holiday,
      | "$id"
      | "$createdAt"
      | "$updatedAt"
      | "$collectionId"
      | "$databaseId"
      | "$permissions"
    >,
  ) => Promise<void>;
  onUpdateHoliday: (id: string, payload: Partial<Holiday>) => Promise<void>;
  onDeleteHoliday: (id: string) => Promise<void>;
}

function buildHolidayDescription(semesterId: string, note: string): string {
  return `semester:${semesterId}|type:holiday|note:${encodeURIComponent(note)}`;
}

function parseHolidayNote(
  semesterId: string,
  description: string | null,
): string {
  if (!description) return "";
  const prefix = `semester:${semesterId}|`;
  if (!description.startsWith(prefix)) return description;
  const notePart = description
    .slice(prefix.length)
    .split("|")
    .find((part) => part.startsWith("note:"));
  if (!notePart) return "";
  try {
    return decodeURIComponent(notePart.replace("note:", ""));
  } catch {
    return notePart.replace("note:", "");
  }
}

export function SemesterHolidaysModal({
  isOpen,
  onClose,
  semester,
  holidays,
  onCreateHoliday,
  onUpdateHoliday,
  onDeleteHoliday,
}: SemesterHolidaysModalProps): React.ReactNode {
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays],
  );

  useEffect(() => {
    if (!isOpen || !semester) return;
    setEditingHolidayId(null);
    setName("");
    setStartDate(semester.start_date);
    setEndDate(semester.start_date);
    setNote("");
  }, [isOpen, semester]);

  if (!isOpen || !semester) return null;

  const resetForm = (): void => {
    setEditingHolidayId(null);
    setName("");
    setStartDate(semester.start_date);
    setEndDate(semester.start_date);
    setNote("");
  };

  const startEdit = (holiday: Holiday): void => {
    setEditingHolidayId(holiday.$id);
    setName(holiday.name);
    setStartDate(holiday.date);
    setEndDate(holiday.date_end ?? holiday.date);
    setNote(parseHolidayNote(semester.$id, holiday.description));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      toast.error("Please enter a holiday name.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (startDate > endDate) {
      toast.error("End date must be on or after start date.");
      return;
    }
    if (startDate < semester.start_date || endDate > semester.end_date) {
      toast.error("Holiday dates must stay within the selected semester.");
      return;
    }

    const cleanName = name.trim();
    const cleanNote = note.trim() || cleanName;
    const payload = {
      name: cleanName,
      date: startDate,
      date_end: startDate === endDate ? null : endDate,
      description: buildHolidayDescription(semester.$id, cleanNote),
    };

    setIsSaving(true);
    try {
      if (editingHolidayId) {
        await onUpdateHoliday(editingHolidayId, payload);
        toast.success("Holiday updated.");
      } else {
        await onCreateHoliday({ ...payload, deleted_at: null });
        toast.success("Holiday added.");
      }
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save holiday.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (holidayId: string): Promise<void> => {
    setDeletingId(holidayId);
    try {
      await onDeleteHoliday(holidayId);
      if (editingHolidayId === holidayId) {
        resetForm();
      }
      toast.success("Holiday deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete holiday.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="w-full max-w-2xl rounded-2xl border border-white/12 bg-background/95 p-5 shadow-2xl"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Semester Holidays
              </h2>
              <p className="text-sm text-muted-foreground">
                {semester.name} • Add and edit as many holiday dates as needed.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Holiday Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="E.g. Mid-sem break"
                  className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    min={semester.start_date}
                    max={semester.end_date}
                    className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    min={startDate || semester.start_date}
                    max={semester.end_date}
                    className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  placeholder="Optional note for this period"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => void handleSubmit()}
                  disabled={isSaving}
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[rgba(var(--accent),0.2)] px-3 py-2.5 text-sm font-medium text-[rgb(var(--accent))] transition-colors hover:bg-[rgba(var(--accent),0.3)] disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingHolidayId ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingHolidayId ? "Update Holiday" : "Add Holiday"}
                </button>
                {editingHolidayId && (
                  <button
                    onClick={resetForm}
                    type="button"
                    className="rounded-xl bg-white/6 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/4 p-3">
              <p className="mb-2 text-sm font-medium text-foreground">
                Existing Holidays
              </p>
              {sortedHolidays.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground">
                  No holidays added for this semester yet.
                </div>
              ) : (
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                  {sortedHolidays.map((holiday) => (
                    <div
                      key={holiday.$id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {holiday.name}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {holiday.date}
                            {(holiday.date_end ?? holiday.date) !== holiday.date
                              ? ` → ${holiday.date_end}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(holiday)}
                            type="button"
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDelete(holiday.$id)}
                            disabled={deletingId === holiday.$id}
                            type="button"
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-60"
                          >
                            {deletingId === holiday.$id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
