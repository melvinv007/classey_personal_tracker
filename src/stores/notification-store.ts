/**
 * Notifications Store - Manages notification preferences and state
 * Mock implementation using localStorage (will be replaced with Appwrite settings)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationSettings {
  // Telegram
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  telegram_verified: boolean;
  telegram_notify_exams: boolean;
  telegram_notify_assignments: boolean;
  telegram_notify_deadlines: boolean;
  telegram_notify_tasks: boolean;
  telegram_notify_classes: boolean;
  
  // Push (Web Push)
  push_enabled: boolean;
  push_permission: "granted" | "denied" | "default";
  push_notify_exams: boolean;
  push_notify_assignments: boolean;
  push_notify_deadlines: boolean;
  push_notify_tasks: boolean;
  
  // Timing
  pre_class_reminder_minutes: number;
  exam_reminder_days: number[];  // e.g., [1, 7] = 1 day and 7 days before
  task_reminder_hours: number;   // hours before deadline
}

interface NotificationStore extends NotificationSettings {
  // Setters
  setTelegramEnabled: (enabled: boolean) => void;
  setTelegramChatId: (chatId: string | null) => void;
  setTelegramVerified: (verified: boolean) => void;
  setTelegramNotifyExams: (enabled: boolean) => void;
  setTelegramNotifyAssignments: (enabled: boolean) => void;
  setTelegramNotifyDeadlines: (enabled: boolean) => void;
  setTelegramNotifyTasks: (enabled: boolean) => void;
  setTelegramNotifyClasses: (enabled: boolean) => void;
  
  setPushEnabled: (enabled: boolean) => void;
  setPushPermission: (permission: "granted" | "denied" | "default") => void;
  setPushNotifyExams: (enabled: boolean) => void;
  setPushNotifyAssignments: (enabled: boolean) => void;
  setPushNotifyDeadlines: (enabled: boolean) => void;
  setPushNotifyTasks: (enabled: boolean) => void;
  
  setPreClassReminderMinutes: (minutes: number) => void;
  setExamReminderDays: (days: number[]) => void;
  setTaskReminderHours: (hours: number) => void;
  
  // Actions
  resetToDefaults: () => void;
  
  // Helpers
  getTelegramSettings: () => Pick<NotificationSettings, 
    "telegram_enabled" | "telegram_chat_id" | "telegram_verified" |
    "telegram_notify_exams" | "telegram_notify_assignments" |
    "telegram_notify_deadlines" | "telegram_notify_tasks" | "telegram_notify_classes"
  >;
  getPushSettings: () => Pick<NotificationSettings,
    "push_enabled" | "push_permission" |
    "push_notify_exams" | "push_notify_assignments" |
    "push_notify_deadlines" | "push_notify_tasks"
  >;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  // Telegram - ON by default for most
  telegram_enabled: false,
  telegram_chat_id: null,
  telegram_verified: false,
  telegram_notify_exams: true,
  telegram_notify_assignments: true,
  telegram_notify_deadlines: true,
  telegram_notify_tasks: true,
  telegram_notify_classes: false, // OFF by default
  
  // Push - OFF by default
  push_enabled: false,
  push_permission: "default",
  push_notify_exams: false,
  push_notify_assignments: false,
  push_notify_deadlines: false,
  push_notify_tasks: false,
  
  // Timing
  pre_class_reminder_minutes: 15,
  exam_reminder_days: [1, 7],
  task_reminder_hours: 24,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      
      // Telegram setters
      setTelegramEnabled: (enabled) => set({ telegram_enabled: enabled }),
      setTelegramChatId: (chatId) => set({ telegram_chat_id: chatId }),
      setTelegramVerified: (verified) => set({ telegram_verified: verified }),
      setTelegramNotifyExams: (enabled) => set({ telegram_notify_exams: enabled }),
      setTelegramNotifyAssignments: (enabled) => set({ telegram_notify_assignments: enabled }),
      setTelegramNotifyDeadlines: (enabled) => set({ telegram_notify_deadlines: enabled }),
      setTelegramNotifyTasks: (enabled) => set({ telegram_notify_tasks: enabled }),
      setTelegramNotifyClasses: (enabled) => set({ telegram_notify_classes: enabled }),
      
      // Push setters
      setPushEnabled: (enabled) => set({ push_enabled: enabled }),
      setPushPermission: (permission) => set({ push_permission: permission }),
      setPushNotifyExams: (enabled) => set({ push_notify_exams: enabled }),
      setPushNotifyAssignments: (enabled) => set({ push_notify_assignments: enabled }),
      setPushNotifyDeadlines: (enabled) => set({ push_notify_deadlines: enabled }),
      setPushNotifyTasks: (enabled) => set({ push_notify_tasks: enabled }),
      
      // Timing setters
      setPreClassReminderMinutes: (minutes) => set({ pre_class_reminder_minutes: minutes }),
      setExamReminderDays: (days) => set({ exam_reminder_days: days }),
      setTaskReminderHours: (hours) => set({ task_reminder_hours: hours }),
      
      // Reset
      resetToDefaults: () => set(DEFAULT_SETTINGS),
      
      // Helpers
      getTelegramSettings: () => {
        const state = get();
        return {
          telegram_enabled: state.telegram_enabled,
          telegram_chat_id: state.telegram_chat_id,
          telegram_verified: state.telegram_verified,
          telegram_notify_exams: state.telegram_notify_exams,
          telegram_notify_assignments: state.telegram_notify_assignments,
          telegram_notify_deadlines: state.telegram_notify_deadlines,
          telegram_notify_tasks: state.telegram_notify_tasks,
          telegram_notify_classes: state.telegram_notify_classes,
        };
      },
      getPushSettings: () => {
        const state = get();
        return {
          push_enabled: state.push_enabled,
          push_permission: state.push_permission,
          push_notify_exams: state.push_notify_exams,
          push_notify_assignments: state.push_notify_assignments,
          push_notify_deadlines: state.push_notify_deadlines,
          push_notify_tasks: state.push_notify_tasks,
        };
      },
    }),
    {
      name: "classey-notifications",
    }
  )
);

/**
 * Hook to check if any notifications are enabled
 */
export function useNotificationsEnabled(): boolean {
  const telegramEnabled = useNotificationStore((s) => s.telegram_enabled);
  const pushEnabled = useNotificationStore((s) => s.push_enabled);
  return telegramEnabled || pushEnabled;
}

/**
 * Hook to get notification summary
 */
export function useNotificationSummary(): {
  telegramConfigured: boolean;
  pushConfigured: boolean;
  totalEnabled: number;
} {
  const store = useNotificationStore();
  
  const telegramConfigured = store.telegram_enabled && store.telegram_verified;
  const pushConfigured = store.push_enabled && store.push_permission === "granted";
  
  let totalEnabled = 0;
  if (store.telegram_notify_exams || store.push_notify_exams) totalEnabled++;
  if (store.telegram_notify_assignments || store.push_notify_assignments) totalEnabled++;
  if (store.telegram_notify_deadlines || store.push_notify_deadlines) totalEnabled++;
  if (store.telegram_notify_tasks || store.push_notify_tasks) totalEnabled++;
  if (store.telegram_notify_classes) totalEnabled++;
  
  return { telegramConfigured, pushConfigured, totalEnabled };
}
