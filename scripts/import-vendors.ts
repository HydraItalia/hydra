import { config } from "dotenv";
import { PrismaClient, CategoryGroupType, ProductUnit } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

type CsvRow = {
  vendor_name: string;
  category: string;
  name: string;
  unit: string;
  price_cents: string;
  in_stock: string;
  product_code: string;
  source_price_raw?: string;
};

// Category name to CategoryGroup mapping
const categoryGroupMap: Record<string, CategoryGroupType> = {
  "Beverage": "BEVERAGE",
  "Beverages": "BEVERAGE",
  "Drinks": "BEVERAGE",
  "Wine": "BEVERAGE",
  "Spirits": "BEVERAGE",
  "Beer": "BEVERAGE",

  "Food": "FOOD",
  "Produce": "FOOD",
  "Seafood": "FOOD",
  "Fish": "FOOD",
  "Meat": "FOOD",
  "Dairy": "FOOD",
  "Bakery": "FOOD",
  "Pantry": "FOOD",
  "Frozen": "FOOD",
  "Specialty Produce": "FOOD",

  "Services": "SERVICES",
  "Packaging": "SERVICES",
  "Supplies": "SERVICES",
  "Disposables": "SERVICES",
  "Cleaning & Disposables": "SERVICES",
};

// Normalize unit strings to ProductUnit enum
function normalizeUnit(unitStr: string): ProductUnit {
  const normalized = unitStr.toLowerCase().trim();

  // Weight units
  if (normalized.includes("kg") || normalized.includes("kilogram")) {
    return "KG";
  }

  // Volume units
  if (normalized.includes("l") || normalized.includes("liter") || normalized.includes("litre") ||
      normalized.includes("ml") || normalized.includes("cl")) {
    return "L";
  }

  // Box/case
  if (normalized.includes("box") || normalized.includes("case") || normalized.includes("crate")) {
    return "BOX";
  }

  // Service
  if (normalized.includes("service") || normalized.includes("delivery")) {
    return "SERVICE";
  }

  // Default to PIECE for bottles, pieces, items, etc.
  return "PIECE";
}

// Create or get CategoryGroup for a category name
async function getOrCreateCategoryGroup(categoryName: string): Promise<string> {
  const groupType = categoryGroupMap[categoryName] || "FOOD";

  const group = await prisma.categoryGroup.upsert({
    where: { name: groupType },
    update: {},
    create: { id: createId(), name: groupType },
  });

  return group.id;
}

async function importCsv(filePath: string) {
  console.log(`\n📦 Importing: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const rows: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${rows.length} products`);

  let imported = 0;
  let skipped = 0;

  // Cache vendors to avoid repeated lookups
  const vendorCache = new Map<string, string>();

  for (const row of rows) {
    try {
      // Skip rows with missing required data
      if (!row.vendor_name || !row.name || !row.price_cents) {
        skipped++;
        continue;
      }

      // Get or create vendor (with caching)
      const vendorName = row.vendor_name.trim();
      let vendorId = vendorCache.get(vendorName);

      if (!vendorId) {
        let vendor = await prisma.vendor.findFirst({
          where: { name: vendorName },
        });

        if (!vendor) {
          vendor = await prisma.vendor.create({
            data: {
              name: vendorName,
            },
          });
        }

        vendorId = vendor.id;
        vendorCache.set(vendorName, vendorId);
      }

      const vendor = { id: vendorId };

      // Get or create category with proper group
      const groupId = await getOrCreateCategoryGroup(row.category.trim());
      const categorySlug = row.category.trim().toLowerCase().replace(/\s+/g, "-");

      const category = await prisma.productCategory.upsert({
        where: { slug: categorySlug },
        update: { groupId },
        create: {
          id: createId(),
          name: row.category.trim(),
          slug: categorySlug,
          groupId,
        },
      });

      // Normalize unit
      const productUnit = normalizeUnit(row.unit || "piece");

      // Get or create product
      // Use name + unit as a unique combination
      const productKey = `${row.name.trim()}_${productUnit}`;

      let product = await prisma.product.findFirst({
        where: {
          name: row.name.trim(),
          unit: productUnit,
        },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            id: createId(),
            name: row.name.trim(),
            description: "",
            unit: productUnit,
            categoryId: category.id,
          },
        });
      }

      // Parse price (should be in cents already)
      const priceCents = parseInt(row.price_cents) || 0;
      const inStock = row.in_stock?.toLowerCase() === "true" || row.in_stock === "1";

      // Create or update vendor product
      await prisma.vendorProduct.upsert({
        where: {
          vendorId_productId: {
            vendorId: vendor.id,
            productId: product.id
          }
        },
        update: {
          basePriceCents: priceCents,
          stockQty: inStock ? 100 : 0, // Default to 100 if in stock
          vendorSku: row.product_code?.trim() || `SKU-${product.id}`,
          isActive: true,
        },
        create: {
          id: createId(),
          vendorId: vendor.id,
          productId: product.id,
          basePriceCents: priceCents,
          stockQty: inStock ? 100 : 0,
          vendorSku: row.product_code?.trim() || `SKU-${product.id}`,
          leadTimeDays: inStock ? 0 : 7,
          isActive: true,
        },
      });

      imported++;
    } catch (error) {
      console.error(`   ⚠️  Error importing row:`, row.name, error);
      skipped++;
    }
  }

  console.log(`   ✅ Imported: ${imported} products`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped: ${skipped} products (errors or missing data)`);
  }
}

async function main() {
  console.log("🚀 Starting vendor data import...\n");

  const vendorsDir = path.join(process.cwd(), "prisma", "seed-data", "vendors");

  if (!fs.existsSync(vendorsDir)) {
    console.error(`❌ Directory not found: ${vendorsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(vendorsDir).filter(f => f.endsWith(".csv"));

  if (files.length === 0) {
    console.error(`❌ No CSV files found in: ${vendorsDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} CSV file(s):`);
  files.forEach(f => console.log(`  - ${f}`));

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
