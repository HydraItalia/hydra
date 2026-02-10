import { Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { NormalizedRow, CommitRowResult, TransactionClient } from "./types";
import { canonicalizeName } from "./normalizer";

/**
 * Commit validated rows to the database within a transaction.
 * Handles CategoryGroup, ProductCategory, Product, and VendorProduct upserts.
 *
 * IMPORTANT: ensureCanonicalCategories() must be called before this function
 * to guarantee all canonical categories exist in the DB.
 *
 * Product lookup: categoryId + case-insensitive name + unit
 */
export async function commitRows(
  tx: TransactionClient,
  vendorId: string,
  rows: NormalizedRow[],
): Promise<CommitRowResult[]> {
  const results: CommitRowResult[] = [];

  // Cache to avoid repeated DB lookups within the batch
  const categoryGroupCache = new Map<string, string>(); // groupType -> id
  const categoryCache = new Map<string, string>(); // slug -> id

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // 1. CategoryGroup: upsert by name (groups are seeded by ensureCanonicalCategories)
    let groupId = categoryGroupCache.get(row.categoryGroup);
    if (!groupId) {
      const group = await tx.categoryGroup.upsert({
        where: { name: row.categoryGroup },
        update: {},
        create: { id: createId(), name: row.categoryGroup },
      });
      groupId = group.id;
      categoryGroupCache.set(row.categoryGroup, groupId);
    }

    // 2. ProductCategory: find by slug (must exist via ensureCanonicalCategories)
    let categoryId = categoryCache.get(row.categorySlug);
    if (!categoryId) {
      const category = await tx.productCategory.findUnique({
        where: { slug: row.categorySlug },
      });
      if (!category) {
        throw new Error(
          `Category slug "${row.categorySlug}" not found. ensureCanonicalCategories must run before commitRows.`,
        );
      }
      categoryId = category.id;
      categoryCache.set(row.categorySlug, categoryId);
    }

    // 3. Product: findFirst by (categoryId + case-insensitive name + unit)
    let product = await tx.product.findFirst({
      where: {
        categoryId,
        name: {
          equals: canonicalizeName(row.name),
          mode: "insensitive" as Prisma.QueryMode,
        },
        unit: row.unit,
        deletedAt: null,
      },
    });

    const created = !product;

    if (!product) {
      // Store the canonicalized name so future lookups match consistently
      product = await tx.product.create({
        data: {
          id: createId(),
          name: canonicalizeName(row.name),
          description: "",
          unit: row.unit,
          categoryId,
        },
      });
    }

    // 4. VendorProduct: upsert by vendorId + productId composite
    const vendorProduct = await tx.vendorProduct.upsert({
      where: {
        vendorId_productId: {
          vendorId,
          productId: product.id,
        },
      },
      update: {
        basePriceCents: row.priceCents,
        stockQty: row.inStock ? 100 : 0,
        vendorSku: row.productCode || `SKU-${product.id}`,
        isActive: true,
      },
      create: {
        id: createId(),
        vendorId,
        productId: product.id,
        basePriceCents: row.priceCents,
        stockQty: row.inStock ? 100 : 0,
        vendorSku: row.productCode || `SKU-${product.id}`,
        leadTimeDays: row.inStock ? 0 : 7,
        isActive: true,
        currency: "EUR",
      },
    });

    results.push({
      rowIndex: i,
      productId: product.id,
      vendorProductId: vendorProduct.id,
      created,
    });
  }

  return results;
}
