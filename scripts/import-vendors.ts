import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import fs from "fs";
import path from "path";

import {
  parseCsv,
  normalizeRow,
  validateRow,
  commitRows,
} from "../src/lib/import/catalog-csv";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function importCsv(filePath: string) {
  console.log(`\n📦 Importing: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const rawRows = parseCsv(fileContent);
  const normalizedRows = rawRows.map((raw) => normalizeRow(raw));

  console.log(`   Found ${normalizedRows.length} products`);

  let imported = 0;
  let skipped = 0;

  // Cache vendors to avoid repeated lookups
  const vendorCache = new Map<string, string>();

  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i];

    try {
      // Validate row
      const validation = validateRow(i, row);
      if (!validation.valid) {
        skipped++;
        continue;
      }

      // Get or create vendor (with caching)
      let vendorId = vendorCache.get(row.vendorName);

      if (!vendorId) {
        let vendor = await prisma.vendor.findFirst({
          where: { name: row.vendorName },
        });

        if (!vendor) {
          vendor = await prisma.vendor.create({
            data: {
              id: createId(),
              name: row.vendorName,
            },
          });
        }

        vendorId = vendor.id;
        vendorCache.set(row.vendorName, vendorId);
      }

      // Commit this single row using the library
      const results = await commitRows(prisma, vendorId, [row]);

      if (results.length > 0) {
        imported++;
      }
    } catch (error) {
      console.error(`   ⚠️  Error importing row:`, row.name, error);
      skipped++;
    }
  }

  console.log(`   ✅ Imported: ${imported} products`);
  if (skipped > 0) {
    console.log(
      `   ⚠️  Skipped: ${skipped} products (errors or missing data)`,
    );
  }
}

async function main() {
  console.log("🚀 Starting vendor data import...\n");

  const vendorsDir = path.join(
    process.cwd(),
    "prisma",
    "seed-data",
    "vendors",
  );

  if (!fs.existsSync(vendorsDir)) {
    console.error(`❌ Directory not found: ${vendorsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(vendorsDir).filter((f) => f.endsWith(".csv"));

  if (files.length === 0) {
    console.error(`❌ No CSV files found in: ${vendorsDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} CSV file(s):`);
  files.forEach((f) => console.log(`  - ${f}`));

  for (const file of files) {
    await importCsv(path.join(vendorsDir, file));
  }

  // Summary
  console.log("\n📊 Import Summary:");
  const vendorCount = await prisma.vendor.count();
  const productCount = await prisma.product.count();
  const vendorProductCount = await prisma.vendorProduct.count();
  const categoryCount = await prisma.productCategory.count();

  console.log(`   Vendors: ${vendorCount}`);
  console.log(`   Categories: ${categoryCount}`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Vendor-Product Links: ${vendorProductCount}`);

  console.log("\n✅ Import complete!");
}

main()
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
