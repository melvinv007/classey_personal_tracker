"use client";

import { cn } from "@/lib/utils";
import {
  parseImportJson,
  validateMinorCourseImport,
  validateSemesterCourseImport,
  type MinorCourseImport,
  type SemesterCourseImport,
  type ValidationError,
  type ValidationWarning,
} from "@/utils/minor-validation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCopy,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

// ============================================================
// LLM Prompt templates
// ============================================================

const MINOR_BUCKET_PROMPT = `I need you to extract course data for a **minor program** at my university and output it as a JSON array.

For each course, return an object with these fields:
- "short_code" (string, REQUIRED) — e.g. "CS 231"
- "name" (string, REQUIRED) — full course name
- "credits" (number, REQUIRED) — credit hours
- "is_required" (boolean) — true if the course is mandatory for this minor
- "slot" (string or null) — timetable slot if known, e.g. "5A"
- "prerequisites" (string[]) — list of prerequisite course codes
- "cutoff" (string or null) — any CGPA/grade cutoff
- "difficulty" (string or null) — "Easy", "Medium", or "Hard"
- "instructors" (string[]) — list of instructor names
- "duration" ("full" | "first_half" | "second_half") — semester duration
- "typically_offered" ("odd" | "even" | "both") — when it's typically offered

Output ONLY a JSON array, no markdown fences, no explanation. Example:
[
  {
    "short_code": "CS 231",
    "name": "Operating Systems",
    "credits": 6,
    "is_required": true,
    "slot": null,
    "prerequisites": ["CS 201"],
    "cutoff": "7.0 CGPA",
    "difficulty": "Hard",
    "instructors": ["Dr. Smith"],
    "duration": "full",
    "typically_offered": "odd"
  }
]`;

const SEMESTER_COURSE_PROMPT = `I need you to extract a **department's course list for a semester** and output it as a JSON array.

For each course, return an object with these fields:
- "short_code" (string, REQUIRED) — e.g. "CS 231"
- "name" (string, REQUIRED) — full course name
- "instructors" (string[]) — list of instructor names
- "slot" (string or null) — timetable slot, e.g. "5A"
- "classroom" (string or null) — room/building
- "student_limit" (number or null) — max students
- "category" (string or null) — "stem" or "advanced"
- "course_type" ("theory" | "lab" | "seminar" | "project" | "other")
- "duration" ("full" | "first_half" | "second_half")

Output ONLY a JSON array, no markdown fences, no explanation. Example:
[
  {
    "short_code": "CS 231",
    "name": "Operating Systems",
    "instructors": ["Dr. Smith"],
    "slot": "5A",
    "classroom": "CSB 201",
    "student_limit": 60,
    "category": "stem",
    "course_type": "theory",
    "duration": "full"
  }
]`;

// ============================================================
// TYPES
// ============================================================

type ImportType = "minor" | "semester";

interface LLMImportModalProps {
  open: boolean;
  onClose: () => void;
  type: ImportType;
  /** Called when user confirms import — receives validated data */
  onImport: (data: MinorCourseImport[] | SemesterCourseImport[], mode: "append" | "replace") => Promise<void>;
  /** Whether the import mutation is pending */
  isPending?: boolean;
}

type Step = "prompt" | "paste" | "validate" | "confirm";

