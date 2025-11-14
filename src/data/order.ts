"use server";

import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { recalcCartPricesForUser } from "@/data/cart-recalc";

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

  // 3. Load cart with items
  const cart = await prisma.cart.findFirst({
    where: {
      clientId,
      status: "ACTIVE",
    },
    include: {
      items: {
        include: {
          vendorProduct: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
              vendor: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Validate cart exists and has items
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // 4. Calculate total
  const totalCents = cart.items.reduce((sum, item) => {
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

  // 5. Create order in a transaction
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
        clientId,
        submitterUserId: userId,
        orderNumber,
        status: "SUBMITTED",
        totalCents,
      },
    });

    // Create OrderItems
    const orderItemsData = cart.items.map((item) => ({
      orderId: order.id,
      vendorProductId: item.vendorProductId,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents ?? 0,
      lineTotalCents: calculateLineTotal(item.unitPriceCents, item.qty),
      productName: item.vendorProduct.product.name,
      vendorName: item.vendorProduct.vendor.name,
    }));

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
