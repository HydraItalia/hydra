/**
 * Test Data Seed Script
 * Creates minimal, deterministic test data for unit and E2E tests
 *
 * Schema:
 * - 1 Category Group (FOOD)
 * - 2 Categories (Seafood, Produce)
 * - 2 Vendors (Test Vendor A, Test Vendor B)
 * - 5 Products total (mixed across categories)
 * - 10 VendorProducts (2 vendors � 5 products)
 * - 1 Test Client with test@example.com user
 * - 2 Agreements (BASE mode and DISCOUNT mode)
 */

import {
  PrismaClient,
  CategoryGroupType,
  ProductUnit,
  PriceMode,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(">� Starting test data seed...");

  // Clear existing test data
  console.log("Clearing existing data...");
  await prisma.vendorProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.categoryGroup.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany({ where: { email: { startsWith: "test" } } });
  await prisma.client.deleteMany();

  // 1. Create Category Group and Categories
  console.log("Creating category structure...");
  const foodGroup = await prisma.categoryGroup.create({
    data: {
      name: CategoryGroupType.FOOD,
      categories: {
        create: [
          { name: "Seafood", slug: "seafood" },
          { name: "Produce", slug: "produce" },
        ],
      },
    },
    include: { categories: true },
  });

  const seafoodCategory = foodGroup.categories.find(
    (c) => c.slug === "seafood"
  )!;
  const produceCategory = foodGroup.categories.find(
    (c) => c.slug === "produce"
  )!;

  // 2. Create Test Vendors
  console.log("Creating test vendors...");
  const vendorA = await prisma.vendor.create({
    data: {
      name: "Test Vendor A",
      region: "Test Region",
    },
  });

  const vendorB = await prisma.vendor.create({
    data: {
      name: "Test Vendor B",
      region: "Test Region",
    },
  });

  // 3. Create Test Products
  console.log("Creating test products...");
  const products = await Promise.all([
    // Seafood products
    prisma.product.create({
      data: {
        categoryId: seafoodCategory.id,
        name: "Test Salmon",
        description: "Fresh test salmon",
        unit: ProductUnit.KG,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: seafoodCategory.id,
        name: "Test Tuna",
        description: "Fresh test tuna",
        unit: ProductUnit.KG,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: seafoodCategory.id,
        name: "Test Shrimp",
        description: "Fresh test shrimp",
        unit: ProductUnit.KG,
      },
    }),
    // Produce products
    prisma.product.create({
      data: {
        categoryId: produceCategory.id,
        name: "Test Tomatoes",
        description: "Fresh test tomatoes",
        unit: ProductUnit.KG,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: produceCategory.id,
        name: "Test Lettuce",
        description: "Fresh test lettuce",
        unit: ProductUnit.PIECE,
      },
    }),
  ]);

  // 4. Create Vendor Products (each vendor offers all products)
  console.log("Creating vendor products...");
  for (const product of products) {
    const nameSlug = product.name.replace(/\s+/g, "-").toUpperCase();

    // Vendor A - Lower prices, in stock
    await prisma.vendorProduct.create({
      data: {
        vendorId: vendorA.id,
        productId: product.id,
        vendorSku: `VA-${nameSlug}`,
        basePriceCents: 1000, // �10.00
        stockQty: 100,
        leadTimeDays: 0,
        isActive: true,
      },
    });

    // Vendor B - Higher prices, lower stock
    await prisma.vendorProduct.create({
      data: {
        vendorId: vendorB.id,
        productId: product.id,
        vendorSku: `VB-${nameSlug}`,
        basePriceCents: 1200, // �12.00
        stockQty: 50,
        leadTimeDays: 2,
        isActive: true,
      },
    });
  }

  // 5. Create Test Client and User
  console.log("Creating test client...");
  const testClient = await prisma.client.create({
    data: {
      name: "Test Client",
      region: "Test Region",
      user: {
        create: {
          email: "test@example.com",
          name: "Test User",
          role: "CLIENT",
        },
      },
    },
    include: { user: true },
  });

  // 6. Create Test Agreements
  console.log("Creating test agreements...");

  // Agreement 1: BASE mode with Vendor A (no modification)
  await prisma.agreement.create({
    data: {
      clientId: testClient.id,
      vendorId: vendorA.id,
      priceMode: PriceMode.BASE,
    },
  });

  // Agreement 2: DISCOUNT mode with Vendor B (10% discount)
  await prisma.agreement.create({
    data: {
      clientId: testClient.id,
      vendorId: vendorB.id,
      priceMode: PriceMode.DISCOUNT,
      discountPct: 0.1, // 10% discount
    },
  });

  console.log(" Test data seed completed!");
  console.log("Summary:");
  console.log(`  - Categories: ${foodGroup.categories.length}`);
  console.log(`  - Vendors: 2`);
  console.log(`  - Products: ${products.length}`);
  console.log(`  - Vendor Products: ${products.length * 2}`);
  console.log(`  - Test Client: ${testClient.user!.email}`);
  console.log(`  - Agreements: 2`);
}

main()
  .catch((e) => {
    console.error("L Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
