"use client";

import { ReminderOffsetsEditor } from "@/components/forms/ReminderOffsetsEditor";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { ThemedColorPicker } from "@/components/ui/ThemedColorPicker";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { useSettings, useUpdateSettings } from "@/hooks/use-appwrite";
import {
  setCalendarColumnWidthSetting,
  setCalendarHourRowHeightSetting,
  setCalendarWeekendsSetting,
  setTimetableColumnWidthSetting,
  setTimetableHourRowHeightSetting,
  setTimetableWeekendSetting,
  useCalendarColumnWidthSetting,
  useCalendarHourRowHeightSetting,
  useCalendarWeekendsSetting,
  useTimetableColumnWidthSetting,
  useTimetableHourRowHeightSetting,
  useTimetableWeekendSetting,
} from "@/hooks/use-timetable-weekend-setting";
import {
  parseReminderOffsetsJson,
  serializeReminderOffsetsJson,
} from "@/lib/appwrite-db";
import {
  backgroundDisplayNames,
  isPersistedBackgroundStyle,
  toBackgroundStyleToken,
  toUIStyleToken,
  useThemeStore,
  type BackgroundStyle,
  type FontFamily,
  type UIStyle,
} from "@/stores/theme-store";
import type { ReminderOffset, Settings } from "@/types/database";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  MessageSquare,
  Moon,
  Palette,
  Send,
  Sparkles,
  Sun,
  Type,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Settings page - Appearance and Notification preferences
 */
export default function SettingsPage(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<"appearance" | "notifications" | "academic">(
    "appearance",
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:p-6 md:pb-6">
      {/* Header */}
      <motion.div
        className="mb-6 flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Customize your Classey experience
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          disabled={isLoggingOut}
          className="ml-auto inline-flex items-center gap-2 rounded-xl btn-muted-themed px-3 py-2 text-sm font-medium text-red-400 disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Logout
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="mb-6 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "appearance"
              ? "bg-accent text-white"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          <Palette className="h-4 w-4" />
          Appearance
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "notifications"
              ? "bg-accent text-white"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("academic")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "academic"
              ? "bg-accent text-white"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Academic
        </button>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "appearance" ? (
          <AppearanceSettings />
        ) : activeTab === "academic" ? (
          <AcademicSettings />
        ) : (
          <NotificationSettings />
        )}
      </motion.div>
    </div>
  );
}

/**
 * Appearance settings section
 */
