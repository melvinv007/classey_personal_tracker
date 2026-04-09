"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Palette, User, Clock, Award, Trash2, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useData } from "@/hooks/use-data";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { ThemedTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Subject } from "@/types/database";
import { generateSchedulesFromSlot, parseSubSlots, getDayName } from "@/utils/slots";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  short_name: z.string().min(1, "Short name is required").max(10),
  code: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
  credits: z.string().min(1, "Credits required"),
  type: z.enum(["theory", "lab", "practical", "project", "other"]),
  attendance_requirement: z.string().optional(),
  teacher_name: z.string().optional(),
  teacher_email: z.string().email().optional().or(z.literal("")),
  grade: z.string().optional(),
});

type SubjectFormData = z.infer<typeof subjectSchema>;
type ScheduleMode = "slot" | "manual";

const PRESET_COLORS = ["#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#06B6D4", "#3B82F6", "#6366F1", "#84CC16", "#F97316"];
const SUBJECT_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "lab", label: "Lab" },
  { value: "practical", label: "Practical" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
] as const;
const GRADES = ["S", "A", "B", "C", "D", "E", "F", "I", "W"];

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onDelete?: () => void | Promise<void>;
}

const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalVariants = { hidden: { opacity: 0, scale: 0.95, y: 10 }, visible: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 10 } };

const dayOptions: Array<{ value: 1 | 2 | 3 | 4 | 5 | 6; label: string }> = [
  { value: 1, label: "Mon" }, { value: 2, label: "Tue" }, { value: 3, label: "Wed" },
  { value: 4, label: "Thu" }, { value: 5, label: "Fri" }, { value: 6, label: "Sat" },
];

