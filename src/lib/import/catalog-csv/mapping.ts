/**
 * Column mapping engine for import templates.
 *
 * Templates store a canonical-field → config mapping (TemplateMapping).
 * At apply-time, buildColumnMapping() inverts it against actual CSV headers
 * to produce a columnMap (actual header → canonical field).
 */

import { normalizeUnit } from "./normalizer";

// ── Types ────────────────────────────────────────────────────────────────────

/** Config for a single canonical field in a template */
export type TemplateMappingField = {
  sources: string[]; // vendor headers that map to this field (first match wins)
  required: boolean; // weighted higher in scoring
  transform?: "toCents" | "toBool" | "normalizeUnit";
};

/** Stored in ImportTemplate.mapping — canonical field → config */
export type TemplateMapping = Record<string, TemplateMappingField>;

/** Result from buildColumnMapping */
export type BuildResult = {
  columnMap: Record<string, string>; // actual CSV header → canonical field
  resolvedFields: Record<string, string>; // canonical field → matched CSV header
  missingRequired: string[]; // canonical fields marked required with no match
};

/** Result from scoreTemplateMatch */
export type MatchScore = {
  score: number; // 0–1
  matchedFields: string[]; // canonical fields that matched
  missingRequired: string[]; // required canonical fields with no match
  unmatchedHeaders: string[]; // CSV headers with no canonical mapping
};

/** Result from suggestTemplate */
export type TemplateSuggestion = {
  templateId: string;
  templateName: string;
  score: number;
  autoApply: boolean; // score >= 0.75
  matchedFields: string[];
  missingRequired: string[];
  unmatchedHeaders: string[];
};

// ── Header normalization ─────────────────────────────────────────────────────

/**
 * Normalize a CSV header for fuzzy matching.
 * trim, lowercase, replace _/-/. with space, collapse spaces, strip punctuation
 */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[_\-.]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Column mapping ───────────────────────────────────────────────────────────

/**
 * For each canonical field in the template, find the first matching CSV header
 * from its sources list (normalized comparison).
 */
export function buildColumnMapping(
  templateMapping: TemplateMapping,
  csvHeaders: string[],
): BuildResult {
  const columnMap: Record<string, string> = {};
  const resolvedFields: Record<string, string> = {};
  const missingRequired: string[] = [];

  // Pre-normalize CSV headers for matching
  const normalizedCsvHeaders = csvHeaders.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
  }));

  for (const [canonicalField, config] of Object.entries(templateMapping)) {
    let matched = false;

    for (const source of config.sources) {
      const normalizedSource = normalizeHeader(source);
      const found = normalizedCsvHeaders.find(
        (h) => h.normalized === normalizedSource,
      );

      if (found) {
        columnMap[found.original] = canonicalField;
        resolvedFields[canonicalField] = found.original;
        matched = true;
        break;
      }
    }

    if (!matched && config.required) {
      missingRequired.push(canonicalField);
    }
  }

  return { columnMap, resolvedFields, missingRequired };
}

// ── Transform helpers ────────────────────────────────────────────────────────

function applyTransform(
  value: string,
  transform: "toCents" | "toBool" | "normalizeUnit",
): string {
  switch (transform) {
    case "toCents": {
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return String(Math.round(num * 100));
    }
    case "toBool": {
      const lower = value.toLowerCase().trim();
      return ["yes", "si", "sì", "1", "true"].includes(lower)
        ? "true"
        : "false";
    }
    case "normalizeUnit":
      return normalizeUnit(value);
    default:
      return value;
  }
}

// ── Apply mapping to rows ────────────────────────────────────────────────────

/**
 * Apply column mapping to raw rows.
 * 1. Copy ALL existing fields (preserves unmapped vendor-specific columns)
 * 2. For each mapped field: copy value to canonical key, applying transform
 * 3. Apply defaults for missing/empty canonical fields
 */
export function applyColumnMapping(
  rawRows: Record<string, string>[],
  columnMap: Record<string, string>,
  templateMapping?: TemplateMapping,
  defaults?: Record<string, string>,
): Record<string, string>[] {
  return rawRows.map((row) => {
    // Start with a copy of all original fields
    const result: Record<string, string> = { ...row };

    // Apply mapped fields
    for (const [csvHeader, canonicalField] of Object.entries(columnMap)) {
      const value = row[csvHeader];
      if (value !== undefined) {
        const transform = templateMapping?.[canonicalField]?.transform;
        result[canonicalField] = transform
          ? applyTransform(value, transform)
          : value;
      }
    }

    // Apply defaults for missing/empty canonical fields
    if (defaults) {
      for (const [field, defaultValue] of Object.entries(defaults)) {
        if (!result[field] || result[field].trim() === "") {
          result[field] = defaultValue;
        }
      }
    }

    return result;
  });
}

// ── Template scoring ─────────────────────────────────────────────────────────

/**
 * Score how well a template matches the given CSV headers.
 * Required fields: 2 points each. Optional fields: 1 point each.
 * Score = earned / max possible.
 */
export function scoreTemplateMatch(
  templateMapping: TemplateMapping,
  csvHeaders: string[],
): MatchScore {
  const normalizedCsvHeaders = csvHeaders.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
  }));

  let earned = 0;
  let maxPoints = 0;
  const matchedFields: string[] = [];
  const missingRequired: string[] = [];
  const matchedCsvHeaders = new Set<string>();

  for (const [canonicalField, config] of Object.entries(templateMapping)) {
    const weight = config.required ? 2 : 1;
    maxPoints += weight;

    let matched = false;
    for (const source of config.sources) {
      const normalizedSource = normalizeHeader(source);
      const found = normalizedCsvHeaders.find(
        (h) => h.normalized === normalizedSource,
      );

      if (found) {
        earned += weight;
        matchedFields.push(canonicalField);
        matchedCsvHeaders.add(found.original);
        matched = true;
        break;
      }
    }

    if (!matched && config.required) {
      missingRequired.push(canonicalField);
    }
  }

  const unmatchedHeaders = csvHeaders.filter((h) => !matchedCsvHeaders.has(h));
  const score = maxPoints > 0 ? earned / maxPoints : 0;

  return { score, matchedFields, missingRequired, unmatchedHeaders };
}

// ── Template suggestion ──────────────────────────────────────────────────────

const AUTO_APPLY_THRESHOLD = 0.75;
const SUGGESTION_THRESHOLD = 0.5;

/**
 * Find the best matching template for the given CSV headers.
 * Returns null if no template scores >= 0.5.
 */
export function suggestTemplate(
  templates: Array<{
    id: string;
    name: string;
    mapping: TemplateMapping;
  }>,
  csvHeaders: string[],
): TemplateSuggestion | null {
  let best: (TemplateSuggestion & { score: number }) | null = null;

  for (const template of templates) {
    const result = scoreTemplateMatch(template.mapping, csvHeaders);

    if (result.score < SUGGESTION_THRESHOLD) continue;

    if (!best || result.score > best.score) {
      best = {
        templateId: template.id,
        templateName: template.name,
        score: result.score,
        autoApply: result.score >= AUTO_APPLY_THRESHOLD,
        matchedFields: result.matchedFields,
        missingRequired: result.missingRequired,
        unmatchedHeaders: result.unmatchedHeaders,
      };
    }
  }

  return best;
}
