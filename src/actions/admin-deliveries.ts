"use server";

/**
 * Phase 9.3.1 - Delivery Assignment Actions (Admin/Agent)
 *
 * Server actions for admin/agent to create deliveries and assign drivers.
 * Only accessible to ADMIN and AGENT roles.
 */

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

/**
 * Create delivery for an order and assign to a driver
 *
 * @param orderId - The ID of the order
 * @param driverId - The ID of the driver to assign
 * @param routeSequence - Optional sequence number for driver's route
 * @returns Success result with delivery ID or error
 */
export async function createDeliveryForOrder(
  orderId: string,
  driverId: string,
  routeSequence?: number
): Promise<
  { success: true; deliveryId: string } | { success: false; error: string }
> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate order exists and is ready for delivery
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        Delivery: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "CONFIRMED") {
      return {
        success: false,
        error: "Order must be CONFIRMED to assign delivery",
      };
    }

    if (order.Delivery) {
      return {
        success: false,
        error: "Order already has a delivery assigned",
      };
    }

    // Validate driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    // Create delivery
    const delivery = await prisma.delivery.create({
      data: {
        id: createId(),
        orderId,
        driverId,
        status: "ASSIGNED",
        routeSequence: routeSequence || null,
        assignedAt: new Date(),
      },
    });

    // Log the delivery creation
    await logAction({
      entityType: "Delivery",
      entityId: delivery.id,
      action: AuditAction.DELIVERY_CREATED,
      diff: {
        orderId,
        driverId,
        driverName: driver.name,
        routeSequence,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/deliveries");

    return { success: true, deliveryId: delivery.id };
  } catch (error) {
    console.error("Error creating delivery for order:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create delivery",
    };
  }
}
