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
 * Returns a list of line diffs showing which prices changed
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
  const diffs: PriceChangeDiff[] = [];

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Get active cart with all items
    const cart = await tx.cart.findFirst({
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
      return;
    }

    // Recalculate price for each item
    for (const item of cart.items) {
      const oldPriceCents = item.unitPriceCents;

      // Get current effective price based on agreements
      const newPriceCents = await getEffectivePriceCents({
        clientId,
        vendorProductId: item.vendorProductId,
      });

      // Track the diff
      diffs.push({
        itemId: item.id,
        oldPriceCents,
        newPriceCents,
      });

      // Update cart item with new price if it changed
      if (oldPriceCents !== newPriceCents) {
        await tx.cartItem.update({
          where: { id: item.id },
          data: {
            unitPriceCents: newPriceCents,
            updatedAt: new Date(),
          },
        });
      }
    }
  });

  // Revalidate cart page
  revalidatePath("/dashboard/cart");

  return diffs;
}