export function EditSubjectModal({ isOpen, onClose, subject, onDelete }: EditSubjectModalProps) {
  const {
    updateSubject,
    getSchedulesBySubject,
    deleteClassSchedule,
    addClassSchedule,
    slots,
    isMutating,
  } = useData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("manual");
  const [manualDayOfWeek, setManualDayOfWeek] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualEndTime, setManualEndTime] = useState("10:00");
  const [manualRoom, setManualRoom] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedSubSlotIds, setSelectedSubSlotIds] = useState<string[]>([]);

  const schedules = getSchedulesBySubject(subject.$id);
  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.$id === selectedSlotId),
    [slots, selectedSlotId]
  );
  const selectedSlotSubSlots = selectedSlot ? parseSubSlots(selectedSlot) : [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: subject.name,
      short_name: subject.short_name,
      code: subject.code ?? "",
      color: subject.color,
      credits: subject.credits.toString(),
      type: subject.type,
      attendance_requirement: (subject.attendance_requirement_percent ?? 75).toString(),
      teacher_name: subject.teacher_name ?? "",
      teacher_email: subject.teacher_email ?? "",
      grade: subject.grade ?? "",
    },
  });

  const selectedColor = watch("color");
  const selectedType = watch("type");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: subject.name,
        short_name: subject.short_name,
        code: subject.code ?? "",
        color: subject.color,
        credits: subject.credits.toString(),
        type: subject.type,
        attendance_requirement: (subject.attendance_requirement_percent ?? 75).toString(),
        teacher_name: subject.teacher_name ?? "",
        teacher_email: subject.teacher_email ?? "",
        grade: subject.grade ?? "",
      });
    }
  }, [isOpen, subject, reset]);

  const onSubmit = async (data: SubjectFormData): Promise<void> => {
    try {
      await updateSubject(subject.$id, {
        name: data.name,
        short_name: data.short_name.toUpperCase(),
        code: data.code || null,
        color: data.color,
        credits: parseInt(data.credits, 10),
        type: data.type,
        attendance_requirement_percent: data.attendance_requirement ? parseInt(data.attendance_requirement, 10) : 75,
        teacher_name: data.teacher_name || null,
        teacher_email: data.teacher_email || null,
        grade: data.grade || null,
      });
      toast.success(`Updated ${data.name}`);
      onClose();
    } catch {
      toast.error("Failed to update subject");
    }
  };

  const addManualSchedule = async (): Promise<void> => {
    try {
      if (manualStartTime >= manualEndTime) {
        toast.error("End time must be after start time");
        return;
      }
      await addClassSchedule({
        subject_id: subject.$id,
        slot_id: null,
        sub_slot_id: null,
        day_of_week: manualDayOfWeek,
        start_time: manualStartTime,
        end_time: manualEndTime,
        room: manualRoom.trim() || null,
        building: null,
        effective_from: subject.start_date ?? new Date().toISOString().split("T")[0],
        effective_until: null,
        deleted_at: null,
      });
      toast.success("Schedule added");
    } catch {
      toast.error("Failed to add schedule");
    }
  };

  const addSlotSchedules = async (): Promise<void> => {
    try {
      if (!selectedSlot) {
        toast.error("Select a slot first");
        return;
      }
      const generated = generateSchedulesFromSlot(
        subject.$id,
        selectedSlot,
        selectedSubSlotIds,
        subject.start_date ?? new Date().toISOString().split("T")[0]
      );
      for (const schedule of generated) {
        await addClassSchedule(schedule);
      }
      toast.success("Slot schedules added");
      setSelectedSubSlotIds([]);
    } catch {
      toast.error("Failed to add slot schedules");
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDeleteConfirm) setShowDeleteConfirm(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, showDeleteConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" transition={{ type: "spring", stiffness: 400, damping: 35 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-white/8 dark:bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-6 m-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selectedColor}20` }}>
                    <BookOpen className="w-5 h-5" style={{ color: selectedColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Edit Subject</h2>
                    <p className="text-xs text-muted-foreground">Modify subject + schedule</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {showDeleteConfirm ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-foreground mb-2">Are you sure you want to delete <strong>{subject.name}</strong>?</p>
                    <p className="text-xs text-muted-foreground">This will delete linked data too.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-foreground font-medium transition-all">Cancel</button>
                    <button onClick={() => { void onDelete?.(); onClose(); }} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-all">Delete Subject</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Subject Name</label>
                      <input {...register("name")} type="text" className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Short</label>
                      <input {...register("short_name")} type="text" maxLength={10} className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground uppercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input {...register("code")} type="text" placeholder="Course Code" className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground" />
                    <input {...register("credits")} type="number" min="1" max="10" className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-wrap gap-1.5">
                      {SUBJECT_TYPES.map((type) => (
                        <button key={type.value} type="button" onClick={() => setValue("type", type.value)} className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all", selectedType === type.value ? "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))]" : "bg-white/5 text-muted-foreground hover:bg-white/10")}>
                          {type.label}
                        </button>
                      ))}
                    </div>
                    <ThemedSelect
                      value={watch("grade") || "__none__"}
                      onChange={(value) => setValue("grade", value === "__none__" ? "" : value, { shouldValidate: true })}
                      options={[{ value: "__none__", label: "Not graded" }, ...GRADES.map((g) => ({ value: g, label: g }))]}
                    />
                    <input type="hidden" {...register("grade")} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button key={color} type="button" onClick={() => setValue("color", color)} className="relative w-8 h-8 rounded-lg transition-transform hover:scale-110" style={{ backgroundColor: color }}>
                        {selectedColor === color && <motion.div layoutId="edit-subject-color" className="absolute inset-0 rounded-lg ring-2 ring-white ring-offset-2 ring-offset-[rgb(var(--background))]" />}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/10 p-4 bg-white/3">
                    <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Schedule Manager
                    </p>
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => setScheduleMode("manual")} className={cn("px-3 py-1.5 rounded-lg text-xs transition-all", scheduleMode === "manual" ? "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))]" : "bg-white/5 text-muted-foreground")}>Manual</button>
                      <button type="button" onClick={() => setScheduleMode("slot")} className={cn("px-3 py-1.5 rounded-lg text-xs transition-all", scheduleMode === "slot" ? "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))]" : "bg-white/5 text-muted-foreground")}>Slot info</button>
                    </div>

                    {scheduleMode === "manual" ? (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <ThemedSelect
                          value={String(manualDayOfWeek)}
                          onChange={(value) => setManualDayOfWeek(Number(value) as 1 | 2 | 3 | 4 | 5 | 6)}
                          options={dayOptions.map((day) => ({ value: String(day.value), label: day.label }))}
                          className="px-3 py-2 text-sm"
                        />
                        <input value={manualRoom} onChange={(e) => setManualRoom(e.target.value)} placeholder="Room (optional)" className="px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-sm text-foreground" />
                        <ThemedTimeInput value={manualStartTime} onChange={setManualStartTime} className="px-3 py-2 text-sm" />
                        <ThemedTimeInput value={manualEndTime} onChange={setManualEndTime} className="px-3 py-2 text-sm" />
                        <button type="button" onClick={() => void addManualSchedule()} className="col-span-2 px-3 py-2 rounded-lg bg-[rgba(var(--accent-rgb),0.15)] hover:bg-[rgba(var(--accent-rgb),0.25)] text-sm text-[rgb(var(--accent))]">+ Add Manual Schedule</button>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-3">
                        <ThemedSelect
                          value={selectedSlotId || "__none__"}
                          onChange={(value) => {
                            setSelectedSlotId(value === "__none__" ? "" : value);
                            setSelectedSubSlotIds([]);
                          }}
                          options={[
                            { value: "__none__", label: "Select slot" },
                            ...slots.map((slot) => ({ value: slot.$id, label: slot.name })),
                          ]}
                          className="px-3 py-2 text-sm"
                        />
                        {selectedSlotSubSlots.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedSlotSubSlots.map((sub) => (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() =>
                                  setSelectedSubSlotIds((prev) =>
                                    prev.includes(sub.id) ? prev.filter((item) => item !== sub.id) : [...prev, sub.id]
                                  )
                                }
                                className={cn(
                                  "px-2 py-1 rounded-md text-xs border transition-colors",
                                  selectedSubSlotIds.includes(sub.id)
                                    ? "bg-[rgba(var(--accent-rgb),0.2)] border-[rgba(var(--accent-rgb),0.3)] text-[rgb(var(--accent))]"
                                    : "bg-white/5 border-white/10 text-muted-foreground"
                                )}
                              >
                                {sub.id} ({getDayName(sub.day_of_week, true)} {sub.start_time}-{sub.end_time})
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => void addSlotSchedules()}
                          className="w-full px-3 py-2 rounded-lg bg-[rgba(var(--accent-rgb),0.15)] hover:bg-[rgba(var(--accent-rgb),0.25)] text-sm text-[rgb(var(--accent))]"
                        >
                          + Add Slot Schedule(s)
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {schedules.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No schedules yet.</p>
                      ) : (
                        schedules.map((schedule) => (
                          <div key={schedule.$id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                            <p className="text-xs text-foreground">
                              {getDayName(schedule.day_of_week, true)} • {schedule.start_time}-{schedule.end_time}
                              {schedule.room ? ` • ${schedule.room}` : ""}
                            </p>
                            <button type="button" onClick={() => void deleteClassSchedule(schedule.$id)} className="text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400">
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 rounded-xl bg-white/3 border border-white/8">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Teacher Info
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <input {...register("teacher_name")} type="text" placeholder="Name" className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground text-sm" />
                      <input {...register("teacher_email")} type="email" placeholder="Email" className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground text-sm" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowDeleteConfirm(true)} className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all" title="Delete subject">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground font-medium transition-all">Cancel</button>
                    <button type="submit" disabled={isSubmitting || isMutating} className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(var(--accent-rgb),0.2)] hover:bg-[rgba(var(--accent-rgb),0.3)] text-[rgb(var(--accent))] font-medium transition-all disabled:opacity-50">
                      {isSubmitting || isMutating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
