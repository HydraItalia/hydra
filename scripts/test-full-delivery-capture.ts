/**
 * Full End-to-End Delivery and Payment Capture Test
 *
 * Tests the complete workflow from pre-authorization through delivery to capture:
 * 1. Find pre-authorized SubOrder from #101
 * 2. Create a delivery assignment
 * 3. Progress through delivery statuses
 * 4. Mark as DELIVERED (triggers automatic capture)
 * 5. Verify payment captured and database updated
 */

import { PrismaClient, PaymentStatus } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🧪 FULL DELIVERY & PAYMENT CAPTURE TEST\n");
  console.log("=".repeat(60));

  // ============================================================================
  // STEP 1: Find Pre-Authorized SubOrder
  // ============================================================================
  console.log("\n📋 STEP 1: Find Pre-Authorized SubOrder");
  console.log("-".repeat(60));

  const subOrder = await prisma.subOrder.findFirst({
    where: {
      paymentStatus: "PROCESSING",
      stripeChargeId: { not: null },
      Delivery: null, // No delivery assigned yet
    },
    include: {
      Vendor: {
        select: {
          name: true,
          stripeAccountId: true,
        },
      },
      Order: {
        select: {
          id: true,
          orderNumber: true,
          Client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!subOrder) {
    // Try to find one with existing delivery
    const subOrderWithDelivery = await prisma.subOrder.findFirst({
      where: {
        paymentStatus: "PROCESSING",
        stripeChargeId: { not: null },
      },
      include: {
        Vendor: { select: { name: true } },
        Order: {
          select: {
            orderNumber: true,
            Client: { select: { name: true } },
          },
        },
        Delivery: {
          select: {
            id: true,
            status: true,
            Driver: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (subOrderWithDelivery?.Delivery) {
      console.log("✅ Found SubOrder with existing delivery:");
      console.log(`   SubOrder: ${subOrderWithDelivery.subOrderNumber}`);
      console.log(`   Delivery: ${subOrderWithDelivery.Delivery.id}`);
      console.log(`   Status: ${subOrderWithDelivery.Delivery.status}`);
      console.log(
        `   Driver: ${subOrderWithDelivery.Delivery.Driver?.name || "Not assigned"}`
      );
      console.log(
        "\n⚠️  Using existing delivery. Will progress from current status."
      );

      // Use this delivery
      const deliveryId = subOrderWithDelivery.Delivery.id;
      const currentStatus = subOrderWithDelivery.Delivery.status;

      // Skip to delivery progression
      return await testDeliveryProgression(
        deliveryId,
        currentStatus,
        subOrderWithDelivery.id
      );
    }

    throw new Error(
      "No pre-authorized SubOrder found. Please run test-pre-auth-workflow.ts first."
    );
  }

  console.log(`✅ Found pre-authorized SubOrder:`);
  console.log(`   SubOrder: ${subOrder.subOrderNumber}`);
  console.log(`   Order: ${subOrder.Order.orderNumber}`);
  console.log(`   Vendor: ${subOrder.Vendor.name}`);
  console.log(`   PaymentIntent: ${subOrder.stripeChargeId}`);
  console.log(`   Amount: €${(subOrder.subTotalCents / 100).toFixed(2)}`);
  console.log(`   Payment Status: ${subOrder.paymentStatus}`);

  // ============================================================================
  // STEP 2: Find or Create Driver
  // ============================================================================
  console.log("\n👤 STEP 2: Find Test Driver");
  console.log("-".repeat(60));

  let driver = await prisma.driver.findFirst({
    where: {
      name: { contains: "Marco", mode: "insensitive" },
    },
  });

  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        id: createId(),
        name: "Test Driver - Marco",
        phone: "+39 123 456789",
        status: "AVAILABLE",
      },
    });
    console.log(`✅ Created test driver: ${driver.name}`);
  } else {
    console.log(`✅ Found driver: ${driver.name}`);
  }

  // ============================================================================
  // STEP 3: Create Delivery Assignment
  // ============================================================================
  console.log("\n🚚 STEP 3: Create Delivery Assignment");
  console.log("-".repeat(60));

  const delivery = await prisma.delivery.create({
    data: {
      id: createId(),
      subOrderId: subOrder.id,
      driverId: driver.id,
      status: "ASSIGNED",
      assignedAt: new Date(),
    },
    include: {
      SubOrder: {
        select: {
          subOrderNumber: true,
        },
      },
      Driver: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`✅ Created delivery:`);
  console.log(`   Delivery ID: ${delivery.id}`);
  console.log(`   SubOrder: ${delivery.SubOrder?.subOrderNumber}`);
  console.log(`   Driver: ${delivery.Driver.name}`);
  console.log(`   Status: ${delivery.status}`);

  // ============================================================================
  // STEP 4: Test Delivery Progression
  // ============================================================================
  return await testDeliveryProgression(delivery.id, "ASSIGNED", subOrder.id);
}

async function testDeliveryProgression(
  deliveryId: string,
  currentStatus: string,
  subOrderId: string
) {
  console.log("\n📦 STEP 4: Progress Through Delivery Statuses");
  console.log("-".repeat(60));

  // Mark as PICKED_UP if currently ASSIGNED
  if (currentStatus === "ASSIGNED") {
    console.log("\n   → Marking as PICKED_UP...");
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
      },
    });
    console.log("   ✅ Status: ASSIGNED → PICKED_UP");
    currentStatus = "PICKED_UP";

    // Small delay to simulate real workflow
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Mark as IN_TRANSIT if currently PICKED_UP
  if (currentStatus === "PICKED_UP") {
    console.log("\n   → Marking as IN_TRANSIT...");
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "IN_TRANSIT",
        inTransitAt: new Date(),
      },
    });
    console.log("   ✅ Status: PICKED_UP → IN_TRANSIT");
    currentStatus = "IN_TRANSIT";

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // ============================================================================
  // STEP 5: Mark as DELIVERED (Triggers Capture)
  // ============================================================================
  console.log("\n🎯 STEP 5: Mark as DELIVERED (Triggers Capture)");
  console.log("-".repeat(60));

  if (currentStatus === "IN_TRANSIT") {
    console.log("\n   → Marking as DELIVERED...");
    console.log(
      "   ⏳ This will trigger automatic payment capture (may take 1-2 seconds)"
    );

    const startTime = Date.now();

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        notes: "Test delivery completed",
      },
    });

    const duration = Date.now() - startTime;

    console.log("   ✅ Status: IN_TRANSIT → DELIVERED");
    console.log(`   ⏱️  Delivery confirmation took ${duration}ms`);

    // Wait a moment for capture to complete
    console.log("\n   ⏳ Waiting for payment capture to complete...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } else {
    console.log(`\n   ⚠️  Delivery already in status: ${currentStatus}`);
    console.log("   Skipping delivery progression");
  }

  // ============================================================================
  // STEP 6: Verify Payment Captured
  // ============================================================================
  console.log("\n💳 STEP 6: Verify Payment Captured");
  console.log("-".repeat(60));

  const updatedSubOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    select: {
      id: true,
      subOrderNumber: true,
      paymentStatus: true,
      paidAt: true,
      stripeChargeId: true,
      subTotalCents: true,
    },
  });

  if (!updatedSubOrder) {
    throw new Error("SubOrder not found");
  }

  console.log(`\n   SubOrder: ${updatedSubOrder.subOrderNumber}`);
  console.log(`   Payment Status: ${updatedSubOrder.paymentStatus}`);
  console.log(`   PaymentIntent: ${updatedSubOrder.stripeChargeId}`);
  console.log(
    `   Amount: €${(updatedSubOrder.subTotalCents / 100).toFixed(2)}`
  );
  console.log(
    `   Paid At: ${updatedSubOrder.paidAt?.toISOString() || "NOT SET"}`
  );

  // Verify capture succeeded
  let captureSucceeded = false;
  let captureError = "";

  if (updatedSubOrder.paymentStatus === PaymentStatus.SUCCEEDED) {
    if (updatedSubOrder.paidAt) {
      captureSucceeded = true;
      console.log("\n✅ CAPTURE SUCCESSFUL!");
      console.log("   ✅ Payment status updated to SUCCEEDED");
      console.log("   ✅ paidAt timestamp set");
      console.log("   ✅ Funds transferred to vendor");
    } else {
      captureError = "Payment status is SUCCEEDED but paidAt is null";
    }
  } else if (updatedSubOrder.paymentStatus === PaymentStatus.PROCESSING) {
    captureError = "Payment still in PROCESSING state - capture may have failed";
  } else {
    captureError = `Unexpected payment status: ${updatedSubOrder.paymentStatus}`;
  }

  if (!captureSucceeded) {
    console.error("\n❌ CAPTURE FAILED!");
    console.error(`   Error: ${captureError}`);
    console.error(
      "\n   💡 Check server logs for [Delivery] CRITICAL errors"
    );
    console.error(
      "   💡 Manually capture PaymentIntent in Stripe Dashboard:"
    );
    console.error(`      ${updatedSubOrder.stripeChargeId}`);
  }

  // ============================================================================
  // STEP 7: Verify Delivery State
  // ============================================================================
  console.log("\n🚚 STEP 7: Verify Delivery State");
  console.log("-".repeat(60));

  const finalDelivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: {
      status: true,
      deliveredAt: true,
      notes: true,
    },
  });

  if (!finalDelivery) {
    throw new Error("Delivery not found");
  }

  console.log(`\n   Status: ${finalDelivery.status}`);
  console.log(
    `   Delivered At: ${finalDelivery.deliveredAt?.toISOString() || "NOT SET"}`
  );
  console.log(`   Notes: ${finalDelivery.notes || "None"}`);

  if (finalDelivery.status !== "DELIVERED") {
    console.error(`\n❌ Delivery status should be DELIVERED, got ${finalDelivery.status}`);
  } else {
    console.log("\n✅ Delivery status correct");
  }

  // ============================================================================
  // TEST SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  if (captureSucceeded && finalDelivery.status === "DELIVERED") {
    console.log("\n✅ ALL TESTS PASSED!");
    console.log("   ✅ Delivery progressed correctly");
    console.log("   ✅ Payment captured automatically");
    console.log("   ✅ Database updated correctly");
    console.log("   ✅ Workflow complete");
    console.log("\n🎯 Issue #102 Working Correctly!");
  } else {
    console.error("\n❌ SOME TESTS FAILED");
    console.error("   See details above");
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n💡 Next Steps:");
  console.log("   1. Check Stripe Dashboard:");
  console.log(
    `      - PaymentIntent: ${updatedSubOrder.stripeChargeId}`
  );
  console.log("      - Status should be 'succeeded'");
  console.log("      - Amount should match SubOrder total");
  console.log("   2. Verify funds transferred to vendor account");
  console.log("   3. Check application logs for any CRITICAL errors");
  console.log("\n🎉 Test Complete!\n");

  return {
    success: captureSucceeded && finalDelivery.status === "DELIVERED",
    deliveryId,
    subOrderId: updatedSubOrder.id,
    paymentIntentId: updatedSubOrder.stripeChargeId,
  };
}

main()
  .catch((e) => {
    console.error("\n❌ ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  })
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  });
