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
  if (normalized.includes("kg") || normalized.includes("kilogram")) {
    return "KG";
  }

  // Service (check before "l" to avoid false match on "delivery")
  if (normalized.includes("service") || normalized.includes("delivery")) {
    return "SERVICE";
  }

  // Box/case (check before "l" to avoid false match on "castle" etc.)
  if (
    normalized.includes("box") ||
    normalized.includes("case") ||
    normalized.includes("crate")
  ) {
    return "BOX";
  }

  // Volume units — use word boundary or exact match to avoid false positives
  // "l" alone, or compound units like "ml", "cl", "liter", "litre"
  if (
    normalized === "l" ||
    normalized.includes("liter") ||
    normalized.includes("litre") ||
    normalized.includes("ml") ||
    normalized.includes("cl") ||
    /\bl\b/.test(normalized)
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

/** Determine the CategoryGroupType for a category name */
export function getCategoryGroup(categoryName: string): CategoryGroupType {
  return categoryGroupMap[categoryName] || "FOOD";
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
