import { ProductUnit, CategoryGroupType } from "@prisma/client";

/** Raw row as parsed from CSV (all string values) */
export interface RawCsvRow {
  vendor_name: string;
  category: string;
  name: string;
  unit: string;
  price_cents: string;
  in_stock: string;
  product_code: string;
  source_price_raw?: string;
}

/** Known CSV column names */
export const KNOWN_CSV_COLUMNS = [
  "vendor_name",
  "category",
  "name",
  "unit",
  "price_cents",
  "in_stock",
  "product_code",
  "source_price_raw",
] as const;

export type KnownCsvColumn = (typeof KNOWN_CSV_COLUMNS)[number];

/** Row after normalization — typed values ready for validation */
export interface NormalizedRow {
  vendorName: string;
  category: string;
  categorySlug: string;
  categoryGroup: CategoryGroupType;
  name: string;
  canonicalName: string;
  unit: ProductUnit;
  priceCents: number;
  inStock: boolean;
  productCode: string;
}

/** Result of validating a single row */
export interface RowValidationResult {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  normalizedData: NormalizedRow | null;
}

/** Result of committing a single row */
export interface CommitRowResult {
  rowIndex: number;
  productId: string;
  vendorProductId: string;
  created: boolean; // true = new product, false = existing product updated
}

/** Safety limits for CSV parsing */
export const CSV_LIMITS = {
  MAX_ROWS: 20_000,
  MAX_COLUMNS: 20,
} as const;
