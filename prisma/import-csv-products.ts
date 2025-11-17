import { PrismaClient, ProductUnit } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface CSVRow {
  vendor_name: string;
  category: string;
  name: string;
  unit: string;
  price_cents: string;
  in_stock: string;
  product_code: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    // Handle CSV with quoted values containing commas
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Push the last value

    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || "";
    });
    return row as CSVRow;
  });
}

function mapUnit(csvUnit: string): ProductUnit {
  const unitLower = csvUnit.toLowerCase().trim();

  // Map common units
  if (unitLower.includes("kg") || unitLower === "g") return "KG";
  if (unitLower.includes("lt") || unitLower.includes("l ")) return "L";
  if (unitLower.includes("unit")) return "PIECE";
  if (unitLower.includes("box") || unitLower.includes("crt")) return "BOX";
  if (unitLower.includes("service")) return "SERVICE";

  // Default to PIECE for anything else
  return "PIECE";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🌱 Starting CSV product import...\n");

  const csvFiles = [
    "cd_fish_products.csv",
    "general_beverage_products.csv",
    "plustik_products.csv",
    "white_dog_products.csv",
  ];

  // Stats
  let totalProducts = 0;
  let totalVendorProducts = 0;
  let skippedProducts = 0;

  for (const csvFile of csvFiles) {
    console.log(`📄 Processing ${csvFile}...`);

    const filePath = join(__dirname, "seed-data", "vendors", csvFile);
    const content = readFileSync(filePath, "utf-8");
    const rows = parseCSV(content);

    console.log(`   Found ${rows.length} rows`);

    for (const row of rows) {
      try {
        // Skip empty rows
        if (!row.name || !row.vendor_name) {
          skippedProducts++;
          continue;
        }

        // Get or create vendor
        let vendor = await prisma.vendor.findFirst({
          where: { name: row.vendor_name },
        });

        if (!vendor) {
          vendor = await prisma.vendor.create({
            data: {
              name: row.vendor_name,
              region: "Sardegna",
            },
          });
          console.log(`   ✓ Created vendor: ${vendor.name}`);
        }

        // Get or create category
        const categorySlug = slugify(row.category);
        let category = await prisma.productCategory.findFirst({
          where: { slug: categorySlug },
        });

        if (!category) {
          // Determine category group based on category name
          let groupName = "FOOD";
          const catLower = row.category.toLowerCase();
          if (
            catLower.includes("beverage") ||
            catLower.includes("drink") ||
            catLower.includes("water") ||
            catLower.includes("wine") ||
            catLower.includes("beer")
          ) {
            groupName = "BEVERAGE";
          } else if (
            catLower.includes("service") ||
            catLower.includes("cleaning") ||
            catLower.includes("maintenance")
          ) {
            groupName = "SERVICES";
          }

          const categoryGroup = await prisma.categoryGroup.findFirst({
            where: { name: groupName as any },
          });

          if (categoryGroup) {
            category = await prisma.productCategory.create({
              data: {
                groupId: categoryGroup.id,
                name: row.category,
                slug: categorySlug,
              },
            });
            console.log(`   ✓ Created category: ${category.name}`);
          }
        }

        if (!category) {
          console.warn(`   ⚠️  Skipping ${row.name} - no category found`);
          skippedProducts++;
          continue;
        }

        // Create or find product
        let product = await prisma.product.findFirst({
          where: {
            name: row.name.trim(),
            categoryId: category.id,
          },
        });

        if (!product) {
          product = await prisma.product.create({
            data: {
              categoryId: category.id,
              name: row.name.trim(),
              unit: mapUnit(row.unit),
            },
          });
          totalProducts++;
        }

        // Create vendor product
        const priceCents = parseInt(row.price_cents) || 0;
        const isActive = row.in_stock.toLowerCase() === "true";

        const existingVP = await prisma.vendorProduct.findFirst({
          where: {
            vendorId: vendor.id,
            productId: product.id,
          },
        });

        if (!existingVP) {
          await prisma.vendorProduct.create({
            data: {
              vendorId: vendor.id,
              productId: product.id,
              vendorSku: row.product_code || `SKU-${product.id}`,
              basePriceCents: priceCents,
              currency: "EUR",
              stockQty: isActive ? 100 : 0,
              leadTimeDays: 2,
              minOrderQty: 1,
              isActive,
            },
          });
          totalVendorProducts++;
        }
      } catch (error) {
        console.error(
          `   ❌ Error processing ${row.name}:`,
          error instanceof Error ? error.message : error
        );
        skippedProducts++;
      }
    }

    console.log(`   ✓ Completed ${csvFile}\n`);
  }

  console.log("✅ CSV Import Complete!\n");
  console.log("📊 Summary:");
  console.log(`   Products created: ${totalProducts}`);
  console.log(`   Vendor products created: ${totalVendorProducts}`);
  console.log(`   Skipped: ${skippedProducts}`);
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