export function LLMImportModal({
  open,
  onClose,
  type,
  onImport,
  isPending = false,
}: LLMImportModalProps) {
  const [step, setStep] = useState<Step>("prompt");
  const [rawJson, setRawJson] = useState("");
  const [validData, setValidData] = useState<MinorCourseImport[] | SemesterCourseImport[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const prompt = type === "minor" ? MINOR_BUCKET_PROMPT : SEMESTER_COURSE_PROMPT;

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [prompt]);

  const handleValidate = useCallback(() => {
    const { data, error } = parseImportJson(rawJson);
    if (error || !data) {
      setParseError(error || "Could not parse JSON");
      return;
    }
    setParseError(null);

    if (type === "minor") {
      const result = validateMinorCourseImport(data);
      setValidData(result.valid);
      setErrors(result.errors);
      setWarnings(result.warnings);
    } else {
      const result = validateSemesterCourseImport(data);
      setValidData(result.valid);
      setErrors(result.errors);
      setWarnings(result.warnings);
    }
    setStep("validate");
  }, [rawJson, type]);

  const handleConfirm = useCallback(
    async (mode: "append" | "replace") => {
      await onImport(validData, mode);
      // Reset
      setStep("prompt");
      setRawJson("");
      setValidData([]);
      setErrors([]);
      setWarnings([]);
      onClose();
    },
    [onImport, validData, onClose],
  );

  const handleReset = useCallback(() => {
    setStep("prompt");
    setRawJson("");
    setValidData([]);
    setErrors([]);
    setWarnings([]);
    setParseError(null);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="glass-elevated relative z-10 flex w-full max-w-2xl flex-col overflow-hidden"
            style={{ maxHeight: "85vh" }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "rgba(var(--accent-rgb), 0.15)" }}
                >
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">LLM Import</h2>
                  <p className="text-xs text-muted-foreground">
                    {type === "minor" ? "Import minor course bucket" : "Import semester courses"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 border-b border-white/5 px-6 py-3">
              {(["prompt", "paste", "validate", "confirm"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      step === s
                        ? "bg-accent text-white"
                        : (["prompt", "paste", "validate", "confirm"] as Step[]).indexOf(step) > i
                          ? "bg-accent/30 text-accent"
                          : "bg-white/10 text-muted-foreground",
                    )}
                  >
                    {(["prompt", "paste", "validate", "confirm"] as Step[]).indexOf(step) > i ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 3 && (
                    <div className="h-px w-6 bg-white/10" />
                  )}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Copy Prompt */}
              {step === "prompt" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Copy this prompt and paste it into your preferred LLM (ChatGPT, Gemini, etc.) along with
                    your course data.
                  </p>
                  <div className="relative">
                    <pre className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-muted-foreground">
                      {prompt}
                    </pre>
                    <button
                      onClick={handleCopyPrompt}
                      className="btn-themed absolute right-3 top-3 flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Paste JSON */}
              {step === "paste" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Paste the JSON array you received from the LLM below.
                  </p>
                  <textarea
                    value={rawJson}
                    onChange={(e) => {
                      setRawJson(e.target.value);
                      setParseError(null);
                    }}
                    placeholder='[\n  {\n    "short_code": "CS 231",\n    "name": "Operating Systems",\n    ...\n  }\n]'
                    className="h-64 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs outline-none transition-colors focus:border-accent/50"
                    autoFocus
                  />
                  {parseError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {parseError}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Validation Results */}
              {step === "validate" && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{validData.length}</div>
                      <div className="text-xs text-muted-foreground">Valid</div>
                    </div>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center">
                      <div className="text-2xl font-bold text-red-400">{errors.length}</div>
                      <div className="text-xs text-muted-foreground">Errors</div>
                    </div>
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{warnings.length}</div>
                      <div className="text-xs text-muted-foreground">Warnings</div>
                    </div>
                  </div>

                  {/* Error list */}
                  {errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-red-400">Errors</h4>
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {errors.map((err, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs"
                          >
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                            <span>
                              <strong>Row {err.row}</strong> · {err.field}: {err.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning list */}
                  {warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-yellow-400">Warnings</h4>
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {warnings.map((warn, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                            <span>
                              <strong>Row {warn.row}</strong> · {warn.field}: {warn.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {validData.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Preview ({validData.length} courses)</h4>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-left text-muted-foreground">
                              <th className="px-3 py-2">Code</th>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Slot</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validData.slice(0, 30).map((item, i) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="px-3 py-1.5 font-mono">{item.short_code}</td>
                                <td className="px-3 py-1.5 truncate max-w-[200px]">{item.name}</td>
                                <td className="px-3 py-1.5">{item.slot || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Confirm */}
              {step === "confirm" && validData.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ready to import <strong>{validData.length}</strong> courses.
                    Choose how to handle existing data:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleConfirm("append")}
                      disabled={isPending}
                      className="btn-themed flex flex-col items-center gap-2 p-4 text-sm"
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <span className="font-semibold">Append</span>
                          <span className="text-xs text-muted-foreground">
                            Add to existing courses
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleConfirm("replace")}
                      disabled={isPending}
                      className="flex flex-col items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <span className="font-semibold">Replace All</span>
                          <span className="text-xs text-muted-foreground">
                            Delete existing & reimport
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
              <button
                onClick={step === "prompt" ? onClose : () => {
                  const steps: Step[] = ["prompt", "paste", "validate", "confirm"];
                  const idx = steps.indexOf(step);
                  if (idx > 0) setStep(steps[idx - 1]);
                }}
                className="btn-muted-themed flex items-center gap-2 px-4 py-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === "prompt" ? "Cancel" : "Back"}
              </button>

              {step === "prompt" && (
                <button
                  onClick={() => setStep("paste")}
                  className="btn-themed flex items-center gap-2 px-4 py-2 text-sm"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {step === "paste" && (
                <button
                  onClick={handleValidate}
                  disabled={!rawJson.trim()}
                  className={cn(
                    "btn-themed flex items-center gap-2 px-4 py-2 text-sm",
                    !rawJson.trim() && "opacity-50 pointer-events-none",
                  )}
                >
                  Validate <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {step === "validate" && validData.length > 0 && (
                <button
                  onClick={() => setStep("confirm")}
                  className="btn-themed flex items-center gap-2 px-4 py-2 text-sm"
                >
                  Confirm Import <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {step === "validate" && validData.length === 0 && (
                <button
                  onClick={handleReset}
                  className="btn-themed flex items-center gap-2 px-4 py-2 text-sm"
                >
                  Start Over
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
