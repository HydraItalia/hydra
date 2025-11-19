"use server";

import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createId } = require("@paralleldrive/cuid2");
import { currentUser } from "@/lib/auth";
import { getEffectivePriceCents } from "@/lib/pricing";
import { revalidatePath } from "next/cache";

// Maximum quantity per cart item to prevent abuse
const MAX_CART_ITEM_QUANTITY = 9999;

// Shared include configuration for cart queries with full item details
const CART_WITH_ITEMS_INCLUDE = {
  CartItem: {
    include: {
      VendorProduct: {
        include: {
          Product: {
            select: {
              id: true,
              name: true,
              unit: true,
              imageUrl: true,
            },
          },
          Vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} as const;

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
    include: CART_WITH_ITEMS_INCLUDE,
  });

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        id: createId(),
        clientId: user.clientId,
        createdByUserId: user.id,
        status: "ACTIVE",
      },
      include: CART_WITH_ITEMS_INCLUDE,
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

  if (quantity > MAX_CART_ITEM_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${MAX_CART_ITEM_QUANTITY}`);
  }

  // Store clientId as a const to ensure type narrowing
  const clientId = user.clientId;

  // Use a transaction to prevent race conditions with concurrent addToCart calls
  const cart = await prisma.$transaction(async (tx) => {
    // Validate that the vendor product exists and is active (inside transaction)
    const vendorProduct = await tx.vendorProduct.findUnique({
      where: { id: vendorProductId },
      select: {
        id: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!vendorProduct) {
      throw new Error("Product not found");
    }

    if (!vendorProduct.isActive || vendorProduct.deletedAt) {
      throw new Error("Product is not available");
    }

    // Get effective price based on agreements
    const unitPriceCents = await getEffectivePriceCents({
      clientId,
      vendorProductId,
    });

    // Get or create cart within transaction
    let cart = await tx.cart.findFirst({
      where: {
        clientId,
        status: "ACTIVE",
      },
      include: {
        CartItem: {
          where: {
            vendorProductId,
          },
        },
      },
    });

    if (!cart) {
      cart = await tx.cart.create({
        data: {
          id: createId(),
          clientId,
          createdByUserId: user.id,
          status: "ACTIVE",
        },
        include: {
          CartItem: {
            where: {
              vendorProductId,
            },
          },
        },
      });
    }

    const existingItem = cart.CartItem[0]; // Only one item due to where filter

    if (existingItem) {
      const newQuantity = existingItem.qty + quantity;

      if (newQuantity > MAX_CART_ITEM_QUANTITY) {
        throw new Error(
          `Total quantity cannot exceed ${MAX_CART_ITEM_QUANTITY}`
        );
      }

      // Update quantity and refresh price in case agreement changed
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          qty: newQuantity,
          unitPriceCents, // Update price to reflect current agreement
          updatedAt: new Date(),
        },
      });
    } else {
      // Add new item
      await tx.cartItem.create({
        data: {
          id: createId(),
          cartId: cart.id,
          vendorProductId,
          qty: quantity,
          unitPriceCents,
        },
      });
    }

    // Return cart with full item details from within transaction
    return tx.cart.findUnique({
      where: { id: cart.id },
      include: CART_WITH_ITEMS_INCLUDE,
    });
  });

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return cart!;
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

  if (quantity > MAX_CART_ITEM_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${MAX_CART_ITEM_QUANTITY}`);
  }

  // Store clientId as a const to ensure type narrowing
  const clientId = user.clientId;

  // Use a transaction to prevent race conditions
  const cart = await prisma.$transaction(async (tx) => {
    // Verify the item belongs to the user's cart
    const item = await tx.cartItem.findUnique({
      where: { id: itemId },
      include: {
        Cart: true,
      },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    if (item.Cart.clientId !== clientId) {
      throw new Error("Unauthorized to modify this cart item");
    }

    if (item.Cart.status !== "ACTIVE") {
      throw new Error("Cannot modify items in inactive cart");
    }

    // Verify vendor product is still active and available
    const vendorProduct = await tx.vendorProduct.findUnique({
      where: { id: item.vendorProductId },
      select: {
        isActive: true,
        deletedAt: true,
      },
    });

    if (!vendorProduct || !vendorProduct.isActive || vendorProduct.deletedAt) {
      throw new Error("Product is no longer available");
    }

    // Get updated price in case agreements have changed
    const unitPriceCents = await getEffectivePriceCents({
      clientId,
      vendorProductId: item.vendorProductId,
    });

    // Update quantity and price
    await tx.cartItem.update({
      where: { id: itemId },
      data: {
        qty: quantity,
        unitPriceCents, // Update price to reflect current agreement
        updatedAt: new Date(),
      },
    });

    // Return cart with full item details from within transaction
    return tx.cart.findUnique({
      where: { id: item.cartId },
      include: CART_WITH_ITEMS_INCLUDE,
    });
  });

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return cart!;
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

  // Use a transaction to ensure consistency
  const cart = await prisma.$transaction(async (tx) => {
    // Verify the item belongs to the user's cart
    const item = await tx.cartItem.findUnique({
      where: { id: itemId },
      include: {
        Cart: true,
      },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    if (item.Cart.clientId !== user.clientId) {
      throw new Error("Unauthorized to modify this cart item");
    }

    if (item.Cart.status !== "ACTIVE") {
      throw new Error("Cannot remove items from inactive cart");
    }

    // Delete item
    await tx.cartItem.delete({
      where: { id: itemId },
    });

    // Return cart with full item details from within transaction
    return tx.cart.findUnique({
      where: { id: item.cartId },
      include: CART_WITH_ITEMS_INCLUDE,
    });
  });

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return cart!;
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

  // Store clientId as a const to ensure type narrowing
  const clientId = user.clientId;

  // Use a transaction to ensure consistency
  const cart = await prisma.$transaction(async (tx) => {
    // Get active cart
    const cart = await tx.cart.findFirst({
      where: {
        clientId,
        status: "ACTIVE",
      },
    });

    if (cart) {
      // Delete all items
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      // Return cart with full item details from within transaction
      return tx.cart.findUnique({
        where: { id: cart.id },
        include: CART_WITH_ITEMS_INCLUDE,
      });
    }

    // If no cart exists, create one and return it
    return tx.cart.create({
      data: {
        id: createId(),
        clientId,
        createdByUserId: user.id,
        status: "ACTIVE",
      },
      include: CART_WITH_ITEMS_INCLUDE,
    });
  });

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/catalog");

  return cart!;
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
      CartItem: {
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

  const itemCount = cart.CartItem.reduce((sum, item) => sum + item.qty, 0);
  const totalCents = cart.CartItem.reduce(
    (sum, item) => sum + item.qty * item.unitPriceCents,
    0
  );

  if (!Number.isFinite(totalCents) || totalCents > Number.MAX_SAFE_INTEGER) {
    throw new Error("Cart total exceeds maximum safe value");
  }

  if (!Number.isFinite(itemCount) || itemCount > Number.MAX_SAFE_INTEGER) {
    throw new Error("Cart item count exceeds maximum safe value");
  }

  return {
    itemCount,
    totalCents,
  };
}
