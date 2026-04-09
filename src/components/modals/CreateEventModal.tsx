"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Repeat, Type } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useCreateEvent } from "@/hooks/use-appwrite";
import { ThemedDateInput, ThemedTimeInput } from "@/components/ui/ThemedDateTimeInput";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  start_date: z.string().min(1, "Start date is required"),
  start_time: z.string().optional(),
  end_date: z.string().min(1, "End date is required"),
  end_time: z.string().optional(),
  is_all_day: z.boolean(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]),
  color: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesterId?: string;
  defaultValues?: Partial<EventFormData>;
}

const recurrenceOptions = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

const colorOptions = [
  "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#EF4444", "#6366F1", "#14B8A6", "#F97316", "#84CC16",
];

/**
 * CreateEventModal - Modal for creating personal calendar events
 */
export function CreateEventModal({
  isOpen,
  onClose,
  semesterId,
  defaultValues,
}: CreateEventModalProps): React.ReactNode {
  const createEvent = useCreateEvent();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const nextHour = format(new Date(), "HH:00");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      location: defaultValues?.location || "",
      start_date: defaultValues?.start_date || today,
      start_time: defaultValues?.start_time || nextHour,
      end_date: defaultValues?.end_date || today,
      end_time: defaultValues?.end_time || format(new Date(new Date().getTime() + 3600000), "HH:00"),
      is_all_day: defaultValues?.is_all_day || false,
      recurrence: defaultValues?.recurrence || "none",
      color: defaultValues?.color || colorOptions[0],
    },
  });

  const isAllDay = watch("is_all_day");
  const selectedColor = watch("color");

  const onSubmit = async (data: EventFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      const startDatetime = data.is_all_day
        ? `${data.start_date}T00:00:00`
        : `${data.start_date}T${data.start_time || "00:00"}:00`;
      const endDatetime = data.is_all_day
        ? `${data.end_date}T23:59:59`
        : `${data.end_date}T${data.end_time || "23:59"}:00`;

      await createEvent.mutateAsync({
        semester_id: semesterId || null,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        is_all_day: data.is_all_day,
        recurrence: data.recurrence === "none" ? null : data.recurrence,
        color: data.color || null,
        deleted_at: null,
      });

      toast.success("Event created successfully!");
      reset();
      onClose();
    } catch (error) {
      toast.error("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedColor}20` }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: selectedColor }} />
                  </div>
                  <h2 className="text-xl font-semibold">New Event</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Type className="w-4 h-4" />
                    Event Title
                  </label>
                  <input
                    {...register("title")}
                    placeholder="e.g., Study Group Meeting"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10",
                      "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25",
                      "placeholder:text-muted-foreground/50",
                      errors.title && "border-red-400"
                    )}
                  />
                  {errors.title && (
                    <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                  <textarea
                    {...register("description")}
                    placeholder="Add details..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/50 resize-none"
                  />
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">All-day event</label>
                  <button
                    type="button"
                    onClick={() => setValue("is_all_day", !isAllDay)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      isAllDay ? "bg-accent" : "bg-white/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        isAllDay ? "translate-x-7" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {/* Date/Time Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4" />
                      Start Date
                    </label>
                    <ThemedDateInput
                      value={watch("start_date") || ""}
                      onChange={(value) => setValue("start_date", value, { shouldValidate: true })}
                    />
                    <input type="hidden" {...register("start_date")} />
                  </div>
                  {!isAllDay && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Clock className="w-4 h-4" />
                        Start Time
                      </label>
                      <ThemedTimeInput
                        value={watch("start_time") || ""}
                        onChange={(value) => setValue("start_time", value, { shouldValidate: true })}
                      />
                      <input type="hidden" {...register("start_time")} />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <ThemedDateInput
                      value={watch("end_date") || ""}
                      onChange={(value) => setValue("end_date", value, { shouldValidate: true })}
                    />
                    <input type="hidden" {...register("end_date")} />
                  </div>
                  {!isAllDay && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Time</label>
                      <ThemedTimeInput
                        value={watch("end_time") || ""}
                        onChange={(value) => setValue("end_time", value, { shouldValidate: true })}
                      />
                      <input type="hidden" {...register("end_time")} />
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4" />
                    Location (optional)
                  </label>
                  <input
                    {...register("location")}
                    placeholder="e.g., Library Room 204"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/50"
                  />
                </div>

                {/* Recurrence */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Repeat className="w-4 h-4" />
                    Repeat
                  </label>
                  <ThemedSelect
                    value={watch("recurrence")}
                    onChange={(value) => setValue("recurrence", value as EventFormData["recurrence"], { shouldValidate: true })}
                    options={recurrenceOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                  />
                  <input type="hidden" {...register("recurrence")} />
                </div>

                {/* Color picker */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue("color", color)}
                        className={cn(
                          "w-8 h-8 rounded-lg transition-all",
                          selectedColor === color && "ring-2 ring-white ring-offset-2 ring-offset-background"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-medium transition-all",
                      "bg-accent hover:bg-accent/90 text-white",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? "Creating..." : "Create Event"}
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
