/**
 * Short code normalization and fuzzy matching utilities
 * Used across: recommender, completion detection, course explorer, minor bucket matching
 */

/**
 * Normalize a short code for comparison.
 * - Lowercase
 * - Remove all whitespace
 * - Remove all characters except letters and digits
 *
 * e.g. "CS 231", "cs231", "CS-231" all normalize to "cs231"
 */
export function normalizeShortCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Compute Levenshtein distance between two strings.
 * Uses the classic dynamic programming approach.
 */
export function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use single-row optimization
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array<number>(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,     // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb];
}

/**
 * Match result for short code comparison
 */
export interface ShortCodeMatch {
  /** Whether this is considered a match */
  match: boolean;
  /** Whether this is a fuzzy (non-exact) match */
  fuzzy: boolean;
  /** Levenshtein distance (0 = exact) */
  distance: number;
  /** Confidence level: "exact" | "close" | "possible" | "no_match" */
  confidence: "exact" | "close" | "possible" | "no_match";
}

/**
 * Compare two short codes using normalization + Levenshtein distance.
 *
 * After normalization:
 * - distance 0 → exact match, no flag
 * - distance ≤ 1 → treat as match, show fuzzy indicator
 * - distance ≤ 2 → possible match, flag more prominently
 * - distance > 2 → no match
 */
export function matchShortCode(a: string, b: string): ShortCodeMatch {
  const na = normalizeShortCode(a);
  const nb = normalizeShortCode(b);

  if (na === nb) {
    return { match: true, fuzzy: false, distance: 0, confidence: "exact" };
  }

  const dist = levenshteinDistance(na, nb);

  if (dist <= 1) {
    return { match: true, fuzzy: true, distance: dist, confidence: "close" };
  }

  if (dist <= 2) {
    return { match: true, fuzzy: true, distance: dist, confidence: "possible" };
  }

  return { match: false, fuzzy: false, distance: dist, confidence: "no_match" };
}

/**
 * Find the best short code match from a list of candidates.
 * Returns the match with the lowest distance, or null if no match.
 */
export function findBestShortCodeMatch<T extends { short_code_normalized?: string; short_code?: string }>(
  target: string,
  candidates: T[],
): { item: T; match: ShortCodeMatch } | null {
  const normalizedTarget = normalizeShortCode(target);
  let bestItem: T | null = null;
  let bestMatch: ShortCodeMatch | null = null;

  for (const candidate of candidates) {
    const code = candidate.short_code_normalized || normalizeShortCode(candidate.short_code || "");
    if (!code) continue;

    const result = matchShortCode(normalizedTarget, code);
    if (result.match && (!bestMatch || result.distance < bestMatch.distance)) {
      bestItem = candidate;
      bestMatch = result;
    }
  }

  if (bestItem && bestMatch) {
    return { item: bestItem, match: bestMatch };
  }

  return null;
}
