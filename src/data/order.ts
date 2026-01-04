"use server";

import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { recalcCartPricesForUser } from "@/data/cart-recalc";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createId } = require("@paralleldrive/cuid2");

/**
 * Calculate line total for an order item
 * Handles null prices by treating them as 0
 */
function calculateLineTotal(
  unitPriceCents: number | null,
  qty: number
): number {
  return (unitPriceCents ?? 0) * qty;
}

/**
 * Generate a unique order number in the format: HYD-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit number
 */
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = randomInt(1000, 10000); // 4-digit random number (1000-9999)

  return `HYD-${year}${month}${day}-${random}`;
}

/**
 * Create an order from the current user's cart
 *
 * This function:
 * 1. Ensures user is authenticated and has CLIENT role
 * 2. Recalculates cart prices based on current agreements
 * 3. Validates cart is not empty
 * 4. Creates Order and OrderItems in a single transaction
 * 5. Clears the cart
 *
 * @returns Object containing the created orderId
 * @throws Error if user is unauthorized, cart is empty, or order creation fails
 */
export async function createOrderFromCart(): Promise<{ orderId: string }> {
  // 1. Verify authentication and role
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can create orders");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  const clientId = user.clientId;
  const userId = user.id;

  // 2. Recalculate cart prices to ensure accuracy
  await recalcCartPricesForUser();

  // 3. Load cart with items (include vendorId for grouping)
  const cart = await prisma.cart.findFirst({
    where: {
      clientId,
      status: "ACTIVE",
    },
    include: {
      CartItem: {
        include: {
          VendorProduct: {
            include: {
              Product: {
                select: {
                  name: true,
                },
              },
              Vendor: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Validate cart exists and has items
  if (!cart || cart.CartItem.length === 0) {
    throw new Error("Cart is empty");
  }

  // 4. Calculate total
  const totalCents = cart.CartItem.reduce((sum, item) => {
    const priceCents = item.unitPriceCents ?? 0;
    if (priceCents === 0) {
      console.warn(
        `Cart item ${item.id} has null or zero price, treating as 0`
      );
    }
    return sum + calculateLineTotal(item.unitPriceCents, item.qty);
  }, 0);

  // Validate total is safe
  if (
    !Number.isFinite(totalCents) ||
    totalCents < 0 ||
    totalCents > Number.MAX_SAFE_INTEGER
  ) {
    throw new Error("Order total is invalid or exceeds safe limits");
  }

  // 5. Group cart items by vendor
  const itemsByVendor = new Map<string, typeof cart.CartItem>();
  for (const item of cart.CartItem) {
    const vendorId = item.VendorProduct.Vendor.id;
    if (!itemsByVendor.has(vendorId)) {
      itemsByVendor.set(vendorId, []);
    }
    itemsByVendor.get(vendorId)!.push(item);
  }

  // 6. Create order in a transaction (with SubOrders)
  const result = await prisma.$transaction(async (tx) => {
    // Generate unique order number (with retry logic for uniqueness)
    let orderNumber = "";
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      orderNumber = generateOrderNumber();

      // Check if order number already exists
      const existing = await tx.order.findFirst({
        where: { orderNumber },
        select: { id: true },
      });

      if (!existing) {
        break; // Unique number found
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique order number");
      }
    }

    // Create the Order
    const order = await tx.order.create({
      data: {
        id: createId(),
        clientId,
        submitterUserId: userId,
        orderNumber,
        status: "SUBMITTED",
        totalCents,
      },
    });

    // Create SubOrders (one per vendor)
    const subOrders: Array<{ id: string; vendorId: string }> = [];
    let vendorSeq = 1;

    for (const [vendorId, items] of itemsByVendor.entries()) {
      const subTotalCents = items.reduce(
        (sum, item) => sum + calculateLineTotal(item.unitPriceCents, item.qty),
        0
      );

      const subOrderNumber = `${orderNumber}-V${String(vendorSeq).padStart(
        2,
        "0"
      )}`;

      const subOrder = await tx.subOrder.create({
        data: {
          id: createId(),
          orderId: order.id,
          vendorId,
          status: "SUBMITTED",
          subOrderNumber,
          subTotalCents,
        },
      });

      subOrders.push({ id: subOrder.id, vendorId });
      vendorSeq++;
    }

    // Create OrderItems linked to SubOrders
    const orderItemsData = [];
    for (const subOrder of subOrders) {
      const items = itemsByVendor.get(subOrder.vendorId)!;
      for (const item of items) {
        orderItemsData.push({
          id: createId(),
          orderId: order.id,
          subOrderId: subOrder.id, // Link to SubOrder
          vendorProductId: item.vendorProductId,
          qty: item.qty,
          unitPriceCents: item.unitPriceCents ?? 0,
          lineTotalCents: calculateLineTotal(item.unitPriceCents, item.qty),
          productName: item.VendorProduct.Product.name,
          vendorName: item.VendorProduct.Vendor.name,
        });
      }
    }

    await tx.orderItem.createMany({
      data: orderItemsData,
    });

    // Clear the cart by deleting all cart items
    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return { orderId: order.id };
  });

  return result;
}
