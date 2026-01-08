/**
 * Seed products for testing pre-authorization with SubOrders
 * Creates products for both Test Vendor (Stripe-enabled) and General Beverage (not enabled)
 * This allows testing multi-vendor orders with one success and one failure
 */

import {
  PrismaClient,
  ProductUnit,
  CategoryGroupType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🌱 Seeding products for pre-authorization testing with SubOrders\n"
  );

  // Find both vendors
  const testVendor = await prisma.vendor.findUnique({
    where: { id: "ipy8e3t9t5u8g5vjpggvmrif" },
  });

  const generalBeverage = await prisma.vendor.findUnique({
    where: { id: "nrvc77uqaawbor31e1bx4c9a" },
  });

  if (!testVendor || !generalBeverage) {
    throw new Error("Required vendors not found!");
  }

  console.log("✅ Found vendors:");
  console.log(
    `   1. ${testVendor.name} (Stripe: ${testVendor.chargesEnabled ? "✅" : "❌"})`
  );
  console.log(
    `   2. ${generalBeverage.name} (Stripe: ${generalBeverage.chargesEnabled ? "✅" : "❌"})\n`
  );

  // Find or create Beverage category group
  let beverageGroup = await prisma.categoryGroup.findFirst({
    where: { name: CategoryGroupType.BEVERAGE },
  });

  if (!beverageGroup) {
    beverageGroup = await prisma.categoryGroup.create({
      data: {
        id: `cg_${Date.now()}`,
        name: CategoryGroupType.BEVERAGE,
      },
    });
  }

  // Find or create beverages category
  let beverageCategory = await prisma.productCategory.findFirst({
    where: { slug: "beverages" },
  });

  if (!beverageCategory) {
    beverageCategory = await prisma.productCategory.create({
      data: {
        id: `pc_${Date.now()}`,
        groupId: beverageGroup.id,
        name: "Beverages",
        slug: "beverages",
      },
    });
  }

  console.log(`✅ Using category: ${beverageCategory.name}\n`);

  // Create master products
  const productsData = [
    {
      id: `prod_wine_${Date.now()}`,
      name: "Test Red Wine - Chianti (Bottle)",
      description: "Test product for pre-authorization testing",
      unit: ProductUnit.PIECE,
    },
    {
      id: `prod_water_${Date.now()}`,
      name: "Test Sparkling Water (Bottle)",
      description: "Test product for pre-authorization testing",
      unit: ProductUnit.PIECE,
    },
    {
      id: `prod_beer_${Date.now()}`,
      name: "Test Craft Beer (Bottle)",
      description: "Test product for pre-authorization testing",
      unit: ProductUnit.PIECE,
    },
    {
      id: `prod_juice_${Date.now()}`,
      name: "Test Orange Juice (Bottle)",
      description: "Test product for pre-authorization testing",
      unit: ProductUnit.PIECE,
    },
  ];

  console.log("📦 Creating products and vendor associations...\n");

  const createdProducts = [];

  for (const productData of productsData) {
    const product = await prisma.product.upsert({
      where: { id: productData.id },
      update: productData,
      create: {
        ...productData,
        categoryId: beverageCategory.id,
      },
    });

    createdProducts.push(product);
    console.log(`   ✅ Created: ${product.name}`);
  }

  console.log("\n💰 Creating vendor product associations...\n");

  // Create VendorProducts for Test Vendor (first 2 products)
  for (let i = 0; i < 2; i++) {
    const product = createdProducts[i];
    await prisma.vendorProduct.upsert({
      where: {
        vendorId_productId: {
          vendorId: testVendor.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        id: `vp_test_${Date.now()}_${i}`,
        vendorId: testVendor.id,
        productId: product.id,
        vendorSku: `TEST-${i + 1}`,
        basePriceCents: 1500 + i * 500, // €15.00, €20.00
        currency: "EUR",
        stockQty: 100,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
      },
    });

    console.log(
      `   ✅ ${testVendor.name}: ${product.name} - €${((1500 + i * 500) / 100).toFixed(2)}`
    );
  }

  // Create VendorProducts for General Beverage (last 2 products)
  for (let i = 2; i < 4; i++) {
    const product = createdProducts[i];
    await prisma.vendorProduct.upsert({
      where: {
        vendorId_productId: {
          vendorId: generalBeverage.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        id: `vp_gen_${Date.now()}_${i}`,
        vendorId: generalBeverage.id,
        productId: product.id,
        vendorSku: `GEN-${i + 1}`,
        basePriceCents: 500 + (i - 2) * 200, // €5.00, €7.00
        currency: "EUR",
        stockQty: 100,
        leadTimeDays: 3,
        minOrderQty: 1,
        isActive: true,
      },
    });

    console.log(
      `   ✅ ${generalBeverage.name}: ${product.name} - €${((500 + (i - 2) * 200) / 100).toFixed(2)}`
    );
  }

  // Find Demo Ristorante client
  const client = await prisma.client.findFirst({
    where: { name: "Demo Ristorante" },
  });

  if (!client) {
    throw new Error("Demo Ristorante client not found!");
  }

  console.log(`\n✅ Found client: ${client.name}`);
  console.log(`   Products are now available for ordering!`);

  console.log("\n✨ Seeding complete!");
  console.log("\n🧪 Test Scenario:");
  console.log("   Create an order with products from BOTH vendors:");
  console.log(
    `   - Items from ${testVendor.name} → Should pre-authorize successfully ✅`
  );
  console.log(
    `   - Items from ${generalBeverage.name} → Should fail with clear error ❌`
  );
  console.log(
    "\n   This tests SubOrder creation and partial pre-authorization failures."
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
