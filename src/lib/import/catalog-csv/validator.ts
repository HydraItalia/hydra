import { PrismaClient } from "@prisma/client";
import { NormalizedRow, RowValidationResult } from "./types";

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
  existingCategorySlugs?: Set<string>,
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

  // Warn if category doesn't exist yet (will be created on commit)
  if (
    existingCategorySlugs &&
    row.categorySlug &&
    !existingCategorySlugs.has(row.categorySlug)
  ) {
    // Not an error — categories are auto-created on commit — but noted for info
  }

  return {
    rowIndex,
    valid: errors.length === 0,
    errors,
    normalizedData: errors.length === 0 ? row : null,
  };
}
