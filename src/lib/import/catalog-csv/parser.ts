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

/**
 * Parse CSV text into raw rows, stripping unknown columns.
 * Throws CsvParseError if safety limits are exceeded or parsing fails.
 */
export function parseCsv(input: string): RawCsvRow[] {
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
