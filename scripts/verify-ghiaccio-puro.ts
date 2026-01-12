/**
 * Verify Ghiaccio Puro vendor setup
 */

import { prisma } from "../src/lib/prisma";

async function verify() {
  console.log("\n🔍 Verifying Ghiaccio Puro Setup...\n");

  // Check vendor
  const vendor = await prisma.vendor.findFirst({
    where: { name: "Ghiaccio Puro" },
  });

  if (!vendor) {
    console.log("❌ Vendor not found");
    return;
  }

  console.log("✅ Vendor found:");
  console.log(`   ID: ${vendor.id}`);
  console.log(`   Name: ${vendor.name}`);
  console.log(`   Email: ${vendor.contactEmail}`);
  console.log(`   Phone: ${vendor.contactPhone}`);

  // Check user
  const user = await prisma.user.findUnique({
    where: { email: "vendor.ghiacciopuro@hydra.local" },
  });

  if (!user) {
    console.log("\n❌ Demo user not found");
    return;
  }

  console.log("\n✅ Demo user found:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Vendor ID: ${user.vendorId}`);

  // Check products
  const products = await prisma.vendorProduct.findMany({
    where: { vendorId: vendor.id },
    include: {
      Product: {
        include: {
          ProductCategory: true,
        },
      },
    },
  });

  console.log(`\n✅ Products found: ${products.length}`);
  console.log("\nProduct Details:");
  products.forEach((vp, idx) => {
    console.log(`   ${idx + 1}. ${vp.Product.name}`);
    console.log(`      SKU: ${vp.vendorSku}`);
    console.log(`      Price: €${(vp.basePriceCents / 100).toFixed(2)}`);
    console.log(`      Unit: ${vp.Product.unit}`);
    console.log(`      Stock: ${vp.stockQty}`);
    console.log(`      Active: ${vp.isActive}`);
    console.log("");
  });

  console.log("✅ All checks passed!\n");
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
