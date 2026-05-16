/**
 * LLM import validation for Minor Course Checker
 * Validates JSON arrays pasted from LLM output against expected schemas.
 */

import { normalizeShortCode } from "./short-code";

// ============================================================
// SHARED TYPES
// ============================================================

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

// ============================================================
// MINOR COURSE IMPORT
// ============================================================

export interface MinorCourseImport {
  short_code: string;
  name: string;
  credits: number;
  is_required: boolean;
  slot: string | null;
  prerequisites: string[];
  cutoff: string | null;
  difficulty: string | null;
  instructors: string[];
  duration: string;
  typically_offered: string;
}

const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const VALID_DURATIONS = ["full", "first_half", "second_half"];
const VALID_TYPICALLY_OFFERED = ["odd", "even", "both"];

export function validateMinorCourseImport(data: unknown[]): {
  valid: MinorCourseImport[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const valid: MinorCourseImport[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = i + 1;
    const item = data[i] as Record<string, unknown>;
    let hasError = false;

    if (typeof item !== "object" || item === null) {
      errors.push({ row, field: "(row)", message: "Row is not a valid object" });
      continue;
    }

    // short_code — required
    const shortCode = item.short_code;
    if (shortCode === null || shortCode === undefined || (typeof shortCode === "string" && !shortCode.trim())) {
      errors.push({ row, field: "short_code", message: "`short_code` is null or empty — this field is required" });
      hasError = true;
    }

    // name — required
    const name = item.name;
    if (name === null || name === undefined || (typeof name === "string" && !name.trim())) {
      errors.push({ row, field: "name", message: "`name` is null or empty — this field is required" });
      hasError = true;
    }

    // credits — required
    const credits = item.credits;
    if (credits === null || credits === undefined || typeof credits !== "number" || isNaN(credits)) {
      errors.push({ row, field: "credits", message: "`credits` is null or not a number — this field is required" });
      hasError = true;
    }

    // is_required — default false
    let isRequired = false;
    if (typeof item.is_required === "boolean") {
      isRequired = item.is_required;
    } else if (item.is_required !== null && item.is_required !== undefined) {
      warnings.push({ row, field: "is_required", message: "`is_required` is not a boolean — defaulting to false" });
    }

    // slot — optional
    const slot = typeof item.slot === "string" && item.slot.trim() ? item.slot.trim() : null;
    if (slot === null && item.slot !== null && item.slot !== undefined) {
      warnings.push({ row, field: "slot", message: "`slot` is null" });
    }

    // prerequisites — optional array
    let prerequisites: string[] = [];
    if (Array.isArray(item.prerequisites)) {
      prerequisites = item.prerequisites.filter((p): p is string => typeof p === "string");
    } else if (item.prerequisites !== null && item.prerequisites !== undefined) {
      warnings.push({ row, field: "prerequisites", message: "`prerequisites` is not an array — defaulting to []" });
    }

    // cutoff — optional
    const cutoff = typeof item.cutoff === "string" && item.cutoff.trim() ? item.cutoff.trim() : null;

    // difficulty — optional, must be Easy/Medium/Hard
    let difficulty: string | null = null;
    if (typeof item.difficulty === "string" && item.difficulty.trim()) {
      if (VALID_DIFFICULTIES.includes(item.difficulty.trim())) {
        difficulty = item.difficulty.trim();
      } else {
        errors.push({
          row,
          field: "difficulty",
          message: `\`difficulty\` value '${item.difficulty}' is invalid — must be ${VALID_DIFFICULTIES.map(d => `\`${d}\``).join(", ")}`,
        });
        hasError = true;
      }
    }

    // instructors — optional array
    let instructors: string[] = [];
    if (Array.isArray(item.instructors)) {
      instructors = item.instructors.filter((p): p is string => typeof p === "string");
    } else if (item.instructors !== null && item.instructors !== undefined) {
      warnings.push({ row, field: "instructors", message: "`instructors` is not an array — defaulting to []" });
    }

    // duration — default "full"
    let duration = "full";
    if (typeof item.duration === "string" && item.duration.trim()) {
      if (VALID_DURATIONS.includes(item.duration.trim())) {
        duration = item.duration.trim();
      } else {
        errors.push({
          row,
          field: "duration",
          message: `\`duration\` value '${item.duration}' is invalid — must be ${VALID_DURATIONS.map(d => `\`${d}\``).join(", ")}`,
        });
        hasError = true;
      }
    }

    // typically_offered — default "both"
    let typicallyOffered = "both";
    if (typeof item.typically_offered === "string" && item.typically_offered.trim()) {
      if (VALID_TYPICALLY_OFFERED.includes(item.typically_offered.trim())) {
        typicallyOffered = item.typically_offered.trim();
      } else {
        errors.push({
          row,
          field: "typically_offered",
          message: `\`typically_offered\` value '${item.typically_offered}' is invalid — must be ${VALID_TYPICALLY_OFFERED.map(d => `\`${d}\``).join(", ")}`,
        });
        hasError = true;
      }
    }

    if (!hasError) {
      valid.push({
        short_code: String(shortCode).trim(),
        name: String(name).trim(),
        credits: Number(credits),
        is_required: isRequired,
        slot,
        prerequisites,
        cutoff,
        difficulty,
        instructors,
        duration,
        typically_offered: typicallyOffered,
      });
    }
  }

  return { valid, errors, warnings };
}

// ============================================================
// SEMESTER COURSE IMPORT
// ============================================================

export interface SemesterCourseImport {
  short_code: string;
  name: string;
  instructors: string[];
  slot: string | null;
  classroom: string | null;
  student_limit: number | null;
  category: string | null;
  course_type: string;
  duration: string;
}

const VALID_CATEGORIES = ["stem", "advanced"];
const VALID_COURSE_TYPES = ["theory", "lab", "seminar", "project", "other"];

export function validateSemesterCourseImport(data: unknown[]): {
  valid: SemesterCourseImport[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const valid: SemesterCourseImport[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = i + 1;
    const item = data[i] as Record<string, unknown>;
    let hasError = false;

    if (typeof item !== "object" || item === null) {
      errors.push({ row, field: "(row)", message: "Row is not a valid object" });
      continue;
    }

    // short_code — required
    const shortCode = item.short_code;
    if (shortCode === null || shortCode === undefined || (typeof shortCode === "string" && !shortCode.trim())) {
      errors.push({ row, field: "short_code", message: "`short_code` is null or empty — this field is required" });
      hasError = true;
    }

    // name — required
    const name = item.name;
    if (name === null || name === undefined || (typeof name === "string" && !name.trim())) {
      errors.push({ row, field: "name", message: "`name` is null or empty — this field is required" });
      hasError = true;
    }

    // instructors — optional array
    let instructors: string[] = [];
    if (Array.isArray(item.instructors)) {
      instructors = item.instructors.filter((p): p is string => typeof p === "string");
    } else if (item.instructors !== null && item.instructors !== undefined) {
      warnings.push({ row, field: "instructors", message: "`instructors` is not an array — defaulting to []" });
    }

    // slot — optional
    const slot = typeof item.slot === "string" && item.slot.trim() ? item.slot.trim() : null;
    if (slot === null && item.slot !== null && item.slot !== undefined) {
      warnings.push({ row, field: "slot", message: "`slot` is null" });
    }

    // classroom — optional
    const classroom = typeof item.classroom === "string" && item.classroom.trim() ? item.classroom.trim() : null;

    // student_limit — optional number
    let studentLimit: number | null = null;
    if (typeof item.student_limit === "number" && !isNaN(item.student_limit)) {
      studentLimit = item.student_limit;
    } else if (item.student_limit !== null && item.student_limit !== undefined) {
      warnings.push({ row, field: "student_limit", message: "`student_limit` is not a number — defaulting to null" });
    }

    // category — optional, must be "stem" or "advanced"
    let category: string | null = null;
    if (typeof item.category === "string" && item.category.trim()) {
      if (VALID_CATEGORIES.includes(item.category.trim())) {
        category = item.category.trim();
      } else {
        errors.push({
          row,
          field: "category",
          message: `\`category\` value '${item.category}' is invalid — must be \`stem\` or \`advanced\``,
        });
        hasError = true;
      }
    }

    // course_type — default "theory"
    let courseType = "theory";
    if (typeof item.course_type === "string" && item.course_type.trim()) {
      if (VALID_COURSE_TYPES.includes(item.course_type.trim())) {
        courseType = item.course_type.trim();
      } else {
        errors.push({
          row,
          field: "course_type",
          message: `\`course_type\` value '${item.course_type}' is invalid — must be ${VALID_COURSE_TYPES.map(d => `\`${d}\``).join(", ")}`,
        });
        hasError = true;
      }
    }

    // duration — required, default "full"
    let duration = "full";
    if (typeof item.duration === "string" && item.duration.trim()) {
      if (VALID_DURATIONS.includes(item.duration.trim())) {
        duration = item.duration.trim();
      } else {
        errors.push({
          row,
          field: "duration",
          message: `\`duration\` value '${item.duration}' is invalid — must be ${VALID_DURATIONS.map(d => `\`${d}\``).join(", ")}`,
        });
        hasError = true;
      }
    }

    if (!hasError) {
      valid.push({
        short_code: String(shortCode).trim(),
        name: String(name).trim(),
        instructors,
        slot,
        classroom,
        student_limit: studentLimit,
        category,
        course_type: courseType,
        duration,
      });
    }
  }

  return { valid, errors, warnings };
}

/**
 * Parse raw JSON text from user input, handling markdown code fences
 */
export function parseImportJson(text: string): { data: unknown[] | null; error: string | null } {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) {
      return { data: null, error: "Expected a JSON array, but got a different type" };
    }
    return { data: parsed, error: null };
  } catch (e) {
    return { data: null, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
}
