/**
 * Setup Ghiaccio Puro vendor with products and demo user
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

type CsvRow = {
  vendor_name: string;
  category: string;
  name: string;
  unit: string;
  price_cents: string;
  in_stock: string;
  product_code: string;
};

const VENDOR_NAME = "Ghiaccio Puro";
const VENDOR_EMAIL = "vendor.ghiacciopuro@hydra.local";

// Normalize unit strings to ProductUnit enum
function normalizeUnit(unitStr: string) {
  const normalized = unitStr.toLowerCase().trim();
  if (normalized.includes("kg")) return "KG";
  if (normalized.includes("box") || normalized.includes("confezione")) return "BOX";
  return "PIECE";
}

async function main() {
  console.log(`\n🧊 Setting up ${VENDOR_NAME}\n`);

  // 1. Create or get vendor
  console.log("1️⃣  Creating vendor...");
  let vendor = await prisma.vendor.findFirst({
    where: { name: VENDOR_NAME },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        id: createId(),
        name: VENDOR_NAME,
        contactEmail: VENDOR_EMAIL,
        contactPhone: "+39 02 1234567",
        address: "Via del Ghiaccio 123, Milano, Italy",
        businessHours: "Mon-Fri 6:00-18:00",
        region: "Lombardy",
        // Stripe fields can be added later if needed
        stripeAccountId: null,
        chargesEnabled: false,
      },
    });
    console.log(`   ✅ Created vendor: ${vendor.name}`);
  } else {
    console.log(`   ℹ️  Vendor already exists: ${vendor.name}`);
  }

  // 2. Import products from CSV
  console.log("\n2️⃣  Importing products from CSV...");
  const csvPath = path.join(
    process.cwd(),
    "prisma",
    "seed-data",
    "vendors",
    "ghiaccio_puro_products.csv"
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const rows: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${rows.length} products in CSV`);

  // Get or create Food category group
  const foodGroup = await prisma.categoryGroup.upsert({
    where: { name: "FOOD" },
    update: {},
    create: { id: createId(), name: "FOOD" },
  });

  // Get or create Food category
  const foodCategory = await prisma.productCategory.upsert({
    where: { slug: "food" },
    update: {},
    create: {
      id: createId(),
      name: "Food",
      slug: "food",
      groupId: foodGroup.id,
    },
  });

  let imported = 0;
  for (const row of rows) {
    try {
      const productUnit = normalizeUnit(row.unit);
      const priceCents = parseInt(row.price_cents) || 0;
      const inStock = row.in_stock?.toLowerCase() === "true";

      // Get or create product
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
            description: `Premium ice product - ${row.name.trim()}`,
            unit: productUnit,
            categoryId: foodCategory.id,
          },
        });
      }

      // Create or update vendor product
      await prisma.vendorProduct.upsert({
        where: {
          vendorId_productId: {
            vendorId: vendor.id,
            productId: product.id,
          },
        },
        update: {
          basePriceCents: priceCents,
          stockQty: inStock ? 100 : 0,
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
          leadTimeDays: 0,
          isActive: true,
        },
      });

      imported++;
    } catch (error) {
      console.error(`   ⚠️  Error importing: ${row.name}`, error);
    }
  }

  console.log(`   ✅ Imported ${imported} products`);

  // 3. Create demo user for vendor
  console.log("\n3️⃣  Creating demo user...");

  let user = await prisma.user.findUnique({
    where: { email: VENDOR_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: createId(),
        email: VENDOR_EMAIL,
        name: `${VENDOR_NAME} Manager`,
        role: "VENDOR",
        vendorId: vendor.id,
      },
    });
    console.log(`   ✅ Created user: ${user.email}`);
  } else {
    console.log(`   ℹ️  User already exists: ${user.email}`);

    // Make sure user is linked to vendor
    if (user.vendorId !== vendor.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { vendorId: vendor.id },
      });
      console.log(`   ✅ Linked user to vendor`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ GHIACCIO PURO VENDOR SETUP COMPLETE!\n");
  console.log("📋 Summary:");
  console.log(`   Vendor: ${vendor.name}`);
  console.log(`   Products: ${imported}`);
  console.log(`   Demo User: ${VENDOR_EMAIL}`);
  console.log("\n📍 Demo Sign-In Instructions:");
  console.log("   1. Go to /demo-signin");
  console.log("   2. Click on 'VENDOR' role");
  console.log(`   3. The system will auto-sign you in as: ${VENDOR_EMAIL}`);
  console.log("\n🔍 View Products:");
  console.log("   - Vendor Dashboard: /dashboard/inventory");
  console.log("   - Client View: Sign in as CLIENT, go to /dashboard/orders/new");
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
