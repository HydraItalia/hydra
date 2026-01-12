/**
 * Create a fresh test order for manual UI testing of payment capture
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { authorizeSubOrderCharge } from "../src/lib/stripe-auth";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🎯 Creating Fresh Test Order for Capture Testing\n");

  // Get test vendor and client
  const testVendor = await prisma.vendor.findFirst({
    where: { id: "ipy8e3t9t5u8g5vjpggvmrif" }, // Test Vendor - Stripe Connect
  });

  const client = await prisma.client.findFirst({
    where: { name: { contains: "Demo Ristorante", mode: "insensitive" } },
  });

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const driver = await prisma.driver.findFirst({
    where: { name: { contains: "Marco", mode: "insensitive" } },
  });

  if (!testVendor || !client || !adminUser || !driver) {
    throw new Error("Required data not found");
  }

  // Get a test product
  const testProduct = await prisma.vendorProduct.findFirst({
    where: {
      vendorId: testVendor.id,
      isActive: true,
    },
    include: { Product: true },
  });

  if (!testProduct) {
    throw new Error("No products found for test vendor");
  }

  const qty = 2;
  const total = testProduct.basePriceCents * qty;
  const orderNumber = `TEST-CAPTURE-${Date.now()}`;
  const orderId = createId();
  const subOrderId = createId();

  // Create order with SubOrder
  console.log("Creating order...");
  const order = await prisma.order.create({
    data: {
      id: orderId,
      orderNumber,
      clientId: client.id,
      submitterUserId: adminUser.id,
      status: "SUBMITTED",
      totalCents: total,
      SubOrder: {
        create: {
          id: subOrderId,
          vendorId: testVendor.id,
          status: "SUBMITTED",
          subOrderNumber: `${orderNumber}-V01`,
          subTotalCents: total,
          paymentStatus: "PENDING",
          OrderItem: {
            create: {
              id: createId(),
              orderId,
              vendorProductId: testProduct.id,
              productName: testProduct.Product.name,
              vendorName: testVendor.name,
              qty,
              unitPriceCents: testProduct.basePriceCents,
              lineTotalCents: total,
            },
          },
        },
      },
    },
  });

  console.log(`✅ Created order: ${orderNumber}`);

  // Update SubOrder to CONFIRMED
  console.log("Confirming SubOrder...");
  await prisma.subOrder.update({
    where: { id: subOrderId },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  // Pre-authorize payment
  console.log("Pre-authorizing payment...");
  const authResult = await authorizeSubOrderCharge(subOrderId);

  if (!authResult.success) {
    throw new Error(`Pre-authorization failed: ${authResult.error}`);
  }

  console.log(`✅ Pre-authorized: ${authResult.paymentIntentId}`);

  // Update SubOrder to READY
  await prisma.subOrder.update({
    where: { id: subOrderId },
    data: { status: "READY", readyAt: new Date() },
  });

  // Create delivery
  console.log("Creating delivery...");
  const delivery = await prisma.delivery.create({
    data: {
      id: createId(),
      subOrderId,
      driverId: driver.id,
      status: "ASSIGNED",
      assignedAt: new Date(),
    },
  });

  console.log(`✅ Created delivery: ${delivery.id}`);

  // Progress to IN_TRANSIT
  await prisma.delivery.update({
    where: { id: delivery.id },
    data: {
      status: "PICKED_UP",
      pickedUpAt: new Date(),
    },
  });

  await prisma.delivery.update({
    where: { id: delivery.id },
    data: {
      status: "IN_TRANSIT",
      inTransitAt: new Date(),
    },
  });

  console.log(`✅ Delivery status: IN_TRANSIT`);

  console.log("\n" + "=".repeat(60));
  console.log("✅ TEST ORDER READY!\n");
  console.log("Order Details:");
  console.log(`  Order Number: ${orderNumber}`);
  console.log(`  SubOrder: ${orderNumber}-V01`);
  console.log(`  Delivery ID: ${delivery.id}`);
  console.log(`  PaymentIntent: ${authResult.paymentIntentId}`);
  console.log(`  Amount: €${(total / 100).toFixed(2)}`);
  console.log(`  Status: IN_TRANSIT (ready to deliver)`);
  console.log("\n📋 Next Steps:");
  console.log("  1. Sign in as driver (driver.marco@hydra.local)");
  console.log("  2. Go to Deliveries page");
  console.log(`  3. Find delivery ID: ${delivery.id}`);
  console.log("  4. Click 'Mark as DELIVERED'");
  console.log("  5. Watch for payment capture!");
  console.log("\n" + "=".repeat(60) + "\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
