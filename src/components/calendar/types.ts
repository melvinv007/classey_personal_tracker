export type CalendarGridEventType = "class" | "exam" | "task" | "event";

export interface CalendarGridEvent {
  id: string;
  type: CalendarGridEventType;
  title: string;
  start: Date;
  end: Date;
  color?: string | null;
  isAllDay?: boolean;
  location?: string | null;
  description?: string | null;
  subjectId?: string | null;
  semesterId?: string | null;
}

