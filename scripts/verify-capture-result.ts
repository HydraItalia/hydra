/**
 * Quick verification script - run after marking delivery as DELIVERED
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("\n🔍 VERIFYING PAYMENT CAPTURE RESULT\n");

  // Find most recently delivered SubOrder with pre-auth
  const subOrder = await prisma.subOrder.findFirst({
    where: {
      stripeChargeId: { not: null },
      Delivery: {
        status: "DELIVERED",
      },
    },
    include: {
      Delivery: {
        select: {
          status: true,
          deliveredAt: true,
          Driver: {
            select: { name: true },
          },
        },
      },
      Vendor: {
        select: { name: true },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!subOrder) {
    console.log("❌ No delivered SubOrders found with payment");
    process.exit(1);
  }

  console.log("📦 SubOrder Details:");
  console.log(`   Number: ${subOrder.subOrderNumber}`);
  console.log(`   Vendor: ${subOrder.Vendor.name}`);
  console.log(`   Driver: ${subOrder.Delivery?.Driver.name || "N/A"}`);
  console.log(`   Delivered: ${subOrder.Delivery?.deliveredAt?.toISOString() || "N/A"}`);
  console.log("");

  console.log("💳 Payment Details:");
  console.log(`   PaymentIntent: ${subOrder.stripeChargeId}`);
  console.log(`   Amount: €${(subOrder.subTotalCents / 100).toFixed(2)}`);
  console.log(`   Payment Status: ${subOrder.paymentStatus}`);
  console.log(`   Paid At: ${subOrder.paidAt?.toISOString() || "NOT SET"}`);
  console.log("");

  // Verify capture
  if (subOrder.paymentStatus === "SUCCEEDED" && subOrder.paidAt) {
    console.log("✅ SUCCESS! Payment was captured correctly");
    console.log("");
    console.log("Next steps:");
    console.log(`   1. Check Stripe Dashboard for PaymentIntent: ${subOrder.stripeChargeId}`);
    console.log("   2. Verify status is 'succeeded'");
    console.log("   3. Confirm funds transferred to vendor");
    process.exit(0);
  } else if (subOrder.paymentStatus === "PROCESSING") {
    console.log("❌ FAILED - Payment still in PROCESSING state");
    console.log("");
    console.log("Troubleshooting:");
    console.log("   1. Check server logs for CRITICAL errors");
    console.log("   2. Look for [Delivery] or [Capture] log entries");
    console.log(`   3. Manually capture in Stripe: ${subOrder.stripeChargeId}`);
    process.exit(1);
  } else {
    console.log(`⚠️  Unexpected status: ${subOrder.paymentStatus}`);
    process.exit(1);
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
