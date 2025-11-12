"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { getEffectivePriceCents } from "@/lib/pricing";
import { revalidatePath } from "next/cache";

/**
 * Get or create the active cart for the current user
 */
export async function getCart() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can have carts");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  // Find or create active cart
  let cart = await prisma.cart.findFirst({
    where: {
      clientId: user.clientId,
      status: "ACTIVE",
    },
    include: {
      items: {
        include: {
          vendorProduct: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  imageUrl: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        clientId: user.clientId,
        createdByUserId: user.id,
        status: "ACTIVE",
      },
      include: {
        items: {
          include: {
            vendorProduct: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    imageUrl: true,
                  },
                },
                vendor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

/**
 * Add an item to the cart or update quantity if it already exists
 */
export async function addToCart({
  vendorProductId,
  quantity = 1,
}: {
  vendorProductId: string;
  quantity?: number;
}) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can add to cart");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // Get effective price based on agreements
  const unitPriceCents = await getEffectivePriceCents({
    clientId: user.clientId,
    vendorProductId,
  });

  // Get or create cart
  const cart = await getCart();

  // Check if item already exists in cart
  const existingItem = cart.items.find(
    (item) => item.vendorProductId === vendorProductId
  );

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        qty: existingItem.qty + quantity,
        unitPriceCents, // Update price in case agreement changed
        updatedAt: new Date(),
      },
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        vendorProductId,
        qty: quantity,
        unitPriceCents,
      },
    });
  }

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return { success: true };
}

/**
 * Update the quantity of a cart item
 */
export async function updateCartItem({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can update cart");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // Verify the item belongs to the user's cart
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
    },
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  if (item.cart.clientId !== user.clientId) {
    throw new Error("Unauthorized to modify this cart item");
  }

  // Update quantity
  await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      qty: quantity,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return { success: true };
}

/**
 * Remove an item from the cart
 */
export async function removeCartItem({ itemId }: { itemId: string }) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can remove from cart");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  // Verify the item belongs to the user's cart
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
    },
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  if (item.cart.clientId !== user.clientId) {
    throw new Error("Unauthorized to modify this cart item");
  }

  // Delete item
  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return { success: true };
}

/**
 * Clear all items from the cart
 */
export async function clearCart() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can clear cart");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  // Get active cart
  const cart = await prisma.cart.findFirst({
    where: {
      clientId: user.clientId,
      status: "ACTIVE",
    },
  });

  if (!cart) {
    return { success: true }; // No cart to clear
  }

  // Delete all items
  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return { success: true };
}

/**
 * Get cart summary (item count and total)
 */
export async function getCartSummary() {
  const user = await currentUser();

  if (!user || user.role !== "CLIENT" || !user.clientId) {
    return {
      itemCount: 0,
      totalCents: 0,
    };
  }

  const cart = await prisma.cart.findFirst({
    where: {
      clientId: user.clientId,
      status: "ACTIVE",
    },
    include: {
      items: {
        select: {
          qty: true,
          unitPriceCents: true,
        },
      },
    },
  });

  if (!cart) {
    return {
      itemCount: 0,
      totalCents: 0,
    };
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.qty, 0);
  const totalCents = cart.items.reduce(
    (sum, item) => sum + item.qty * item.unitPriceCents,
    0
  );

  return {
    itemCount,
    totalCents,
  };
}
