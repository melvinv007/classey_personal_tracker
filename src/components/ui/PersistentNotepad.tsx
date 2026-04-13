"use client";

import { motion } from "framer-motion";
import { StickyNote } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface PersistentNotepadProps {
  storageKey: string;
  title: string;
  placeholder?: string;
  className?: string;
}

export function PersistentNotepad({
  storageKey,
  title,
  placeholder = "Write anything here...",
  className,
}: PersistentNotepadProps): React.ReactNode {
  const [value, setValue] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { text: string; savedAt?: number };
        setValue(parsed.text ?? "");
        setSavedAt(parsed.savedAt ?? null);
      }
    } catch {
      // ignore malformed local cache
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      const now = Date.now();
      localStorage.setItem(storageKey, JSON.stringify({ text: value, savedAt: now }));
      setSavedAt(now);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [hydrated, storageKey, value]);

  const savedLabel = useMemo(() => {
    if (!savedAt) return "Not saved yet";
    return `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }, [savedAt]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`glass-card rounded-2xl p-5 ${className ?? ""}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-[rgb(var(--accent))]" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{savedLabel}</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={8}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)]"
      />
    </motion.section>
  );
}
