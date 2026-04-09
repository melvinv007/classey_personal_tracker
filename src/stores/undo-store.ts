/**
 * Undo Store - Manages undoable actions with 5-second window
 * Works with Sonner toast for undo UI
 */

import { create } from "zustand";
import { toast } from "sonner";

export interface UndoableAction {
  id: string;
  description: string;
  undo: () => void;
  timestamp: number;
}

interface UndoStore {
  // Current pending actions (within 5-second window)
  pendingActions: UndoableAction[];
  
  // Add an undoable action
  addAction: (action: Omit<UndoableAction, "id" | "timestamp">) => string;
  
  // Execute undo for an action
  executeUndo: (actionId: string) => void;
  
  // Remove action (after timeout or manual dismiss)
  removeAction: (actionId: string) => void;
  
  // Clear all pending actions
  clearAll: () => void;
}

const UNDO_TIMEOUT_MS = 5000; // 5 seconds

export const useUndoStore = create<UndoStore>((set, get) => ({
  pendingActions: [],
  
  addAction: (action) => {
    const actionId = `undo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newAction: UndoableAction = {
      ...action,
      id: actionId,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      pendingActions: [...state.pendingActions, newAction],
    }));
    
    // Auto-remove after timeout
    setTimeout(() => {
      get().removeAction(actionId);
    }, UNDO_TIMEOUT_MS);
    
    return actionId;
  },
  
  executeUndo: (actionId) => {
    const { pendingActions } = get();
    const action = pendingActions.find((a) => a.id === actionId);
    
    if (action) {
      // Execute the undo function
      action.undo();
      // Remove from pending
      set((state) => ({
        pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
      }));
    }
  },
  
  removeAction: (actionId) => {
    set((state) => ({
      pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
    }));
  },
  
  clearAll: () => {
    set({ pendingActions: [] });
  },
}));

/**
 * Show a toast with undo button for destructive actions
 * @param description - What was done (e.g., "Task deleted")
 * @param undoFn - Function to call to undo the action
 * @returns The action ID
 */
export function showUndoToast(
  description: string,
  undoFn: () => void
): string {
  const store = useUndoStore.getState();
  const actionId = store.addAction({ description, undo: undoFn });
  
  toast(description, {
    action: {
      label: "Undo",
      onClick: () => {
        store.executeUndo(actionId);
        toast.success("Action undone");
      },
    },
    duration: UNDO_TIMEOUT_MS,
    onDismiss: () => {
      store.removeAction(actionId);
    },
  });
  
  return actionId;
}

/**
 * Helper for common undo scenarios
 */
export const undoHelpers = {
  /**
   * Delete with undo - soft deletes an item and shows undo toast
   */
  softDelete: <T extends { $id: string; deleted_at: string | null }>(
    item: T,
    entityName: string,
    deleteAction: (id: string) => void,
    restoreAction: (id: string) => void
  ): void => {
    // Perform the delete
    deleteAction(item.$id);
    
    // Show undo toast
    showUndoToast(`${entityName} deleted`, () => {
      restoreAction(item.$id);
    });
  },
  
  /**
   * Complete task with undo
   */
  completeTask: (
    taskId: string,
    taskTitle: string,
    completeAction: (id: string) => void,
    uncompleteAction: (id: string) => void
  ): void => {
    completeAction(taskId);
    
    showUndoToast(`"${taskTitle}" completed`, () => {
      uncompleteAction(taskId);
    });
  },
  
  /**
   * Mark absent with undo
   */
  markAbsent: (
    occurrenceId: string,
    subjectName: string,
    markAbsentAction: (id: string) => void,
    clearAttendanceAction: (id: string) => void
  ): void => {
    markAbsentAction(occurrenceId);
    
    showUndoToast(`Marked absent for ${subjectName}`, () => {
      clearAttendanceAction(occurrenceId);
    });
  },
};
