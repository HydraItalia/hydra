import { Prisma, PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { NormalizedRow, CommitRowResult } from "./types";
import { canonicalizeName } from "./normalizer";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Commit validated rows to the database within a transaction.
 * Handles CategoryGroup, ProductCategory, Product, and VendorProduct upserts.
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

    // 1. CategoryGroup: upsert by name
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

    // 2. ProductCategory: upsert by slug
    let categoryId = categoryCache.get(row.categorySlug);
    if (!categoryId) {
      const category = await tx.productCategory.upsert({
        where: { slug: row.categorySlug },
        update: { groupId },
        create: {
          id: createId(),
          name: row.category,
          slug: row.categorySlug,
          groupId,
        },
      });
      categoryId = category.id;
      categoryCache.set(row.categorySlug, categoryId);
    }

    // 3. Product: findFirst by (categoryId + case-insensitive name + unit)
    let product = await tx.product.findFirst({
      where: {
        categoryId,
        name: { equals: canonicalizeName(row.name), mode: "insensitive" as Prisma.QueryMode },
        unit: row.unit,
        deletedAt: null,
      },
    });

    const created = !product;

    if (!product) {
      product = await tx.product.create({
        data: {
          id: createId(),
          name: row.name.trim(),
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
