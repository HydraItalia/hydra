"use server";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { SubOrderStatus, OrderStatus } from "@prisma/client";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Valid status transitions for SubOrders
 */
const VALID_TRANSITIONS: Record<SubOrderStatus, SubOrderStatus[]> = {
  PENDING: ["SUBMITTED", "CANCELED"],
  SUBMITTED: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["FULFILLING", "CANCELED"],
  FULFILLING: ["READY", "CANCELED"],
  READY: ["CANCELED"],
  CANCELED: [],
};

/**
 * Authenticate vendor user and return their vendorId
 * Reduces duplication across vendor-specific actions
 */
async function authenticateVendor(): Promise<
  { success: false; error: string } | { success: true; vendorId: string }
> {
  const user = await currentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (user.role !== "VENDOR") {
    return { success: false, error: "Unauthorized: Vendor access required" };
  }

  if (!user.vendorId) {
    return {
      success: false,
      error: "No vendor associated with this account",
    };
  }

  return { success: true, vendorId: user.vendorId };
}

/**
 * Update the status of a SubOrder
 *
 * This function:
 * 1. Verifies the vendor owns the SubOrder
 * 2. Validates the status transition
 * 3. Updates the SubOrder with timestamps
 * 4. Derives and updates the parent Order status
 *
 * @param subOrderId - The ID of the SubOrder to update
 * @param newStatus - The new status to set
 * @returns ActionResult with updated SubOrder data
 */
export async function updateSubOrderStatus(
  subOrderId: string,
  newStatus: SubOrderStatus
): Promise<ActionResult<{ id: string; status: SubOrderStatus }>> {
  try {
    // Authenticate vendor
    const auth = await authenticateVendor();
    if (!auth.success) {
      return auth;
    }

    // Verify vendor owns this SubOrder
    const subOrder = await prisma.subOrder.findFirst({
      where: { id: subOrderId, vendorId: auth.vendorId },
      select: {
        id: true,
        status: true,
        orderId: true,
      },
    });

    if (!subOrder) {
      return { success: false, error: "SubOrder not found" };
    }

    // Validate transition
    if (!VALID_TRANSITIONS[subOrder.status].includes(newStatus)) {
      return {
        success: false,
        error: `Invalid transition: ${subOrder.status} → ${newStatus}`,
      };
    }

    // Update SubOrder and parent Order in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedSubOrder = await tx.subOrder.update({
        where: { id: subOrderId },
        data: {
          status: newStatus,
          ...(newStatus === "CONFIRMED" && { confirmedAt: new Date() }),
          ...(newStatus === "READY" && { readyAt: new Date() }),
          ...(newStatus === "CANCELED" && { canceledAt: new Date() }),
        },
        select: {
          id: true,
          status: true,
        },
      });

      // Update parent Order status within same transaction
      await updateParentOrderStatusInTx(tx, subOrder.orderId);

      return updatedSubOrder;
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/vendor/orders");

    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateSubOrderStatus] Error:", {
      subOrderId,
      newStatus,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: "Failed to update SubOrder status",
    };
  }
}

/**
 * Derive parent Order status from SubOrder statuses (within transaction)
 *
 * Rules:
 * - All CANCELED → Order CANCELED
 * - All READY or CANCELED → Order CONFIRMED (ready for delivery)
 * - Any CONFIRMED/FULFILLING/READY → Order CONFIRMED
 * - Otherwise → Order SUBMITTED
 *
 * @param tx - Prisma transaction client
 * @param orderId - The ID of the Order to update
 */
async function updateParentOrderStatusInTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  orderId: string
): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { SubOrder: { select: { status: true } } },
  });

  if (!order || order.SubOrder.length === 0) {
    return;
  }

  const statuses = order.SubOrder.map((s) => s.status);

  let newOrderStatus: OrderStatus;

  if (statuses.every((s) => s === "CANCELED")) {
    newOrderStatus = "CANCELED";
  } else if (statuses.every((s) => s === "READY" || s === "CANCELED")) {
    newOrderStatus = "CONFIRMED"; // All ready → can assign deliveries
  } else if (
    statuses.some(
      (s) => s === "CONFIRMED" || s === "FULFILLING" || s === "READY"
    )
  ) {
    newOrderStatus = "CONFIRMED";
  } else {
    newOrderStatus = "SUBMITTED";
  }

  // Only update if status changed
  if (order.status !== newOrderStatus) {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newOrderStatus },
    });
  }
}

/**
 * Get a single SubOrder detail for the current vendor
 *
 * @param subOrderId - The ID of the SubOrder to fetch
 * @returns ActionResult with SubOrder details
 */
export async function getVendorSubOrder(subOrderId: string): Promise<
  ActionResult<{
    id: string;
    subOrderNumber: string;
    status: SubOrderStatus;
    subTotalCents: number;
    confirmedAt: Date | null;
    readyAt: Date | null;
    canceledAt: Date | null;
    vendorNotes: string | null;
    createdAt: Date;
    Order: {
      orderNumber: string;
      clientName: string;
      deliveryAddress: string | null;
    };
    OrderItem: Array<{
      productName: string;
      qty: number;
      unitPriceCents: number;
      lineTotalCents: number;
    }>;
  }>
> {
  try {
    // Authenticate vendor
    const auth = await authenticateVendor();
    if (!auth.success) {
      return auth;
    }

    const subOrder = await prisma.subOrder.findFirst({
      where: {
        id: subOrderId,
        vendorId: auth.vendorId,
      },
      select: {
        id: true,
        subOrderNumber: true,
        status: true,
        subTotalCents: true,
        confirmedAt: true,
        readyAt: true,
        canceledAt: true,
        vendorNotes: true,
        createdAt: true,
        Order: {
          select: {
            orderNumber: true,
            deliveryAddress: true,
            Client: {
              select: {
                name: true,
              },
            },
          },
        },
        OrderItem: {
          select: {
            productName: true,
            qty: true,
            unitPriceCents: true,
            lineTotalCents: true,
          },
        },
      },
    });

    if (!subOrder) {
      return { success: false, error: "SubOrder not found" };
    }

    const result = {
      ...subOrder,
      Order: {
        orderNumber: subOrder.Order.orderNumber,
        clientName: subOrder.Order.Client.name,
        deliveryAddress: subOrder.Order.deliveryAddress,
      },
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("[getVendorSubOrder] Error:", {
      subOrderId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: "Failed to fetch SubOrder",
    };
  }
}
