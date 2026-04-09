"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Palette, User, Clock, Award, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useData } from "@/hooks/use-data";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { ThemedTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
});

type SubjectFormData = z.infer<typeof subjectSchema>;
type ScheduleMode = "slot" | "manual";

const PRESET_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#84CC16",
  "#F97316",
];

const SUBJECT_TYPES = [
  { value: "theory", label: "Theory", description: "Lecture-based class" },
  { value: "lab", label: "Lab", description: "Practical lab session" },
  { value: "practical", label: "Practical", description: "Hands-on work" },
  { value: "project", label: "Project", description: "Project-based" },
  { value: "other", label: "Other", description: "Other type" },
] as const;

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesterId: string;
  semesterColor?: string;
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

const dayOptions: Array<{ value: 1 | 2 | 3 | 4 | 5 | 6; label: string }> = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function CreateSubjectModal({
  isOpen,
  onClose,
  semesterId,
  semesterColor = "#8B5CF6",
}: CreateSubjectModalProps) {
  const { addSubject, addClassSchedule, getSemesterById, slots, isMutating } = useData();
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("slot");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedSubSlotIds, setSelectedSubSlotIds] = useState<string[]>([]);
  const [manualDayOfWeek, setManualDayOfWeek] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualEndTime, setManualEndTime] = useState("10:00");
  const [manualRoom, setManualRoom] = useState("");

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
      name: "",
      short_name: "",
      code: "",
      color: semesterColor,
      credits: "3",
      type: "theory",
      attendance_requirement: "75",
      teacher_name: "",
      teacher_email: "",
    },
  });

  const selectedColor = watch("color");
  const selectedType = watch("type");
  const semester = getSemesterById(semesterId);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.$id === selectedSlotId),
    [slots, selectedSlotId]
  );
  const selectedSlotSubSlots = selectedSlot ? parseSubSlots(selectedSlot) : [];

  useEffect(() => {
    if (!isOpen) {
      reset({
        name: "",
        short_name: "",
        code: "",
        color: semesterColor,
        credits: "3",
        type: "theory",
        attendance_requirement: "75",
        teacher_name: "",
        teacher_email: "",
      });
      setScheduleMode("slot");
      setSelectedSlotId("");
      setSelectedSubSlotIds([]);
      setManualDayOfWeek(1);
      setManualStartTime("09:00");
      setManualEndTime("10:00");
      setManualRoom("");
    }
  }, [isOpen, reset, semesterColor]);

  const onSubmit = async (data: SubjectFormData): Promise<void> => {
    try {
      if (!semester) {
        throw new Error("Semester not found");
      }
      if (scheduleMode === "slot" && !selectedSlotId) {
        throw new Error("Select a slot");
      }
      if (scheduleMode === "manual" && manualStartTime >= manualEndTime) {
        throw new Error("Manual end time must be after start time");
      }

      const slotIdsForSubject =
        scheduleMode === "slot"
          ? selectedSubSlotIds.length > 0
            ? selectedSubSlotIds
            : [selectedSlotId]
          : [];

      const createdSubject = await addSubject({
        semester_id: semesterId,
        name: data.name,
        short_name: data.short_name.toUpperCase(),
        code: data.code || null,
        start_date: null,
        end_date: null,
        color: data.color,
        icon: null,
        attendance_requirement_percent: data.attendance_requirement
          ? parseInt(data.attendance_requirement, 10)
          : 75,
        credits: parseInt(data.credits, 10),
        grade: null,
        grade_points: null,
        grade_scale_id: null,
        type: data.type,
        slot_ids: slotIdsForSubject,
        teacher_name: data.teacher_name || null,
        teacher_email: data.teacher_email || null,
        teacher_phone: null,
        telegram_notify_classes: false,
        sort_order: 0,
        deleted_at: null,
      });

      if (scheduleMode === "slot") {
        if (!selectedSlot) throw new Error("Selected slot unavailable");
        const generated = generateSchedulesFromSlot(
          createdSubject.$id,
          selectedSlot,
          selectedSubSlotIds,
          semester.start_date
        );
        for (const schedule of generated) {
          await addClassSchedule(schedule);
        }
      } else {
        await addClassSchedule({
          subject_id: createdSubject.$id,
          slot_id: null,
          sub_slot_id: null,
          day_of_week: manualDayOfWeek,
          start_time: manualStartTime,
          end_time: manualEndTime,
          room: manualRoom.trim() || null,
          building: null,
          effective_from: semester.start_date,
          effective_until: null,
          deleted_at: null,
        });
      }

      toast.success(`Added ${data.name} with schedule`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create subject");
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white/8 dark:bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-6 m-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedColor}20` }}
                  >
                    <BookOpen className="w-5 h-5" style={{ color: selectedColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">New Subject</h2>
                    <p className="text-xs text-muted-foreground">Add a subject + class schedule</p>
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Subject Name</label>
                    <input
                      {...register("name")}
                      type="text"
                      placeholder="e.g., Data Structures"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Short</label>
                    <input
                      {...register("short_name")}
                      type="text"
                      placeholder="DSA"
                      maxLength={10}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Course Code</label>
                    <input
                      {...register("code")}
                      type="text"
                      placeholder="CS301 (optional)"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Award className="inline w-3.5 h-3.5 mr-1.5" />
                      Credits
                    </label>
                    <input
                      {...register("credits")}
                      type="number"
                      min="1"
                      max="10"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {SUBJECT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue("type", type.value)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-medium transition-all text-center",
                          selectedType === type.value
                            ? "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))] ring-1 ring-[rgba(var(--accent-rgb),0.3)]"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Palette className="inline w-3.5 h-3.5 mr-1.5" />
                    Color
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
                            layoutId="subject-color-selected"
                            className="absolute inset-0 rounded-lg ring-2 ring-white ring-offset-2 ring-offset-[rgb(var(--background))]"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 p-4 bg-white/3">
                  <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Schedule
                  </p>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setScheduleMode("slot")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs transition-all",
                        scheduleMode === "slot" ? "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))]" : "bg-white/5 text-muted-foreground"
                      )}
                    >
                      Slot-based
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode("manual")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs transition-all",
                        scheduleMode === "manual" ? "bg-[rgba(var(--accent-rgb),0.2)] text-[rgb(var(--accent))]" : "bg-white/5 text-muted-foreground"
                      )}
                    >
                      Manual
                    </button>
                  </div>

                  {scheduleMode === "slot" ? (
                    <div className="space-y-3">
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
                        className="text-sm px-3 py-2"
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
                      <p className="text-xs text-muted-foreground">No sub-slot selected = full slot.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <ThemedSelect
                        value={String(manualDayOfWeek)}
                        onChange={(value) => setManualDayOfWeek(Number(value) as 1 | 2 | 3 | 4 | 5 | 6)}
                        options={dayOptions.map((day) => ({ value: String(day.value), label: day.label }))}
                        className="text-sm px-3 py-2"
                      />
                      <input
                        value={manualRoom}
                        onChange={(e) => setManualRoom(e.target.value)}
                        placeholder="Room (optional)"
                        className="px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-sm text-foreground placeholder:text-white/40"
                      />
                      <ThemedTimeInput
                        value={manualStartTime}
                        onChange={setManualStartTime}
                        className="text-sm px-3 py-2"
                      />
                      <ThemedTimeInput
                        value={manualEndTime}
                        onChange={setManualEndTime}
                        className="text-sm px-3 py-2"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Clock className="inline w-3.5 h-3.5 mr-1.5" />
                    Attendance Requirement (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      {...register("attendance_requirement")}
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--accent))]"
                    />
                    <span className="w-12 text-center text-sm font-medium text-foreground">{watch("attendance_requirement")}%</span>
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Teacher Info (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      {...register("teacher_name")}
                      type="text"
                      placeholder="Name"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 text-sm"
                    />
                    <input
                      {...register("teacher_email")}
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-white/30 text-sm"
                    />
                  </div>
                </div>

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
                    disabled={isSubmitting || isMutating}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(var(--accent-rgb),0.2)] hover:bg-[rgba(var(--accent-rgb),0.3)] text-[rgb(var(--accent))] font-medium transition-all disabled:opacity-50"
                  >
                    {isSubmitting || isMutating ? "Adding..." : "Add Subject"}
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
