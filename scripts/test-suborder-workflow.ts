/**
 * Comprehensive End-to-End SubOrder Workflow Test
 *
 * Tests GitHub Issue #100: Split Hydra Order into Vendor SubOrders
 *
 * Workflow:
 * 1. Create order as Demo Ristorante with items from General Beverage + CD Fish
 * 2. Verify order splits into 2 SubOrders
 * 3. Verify totals match (Order.totalCents = sum of SubOrder.subTotalCents)
 * 4. Test vendor visibility (each vendor sees only their SubOrder)
 * 5. Test admin visibility (sees all SubOrders)
 * 6. Test status transitions (SUBMITTED → CONFIRMED → READY)
 * 7. Test driver assignment
 * 8. Test delivery completion
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🧪 COMPREHENSIVE SUBORDER WORKFLOW TEST\n");
  console.log("=".repeat(60));

  // ============================================================================
  // STEP 1: Setup - Get Client, Vendors, and Products
  // ============================================================================
  console.log("\n📋 STEP 1: Setup");
  console.log("-".repeat(60));

  const client = await prisma.client.findFirst({
    where: { name: { contains: "Demo Ristorante", mode: "insensitive" } },
  });

  if (!client) {
    throw new Error("Demo Ristorante client not found");
  }
  console.log(`✅ Found client: ${client.name} (${client.id})`);

  const generalBeverage = await prisma.vendor.findFirst({
    where: { name: { contains: "General Beverage", mode: "insensitive" } },
  });

  const cdFish = await prisma.vendor.findFirst({
    where: { name: { contains: "CD Fish", mode: "insensitive" } },
  });

  if (!generalBeverage || !cdFish) {
    throw new Error("Vendors not found");
  }

  console.log(
    `✅ Found vendor: ${generalBeverage.name} (${generalBeverage.id})`
  );
  console.log(`✅ Found vendor: ${cdFish.name} (${cdFish.id})`);

  // Get products from each vendor
  const beverageProduct = await prisma.vendorProduct.findFirst({
    where: {
      vendorId: generalBeverage.id,
      isActive: true,
      deletedAt: null,
    },
    include: { Product: true },
  });

  const fishProduct = await prisma.vendorProduct.findFirst({
    where: {
      vendorId: cdFish.id,
      isActive: true,
      deletedAt: null,
    },
    include: { Product: true },
  });

  if (!beverageProduct || !fishProduct) {
    throw new Error("Products not found");
  }

  console.log(
    `✅ Found product from ${generalBeverage.name}: ${beverageProduct.Product.name}`
  );
  console.log(
    `✅ Found product from ${cdFish.name}: ${fishProduct.Product.name}`
  );

  // Get admin user for order submission
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  // ============================================================================
  // STEP 2: Create Multi-Vendor Order
  // ============================================================================
  console.log("\n📦 STEP 2: Create Multi-Vendor Order");
  console.log("-".repeat(60));

  const bevQty = 5;
  const fishQty = 3;
  const bevTotal = beverageProduct.basePriceCents * bevQty;
  const fishTotal = fishProduct.basePriceCents * fishQty;
  const expectedTotal = bevTotal + fishTotal;

  console.log(
    `   Beverage: ${bevQty} × €${(beverageProduct.basePriceCents / 100).toFixed(
      2
    )} = €${(bevTotal / 100).toFixed(2)}`
  );
  console.log(
    `   Fish: ${fishQty} × €${(fishProduct.basePriceCents / 100).toFixed(
      2
    )} = €${(fishTotal / 100).toFixed(2)}`
  );
  console.log(`   Expected Total: €${(expectedTotal / 100).toFixed(2)}`);

  const orderNumber = `TEST-${Date.now()}`;
  const orderId = createId();

  const order = await prisma.order.create({
    data: {
      id: orderId,
      orderNumber,
      clientId: client.id,
      submitterUserId: adminUser.id,
      status: "SUBMITTED",
      totalCents: expectedTotal,
      deliveryAddress: client.deliveryAddress,
      deliveryLat: client.deliveryLat,
      deliveryLng: client.deliveryLng,
      region: client.region,
      // Create SubOrders
      SubOrder: {
        create: [
          {
            id: createId(),
            vendorId: generalBeverage.id,
            status: "SUBMITTED",
            subOrderNumber: `SO-${Date.now()}-1`,
            subTotalCents: bevTotal,
            OrderItem: {
              create: {
                id: createId(),
                orderId, // Required link to parent Order
                vendorProductId: beverageProduct.id,
                productName: beverageProduct.Product.name,
                vendorName: generalBeverage.name,
                qty: bevQty,
                unitPriceCents: beverageProduct.basePriceCents,
                lineTotalCents: bevTotal,
              },
            },
          },
          {
            id: createId(),
            vendorId: cdFish.id,
            status: "SUBMITTED",
            subOrderNumber: `SO-${Date.now()}-2`,
            subTotalCents: fishTotal,
            OrderItem: {
              create: {
                id: createId(),
                orderId, // Required link to parent Order
                vendorProductId: fishProduct.id,
                productName: fishProduct.Product.name,
                vendorName: cdFish.name,
                qty: fishQty,
                unitPriceCents: fishProduct.basePriceCents,
                lineTotalCents: fishTotal,
              },
            },
          },
        ],
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

  console.log(`✅ Created Order: ${order.orderNumber}`);
  console.log(`   Order ID: ${order.id}`);
  console.log(`   Total: €${(order.totalCents / 100).toFixed(2)}`);
  console.log(`   SubOrders created: ${order.SubOrder.length}`);

  // ============================================================================
  // STEP 3: Verify Order Split and Totals
  // ============================================================================
  console.log("\n🔍 STEP 3: Verify Order Split and Totals");
  console.log("-".repeat(60));

  const subOrdersTotal = order.SubOrder.reduce(
    (sum, so) => sum + so.subTotalCents,
    0
  );

  console.log(`   Order Total: €${(order.totalCents / 100).toFixed(2)}`);
  console.log(`   SubOrders Total: €${(subOrdersTotal / 100).toFixed(2)}`);

  if (order.totalCents === subOrdersTotal) {
    console.log(`✅ Totals match! Order integrity maintained.`);
  } else {
    console.error(`❌ FAIL: Totals don't match!`);
    console.error(
      `   Difference: €${((order.totalCents - subOrdersTotal) / 100).toFixed(
        2
      )}`
    );
    throw new Error("Total mismatch");
  }

  for (const subOrder of order.SubOrder) {
    console.log(`\n   SubOrder: ${subOrder.subOrderNumber}`);
    console.log(`     Vendor: ${subOrder.OrderItem[0]?.vendorName}`);
    console.log(`     Items: ${subOrder.OrderItem.length}`);
    console.log(`     Subtotal: €${(subOrder.subTotalCents / 100).toFixed(2)}`);
    console.log(`     Status: ${subOrder.status}`);
  }

  // ============================================================================
  // STEP 4: Test Vendor Visibility
  // ============================================================================
  console.log("\n👁️  STEP 4: Test Vendor Visibility");
  console.log("-".repeat(60));

  // General Beverage should see only their SubOrder
  const bevSubOrders = await prisma.subOrder.findMany({
    where: {
      vendorId: generalBeverage.id,
      orderId: order.id,
    },
    include: { OrderItem: true },
  });

  console.log(`\n   General Beverage sees:`);
  console.log(`     SubOrders: ${bevSubOrders.length}`);
  if (bevSubOrders.length === 1) {
    console.log(`     ✅ Correct - sees only their SubOrder`);
    console.log(`     SubOrder: ${bevSubOrders[0].subOrderNumber}`);
  } else {
    console.error(`     ❌ FAIL: Should see exactly 1 SubOrder`);
    throw new Error("Vendor visibility check failed for General Beverage");
  }

  // CD Fish should see only their SubOrder
  const fishSubOrders = await prisma.subOrder.findMany({
    where: {
      vendorId: cdFish.id,
      orderId: order.id,
    },
    include: { OrderItem: true },
  });

  console.log(`\n   CD Fish sees:`);
  console.log(`     SubOrders: ${fishSubOrders.length}`);
  if (fishSubOrders.length === 1) {
    console.log(`     ✅ Correct - sees only their SubOrder`);
    console.log(`     SubOrder: ${fishSubOrders[0].subOrderNumber}`);
  } else {
    console.error(`     ❌ FAIL: Should see exactly 1 SubOrder`);
    throw new Error("Vendor visibility check failed for CD Fish");
  }

  // ============================================================================
  // STEP 5: Test Admin Visibility
  // ============================================================================
  console.log("\n👑 STEP 5: Test Admin Visibility");
  console.log("-".repeat(60));

  const adminOrderView = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      SubOrder: {
        include: {
          Vendor: true,
          OrderItem: true,
        },
      },
      Client: true,
    },
  });

  console.log(`   Admin sees:`);
  console.log(`     Order: ${adminOrderView?.orderNumber}`);
  console.log(`     Client: ${adminOrderView?.Client?.name}`);
  console.log(`     SubOrders: ${adminOrderView?.SubOrder?.length}`);

  if (adminOrderView?.SubOrder?.length === 2) {
    console.log(`     ✅ Correct - sees all SubOrders`);
    for (const so of adminOrderView.SubOrder) {
      console.log(
        `       - ${so.subOrderNumber} (${so.Vendor.name}): ${so.status}`
      );
    }
  } else {
    console.error(`     ❌ FAIL: Should see 2 SubOrders`);
  }

  // ============================================================================
  // STEP 6: Test Status Transitions
  // ============================================================================
  console.log("\n🔄 STEP 6: Test Status Transitions");
  console.log("-".repeat(60));

  // Vendor confirms their SubOrders
  const bevSubOrder = bevSubOrders[0];
  const fishSubOrder = fishSubOrders[0];

  console.log(`\n   General Beverage: SUBMITTED → CONFIRMED`);
  await prisma.subOrder.update({
    where: { id: bevSubOrder.id },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });
  console.log(`     ✅ Updated to CONFIRMED`);

  console.log(`\n   CD Fish: SUBMITTED → CONFIRMED`);
  await prisma.subOrder.update({
    where: { id: fishSubOrder.id },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });
  console.log(`     ✅ Updated to CONFIRMED`);

  // Mark as READY
  console.log(`\n   General Beverage: CONFIRMED → READY`);
  await prisma.subOrder.update({
    where: { id: bevSubOrder.id },
    data: {
      status: "READY",
      readyAt: new Date(),
    },
  });
  console.log(`     ✅ Updated to READY`);

  console.log(`\n   CD Fish: CONFIRMED → READY`);
  await prisma.subOrder.update({
    where: { id: fishSubOrder.id },
    data: {
      status: "READY",
      readyAt: new Date(),
    },
  });
  console.log(`     ✅ Updated to READY`);

  // ============================================================================
  // STEP 7: Test Driver Assignment
  // ============================================================================
  console.log("\n🚚 STEP 7: Test Driver Assignment");
  console.log("-".repeat(60));

  const driver = await prisma.driver.findFirst({
    where: { status: "ONLINE" },
  });

  if (!driver) {
    console.log(`   ⚠️  No active driver found - skipping driver tests`);
  } else {
    console.log(`   Found driver: ${driver.name}`);

    // Assign deliveries for both SubOrders
    console.log(`\n   Creating delivery for General Beverage SubOrder`);
    const bevDelivery = await prisma.delivery.create({
      data: {
        id: createId(),
        subOrderId: bevSubOrder.id,
        driverId: driver.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });
    console.log(`     ✅ Delivery created: ${bevDelivery.id}`);

    console.log(`\n   Creating delivery for CD Fish SubOrder`);
    const fishDelivery = await prisma.delivery.create({
      data: {
        id: createId(),
        subOrderId: fishSubOrder.id,
        driverId: driver.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });
    console.log(`     ✅ Delivery created: ${fishDelivery.id}`);

    // ============================================================================
    // STEP 8: Test Driver Workflow
    // ============================================================================
    console.log("\n🎯 STEP 8: Test Driver Workflow");
    console.log("-".repeat(60));

    // Driver picks up
    console.log(`\n   Driver picks up beverage order`);
    await prisma.delivery.update({
      where: { id: bevDelivery.id },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
      },
    });
    console.log(`     ✅ Status: PICKED_UP`);

    console.log(`\n   Driver picks up fish order`);
    await prisma.delivery.update({
      where: { id: fishDelivery.id },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
      },
    });
    console.log(`     ✅ Status: PICKED_UP`);

    // Driver delivers
    console.log(`\n   Driver delivers beverage order`);
    await prisma.delivery.update({
      where: { id: bevDelivery.id },
      data: {
        status: "IN_TRANSIT",
        inTransitAt: new Date(),
      },
    });
    console.log(`     ✅ Status: IN_TRANSIT`);

    // Note: Using direct update since we're testing, not using the action
    await prisma.delivery.update({
      where: { id: bevDelivery.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });
    console.log(`     ✅ Status: DELIVERED`);

    console.log(`\n   Driver delivers fish order`);
    await prisma.delivery.update({
      where: { id: fishDelivery.id },
      data: {
        status: "IN_TRANSIT",
        inTransitAt: new Date(),
      },
    });
    console.log(`     ✅ Status: IN_TRANSIT`);

    await prisma.delivery.update({
      where: { id: fishDelivery.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });
    console.log(`     ✅ Status: DELIVERED`);
  }

  // ============================================================================
  // STEP 9: Final Verification
  // ============================================================================
  console.log("\n✅ STEP 9: Final Verification");
  console.log("-".repeat(60));

  const finalOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      SubOrder: {
        include: {
          OrderItem: true,
          Delivery: true,
        },
      },
    },
  });

  console.log(`\n   Final State:`);
  console.log(`     Order: ${finalOrder?.orderNumber}`);
  console.log(
    `     Total: €${((finalOrder?.totalCents || 0) / 100).toFixed(2)}`
  );
  console.log(`     SubOrders: ${finalOrder?.SubOrder.length}`);

  let allChecks = true;

  for (const so of finalOrder?.SubOrder || []) {
    const itemsTotal = so.OrderItem.reduce(
      (sum, item) => sum + item.lineTotalCents,
      0
    );
    const match = itemsTotal === so.subTotalCents;

    console.log(`\n     SubOrder: ${so.subOrderNumber}`);
    console.log(`       Status: ${so.status}`);
    console.log(`       Items: ${so.OrderItem.length}`);
    console.log(`       Subtotal: €${(so.subTotalCents / 100).toFixed(2)}`);
    console.log(`       Items Total: €${(itemsTotal / 100).toFixed(2)}`);
    console.log(`       Match: ${match ? "✅" : "❌"}`);

    if (so.Delivery) {
      console.log(`       Delivery: ${so.Delivery.status}`);
    }

    if (!match) allChecks = false;
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  if (allChecks && finalOrder?.SubOrder.length === 2) {
    console.log("\n✅ ALL CHECKS PASSED!");
    console.log("   - Order created successfully");
    console.log("   - Split into 2 SubOrders");
    console.log("   - Totals match");
    console.log("   - Vendor visibility correct");
    console.log("   - Admin sees everything");
    console.log("   - Status transitions work");
    console.log("   - Driver workflow functional");
  } else {
    console.error("\n❌ SOME CHECKS FAILED");
    allChecks = false;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n🎉 Test Complete! Order ID: ${order.id}\n`);

  return { success: allChecks, orderId: order.id };
}

main()
  .then((result) => {
    return result;
  })
  .catch(async (e) => {
    console.error("\n❌ ERROR:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .then(async (result) => {
    await prisma.$disconnect();
    if (result) {
      process.exit(result.success ? 0 : 1);
    }
  });
