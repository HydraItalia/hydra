import { parse } from "csv-parse/sync";
import {
  RawCsvRow,
  KNOWN_CSV_COLUMNS,
  KnownCsvColumn,
  CSV_LIMITS,
} from "./types";

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvParseError";
  }
}

export type ParseCsvOpts = {
  /** When true, keep all columns instead of stripping unknown ones */
  keepAllColumns?: boolean;
};

/**
 * Parse CSV text into raw rows, optionally stripping unknown columns.
 * Throws CsvParseError if safety limits are exceeded or parsing fails.
 */
export function parseCsv(
  input: string,
  opts?: ParseCsvOpts,
): RawCsvRow[] {
  if (!input.trim()) {
    throw new CsvParseError("CSV input is empty");
  }

  let allRows: Record<string, string>[];
  try {
    allRows = parse(input, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new CsvParseError(
      `CSV parse failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (allRows.length === 0) {
    throw new CsvParseError("CSV contains no data rows");
  }

  // Check column count from first row
  const columnCount = Object.keys(allRows[0]).length;
  if (columnCount > CSV_LIMITS.MAX_COLUMNS) {
    throw new CsvParseError(
      `CSV has ${columnCount} columns (max ${CSV_LIMITS.MAX_COLUMNS})`,
    );
  }

  // Check row count
  if (allRows.length > CSV_LIMITS.MAX_ROWS) {
    throw new CsvParseError(
      `CSV has ${allRows.length} rows (max ${CSV_LIMITS.MAX_ROWS})`,
    );
  }

  // When keepAllColumns is set, return all columns (for template mapping)
  if (opts?.keepAllColumns) {
    return allRows as unknown as RawCsvRow[];
  }

  // Strip unknown columns, keep only known ones
  const knownSet = new Set<string>(KNOWN_CSV_COLUMNS as readonly string[]);

  return allRows.map((row) => {
    const cleaned: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      if (knownSet.has(key as KnownCsvColumn)) {
        cleaned[key] = row[key];
      }
    }
    return cleaned as unknown as RawCsvRow;
  });
}

/**
 * Safely extract CSV headers using csv-parse.
 * Handles quoted commas, multiline headers, etc.
 */
export function extractCsvHeaders(input: string): string[] {
  if (!input.trim()) return [];

  let rows: string[][];
  try {
    rows = parse(input, {
      columns: false,
      trim: true,
      relax_column_count: true,
      to: 1,
    });
  } catch (err) {
    throw new CsvParseError(
      `CSV parse failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const headers = (rows[0] as string[]) || [];
  if (headers.length > CSV_LIMITS.MAX_COLUMNS) {
    throw new CsvParseError(
      `CSV has ${headers.length} columns (max ${CSV_LIMITS.MAX_COLUMNS})`,
    );
  }

  return headers;
}
