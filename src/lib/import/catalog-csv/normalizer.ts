import { ProductUnit, CategoryGroupType } from "@prisma/client";
import { RawCsvRow, NormalizedRow } from "./types";

/** Category name → CategoryGroupType mapping */
export const categoryGroupMap: Record<string, CategoryGroupType> = {
  Beverage: "BEVERAGE",
  Beverages: "BEVERAGE",
  Drinks: "BEVERAGE",
  Wine: "BEVERAGE",
  Spirits: "BEVERAGE",
  Beer: "BEVERAGE",
  Food: "FOOD",
  Produce: "FOOD",
  Seafood: "FOOD",
  Fish: "FOOD",
  Meat: "FOOD",
  Dairy: "FOOD",
  Bakery: "FOOD",
  Pantry: "FOOD",
  Frozen: "FOOD",
  "Specialty Produce": "FOOD",
  Services: "SERVICES",
  Packaging: "SERVICES",
  Supplies: "SERVICES",
  Disposables: "SERVICES",
  "Cleaning & Disposables": "SERVICES",
};

/** Normalize a unit string to ProductUnit enum */
export function normalizeUnit(unitStr: string): ProductUnit {
  const normalized = unitStr.toLowerCase().trim();

  // Weight units
  if (/\bkg\b/.test(normalized) || /\bkilogram/.test(normalized)) {
    return "KG";
  }

  // Service
  if (/\bservice\b/.test(normalized) || /\bdelivery\b/.test(normalized)) {
    return "SERVICE";
  }

  // Box/case
  if (
    /\bbox\b/.test(normalized) ||
    /\bcase\b/.test(normalized) ||
    /\bcrate\b/.test(normalized)
  ) {
    return "BOX";
  }

  // Volume units — word boundaries to avoid matching "small", "clams", etc.
  if (
    /\bl\b/.test(normalized) ||
    /\bliter\b/.test(normalized) ||
    /\blitre\b/.test(normalized) ||
    /\bml\b/.test(normalized) ||
    /\bcl\b/.test(normalized)
  ) {
    return "L";
  }

  // Default to PIECE for bottles, pieces, items, etc.
  return "PIECE";
}

/** Canonicalize a product name for case-insensitive matching */
export function canonicalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Create a URL-safe slug from a category name */
export function slugifyCategory(category: string): string {
  return category.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Case-insensitive lookup index built once from categoryGroupMap */
const categoryGroupLookup = new Map<string, CategoryGroupType>(
  Object.entries(categoryGroupMap).map(([k, v]) => [k.toLowerCase(), v]),
);

/** Determine the CategoryGroupType for a category name (case-insensitive) */
export function getCategoryGroup(categoryName: string): CategoryGroupType {
  return categoryGroupLookup.get(categoryName.toLowerCase()) || "FOOD";
}

/** Normalize a single raw CSV row into typed values */
export function normalizeRow(raw: RawCsvRow): NormalizedRow {
  const category = (raw.category || "").trim();
  const name = (raw.name || "").trim();
  const unitStr = raw.unit || "piece";
  const priceCentsStr = raw.price_cents || "0";
  const inStockStr = (raw.in_stock || "").toLowerCase();

  return {
    vendorName: (raw.vendor_name || "").trim(),
    category,
    categorySlug: slugifyCategory(category),
    categoryGroup: getCategoryGroup(category),
    name,
    canonicalName: canonicalizeName(name),
    unit: normalizeUnit(unitStr),
    priceCents: parseInt(priceCentsStr, 10) || 0,
    inStock: inStockStr === "true" || inStockStr === "1",
    productCode: (raw.product_code || "").trim(),
  };
}
