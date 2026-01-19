/**
 * Creates a test order with full financial breakdown fields for UI testing.
 *
 * This order will persist in the database so you can test the vendor
 * order detail page in the browser.
 *
 * Usage: npx tsx scripts/create-test-order-with-financial-breakdown.ts
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

function computeHydraFeeCents(grossCents: number, feeBps: number): number {
  return Math.round((grossCents * feeBps) / 10000);
}

function bpsToPercent(bps: number): number {
  return bps / 10000;
}

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
  console.log("\n📦 Creating Test Order with Financial Breakdown\n");

  // Get required entities
  const client = await prisma.client.findFirst({
    where: { name: { contains: "Demo Ristorante", mode: "insensitive" } },
  });
  if (!client) throw new Error("Demo Ristorante not found");

  const vendor = await prisma.vendor.findFirst({
    where: { name: { contains: "General Beverage", mode: "insensitive" } },
  });
  if (!vendor) throw new Error("General Beverage not found");

  const taxProfile = await prisma.taxProfile.findFirst({
    where: { vatRateBps: 2200 },
  });
  if (!taxProfile) throw new Error("22% tax profile not found");

  const vendorProduct = await prisma.vendorProduct.findFirst({
    where: { vendorId: vendor.id, isActive: true },
    include: { Product: true },
  });
  if (!vendorProduct) throw new Error("No product found");

  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) throw new Error("Admin user not found");

  // Calculate financials
  const qty = 3;
  const unitPriceCents = vendorProduct.basePriceCents;
  const lineTotalCents = unitPriceCents * qty;
  const vatRateBps = taxProfile.vatRateBps;

  const vatComputation = computeVatFromNet(lineTotalCents, vatRateBps);
  const netTotalCents = lineTotalCents;
  const vatTotalCents = vatComputation.vatAmountCents;
  const grossTotalCents = vatComputation.grossCents;

  const hydraFeeBps = 500;
  const hydraFeeCents = computeHydraFeeCents(grossTotalCents, hydraFeeBps);
  const hydraFeePercent = bpsToPercent(hydraFeeBps);

  const orderNumber = `TEST-UI-${Date.now()}`;
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
      region: client.region,
      SubOrder: {
        create: {
          id: subOrderId,
          vendorId: vendor.id,
          status: "SUBMITTED",
          subOrderNumber: `${orderNumber}-V01`,
          subTotalCents: lineTotalCents,
          netTotalCents,
          vatTotalCents,
          grossTotalCents,
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
    include: { SubOrder: true },
  });

  console.log("✅ Order created successfully!\n");
  console.log("=".repeat(60));
  console.log(`Order Number:     ${order.orderNumber}`);
  console.log(`SubOrder ID:      ${order.SubOrder[0].id}`);
  console.log(`SubOrder Number:  ${order.SubOrder[0].subOrderNumber}`);
  console.log("=".repeat(60));
  console.log("\n📊 Financial Breakdown:");
  console.log(`   Gross Total:   €${(grossTotalCents / 100).toFixed(2)}`);
  console.log(`   VAT (${vatRateBps / 100}%):     €${(vatTotalCents / 100).toFixed(2)}`);
  console.log(`   Net Amount:    €${(netTotalCents / 100).toFixed(2)}`);
  console.log(`   Platform Fee:  €${(hydraFeeCents / 100).toFixed(2)} (5%)`);
  console.log("=".repeat(60));
  console.log("\n🔗 To test in browser:");
  console.log(`   1. Start dev server: npm run dev`);
  console.log(`   2. Login as: vendor.generalbeverage@hydra.local`);
  console.log(`   3. Navigate to: /dashboard/orders/${order.SubOrder[0].id}`);
  console.log("\n   You should see the Financial Breakdown card with all values!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
