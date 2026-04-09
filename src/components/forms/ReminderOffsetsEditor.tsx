"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import type { ReminderOffset } from "@/types/database";

interface ReminderOffsetsEditorProps {
  label: string;
  description: string;
  value: ReminderOffset[];
  onChange: (next: ReminderOffset[]) => void;
}

const UNIT_OPTIONS: { value: ReminderOffset["unit"]; label: string }[] = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

function formatOffset(offset: ReminderOffset): string {
  const unitLabel = offset.value === 1 ? offset.unit.slice(0, -1) : offset.unit;
  return `${offset.value} ${unitLabel} before`;
}

export function ReminderOffsetsEditor({
  label,
  description,
  value,
  onChange,
}: ReminderOffsetsEditorProps): React.ReactNode {
  const [draftValue, setDraftValue] = useState<string>("24");
  const [draftUnit, setDraftUnit] = useState<ReminderOffset["unit"]>("hours");

  const sorted = useMemo(
    () => [...value],
    [value]
  );

  const handleAdd = (): void => {
    const parsed = Number(draftValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const normalized: ReminderOffset = { value: parsed, unit: draftUnit };
    const exists = sorted.some((item) => item.value === normalized.value && item.unit === normalized.unit);
    if (exists) return;
    onChange([...sorted, normalized]);
  };

  const handleRemove = (index: number): void => {
    onChange(sorted.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sorted.length === 0 ? (
          <span className="text-xs text-muted-foreground">No reminders configured</span>
        ) : (
          sorted.map((offset, index) => (
            <span
              key={`${offset.value}-${offset.unit}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent"
            >
              {formatOffset(offset)}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded p-0.5 hover:bg-accent/20"
                aria-label={`Remove ${formatOffset(offset)}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <input
          type="number"
          min={1}
          step={1}
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <ThemedSelect
          value={draftUnit}
          onChange={(next) => setDraftUnit(next as ReminderOffset["unit"])}
          options={UNIT_OPTIONS}
          className="px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}

