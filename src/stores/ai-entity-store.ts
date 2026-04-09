/**
 * AI Entity Store - Manages entity creation from AI responses
 * When AI returns a create action, this store holds the data
 * and notifies components to open the appropriate modal.
 */

import { create } from "zustand";

export interface AIEntityAction {
  action: "create";
  entity_type: "exam" | "task" | "event";
  fields: Record<string, unknown>;
  timestamp: number;
}

interface AIEntityStore {
  pendingAction: AIEntityAction | null;
  
  // Set a pending entity action from AI
  setPendingAction: (action: AIEntityAction | null) => void;
  
  // Clear the pending action (after modal opened or dismissed)
  clearPendingAction: () => void;
  
  // Check if there's a pending action of a specific type
  hasPendingAction: (type: "exam" | "task" | "event") => boolean;
  
  // Get and clear action (atomic operation for modal handling)
  consumeAction: (type: "exam" | "task" | "event") => AIEntityAction | null;
}

export const useAIEntityStore = create<AIEntityStore>((set, get) => ({
  pendingAction: null,
  
  setPendingAction: (action) => set({ pendingAction: action }),
  
  clearPendingAction: () => set({ pendingAction: null }),
  
  hasPendingAction: (type) => {
    const { pendingAction } = get();
    return pendingAction?.entity_type === type;
  },
  
  consumeAction: (type) => {
    const { pendingAction } = get();
    if (pendingAction?.entity_type === type) {
      set({ pendingAction: null });
      return pendingAction;
    }
    return null;
  },
}));

/**
 * Helper to extract default values from AI entity action
 */
export function extractExamDefaults(action: AIEntityAction): Partial<{
  name: string;
  type: string;
  date: string;
  start_time: string;
  marks_total: number;
  syllabus: string;
  subject_id: string;
}> {
  const fields = action.fields;
  return {
    name: typeof fields.name === "string" ? fields.name : undefined,
    type: typeof fields.type === "string" ? fields.type : undefined,
    date: typeof fields.date === "string" ? fields.date : undefined,
    start_time: typeof fields.start_time === "string" ? fields.start_time : undefined,
    marks_total: typeof fields.marks_total === "number" ? fields.marks_total : undefined,
    syllabus: typeof fields.syllabus === "string" ? fields.syllabus : undefined,
    subject_id: typeof fields.subject_id === "string" ? fields.subject_id : undefined,
  };
}

export function extractTaskDefaults(action: AIEntityAction): Partial<{
  title: string;
  description: string;
  deadline: string;
  priority: string;
  subject_id: string;
}> {
  const fields = action.fields;
  return {
    title: typeof fields.title === "string" ? fields.title : undefined,
    description: typeof fields.description === "string" ? fields.description : undefined,
    deadline: typeof fields.deadline === "string" ? fields.deadline : undefined,
    priority: typeof fields.priority === "string" ? fields.priority : undefined,
    subject_id: typeof fields.subject_id === "string" ? fields.subject_id : undefined,
  };
}

export function extractEventDefaults(action: AIEntityAction): Partial<{
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  is_all_day: boolean;
}> {
  const fields = action.fields;
  return {
    title: typeof fields.title === "string" ? fields.title : undefined,
    description: typeof fields.description === "string" ? fields.description : undefined,
    start_datetime: typeof fields.start_datetime === "string" ? fields.start_datetime : undefined,
    end_datetime: typeof fields.end_datetime === "string" ? fields.end_datetime : undefined,
    location: typeof fields.location === "string" ? fields.location : undefined,
    is_all_day: typeof fields.is_all_day === "boolean" ? fields.is_all_day : undefined,
  };
}