function AppearanceSettings(): React.ReactNode {
  const {
    mode,
    toggleMode,
    background,
    setBackground,
    fontFamily,
    setFontFamily,
    accentColor,
    setAccentColor,
    uiStyle,
    setUIStyle,
  } = useThemeStore();

  const backgrounds: BackgroundStyle[] = [
    "spooky-smoke",
    "dotted",
    "boxes",
    "dot-pattern",
    "noise-grid",
    "aurora",
    "beams",
    "animated-grid",
    "mesh-gradient",
    "starfield",
    "spiral-bloom",
    "meteor-shower",
  ];

  const accentOptions = [
    "#8b5cf6",
    "#6366f1",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#14b8a6",
    "#3b82f6",
    "#22c55e",
  ];

  const fonts: { value: FontFamily; label: string }[] = [
    { value: "nunito", label: "Nunito" },
    { value: "poppins", label: "Poppins" },
    { value: "quicksand", label: "Quicksand" },
    { value: "inter", label: "Inter" },
    { value: "manrope", label: "Manrope" },
    { value: "space-grotesk", label: "Space Grotesk" },
  ];
  const uiStyleOptions: {
    value: UIStyle;
    label: string;
    description: string;
  }[] = [
    {
      value: "classic-glass",
      label: "Classic Glass",
      description: "Current style with clean glass surfaces.",
    },
    {
      value: "organic-glass",
      label: "Organic Glass",
      description: "Richer depth, stronger hover, softer premium motion.",
    },
    {
      value: "frosted-prism-glass",
      label: "Frosted Prism",
      description: "Subtle chromatic edge refraction with premium glow.",
    },
    {
      value: "liquid-glass",
      label: "Liquid Glass",
      description: "Soft inner distortion and caustic-like highlights.",
    },
    {
      value: "layered-pane-glass",
      label: "Layered Pane",
      description: "Foreground/background pane depth for spatial hierarchy.",
    },
    {
      value: "iridescent-glass",
      label: "Iridescent Glass",
      description: "Angle-shifting tint with vivid hover response.",
    },
    {
      value: "smoked-matte-glass",
      label: "Smoked Matte",
      description: "Low-gloss, high-legibility glass for dense content.",
    },
  ];
  const updateSettings = useUpdateSettings();
  const showWeekendsInCalendar = useCalendarWeekendsSetting();
  const calendarHourRowHeight = useCalendarHourRowHeightSetting();
  const calendarColumnMinWidth = useCalendarColumnWidthSetting();
  const showWeekendsInTimetable = useTimetableWeekendSetting();
  const timetableHourRowHeight = useTimetableHourRowHeightSetting();
  const timetableColumnMinWidth = useTimetableColumnWidthSetting();
  const selectedUIStyle = uiStyleOptions.find((item) => item.value === uiStyle);

  const commitAppearance = async (patch: Partial<Settings>): Promise<void> => {
    try {
      await updateSettings.mutateAsync(patch);
    } catch (error) {
      console.error("Failed to update appearance settings:", error);
      toast.error("Failed to sync appearance settings");
    }
  };

  const syncThemeTokens = (nextUIStyle: UIStyle, nextBackground: BackgroundStyle) => {
    const serializedTokens = `${toUIStyleToken(nextUIStyle)};${toBackgroundStyleToken(nextBackground)}`;
    void commitAppearance({
      background_custom_css: serializedTokens,
      background_style: isPersistedBackgroundStyle(nextBackground)
        ? nextBackground
        : "spooky-smoke",
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-3">
          {mode === "dark" ? (
            <Moon className="h-5 w-5 text-accent" />
          ) : (
            <Sun className="h-5 w-5 text-accent" />
          )}
          <div>
            <h3 className="font-semibold">Theme Mode</h3>
            <p className="text-sm text-muted-foreground">
              Switch between dark and light mode
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const nextMode = mode === "dark" ? "light" : "dark";
            toggleMode();
            void commitAppearance({ theme_mode: nextMode });
          }}
          type="button"
          className="flex w-full items-center justify-between rounded-xl btn-muted-themed p-4 interactive-focus"
        >
          <span className="font-medium capitalize">{mode} Mode</span>
          <div className="flex h-8 w-14 items-center rounded-full bg-accent/20 p-1">
            <motion.div
              className="h-6 w-6 rounded-full bg-accent"
              animate={{ x: mode === "dark" ? 0 : 24 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </button>
      </div>

      {/* UI Style */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <h3 className="font-semibold">UI Style</h3>
            <p className="text-sm text-muted-foreground">
              Switch between classic and premium organic interaction design.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <ThemedSelect
            value={uiStyle}
            onChange={(value) => {
              const nextValue = value as UIStyle;
              setUIStyle(nextValue);
              syncThemeTokens(nextValue, background);
            }}
            options={uiStyleOptions.map((style) => ({
              value: style.value,
              label: style.label,
            }))}
          />
          <div className="rounded-xl btn-muted-themed p-3">
            <p className="text-xs text-muted-foreground">
              Current:{" "}
              <span className="font-semibold text-foreground">
                {selectedUIStyle?.label ?? "Classic Glass"}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedUIStyle?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar and timetable controls */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-accent" />
          <div>
            <h3 className="font-semibold">Calendar & Timetable Grid</h3>
            <p className="text-sm text-muted-foreground">
              Configure weekends, block height, and column width separately.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl btn-muted-themed p-4">
            <p className="text-sm font-semibold">Calendar (Week/Day)</p>
            <button
              onClick={() => {
                setCalendarWeekendsSetting(!showWeekendsInCalendar);
              }}
              type="button"
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/5 p-3 interactive-focus"
            >
              <span className="text-sm">
                {showWeekendsInCalendar ? "Weekends visible" : "Weekends hidden"}
              </span>
              <div className="flex h-7 w-12 items-center rounded-full bg-accent/20 p-1">
                <motion.div
                  className="h-5 w-5 rounded-full bg-accent"
                  animate={{ x: showWeekendsInCalendar ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Block height</p>
                <p className="text-xs text-muted-foreground">
                  {calendarHourRowHeight}px
                </p>
              </div>
              <input
                type="range"
                min={72}
                max={140}
                step={2}
                value={calendarHourRowHeight}
                onChange={(event) =>
                  setCalendarHourRowHeightSetting(Number(event.target.value))
                }
                className="w-full accent-[rgb(var(--accent))]"
              />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Column width</p>
                <p className="text-xs text-muted-foreground">
                  {calendarColumnMinWidth}px
                </p>
              </div>
              <input
                type="range"
                min={110}
                max={220}
                step={2}
                value={calendarColumnMinWidth}
                onChange={(event) =>
                  setCalendarColumnWidthSetting(Number(event.target.value))
                }
                className="w-full accent-[rgb(var(--accent))]"
              />
            </div>
          </div>

          <div className="rounded-xl btn-muted-themed p-4">
            <p className="text-sm font-semibold">Timetable</p>
            <button
              onClick={() => {
                setTimetableWeekendSetting(!showWeekendsInTimetable);
              }}
              type="button"
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/5 p-3 interactive-focus"
            >
              <span className="text-sm">
                {showWeekendsInTimetable ? "Weekends visible" : "Weekends hidden"}
              </span>
              <div className="flex h-7 w-12 items-center rounded-full bg-accent/20 p-1">
                <motion.div
                  className="h-5 w-5 rounded-full bg-accent"
                  animate={{ x: showWeekendsInTimetable ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Block height</p>
                <p className="text-xs text-muted-foreground">
                  {timetableHourRowHeight}px
                </p>
              </div>
              <input
                type="range"
                min={72}
                max={140}
                step={2}
                value={timetableHourRowHeight}
                onChange={(event) =>
                  setTimetableHourRowHeightSetting(Number(event.target.value))
                }
                className="w-full accent-[rgb(var(--accent))]"
              />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Column width</p>
                <p className="text-xs text-muted-foreground">
                  {timetableColumnMinWidth}px
                </p>
              </div>
              <input
                type="range"
                min={110}
                max={220}
                step={2}
                value={timetableColumnMinWidth}
                onChange={(event) =>
                  setTimetableColumnWidthSetting(Number(event.target.value))
                }
                className="w-full accent-[rgb(var(--accent))]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Background Style */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <h3 className="font-semibold">Background Style</h3>
            <p className="text-sm text-muted-foreground">
              Choose from 12 styles: 7 static and 5 dynamic.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <ThemedSelect
            value={background}
            onChange={(value) => {
              const nextBackground = value as BackgroundStyle;
              setBackground(nextBackground);
              syncThemeTokens(uiStyle, nextBackground);
            }}
            options={backgrounds.map((bg) => ({
              value: bg,
              label: backgroundDisplayNames[bg],
            }))}
          />
          <p className="text-xs text-muted-foreground">
            Current:{" "}
            <span className="font-semibold text-foreground">
              {backgroundDisplayNames[background]}
            </span>
          </p>
        </div>
      </div>

      {/* Accent Color */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Palette className="h-5 w-5 text-accent" />
          <div>
            <h3 className="font-semibold">Accent Color</h3>
            <p className="text-sm text-muted-foreground">
              Choose your UI accent color.
            </p>
          </div>
        </div>
        <ThemedColorPicker
          value={accentColor}
          onChange={(value) => {
            setAccentColor(value);
            void commitAppearance({ accent_color_default: value });
          }}
          colors={accentOptions}
        />
      </div>

      {/* Font Family */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Type className="h-5 w-5 text-accent" />
          <div>
            <h3 className="font-semibold">Font Family</h3>
            <p className="text-sm text-muted-foreground">
              Choose your preferred font
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <ThemedSelect
            value={fontFamily}
            onChange={(value) => {
              const nextFont = value as FontFamily;
              const selected = fonts.find((font) => font.value === nextFont);
              setFontFamily(nextFont);
              void commitAppearance({ font_family: selected?.label ?? "Nunito" });
            }}
            options={fonts.map((font) => ({
              value: font.value,
              label: font.label,
            }))}
          />
          <p
            className="rounded-xl btn-muted-themed px-3 py-2 text-sm"
            style={{ fontFamily: fonts.find((item) => item.value === fontFamily)?.label }}
          >
            Current: {fonts.find((item) => item.value === fontFamily)?.label}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification settings section
 */
function NotificationSettings(): React.ReactNode {
  const [chatIdInput, setChatIdInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const current = settings;
  const isConnected = Boolean(
    current?.telegram_notifications_enabled && current?.telegram_bot_chat_id,
  );
  const preClassMinutes = current?.pre_class_reminder_minutes ?? 15;

  const defaultExamOffsets = useMemo<ReminderOffset[]>(() => {
    const parsed = parseReminderOffsetsJson(
      current?.exam_default_reminder_offsets_json ?? null,
    );
    return parsed.length > 0
      ? parsed
      : [
          { value: 24, unit: "hours" },
          { value: 2, unit: "hours" },
        ];
  }, [current?.exam_default_reminder_offsets_json]);

  const defaultTaskOffsets = useMemo<ReminderOffset[]>(() => {
    const parsed = parseReminderOffsetsJson(
      current?.task_default_reminder_offsets_json ?? null,
    );
    return parsed.length > 0
      ? parsed
      : [
          { value: 24, unit: "hours" },
          { value: 2, unit: "hours" },
        ];
  }, [current?.task_default_reminder_offsets_json]);

  const commitSettings = async (patch: Partial<Settings>): Promise<void> => {
    try {
      await updateSettings.mutateAsync(patch);
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to save notification settings");
    }
  };

  useEffect(() => {
    if (!current) return;
    setChatIdInput(current.telegram_bot_chat_id ?? "");
  }, [current]);

  const handleVerifyChatId = async () => {
    if (!chatIdInput.trim()) {
      toast.error("Please enter your Telegram Chat ID");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", chatId: chatIdInput.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        await commitSettings({
          telegram_bot_chat_id: chatIdInput.trim(),
          telegram_notifications_enabled: true,
        });
        toast.success("Telegram connected!", {
          description: "You'll receive notifications on Telegram",
        });
      } else {
        toast.error("Verification failed", {
          description: data.error || "Could not send message to this Chat ID",
        });
      }
    } catch {
      toast.error("Connection error", {
        description: "Could not connect to notification service",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestNotification = async () => {
    const chatId = current?.telegram_bot_chat_id;
    if (!chatId) {
      toast.error("No Chat ID configured");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", chatId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Test notification sent!");
      } else {
        toast.error("Failed to send test", {
          description: data.error,
        });
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    await commitSettings({
      telegram_bot_chat_id: null,
      telegram_notifications_enabled: false,
    });
    setChatIdInput("");
    toast.info("Telegram disconnected");
  };

  const toggleSetting = async (
    key: keyof Settings,
    enabled: boolean,
  ): Promise<void> => {
    await commitSettings({ [key]: enabled } as Partial<Settings>);
  };

  return (
    <div className="space-y-6">
      {/* Telegram Setup */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold">Telegram Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications via Telegram bot
              </p>
            </div>
          </div>
          {isConnected && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" />
              Connected
            </span>
          )}
        </div>

        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              1. Start a chat with <strong>@ClasseyBot</strong> on Telegram
              <br />
              2. Send <code className="rounded bg-muted px-1">/start</code> to
              get your Chat ID
              <br />
              3. Enter your Chat ID below
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                placeholder="Enter your Chat ID"
                className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                onClick={handleVerifyChatId}
                disabled={isVerifying}
                className="flex items-center gap-2 rounded-xl btn-themed px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Verify
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-muted p-3">
              <span className="text-sm">
                Chat ID:{" "}
                <code className="font-mono">
                  {current?.telegram_bot_chat_id}
                </code>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleTestNotification}
                  disabled={isTesting}
                  className="flex items-center gap-1 rounded-lg btn-themed px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {isTesting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                  Test
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 rounded-lg btn-muted-themed px-3 py-1.5 text-sm font-medium text-destructive transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Types */}
      {isConnected && (
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold">Notification Types</h3>
              <p className="text-sm text-muted-foreground">
                Choose what notifications to receive
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <ToggleRow
              icon={<Calendar className="h-4 w-4" />}
              label="Exam Reminders"
              description="Get notified before exams"
              enabled={current?.telegram_notify_exams ?? true}
              onToggle={(enabled) => {
                void toggleSetting("telegram_notify_exams", enabled);
              }}
            />
            <ToggleRow
              icon={<FileText className="h-4 w-4" />}
              label="Assignment Deadlines"
              description="Reminders for assignment due dates"
              enabled={current?.telegram_notify_assignments ?? true}
              onToggle={(enabled) => {
                void toggleSetting("telegram_notify_assignments", enabled);
              }}
            />
            <ToggleRow
              icon={<Clock className="h-4 w-4" />}
              label="Task Deadlines"
              description="Reminders for task deadlines"
              enabled={current?.telegram_notify_deadlines ?? true}
              onToggle={(enabled) => {
                void toggleSetting("telegram_notify_deadlines", enabled);
              }}
            />
            <ToggleRow
              icon={<CheckSquare className="h-4 w-4" />}
              label="Task Reminders"
              description="General task notifications"
              enabled={current?.telegram_notify_tasks ?? true}
              onToggle={(enabled) => {
                void toggleSetting("telegram_notify_tasks", enabled);
              }}
            />
            <ToggleRow
              icon={<BookOpen className="h-4 w-4" />}
              label="Class Reminders"
              description="Get notified before classes start"
              enabled={current?.telegram_notify_classes ?? false}
              onToggle={(enabled) => {
                void toggleSetting("telegram_notify_classes", enabled);
              }}
            />
          </div>
        </div>
      )}

      {isConnected && (
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold">Default Reminder Offsets</h3>
              <p className="text-sm text-muted-foreground">
                Used when exam/task does not have custom reminder offsets.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ReminderOffsetsEditor
              label="Exam defaults"
              description="Default reminders for new exams"
              value={defaultExamOffsets}
              onChange={(next) => {
                void commitSettings({
                  exam_default_reminder_offsets_json:
                    serializeReminderOffsetsJson(next),
                });
              }}
            />

            <ReminderOffsetsEditor
              label="Task defaults"
              description="Default reminders for new tasks"
              value={defaultTaskOffsets}
              onChange={(next) => {
                void commitSettings({
                  task_default_reminder_offsets_json:
                    serializeReminderOffsetsJson(next),
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Timing Settings */}
      {isConnected && (current?.telegram_notify_classes ?? false) && (
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold">Reminder Timing</h3>
              <p className="text-sm text-muted-foreground">
                When to send class reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm">Remind me</span>
            <div className="w-44">
              <ThemedSelect
                value={String(preClassMinutes)}
                onChange={(value) => {
                  void commitSettings({
                    pre_class_reminder_minutes: Number(value),
                  });
                }}
                options={[
                  { value: "5", label: "5 minutes" },
                  { value: "10", label: "10 minutes" },
                  { value: "15", label: "15 minutes" },
                  { value: "30", label: "30 minutes" },
                  { value: "60", label: "1 hour" },
                ]}
                className="px-3 py-2 text-sm"
              />
            </div>
            <span className="text-sm">before class</span>
          </div>
        </div>
      )}

      <div className="glass-card border border-red-500/20 p-5">
        <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete all semesters, subjects, schedules, attendance,
          exams, tasks, events, files, links, and notes.
        </p>
        <button
          type="button"
          onClick={() => setIsDeleteAllOpen(true)}
          className="mt-4 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
        >
          Delete All Data
        </button>
      </div>

      <ConfirmActionModal
        isOpen={isDeleteAllOpen}
        title="Delete all data permanently?"
        description="This cannot be undone. All academic and personal tracking data in the app will be removed."
        confirmText="Delete Everything"
        onConfirm={async () => {
          setIsDeletingAll(true);
          try {
            const response = await fetch("/api/data/cascade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "delete-all" }),
            });
            const result = (await response.json()) as {
              success: boolean;
              error?: string;
              deleted?: {
                semesters?: number;
                subjects?: number;
                tasks?: number;
                events?: number;
              };
            };
            if (!response.ok || !result.success) {
              throw new Error(result.error ?? "Failed to delete all data");
            }
            toast.success(
              `All data deleted (${result.deleted?.semesters ?? 0} semesters, ${result.deleted?.subjects ?? 0} subjects, ${result.deleted?.tasks ?? 0} tasks, ${result.deleted?.events ?? 0} events).`,
            );
            setIsDeleteAllOpen(false);
            window.location.href = "/";
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete all data",
            );
          } finally {
            setIsDeletingAll(false);
          }
        }}
        onCancel={() => setIsDeleteAllOpen(false)}
        isProcessing={isDeletingAll}
      />
    </div>
  );
}

/**
 * Toggle row component for notification settings
 */
function ToggleRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}): React.ReactNode {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className="flex w-full items-center justify-between rounded-xl bg-muted p-3 transition-colors hover:bg-muted/80"
    >
      <div className="flex items-center gap-3">
        <span className="text-accent">{icon}</span>
        <div className="text-left">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
          enabled ? "bg-accent" : "bg-border"
        }`}
      >
        <motion.div
          className="h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: enabled ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

/**
 * Academic settings section — Home Department for minor course eligibility
 */
function AcademicSettings(): React.ReactNode {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [dept, setDept] = useState(settings?.home_department || "");

  useEffect(() => {
    if (settings?.home_department !== undefined) {
      setDept(settings.home_department || "");
    }
  }, [settings?.home_department]);

  const handleSave = (): void => {
    updateSettings.mutate({
      home_department: dept.trim() || null,
    });
    toast.success("Academic settings saved");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Home Department */}
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(var(--accent-rgb), 0.15)" }}
          >
            <GraduationCap className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">Home Department</h3>
            <p className="text-xs text-muted-foreground">
              Used by the Course Explorer to determine which &quot;Advanced&quot; courses you&apos;re eligible for
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            placeholder="e.g. Computer Science, Electrical Engineering"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
          />
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="btn-themed px-4 py-2.5 text-sm font-medium"
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          In the Course Explorer, <strong>STEM</strong> courses from all departments are always visible.{" "}
          <strong>Advanced</strong> courses are only shown from your home department.
        </p>
      </div>
    </div>
  );
}
