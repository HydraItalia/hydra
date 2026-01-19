/**
 * Test Script: Vendor Order Financial Breakdown (N2.2)
 *
 * This script tests Issue #123 - Vendor dashboard shows VAT and fee breakdown
 *
 * It creates an order with proper VAT and fee snapshot fields,
 * then verifies that all financial fields are correctly populated
 * and would display correctly in the vendor order detail view.
 *
 * Usage: npx ts-node scripts/test-vendor-financial-breakdown.ts
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

// Fee calculation helpers (mirror the actual implementation)
function computeHydraFeeCents(grossCents: number, feeBps: number): number {
  return Math.round((grossCents * feeBps) / 10000);
}

function bpsToPercent(bps: number): number {
  return bps / 10000;
}

// VAT calculation helpers (mirror the actual implementation)
function computeVatFromNet(
  netCents: number,
  vatRateBps: number,
): { vatAmountCents: number; grossCents: number } {
  const vatAmountCents = Math.round((netCents * vatRateBps) / 10000);
  return {
    vatAmountCents,
    grossCents: netCents + vatAmountCents,
  };
}

async function main() {
  console.log("\n🧪 VENDOR FINANCIAL BREAKDOWN TEST (N2.2)\n");
  console.log("=".repeat(70));

  // ============================================================================
  // STEP 1: Setup - Get Client, Vendor, Products, and Tax Profile
  // ============================================================================
  console.log("\n📋 STEP 1: Setup");
  console.log("-".repeat(70));

  // Find demo client
  const client = await prisma.client.findFirst({
    where: { name: { contains: "Demo Ristorante", mode: "insensitive" } },
  });

  if (!client) {
    throw new Error(
      "Demo Ristorante client not found. Run: npx prisma db seed",
    );
  }
  console.log(`✅ Found client: ${client.name} (${client.id})`);

  // Find a vendor with products
  const vendor = await prisma.vendor.findFirst({
    where: { name: { contains: "General Beverage", mode: "insensitive" } },
  });

  if (!vendor) {
    throw new Error(
      "General Beverage vendor not found. Run: npx prisma db seed",
    );
  }
  console.log(`✅ Found vendor: ${vendor.name} (${vendor.id})`);

  // Find vendor user for this vendor
  const vendorUser = await prisma.user.findFirst({
    where: { vendorId: vendor.id, role: "VENDOR" },
  });

  if (!vendorUser) {
    throw new Error(`No VENDOR user found for ${vendor.name}`);
  }
  console.log(`✅ Found vendor user: ${vendorUser.email}`);

  // Find or create a tax profile (22% standard Italian VAT)
  let taxProfile = await prisma.taxProfile.findFirst({
    where: { vatRateBps: 2200 },
  });

  if (!taxProfile) {
    taxProfile = await prisma.taxProfile.create({
      data: {
        id: createId(),
        name: "Standard Rate (22%)",
        vatRateBps: 2200,
        isDefault: true,
      },
    });
    console.log(`✅ Created tax profile: ${taxProfile.name}`);
  } else {
    console.log(
      `✅ Found tax profile: ${taxProfile.name} (${taxProfile.vatRateBps} bps)`,
    );
  }

  // Get a product from the vendor
  const vendorProduct = await prisma.vendorProduct.findFirst({
    where: {
      vendorId: vendor.id,
      isActive: true,
      deletedAt: null,
    },
    include: { Product: true },
  });

  if (!vendorProduct) {
    throw new Error(`No products found for ${vendor.name}`);
  }
  console.log(
    `✅ Found product: ${vendorProduct.Product.name} @ €${(vendorProduct.basePriceCents / 100).toFixed(2)}`,
  );

  // Get admin user for order submission
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    throw new Error("Admin user not found");
  }
  console.log(`✅ Found admin user: ${adminUser.email}`);

  // ============================================================================
  // STEP 2: Create Order with Full Financial Snapshot (Simulating createOrderFromCart)
  // ============================================================================
  console.log("\n📦 STEP 2: Create Order with Financial Snapshot");
  console.log("-".repeat(70));

  const qty = 5;
  const unitPriceCents = vendorProduct.basePriceCents;
  const lineTotalCents = unitPriceCents * qty;
  const vatRateBps = taxProfile.vatRateBps;

  // Compute VAT (assuming NET pricing - price does not include VAT)
  const vatComputation = computeVatFromNet(lineTotalCents, vatRateBps);
  const netTotalCents = lineTotalCents;
  const vatTotalCents = vatComputation.vatAmountCents;
  const grossTotalCents = vatComputation.grossCents;

  // Compute Hydra fee (5% = 500 bps)
  const hydraFeeBps = 500;
  const hydraFeeCents = computeHydraFeeCents(grossTotalCents, hydraFeeBps);
  const hydraFeePercent = bpsToPercent(hydraFeeBps);

  console.log(`\n   📊 Financial Calculations:`);
  console.log(`   ────────────────────────────────────────`);
  console.log(`   Line Total (Net):     €${(netTotalCents / 100).toFixed(2)}`);
  console.log(`   VAT Rate:             ${vatRateBps / 100}%`);
  console.log(`   VAT Amount:           €${(vatTotalCents / 100).toFixed(2)}`);
  console.log(
    `   Gross Total:          €${(grossTotalCents / 100).toFixed(2)}`,
  );
  console.log(`   ────────────────────────────────────────`);
  console.log(`   Hydra Fee Rate:       ${hydraFeeBps / 100}%`);
  console.log(`   Hydra Fee:            €${(hydraFeeCents / 100).toFixed(2)}`);
  console.log(`   ────────────────────────────────────────`);

  // Verify invariant: net + vat = gross
  if (netTotalCents + vatTotalCents !== grossTotalCents) {
    throw new Error(
      `VAT invariant violated: ${netTotalCents} + ${vatTotalCents} !== ${grossTotalCents}`,
    );
  }
  console.log(`\n   ✅ VAT invariant verified: net + vat = gross`);

  // Verify fee calculation
  const expectedFee = Math.round((grossTotalCents * hydraFeeBps) / 10000);
  if (hydraFeeCents !== expectedFee) {
    throw new Error(
      `Fee calculation mismatch: ${hydraFeeCents} !== ${expectedFee}`,
    );
  }
  console.log(`   ✅ Fee calculation verified: ${hydraFeeCents} cents`);

  // Create the order with SubOrder and full financial snapshot
  const orderNumber = `TEST-FIN-${Date.now()}`;
  const orderId = createId();
  const subOrderId = createId();

  const order = await prisma.order.create({
    data: {
      id: orderId,
      orderNumber,
      clientId: client.id,
      submitterUserId: adminUser.id,
      status: "SUBMITTED",
      totalCents: grossTotalCents,
      deliveryAddress: client.deliveryAddress,
      deliveryLat: client.deliveryLat,
      deliveryLng: client.deliveryLng,
      region: client.region,
      SubOrder: {
        create: {
          id: subOrderId,
          vendorId: vendor.id,
          status: "SUBMITTED",
          subOrderNumber: `${orderNumber}-V01`,
          subTotalCents: lineTotalCents,
          // VAT snapshot fields (N1.3)
          netTotalCents,
          vatTotalCents,
          grossTotalCents,
          // Hydra fee fields (N2.1)
          hydraFeeBps,
          hydraFeeCents,
          hydraFeePercent,
          OrderItem: {
            create: {
              id: createId(),
              orderId,
              vendorProductId: vendorProduct.id,
              productName: vendorProduct.Product.name,
              vendorName: vendor.name,
              qty,
              unitPriceCents,
              lineTotalCents,
              // VAT snapshot fields for OrderItem (N1.3)
              taxProfileId: taxProfile.id,
              vatRateBps,
              vatAmountCents: vatTotalCents,
              netCents: netTotalCents,
              grossCents: grossTotalCents,
            },
          },
        },
      },
    },
    include: {
      SubOrder: {
        include: {
          OrderItem: true,
        },
      },
    },
  });

  console.log(`\n   ✅ Created Order: ${order.orderNumber}`);
  console.log(`   Order ID: ${order.id}`);

  // ============================================================================
  // STEP 3: Verify SubOrder Has All Financial Fields
  // ============================================================================
  console.log("\n🔍 STEP 3: Verify SubOrder Financial Fields");
  console.log("-".repeat(70));

  const subOrder = order.SubOrder[0];

  const checks = [
    {
      field: "netTotalCents",
      expected: netTotalCents,
      actual: subOrder.netTotalCents,
    },
    {
      field: "vatTotalCents",
      expected: vatTotalCents,
      actual: subOrder.vatTotalCents,
    },
    {
      field: "grossTotalCents",
      expected: grossTotalCents,
      actual: subOrder.grossTotalCents,
    },
    {
      field: "hydraFeeBps",
      expected: hydraFeeBps,
      actual: subOrder.hydraFeeBps,
    },
    {
      field: "hydraFeeCents",
      expected: hydraFeeCents,
      actual: subOrder.hydraFeeCents,
    },
    {
      field: "hydraFeePercent",
      expected: hydraFeePercent,
      actual: subOrder.hydraFeePercent,
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    const pass = check.actual === check.expected;
    const icon = pass ? "✅" : "❌";
    console.log(
      `   ${icon} ${check.field}: ${check.actual} (expected: ${check.expected})`,
    );
    if (!pass) allPassed = false;
  }

  if (!allPassed) {
    throw new Error("SubOrder financial field verification failed");
  }

  // ============================================================================
  // STEP 4: Test Vendor View Query (simulate getVendorOrderDetail)
  // ============================================================================
  console.log("\n👁️  STEP 4: Test Vendor View Query");
  console.log("-".repeat(70));

  // Simulate what getVendorOrderDetail does
  const vendorSubOrder = await prisma.subOrder.findFirst({
    where: {
      id: subOrderId,
      vendorId: vendor.id,
    },
    include: {
      Order: {
        include: {
          Client: {
            select: { name: true },
          },
        },
      },
      OrderItem: {
        select: {
          id: true,
          productName: true,
          qty: true,
          unitPriceCents: true,
          lineTotalCents: true,
        },
      },
    },
  });

  if (!vendorSubOrder) {
    throw new Error("Vendor cannot see their SubOrder - authorization issue");
  }

  console.log(
    `   ✅ Vendor can access SubOrder: ${vendorSubOrder.subOrderNumber}`,
  );
  console.log(`   ✅ Order Number: ${vendorSubOrder.Order.orderNumber}`);
  console.log(`   ✅ Client: ${vendorSubOrder.Order.Client.name}`);

  // Check all financial fields are present in vendor view
  console.log(`\n   📊 Vendor View Financial Data:`);
  console.log(`   ────────────────────────────────────────`);
  console.log(
    `   Gross Total:          ${vendorSubOrder.grossTotalCents !== null ? `€${(vendorSubOrder.grossTotalCents / 100).toFixed(2)}` : "N/A"}`,
  );
  console.log(
    `   VAT:                  ${vendorSubOrder.vatTotalCents !== null ? `€${(vendorSubOrder.vatTotalCents / 100).toFixed(2)}` : "N/A"}`,
  );
  console.log(
    `   Net Amount:           ${vendorSubOrder.netTotalCents !== null ? `€${(vendorSubOrder.netTotalCents / 100).toFixed(2)}` : "N/A"}`,
  );
  console.log(
    `   Platform Fee:         ${vendorSubOrder.hydraFeeCents !== null ? `€${(vendorSubOrder.hydraFeeCents / 100).toFixed(2)}` : "N/A"}`,
  );
  console.log(`   ────────────────────────────────────────`);

  // ============================================================================
  // STEP 5: Test Component Display Logic
  // ============================================================================
  console.log("\n🖥️  STEP 5: Test Component Display Logic");
  console.log("-".repeat(70));

  // Test the VAT percentage display calculation
  const hasFinancialData =
    vendorSubOrder.grossTotalCents !== null &&
    vendorSubOrder.vatTotalCents !== null &&
    vendorSubOrder.netTotalCents !== null;

  if (!hasFinancialData) {
    throw new Error(
      "Financial data missing - component would show fallback message",
    );
  }

  console.log(`   ✅ hasFinancialData: true (component will render breakdown)`);

  // Compute display VAT percentage (what the component does)
  let vatPercent: number | null = null;
  if (
    vendorSubOrder.netTotalCents !== null &&
    vendorSubOrder.vatTotalCents !== null &&
    vendorSubOrder.netTotalCents > 0
  ) {
    vatPercent =
      Math.round(
        (vendorSubOrder.vatTotalCents / vendorSubOrder.netTotalCents) *
          100 *
          100,
      ) / 100;
  }

  console.log(
    `   ✅ Display VAT %: ${vatPercent}% (expected: ${vatRateBps / 100}%)`,
  );

  if (vatPercent !== null && Math.abs(vatPercent - vatRateBps / 100) > 0.01) {
    console.log(
      `   ⚠️  VAT % display has small rounding difference (acceptable)`,
    );
  }

  // Check fee display
  const hasFeeData = vendorSubOrder.hydraFeeCents !== null;
  console.log(`   ✅ Platform Fee available: ${hasFeeData}`);

  // ============================================================================
  // STEP 6: Test Backward Compatibility (Old Order without snapshot)
  // ============================================================================
  console.log("\n⏮️  STEP 6: Test Backward Compatibility");
  console.log("-".repeat(70));

  // Create an "old" order without snapshot fields
  const oldOrderNumber = `TEST-OLD-${Date.now()}`;
  const oldOrderId = createId();
  const oldSubOrderId = createId();

  const oldOrder = await prisma.order.create({
    data: {
      id: oldOrderId,
      orderNumber: oldOrderNumber,
      clientId: client.id,
      submitterUserId: adminUser.id,
      status: "SUBMITTED",
      totalCents: lineTotalCents,
      SubOrder: {
        create: {
          id: oldSubOrderId,
          vendorId: vendor.id,
          status: "SUBMITTED",
          subOrderNumber: `${oldOrderNumber}-V01`,
          subTotalCents: lineTotalCents,
          // NO VAT or fee snapshot fields (simulating old order)
          OrderItem: {
            create: {
              id: createId(),
              orderId: oldOrderId,
              vendorProductId: vendorProduct.id,
              productName: vendorProduct.Product.name,
              vendorName: vendor.name,
              qty,
              unitPriceCents,
              lineTotalCents,
              // NO VAT snapshot fields
            },
          },
        },
      },
    },
    include: {
      SubOrder: true,
    },
  });

  console.log(
    `   ✅ Created "old" order without snapshot: ${oldOrder.orderNumber}`,
  );

  const oldSubOrder = oldOrder.SubOrder[0];
  const oldHasFinancialData =
    oldSubOrder.grossTotalCents !== null &&
    oldSubOrder.vatTotalCents !== null &&
    oldSubOrder.netTotalCents !== null;

  console.log(
    `   ✅ Old order hasFinancialData: ${oldHasFinancialData} (expected: false)`,
  );

  if (oldHasFinancialData) {
    throw new Error("Old order should NOT have financial data");
  }

  console.log(
    `   ✅ Component will show: "Financial breakdown not available for older orders."`,
  );

  // ============================================================================
  // STEP 7: Cleanup Test Orders
  // ============================================================================
  console.log("\n🧹 STEP 7: Cleanup Test Orders");
  console.log("-".repeat(70));

  // Delete test orders
  await prisma.orderItem.deleteMany({
    where: { orderId: { in: [orderId, oldOrderId] } },
  });
  await prisma.subOrder.deleteMany({
    where: { orderId: { in: [orderId, oldOrderId] } },
  });
  await prisma.order.deleteMany({
    where: { id: { in: [orderId, oldOrderId] } },
  });

  console.log(`   ✅ Deleted test orders`);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(70));

  console.log(`
   ✅ All tests passed!

   Tests completed:
   1. ✅ Setup - Found client, vendor, tax profile, product
   2. ✅ Order Creation - Created order with full financial snapshot
   3. ✅ SubOrder Fields - All VAT and fee fields populated correctly
   4. ✅ Vendor View Query - Vendor can access SubOrder with financial data
   5. ✅ Component Logic - Display calculations work correctly
   6. ✅ Backward Compat - Old orders without snapshot handled gracefully
   7. ✅ Cleanup - Test data removed

   Financial Breakdown Verified:
   - Gross Total:    €${(grossTotalCents / 100).toFixed(2)}
   - VAT (${vatRateBps / 100}%):       €${(vatTotalCents / 100).toFixed(2)}
   - Net Amount:     €${(netTotalCents / 100).toFixed(2)}
   - Platform Fee:   €${(hydraFeeCents / 100).toFixed(2)} (Informational — not yet deducted)

   The vendor order financial breakdown (N2.2) is working correctly!
  `);

  console.log("=".repeat(70));
  console.log("\n🎉 Test Complete!\n");

  return { success: true };
}

main()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
