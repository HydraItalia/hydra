/**
 * N1.1: Seed Tax Profiles Script
 *
 * Creates the 4 Italian VAT tax profiles and assigns them to existing categories.
 *
 * Run with: npx tsx scripts/seed-tax-profiles.ts
 *
 * Tax Profiles:
 * - standard_22:     2200 bps (22.00%) - Services, alcohol
 * - reduced_10:      1000 bps (10.00%) - Food, non-alcoholic beverages (DEFAULT)
 * - super_reduced_4:  400 bps (4.00%)  - Essential food items
 * - exempt_0:           0 bps (0.00%)  - Medical, education
 *
 * Category Assignment:
 * - FOOD group       → reduced_10
 * - BEVERAGE group   → reduced_10 (except Alcoholic Beverages → standard_22)
 * - SERVICES group   → standard_22
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TAX_PROFILES = [
  {
    name: "standard_22",
    vatRateBps: 2200,
    description: "Standard rate (22%) - Services, alcohol, general goods",
    isDefault: false,
  },
  {
    name: "reduced_10",
    vatRateBps: 1000,
    description: "Reduced rate (10%) - Food, restaurants, non-alcoholic beverages",
    isDefault: true, // This is the default for most products
  },
  {
    name: "super_reduced_4",
    vatRateBps: 400,
    description: "Super-reduced rate (4%) - Essential food items (bread, milk, etc.)",
    isDefault: false,
  },
  {
    name: "exempt_0",
    vatRateBps: 0,
    description: "Exempt (0%) - Medical, education, specific exemptions",
    isDefault: false,
  },
];

// Categories that get standard_22 instead of the group default
const STANDARD_22_CATEGORIES = ["alcoholic-beverages"];

async function main() {
  console.log("N1.1: Seeding Tax Profiles\n");
  console.log("=".repeat(60));

  // 1. Create or update tax profiles
  console.log("\n1. Creating Tax Profiles\n");

  const profileMap: Record<string, string> = {};

  for (const profile of TAX_PROFILES) {
    const existing = await prisma.taxProfile.findUnique({
      where: { name: profile.name },
    });

    if (existing) {
      console.log(`  [skip] ${profile.name} (already exists)`);
      profileMap[profile.name] = existing.id;
    } else {
      const created = await prisma.taxProfile.create({
        data: profile,
      });
      console.log(`  [create] ${profile.name} (${profile.vatRateBps} bps)`);
      profileMap[profile.name] = created.id;
    }
  }

  // 2. Assign tax profiles to categories
  console.log("\n2. Assigning Tax Profiles to Categories\n");

  const categories = await prisma.productCategory.findMany({
    include: {
      CategoryGroup: { select: { name: true } },
    },
  });

  let assigned = 0;
  let skipped = 0;

  for (const category of categories) {
    // Skip if already assigned
    if (category.taxProfileId) {
      console.log(`  [skip] ${category.name} (already has taxProfileId)`);
      skipped++;
      continue;
    }

    // Determine which tax profile to use
    let taxProfileName: string;

    if (STANDARD_22_CATEGORIES.includes(category.slug)) {
      // Special case: alcoholic beverages get standard rate
      taxProfileName = "standard_22";
    } else if (category.CategoryGroup.name === "SERVICES") {
      // Services get standard rate
      taxProfileName = "standard_22";
    } else {
      // FOOD and BEVERAGE get reduced rate
      taxProfileName = "reduced_10";
    }

    const taxProfileId = profileMap[taxProfileName];

    await prisma.productCategory.update({
      where: { id: category.id },
      data: { taxProfileId },
    });

    console.log(
      `  [assign] ${category.name} (${category.CategoryGroup.name}) → ${taxProfileName}`
    );
    assigned++;
  }

  // 3. Summary
  console.log("\n" + "=".repeat(60));
  console.log("Summary\n");
  console.log(`  Tax Profiles: ${TAX_PROFILES.length} created/verified`);
  console.log(`  Categories assigned: ${assigned}`);
  console.log(`  Categories skipped: ${skipped}`);

  // 4. Verification
  console.log("\n" + "=".repeat(60));
  console.log("Verification\n");

  const unassigned = await prisma.productCategory.count({
    where: { taxProfileId: null },
  });

  if (unassigned === 0) {
    console.log("  All categories have a tax profile assigned");
  } else {
    console.log(`  WARNING: ${unassigned} categories still without tax profile`);
  }

  const profileCounts = await prisma.productCategory.groupBy({
    by: ["taxProfileId"],
    _count: { id: true },
  });

  console.log("\n  Categories by Tax Profile:");
  for (const pc of profileCounts) {
    const profile = pc.taxProfileId
      ? await prisma.taxProfile.findUnique({ where: { id: pc.taxProfileId } })
      : null;
    const name = profile ? profile.name : "(none)";
    console.log(`    ${name}: ${pc._count.id}`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
