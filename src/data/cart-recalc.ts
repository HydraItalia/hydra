"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { getEffectivePriceCents } from "@/lib/pricing";
import { revalidatePath } from "next/cache";

export type PriceChangeDiff = {
  itemId: string;
  oldPriceCents: number;
  newPriceCents: number;
};

/**
 * Recalculate all cart item prices based on current agreements
 * Returns a list of line diffs for all cart items (both changed and unchanged)
 * showing old and new prices for comparison
 */
export async function recalcCartPricesForUser(): Promise<PriceChangeDiff[]> {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can recalculate cart prices");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  const clientId = user.clientId;

  // Fetch cart and items first (outside transaction)
  const cart = await prisma.cart.findFirst({
    where: {
      clientId,
      status: "ACTIVE",
    },
    include: {
      items: {
        select: {
          id: true,
          vendorProductId: true,
          unitPriceCents: true,
        },
      },
    },
  });

  // No cart or empty cart = nothing to recalculate
  if (!cart || cart.items.length === 0) {
    return [];
  }

  // Fetch all prices outside transaction to avoid long-running transactions
  const priceUpdates = await Promise.all(
    cart.items.map(async (item) => {
      const newPriceCents = await getEffectivePriceCents({
        clientId,
        vendorProductId: item.vendorProductId,
      });

      return {
        itemId: item.id,
        oldPriceCents: item.unitPriceCents,
        newPriceCents,
      };
    })
  );

  // Apply updates in a single transaction
  await prisma.$transaction(async (tx) => {
    for (const update of priceUpdates) {
      if (update.oldPriceCents !== update.newPriceCents) {
        await tx.cartItem.update({
          where: { id: update.itemId },
          data: {
            unitPriceCents: update.newPriceCents,
            updatedAt: new Date(),
          },
        });
      }
    }
  });

  // Revalidate cart page
  revalidatePath("/dashboard/cart");

  return priceUpdates;
}
