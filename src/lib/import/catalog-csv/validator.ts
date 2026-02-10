import { PrismaClient } from "@prisma/client";
import { NormalizedRow, RowValidationResult } from "./types";
import { suggestCanonicalCategories } from "@/lib/taxonomy";

/** Cached set of existing category slugs for validation */
export async function loadExistingCategories(
  prisma: PrismaClient,
): Promise<Set<string>> {
  const categories = await prisma.productCategory.findMany({
    select: { slug: true },
  });
  return new Set(categories.map((c) => c.slug));
}

/** Validate a single normalized row */
export function validateRow(
  rowIndex: number,
  row: NormalizedRow,
  _existingCategorySlugs?: Set<string>,
): RowValidationResult {
  const errors: string[] = [];

  if (!row.vendorName) {
    errors.push("vendor_name is required");
  }

  if (!row.name) {
    errors.push("name is required");
  }

  if (!row.category) {
    errors.push("category is required");
  }

  if (row.priceCents < 0) {
    errors.push("price_cents must be non-negative");
  }

  if (row.priceCents === 0 && row.inStock) {
    errors.push("in-stock product must have a price > 0");
  }

  // Enforce canonical taxonomy: if didFallback is true, the category is unmapped
  if ((row.didFallback ?? false) && row.category) {
    const suggestions = suggestCanonicalCategories(row.category, "IT", 5);
    const suggestionNames = suggestions.map((s) => s.name).join(", ");
    const hint = suggestionNames ? ` Did you mean: ${suggestionNames}?` : "";
    errors.push(
      `UNMAPPED_CATEGORY: "${row.category}" is not a recognized category.${hint}`,
    );
  }

  return {
    rowIndex,
    valid: errors.length === 0,
    errors,
    normalizedData: errors.length === 0 ? row : null,
  };
}
