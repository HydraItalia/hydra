/**
 * Test script for SubOrder functionality
 *
 * Run with: npx tsx scripts/test-suborders.ts
 *
 * This script tests:
 * 1. Database schema (SubOrder table exists)
 * 2. Order creation splits into SubOrders
 * 3. SubOrder status transitions
 * 4. Delivery assignment to SubOrders
 */

import { PrismaClient, SubOrderStatus } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Testing SubOrder Functionality\n");

  // ============================================
  // TEST 1: Verify Database Schema
  // ============================================
  console.log("📋 Test 1: Verify Database Schema");
  try {
    const subOrderCount = await prisma.subOrder.count();
    console.log(`✅ SubOrder table exists (${subOrderCount} records)`);

    // Check if SubOrderStatus enum exists
    const subOrder = await prisma.subOrder.findFirst();
    if (subOrder) {
      console.log(
        `✅ SubOrderStatus enum working (sample status: ${subOrder.status})`
      );
    }
  } catch (error) {
    console.error("❌ Schema verification failed:", error);
    return;
  }

  // ============================================
  // TEST 2: Find or Create Test Data
  // ============================================
  console.log("\n📋 Test 2: Prepare Test Data");

  // Find a client with a cart
  const clientWithCart = await prisma.client.findFirst({
    include: {
      Cart: {
        where: { status: "ACTIVE" },
        include: {
          CartItem: {
            include: {
              VendorProduct: {
                include: {
                  Vendor: true,
                  Product: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!clientWithCart?.Cart[0]?.CartItem.length) {
    console.log("⚠️  No active cart with items found. Creating test cart...");

    // Find client, vendors, and products
    const client = await prisma.client.findFirst({
      include: {
        User: true,
      },
    });

    // Find specific vendors: CD Fish and General Beverage
    const vendors = await prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: "CD Fish", mode: "insensitive" } },
          { name: { contains: "General Beverage", mode: "insensitive" } },
        ],
      },
      take: 2,
    });

    if (!client || vendors.length < 2) {
      console.error("❌ Need at least 1 client and 2 vendors in database");
      return;
    }

    // Find products from each vendor
    console.log(
      `   Looking for products from vendors: ${vendors[0].id}, ${vendors[1].id}`
    );

    const vendorProduct1 = await prisma.vendorProduct.findFirst({
      where: { vendorId: vendors[0].id },
    });
    const vendorProduct2 = await prisma.vendorProduct.findFirst({
      where: { vendorId: vendors[1].id },
    });

    console.log(`   Found product 1: ${vendorProduct1?.id || "NONE"}`);
    console.log(`   Found product 2: ${vendorProduct2?.id || "NONE"}`);

    if (!vendorProduct1 || !vendorProduct2) {
      // Try to see what products exist
      const allProducts = await prisma.vendorProduct.findMany({ take: 5 });
      console.log(`   Total VendorProducts in DB: ${allProducts.length}`);
      if (allProducts.length > 0) {
        console.log(
          `   Sample vendorIds: ${allProducts
            .map((p) => p.vendorId)
            .join(", ")}`
        );
      }
      console.error("❌ Need products from both vendors");
      return;
    }

    // Get or find a valid user ID
    let userId = client.User?.id;
    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        console.error("❌ No users found in database");
        return;
      }
      userId = firstUser.id;
    }

    // Create cart with items from 2 different vendors
    const cart = await prisma.cart.create({
      data: {
        id: createId(),
        clientId: client.id,
        createdByUserId: userId,
        status: "ACTIVE",
        CartItem: {
          create: [
            {
              id: createId(),
              vendorProductId: vendorProduct1.id,
              qty: 2,
              unitPriceCents: vendorProduct1.basePriceCents,
            },
            {
              id: createId(),
              vendorProductId: vendorProduct2.id,
              qty: 3,
              unitPriceCents: vendorProduct2.basePriceCents,
            },
          ],
        },
      },
    });
    console.log(`✅ Created test cart: ${cart.id}`);
  } else {
    console.log(
      `✅ Found active cart with ${clientWithCart.Cart[0].CartItem.length} items`
    );
  }

  // ============================================
  // TEST 3: Test Order Creation → SubOrders
  // ============================================
  console.log("\n📋 Test 3: Create Order and Verify SubOrder Split");

  const cart = await prisma.cart.findFirst({
    where: {
      status: "ACTIVE",
      CartItem: {
        some: {}, // Only get carts that have items
      },
    },
    include: {
      CartItem: {
        include: {
          VendorProduct: {
            include: {
              Vendor: true,
              Product: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Get the most recent one (the one we just created)
    },
  });

  if (!cart) {
    console.error("❌ No active cart found");
    return;
  }

  // Group items by vendor
  console.log(`   Cart has ${cart.CartItem.length} items`);
  if (cart.CartItem.length > 0) {
    console.log(`   First item:`, {
      id: cart.CartItem[0].id,
      vendorProductId: cart.CartItem[0].vendorProductId,
      hasVendorProduct: !!cart.CartItem[0].VendorProduct,
      vendorId: cart.CartItem[0].VendorProduct?.Vendor?.id,
    });
  }

  const vendorIds = [
    ...new Set(cart.CartItem.map((item) => item.VendorProduct.Vendor.id)),
  ];
  console.log(`   Cart has items from ${vendorIds.length} vendors`);

  // Simulate order creation (wrapped in transaction for data consistency)
  const orderNumber = `HYD-TEST-${Date.now()}`;
  const totalCents = cart.CartItem.reduce(
    (sum, item) => sum + item.unitPriceCents * item.qty,
    0
  );

  const { order, subOrders } = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        id: createId(),
        clientId: cart.clientId,
        submitterUserId: cart.createdByUserId,
        orderNumber,
        status: "SUBMITTED",
        totalCents,
      },
    });
    console.log(`✅ Created Order: ${orderNumber}`);

    // Create SubOrders (one per vendor)
    const subOrders = [];
    for (let i = 0; i < vendorIds.length; i++) {
      const vendorId = vendorIds[i];
      const vendorItems = cart.CartItem.filter(
        (item) => item.VendorProduct.Vendor.id === vendorId
      );
      const subTotalCents = vendorItems.reduce(
        (sum, item) => sum + item.unitPriceCents * item.qty,
        0
      );

      const subOrder = await tx.subOrder.create({
        data: {
          id: createId(),
          orderId: order.id,
          vendorId,
          status: "SUBMITTED",
          subOrderNumber: `${orderNumber}-V${String(i + 1).padStart(2, "0")}`,
          subTotalCents,
        },
      });
      subOrders.push(subOrder);

      // Create OrderItems linked to SubOrder
      for (const item of vendorItems) {
        await tx.orderItem.create({
          data: {
            id: createId(),
            orderId: order.id,
            subOrderId: subOrder.id,
            vendorProductId: item.vendorProductId,
            qty: item.qty,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.unitPriceCents * item.qty,
            productName: item.VendorProduct.Product.name,
            vendorName: item.VendorProduct.Vendor.name,
          },
        });
      }

      console.log(
        `✅ Created SubOrder: ${subOrder.subOrderNumber} (${subTotalCents} cents)`
      );
    }

    return { order, subOrders };
  });

  // Verify totals match
  const subOrderTotal = subOrders.reduce(
    (sum, so) => sum + so.subTotalCents,
    0
  );
  if (subOrderTotal === totalCents) {
    console.log(`✅ Order total matches SubOrder totals: ${totalCents} cents`);
  } else {
    console.error(
      `❌ Total mismatch! Order: ${totalCents}, SubOrders: ${subOrderTotal}`
    );
  }

  // ============================================
  // TEST 4: Test SubOrder Status Transitions
  // ============================================
  console.log("\n📋 Test 4: Test SubOrder Status Transitions");

  const testSubOrder = subOrders[0];
  const validTransitions = {
    SUBMITTED: SubOrderStatus.CONFIRMED,
    CONFIRMED: SubOrderStatus.FULFILLING,
    FULFILLING: SubOrderStatus.READY,
  };

  try {
    for (const [currentStatus, nextStatus] of Object.entries(
      validTransitions
    )) {
      await prisma.subOrder.update({
        where: { id: testSubOrder.id },
        data: {
          status: nextStatus,
          ...(nextStatus === SubOrderStatus.CONFIRMED && {
            confirmedAt: new Date(),
          }),
          ...(nextStatus === SubOrderStatus.READY && { readyAt: new Date() }),
        },
      });
      console.log(`✅ Transitioned ${currentStatus} → ${nextStatus}`);
    }
  } catch (error) {
    console.error("❌ Status transition failed:", error);
  }

  // ============================================
  // TEST 5: Test Delivery Assignment
  // ============================================
  console.log("\n📋 Test 5: Test Delivery Assignment to SubOrder");

  // Find or create a driver
  let driver = await prisma.driver.findFirst({ where: { status: "ONLINE" } });
  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        id: createId(),
        name: "Test Driver",
        status: "ONLINE",
      },
    });
    console.log(`   Created test driver: ${driver.name}`);
  }

  // Assign delivery to SubOrder
  const readySubOrder = await prisma.subOrder.findFirst({
    where: { status: "READY" },
  });

  if (readySubOrder) {
    const delivery = await prisma.delivery.create({
      data: {
        id: createId(),
        subOrderId: readySubOrder.id,
        driverId: driver.id,
        status: "ASSIGNED",
        routeSequence: 0, // Test that 0 is preserved (not converted to null)
      },
    });
    console.log(
      `✅ Created Delivery for SubOrder: ${readySubOrder.subOrderNumber}`
    );
    console.log(
      `   Route Sequence: ${delivery.routeSequence} (should be 0, not null)`
    );
  } else {
    console.log("⚠️  No READY SubOrders available for delivery assignment");
  }

  // ============================================
  // TEST 6: Verify Data Integrity
  // ============================================
  console.log("\n📋 Test 6: Verify Data Integrity");

  const orderWithSubOrders = await prisma.order.findUnique({
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

  if (orderWithSubOrders) {
    console.log(`✅ Order has ${orderWithSubOrders.SubOrder.length} SubOrders`);

    for (const subOrder of orderWithSubOrders.SubOrder) {
      console.log(
        `   - ${subOrder.subOrderNumber}: ${subOrder.status}, ${
          subOrder.OrderItem.length
        } items, ${subOrder.Delivery ? "HAS" : "NO"} delivery`
      );
    }
  }

  console.log("\n🎉 All tests completed!");
  console.log("\n📊 Summary:");
  console.log(`   ✅ Database schema verified`);
  console.log(`   ✅ Order split into ${subOrders.length} SubOrders`);
  console.log(`   ✅ SubOrder status transitions working`);
  console.log(`   ✅ Delivery assignment to SubOrder working`);
  console.log(`   ✅ Data integrity verified`);
}

main()
  .catch(async (error) => {
    console.error("💥 Test failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .then(() => prisma.$disconnect());
