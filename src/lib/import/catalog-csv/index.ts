export { parseCsv, extractCsvHeaders, CsvParseError } from "./parser";
export type { ParseCsvOpts } from "./parser";
export {
  normalizeRow,
  normalizeUnit,
  canonicalizeName,
  slugifyCategory,
  getCategoryGroup,
  categoryGroupMap,
} from "./normalizer";
export { validateRow, loadExistingCategories } from "./validator";
export { commitRows } from "./committer";
export {
  normalizeHeader,
  buildColumnMapping,
  applyColumnMapping,
  scoreTemplateMatch,
  suggestTemplate,
} from "./mapping";
export type {
  TemplateMapping,
  TemplateMappingField,
  BuildResult,
  MatchScore,
  TemplateSuggestion,
} from "./mapping";
export type {
  RawCsvRow,
  NormalizedRow,
  RowValidationResult,
  CommitRowResult,
} from "./types";
export { KNOWN_CSV_COLUMNS, CSV_LIMITS } from "./types";
