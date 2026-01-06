import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function createTestOrder() {
  console.log("Creating a fresh test order...\n");

  // Find Demo Ristorante client
  const client = await prisma.client.findFirst({
    where: { name: { contains: "Demo Ristorante" } },
  });

  if (!client) {
    console.error("Demo Ristorante client not found");
    process.exit(1);
  }

  console.log("✅ Found client:", client.name);

  // Find vendors
  const generalBev = await prisma.vendor.findFirst({
    where: { name: { contains: "General Beverage" } },
  });

  const cdFish = await prisma.vendor.findFirst({
    where: { name: { contains: "CD Fish" } },
  });

  if (!generalBev || !cdFish) {
    console.error("Vendors not found");
    process.exit(1);
  }

  console.log("✅ Found vendor:", generalBev.name);
  console.log("✅ Found vendor:", cdFish.name);

  // Find products
  const bevProduct = await prisma.vendorProduct.findFirst({
    where: { vendorId: generalBev.id },
    include: { Product: true },
  });

  const fishProduct = await prisma.vendorProduct.findFirst({
    where: { vendorId: cdFish.id },
    include: { Product: true },
  });

  if (!bevProduct || !fishProduct) {
    console.error("Products not found");
    process.exit(1);
  }

  // Get user for the client
  const user = await prisma.user.findFirst({
    where: { clientId: client.id },
  });

  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  // Create order with SubOrders
  const orderNumber = `TEST-UI-${Date.now()}`;
  const totalCents =
    bevProduct.basePriceCents * 2 + fishProduct.basePriceCents * 3;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        id: createId(),
        clientId: client.id,
        submitterUserId: user.id,
        orderNumber,
        status: "SUBMITTED",
        totalCents,
      },
    });

    // Create SubOrder for General Beverage
    const bevSubOrder = await tx.subOrder.create({
      data: {
        id: createId(),
        orderId: order.id,
        vendorId: generalBev.id,
        status: "SUBMITTED",
        subOrderNumber: `${orderNumber}-V01`,
        subTotalCents: bevProduct.basePriceCents * 2,
      },
    });

    // Create SubOrder for CD Fish
    const fishSubOrder = await tx.subOrder.create({
      data: {
        id: createId(),
        orderId: order.id,
        vendorId: cdFish.id,
        status: "SUBMITTED",
        subOrderNumber: `${orderNumber}-V02`,
        subTotalCents: fishProduct.basePriceCents * 3,
      },
    });

    // Create order items
    await tx.orderItem.create({
      data: {
        id: createId(),
        orderId: order.id,
        subOrderId: bevSubOrder.id,
        vendorProductId: bevProduct.id,
        qty: 2,
        unitPriceCents: bevProduct.basePriceCents,
        lineTotalCents: bevProduct.basePriceCents * 2,
        productName: bevProduct.Product.name,
        vendorName: generalBev.name,
      },
    });

    await tx.orderItem.create({
      data: {
        id: createId(),
        orderId: order.id,
        subOrderId: fishSubOrder.id,
        vendorProductId: fishProduct.id,
        qty: 3,
        unitPriceCents: fishProduct.basePriceCents,
        lineTotalCents: fishProduct.basePriceCents * 3,
        productName: fishProduct.Product.name,
        vendorName: cdFish.name,
      },
    });

    return { order, bevSubOrder, fishSubOrder };
  });

  console.log("\n✅ Order created:", result.order.orderNumber);
  console.log("   Order ID:", result.order.id);
  console.log("   Order Status:", result.order.status);
  console.log("\n📦 SubOrders created:");
  console.log("   1. General Beverage:", result.bevSubOrder.subOrderNumber);
  console.log("      SubOrder ID:", result.bevSubOrder.id);
  console.log("      Status:", result.bevSubOrder.status);
  console.log("   2. CD Fish:", result.fishSubOrder.subOrderNumber);
  console.log("      SubOrder ID:", result.fishSubOrder.id);
  console.log("      Status:", result.fishSubOrder.status);
  console.log("\n🔗 To view as vendor:");
  console.log(
    "   General Beverage: http://localhost:3000/dashboard/orders/" +
      result.bevSubOrder.id
  );
  console.log(
    "   CD Fish: http://localhost:3000/dashboard/orders/" +
      result.fishSubOrder.id
  );
  console.log("\n✅ Both SubOrders are in SUBMITTED status");
  console.log("   You should see 'Confirm Order' and 'Cancel Order' buttons");
}

createTestOrder()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
