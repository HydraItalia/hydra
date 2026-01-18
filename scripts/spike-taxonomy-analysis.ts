/**
 * Phase 12 Discovery: Taxonomy Health Analysis Script
 *
 * Run with: npx tsx scripts/spike-taxonomy-analysis.ts
 *
 * Outputs:
 * - Total product counts
 * - Category distribution
 * - Potential duplicates / near-duplicates
 * - Unit normalization issues
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Phase 12 Discovery: Taxonomy Health Analysis\n");
  console.log("=".repeat(60));

  // 1. Basic counts
  console.log("\n📊 BASIC COUNTS\n");

  const productCount = await prisma.product.count({
    where: { deletedAt: null },
  });
  const vendorProductCount = await prisma.vendorProduct.count({
    where: { deletedAt: null },
  });
  const categoryCount = await prisma.productCategory.count();
  const groupCount = await prisma.categoryGroup.count();
  const vendorCount = await prisma.vendor.count({ where: { deletedAt: null } });

  console.log(`Products:        ${productCount}`);
  console.log(`Vendor Products: ${vendorProductCount}`);
  console.log(`Categories:      ${categoryCount}`);
  console.log(`Category Groups: ${groupCount}`);
  console.log(`Vendors:         ${vendorCount}`);

  // 2. Category distribution
  console.log("\n📁 CATEGORY DISTRIBUTION\n");

  const categoryDistribution = await prisma.productCategory.findMany({
    include: {
      _count: { select: { Product: true } },
      CategoryGroup: { select: { name: true } },
    },
    orderBy: { Product: { _count: "desc" } },
  });

  console.log("Group              | Category                    | Products");
  console.log("-".repeat(60));

  for (const cat of categoryDistribution) {
    const group = cat.CategoryGroup.name.padEnd(18);
    const name = cat.name.padEnd(27);
    console.log(`${group} | ${name} | ${cat._count.Product}`);
  }

  // 3. Products per vendor
  console.log("\n🏪 PRODUCTS PER VENDOR\n");

  const vendorDistribution = await prisma.vendor.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { VendorProduct: true } },
    },
    orderBy: { VendorProduct: { _count: "desc" } },
  });

  console.log("Vendor                              | Products");
  console.log("-".repeat(50));

  for (const vendor of vendorDistribution) {
    const name = vendor.name.padEnd(35);
    console.log(`${name} | ${vendor._count.VendorProduct}`);
  }

  // 4. Unit distribution
  console.log("\n📏 UNIT DISTRIBUTION\n");

  const unitDistribution = await prisma.product.groupBy({
    by: ["unit"],
    _count: { id: true },
    where: { deletedAt: null },
    orderBy: { _count: { id: "desc" } },
  });

  console.log("Unit      | Count");
  console.log("-".repeat(25));

  for (const unit of unitDistribution) {
    const unitName = unit.unit.padEnd(9);
    console.log(`${unitName} | ${unit._count.id}`);
  }

  // 5. Potential duplicate product names
  console.log(
    "\n⚠️  POTENTIAL DUPLICATE PRODUCTS (same name, different categories)\n",
  );

  const allProducts = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, categoryId: true },
  });

  const nameGroups = new Map<string, typeof allProducts>();
  for (const p of allProducts) {
    const normalizedName = p.name.toLowerCase().trim();
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    nameGroups.get(normalizedName)!.push(p);
  }

  let duplicateCount = 0;
  for (const [name, products] of nameGroups) {
    if (products.length > 1) {
      const uniqueCategories = new Set(products.map((p) => p.categoryId));
      if (uniqueCategories.size > 1) {
        duplicateCount++;
        if (duplicateCount <= 10) {
          console.log(
            `"${name}" appears in ${uniqueCategories.size} categories (${products.length} total)`,
          );
        }
      }
    }
  }

  if (duplicateCount === 0) {
    console.log("No cross-category duplicates found.");
  } else if (duplicateCount > 10) {
    console.log(`... and ${duplicateCount - 10} more`);
  }
  console.log(`\nTotal potential cross-category duplicates: ${duplicateCount}`);

  // 6. Near-duplicate detection (case/spacing issues)
  console.log("\n⚠️  NEAR-DUPLICATE CATEGORIES (case/spacing issues)\n");

  const categories = await prisma.productCategory.findMany({
    select: { id: true, name: true, slug: true },
  });

  const seenNormalized = new Map<string, typeof categories>();
  for (const cat of categories) {
    const normalized = cat.name.toLowerCase().replace(/\s+/g, " ").trim();
    if (!seenNormalized.has(normalized)) {
      seenNormalized.set(normalized, []);
    }
    seenNormalized.get(normalized)!.push(cat);
  }

  let nearDupeCount = 0;
  for (const [, cats] of seenNormalized) {
    if (cats.length > 1) {
      nearDupeCount++;
      console.log(
        `Near-duplicates: ${cats.map((c) => `"${c.name}"`).join(", ")}`,
      );
    }
  }

  if (nearDupeCount === 0) {
    console.log("No near-duplicate categories found.");
  }

  // 7. Products with suspicious names (embedded metadata)
  console.log("\n⚠️  PRODUCTS WITH EMBEDDED METADATA IN NAMES\n");

  const suspiciousPatterns = [
    { pattern: /IVA\s*(ESCLUSA|INCLUSA|COMPRESA)/i, label: "IVA mention" },
    { pattern: /\d+\s*(CRT|CASSE|BOX|PZ)\s*\d*/i, label: "Pack size" },
    { pattern: /€\s*\d+[.,]\d{2}/i, label: "Price" },
  ];

  const productsWithMetadata = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    take: 2000, // Limit for performance
  });

  let suspiciousCount = 0;
  for (const p of productsWithMetadata) {
    for (const { pattern, label } of suspiciousPatterns) {
      if (pattern.test(p.name)) {
        suspiciousCount++;
        if (suspiciousCount <= 5) {
          console.log(`[${label}] ${p.name.substring(0, 80)}...`);
        }
        break;
      }
    }
  }

  if (suspiciousCount === 0) {
    console.log("No suspicious product names found.");
  } else {
    console.log(`\nTotal products with embedded metadata: ${suspiciousCount}`);
  }

  // 8. VAT readiness check
  console.log("\n🧾 VAT READINESS CHECK\n");

  // Check if VAT fields exist (they shouldn't yet)
  const schema = await prisma.$queryRaw<
    { column_name: string }[]
  >`SELECT column_name FROM information_schema.columns
    WHERE table_name = 'ProductCategory' AND column_name LIKE '%vat%'`;

  if (schema.length === 0) {
    console.log(
      "❌ No VAT fields on ProductCategory (expected - needs Phase 12.1)",
    );
  } else {
    console.log(
      `✅ VAT fields found: ${schema.map((s) => s.column_name).join(", ")}`,
    );
  }

  const orderItemVat = await prisma.$queryRaw<
    { column_name: string }[]
  >`SELECT column_name FROM information_schema.columns
    WHERE table_name = 'OrderItem' AND column_name LIKE '%vat%'`;

  if (orderItemVat.length === 0) {
    console.log(
      "❌ No VAT snapshot fields on OrderItem (expected - needs Phase 12.1)",
    );
  } else {
    console.log(
      `✅ VAT snapshot fields found: ${orderItemVat.map((s) => s.column_name).join(", ")}`,
    );
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY\n");
  console.log(`✅ ${productCount} products across ${categoryCount} categories`);
  console.log(
    `✅ ${vendorCount} vendors with ${vendorProductCount} vendor-product links`,
  );
  console.log(`⚠️  ${duplicateCount} potential cross-category duplicates`);
  console.log(`⚠️  ${nearDupeCount} near-duplicate category names`);
  console.log(`⚠️  ${suspiciousCount} products with embedded metadata`);
  console.log(`❌ No VAT fields yet (Phase 12.1 required)`);

  console.log("\n🎯 RECOMMENDATIONS:");
  console.log("1. Implement Phase 12.1 to add VAT schema fields");
  console.log("2. Review products with embedded IVA/price metadata");
  console.log("3. Consider deduplicating cross-category products");
  console.log("4. Normalize category names for consistency");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
