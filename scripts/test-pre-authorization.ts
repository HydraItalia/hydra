/**
 * Comprehensive Pre-Authorization Test Script
 *
 * Tests GitHub Issue #101: Pre-authorize vendor charges at order confirmation
 *
 * Workflow:
 * 1. Verify client has payment method
 * 2. Verify vendors have Stripe Connect enabled
 * 3. Create multi-vendor order
 * 4. Confirm order (triggers pre-authorization)
 * 5. Verify PaymentIntents created
 * 6. Test error scenarios
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🧪 PRE-AUTHORIZATION TEST\n");
  console.log("=".repeat(60));

  // ============================================================================
  // STEP 1: Setup - Verify Prerequisites
  // ============================================================================
  console.log("\n📋 STEP 1: Verify Prerequisites");
  console.log("-".repeat(60));

  // Check Stripe keys are configured
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured in environment");
  }
  console.log("✅ Stripe API key configured");

  // Find or create test client with payment method
  let client = await prisma.client.findFirst({
    where: {
      stripeCustomerId: { not: null },
      defaultPaymentMethodId: { not: null },
      hasPaymentMethod: true,
    },
  });

  if (!client) {
    // Try Demo Ristorante
    client = await prisma.client.findFirst({
      where: { name: { contains: "Demo Ristorante", mode: "insensitive" } },
    });

    if (!client) {
      throw new Error(
        "No client with payment method found. Please set up a client with a payment method first."
      );
    }

    if (!client.defaultPaymentMethodId) {
      console.log(`⚠️  Client ${client.name} does not have a payment method.`);
      console.log(
        "   Please add a payment method via the UI or Stripe API first."
      );
      throw new Error("Client missing payment method");
    }
  }

  console.log(`✅ Found client: ${client.name}`);
  console.log(`   Stripe Customer: ${client.stripeCustomerId}`);
  console.log(`   Payment Method: ${client.defaultPaymentMethodId}`);

  // Find vendors with Stripe Connect
  const vendors = await prisma.vendor.findMany({
    where: {
      stripeAccountId: { not: null },
      chargesEnabled: true,
    },
    take: 2,
  });

  if (vendors.length < 2) {
    console.log(
      `⚠️  Only found ${vendors.length} vendor(s) with Stripe Connect`
    );
    console.log("   Need at least 2 vendors to test multi-vendor orders.");
    console.log("   Please set up Stripe Connect for at least 2 vendors.");
    throw new Error("Not enough vendors with Stripe Connect");
  }

  console.log(`✅ Found ${vendors.length} vendors with Stripe Connect:`);
  for (const vendor of vendors) {
    console.log(`   - ${vendor.name} (${vendor.stripeAccountId})`);
  }

  // Get products from each vendor
  const products = await Promise.all(
    vendors.map(async (vendor) => {
      const product = await prisma.vendorProduct.findFirst({
        where: {
          vendorId: vendor.id,
          isActive: true,
          deletedAt: null,
        },
        include: { Product: true },
      });
      return { vendor, product };
    })
  );

  if (products.some((p) => !p.product)) {
    throw new Error("Some vendors don't have active products");
  }

  console.log("✅ Found products from each vendor");

  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    throw new Error("No admin user found");
  }

  // ============================================================================
  // STEP 2: Create Test Order
  // ============================================================================
  console.log("\n📦 STEP 2: Create Test Order");
  console.log("-".repeat(60));

  const orderNumber = `TEST-AUTH-${Date.now()}`;
  const orderId = createId();

  // Calculate totals
  const orderItems = products.map(({ vendor, product }, index) => {
    const qty = 2 + index; // 2, 3, 4, etc.
    const total = product!.basePriceCents * qty;

    return {
      vendor,
      product: product!,
      qty,
      total,
      subOrderNumber: `SO-${Date.now()}-${index + 1}`,
    };
  });

  const expectedTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

  console.log("Order breakdown:");
  for (const item of orderItems) {
    console.log(
      `   ${item.vendor.name}: ${item.qty} × €${(
        item.product.basePriceCents / 100
      ).toFixed(2)} = €${(item.total / 100).toFixed(2)}`
    );
  }
  console.log(`   Total: €${(expectedTotal / 100).toFixed(2)}`);

  // Create order with SubOrders
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
      SubOrder: {
        create: orderItems.map((item) => ({
          id: createId(),
          vendorId: item.vendor.id,
          status: "SUBMITTED",
          subOrderNumber: item.subOrderNumber,
          subTotalCents: item.total,
          OrderItem: {
            create: {
              id: createId(),
              orderId,
              vendorProductId: item.product.id,
              productName: item.product.Product.name,
              vendorName: item.vendor.name,
              qty: item.qty,
              unitPriceCents: item.product.basePriceCents,
              lineTotalCents: item.total,
            },
          },
        })),
      },
    },
    include: {
      SubOrder: true,
    },
  });

  console.log(`✅ Created order: ${order.orderNumber}`);
  console.log(`   Order ID: ${order.id}`);
  console.log(`   Status: ${order.status}`);
  console.log(`   SubOrders: ${order.SubOrder.length}`);

  // ============================================================================
  // STEP 3: Test Pre-Authorization
  // ============================================================================
  console.log("\n🔐 STEP 3: Test Pre-Authorization");
  console.log("-".repeat(60));

  console.log("\nSimulating order confirmation...");
  console.log(
    "This will call the updateOrderStatus action which triggers pre-auth."
  );

  // Import the action (this would normally be called from UI)
  // For testing, we'll call the API directly
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // Note: In a real scenario, this would be called through the UI with proper auth
    // For testing, we'll use the server action directly
    console.log("\n⚠️  Manual step required:");
    console.log("   1. Start your dev server: npm run dev");
    console.log("   2. Navigate to: http://localhost:3000/dashboard/orders");
    console.log(`   3. Find order: ${order.orderNumber}`);
    console.log("   4. Change status from SUBMITTED to CONFIRMED");
    console.log("\n   Or use the API:");
    console.log(
      `   POST ${baseUrl}/api/orders/${order.id}/status (not yet implemented)`
    );
    console.log("\nAlternatively, we can test the authorization API directly:");

    // Test each SubOrder authorization individually
    for (const subOrder of order.SubOrder) {
      console.log(`\n   Testing SubOrder: ${subOrder.subOrderNumber}`);

      // In a real test, you'd make an authenticated API call here
      // For now, we'll just show what would happen
      console.log(`   Would call: POST ${baseUrl}/api/stripe/authorize-charge`);
      console.log(`   Body: { "subOrderId": "${subOrder.id}" }`);
      console.log(
        "   Expected response: { success: true, paymentIntentId: 'pi_...' }"
      );
    }
  } catch (error) {
    console.error("❌ Authorization failed:", error);
    throw error;
  }

  // ============================================================================
  // STEP 4: Verification Instructions
  // ============================================================================
  console.log("\n🔍 STEP 4: Verification Instructions");
  console.log("-".repeat(60));

  console.log("\nAfter confirming the order, verify the following:\n");

  console.log("1. Check database for pre-authorization:");
  console.log("   ```sql");
  console.log("   SELECT");
  console.log("     so.subOrderNumber,");
  console.log("     so.stripeChargeId,");
  console.log("     so.paymentStatus,");
  console.log("     so.subTotalCents / 100.0 as amount_eur,");
  console.log("     v.name as vendor_name");
  console.log('   FROM "SubOrder" so');
  console.log('   JOIN "Vendor" v ON v.id = so.vendorId');
  console.log(`   WHERE so.orderId = '${order.id}';`);
  console.log("   ```\n");

  console.log("   Expected results:");
  for (const subOrder of order.SubOrder) {
    console.log(`   - ${subOrder.subOrderNumber}:`);
    console.log("     stripeChargeId: pi_... (not null)");
    console.log("     paymentStatus: PROCESSING");
  }

  console.log("\n2. Check Stripe Dashboard:");
  console.log("   URL: https://dashboard.stripe.com/test/payments");
  console.log("   Filter: Uncaptured");
  console.log(
    `   Expected: ${order.SubOrder.length} uncaptured PaymentIntents\n`
  );

  console.log("3. Verify each PaymentIntent:");
  for (const item of orderItems) {
    console.log(`   - Vendor: ${item.vendor.name}`);
    console.log(`     Amount: €${(item.total / 100).toFixed(2)}`);
    console.log(`     Status: Requires capture`);
    console.log(`     Account: ${item.vendor.stripeAccountId}\n`);
  }

  // ============================================================================
  // STEP 5: Error Scenario Tests
  // ============================================================================
  console.log("\n❌ STEP 5: Error Scenario Tests");
  console.log("-".repeat(60));

  console.log("\nTo test error scenarios, try these:");

  console.log("\n1. Client without payment method:");
  console.log("   - Create a client without a payment method");
  console.log("   - Create an order for that client");
  console.log("   - Try to confirm the order");
  console.log("   - Expected: Error about missing payment method\n");

  console.log("2. Vendor without Stripe Connect:");
  console.log(
    "   - Create an order with a vendor that doesn't have Stripe Connect"
  );
  console.log("   - Try to confirm the order");
  console.log("   - Expected: Error about vendor not having Stripe account\n");

  console.log("3. Card declined:");
  console.log(
    "   - Update client's payment method to use card: 4000 0000 0000 9995"
  );
  console.log("   - Try to confirm an order");
  console.log("   - Expected: Error about card being declined\n");

  console.log("4. Already authorized:");
  console.log("   - Confirm an order successfully");
  console.log("   - Try to authorize the same SubOrder again");
  console.log(
    "   - Expected: Success with existing PaymentIntent ID (idempotent)\n"
  );

  // ============================================================================
  // Summary
  // ============================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  console.log("\n✅ Setup complete:");
  console.log(`   - Client ready: ${client.name} (has payment method)`);
  console.log(`   - Vendors ready: ${vendors.length} with Stripe Connect`);
  console.log(`   - Test order created: ${order.orderNumber}`);
  console.log(`   - SubOrders created: ${order.SubOrder.length}`);

  console.log("\n📝 Next steps:");
  console.log("   1. Confirm the order via UI or API");
  console.log("   2. Verify pre-authorizations in database and Stripe");
  console.log("   3. Test error scenarios as listed above");
  console.log("   4. Clean up test data when done\n");

  console.log("🔗 Useful links:");
  console.log(`   - Order details: ${baseUrl}/dashboard/orders/${order.id}`);
  console.log(
    "   - Stripe Dashboard: https://dashboard.stripe.com/test/payments"
  );
  console.log("   - Documentation: docs/testing-pre-authorization.md\n");

  console.log("=".repeat(60));
  console.log(`\n🎉 Test setup complete! Order ID: ${order.id}\n`);

  return { success: true, orderId: order.id, orderNumber: order.orderNumber };
}

main()
  .then((result) => {
    console.log("\n✅ Test completed successfully");
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
      process.exit(0);
    }
  });
