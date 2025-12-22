"use server";

/**
 * Phase 9.1 - Order Status Mutation Actions (Admin/Agent)
 *
 * Server actions for admin/agent to update order status through the workflow.
 * Only accessible to ADMIN and AGENT roles.
 */

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

/**
 * Valid order status transitions
 * Each status can only transition to specific next statuses
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELED"],
  SUBMITTED: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["FULFILLING", "CANCELED"],
  FULFILLING: ["DELIVERED", "CANCELED"],
  DELIVERED: [],
  CANCELED: [],
};

/**
 * Update order status with validation
 *
 * @param orderId - The ID of the order to update
 * @param newStatus - The new status to transition to
 * @returns Success result or error
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Validate transition
    const allowedStatuses = VALID_TRANSITIONS[order.status];
    if (!allowedStatuses.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${order.status} to ${newStatus}`,
      };
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Log the status change
    await logAction({
      entityType: "Order",
      entityId: orderId,
      action: AuditAction.ORDER_STATUS_UPDATED,
      diff: { from: order.status, to: newStatus },
    });

    // Revalidate dashboard pages
    revalidatePath("/dashboard/orders");

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

/**
 * Cancel an order with optional reason
 *
 * @param orderId - The ID of the order to cancel
 * @param reason - Optional cancellation reason
 * @returns Success result or error
 */
export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if already canceled
    if (order.status === "CANCELED") {
      return { success: false, error: "Order is already canceled" };
    }

    // Check if delivered (cannot cancel delivered orders)
    if (order.status === "DELIVERED") {
      return { success: false, error: "Cannot cancel a delivered order" };
    }

    // Update order status to CANCELED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELED" },
    });

    // Log the cancellation with reason
    await logAction({
      entityType: "Order",
      entityId: orderId,
      action: AuditAction.ORDER_CANCELLED,
      diff: {
        from: order.status,
        to: "CANCELED",
        reason: reason || null,
      },
    });

    // Revalidate dashboard pages
    revalidatePath("/dashboard/orders");

    return { success: true };
  } catch (error) {
    console.error("Error canceling order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
}
