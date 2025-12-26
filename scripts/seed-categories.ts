/**
 * Seed Categories Script
 *
 * Adds common food service categories to the database
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

const categories = {
  FOOD: [
    { name: "Meat & Poultry", slug: "meat-poultry" },
    { name: "Seafood", slug: "seafood" },
    { name: "Dairy & Eggs", slug: "dairy-eggs" },
    { name: "Produce", slug: "produce" },
    { name: "Bakery & Bread", slug: "bakery-bread" },
    { name: "Frozen Foods", slug: "frozen-foods" },
    { name: "Dry Goods & Pantry", slug: "dry-goods-pantry" },
    { name: "Condiments & Sauces", slug: "condiments-sauces" },
  ],
  BEVERAGE: [
    { name: "Alcoholic Beverages", slug: "alcoholic-beverages" },
    { name: "Soft Drinks", slug: "soft-drinks" },
    { name: "Coffee & Tea", slug: "coffee-tea" },
    { name: "Juices", slug: "juices" },
    { name: "Water", slug: "water" },
  ],
  SERVICES: [
    { name: "Cleaning & Disposables", slug: "cleaning-disposables" },
    { name: "Equipment & Supplies", slug: "equipment-supplies" },
    { name: "Uniforms & Linens", slug: "uniforms-linens" },
  ],
};

async function main() {
  console.log("🌱 Seeding categories...\n");

  let added = 0;
  let skipped = 0;

  for (const [groupName, cats] of Object.entries(categories)) {
    // Find the category group
    const group = await prisma.categoryGroup.findFirst({
      where: { name: groupName as any },
    });

    if (!group) {
      console.log(`❌ Group ${groupName} not found`);
      continue;
    }

    console.log(`\n📁 ${groupName}:`);

    for (const cat of cats) {
      // Check if category already exists
      const existing = await prisma.productCategory.findFirst({
        where: { slug: cat.slug },
      });

      if (existing) {
        console.log(`  ⏭️  ${cat.name} (already exists)`);
        skipped++;
        continue;
      }

      // Create category
      await prisma.productCategory.create({
        data: {
          id: createId(),
          groupId: group.id,
          name: cat.name,
          slug: cat.slug,
        },
      });

      console.log(`  ✅ ${cat.name}`);
      added++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📈 Summary:`);
  console.log(`   ✅ Added: ${added}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📊 Total: ${added + skipped}`);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
