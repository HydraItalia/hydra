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

    // Validate driver is available for assignment
    if (driver.status === "BUSY") {
      return {
        success: false,
        error: "Driver is currently busy and cannot be assigned to this order",
      };
    }

    if (driver.status === "OFFLINE") {
      return {
        success: false,
        error: "Driver is offline and cannot be assigned to this order",
      };
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

/**
 * Unassign driver from order (delete delivery record)
 *
 * @param orderId - The ID of the order
 * @returns Success result or error
 */
export async function unassignDriverFromOrder(
  orderId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Find the order's delivery
    const delivery = await prisma.delivery.findFirst({
      where: { orderId },
      select: {
        id: true,
        status: true,
        Driver: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!delivery) {
      return { success: false, error: "No delivery found for this order" };
    }

    // Don't allow unassigning if delivery is in progress
    if (delivery.status === "PICKED_UP" || delivery.status === "IN_TRANSIT") {
      return {
        success: false,
        error: "Cannot unassign driver when delivery is in progress",
      };
    }

    if (delivery.status === "DELIVERED") {
      return {
        success: false,
        error: "Cannot unassign driver from completed delivery",
      };
    }

    // Delete the delivery
    await prisma.delivery.delete({
      where: { id: delivery.id },
    });

    // Log the unassignment
    await logAction({
      entityType: "Delivery",
      entityId: delivery.id,
      action: AuditAction.DELIVERY_DELETED,
      diff: {
        orderId,
        driverName: delivery.Driver.name,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/deliveries");

    return { success: true };
  } catch (error) {
    console.error("Error unassigning driver from order:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unassign driver",
    };
  }
}

/**
 * Reassign order to a different driver
 *
 * @param orderId - The ID of the order
 * @param newDriverId - The ID of the new driver
 * @returns Success result or error
 */
export async function reassignDriverToOrder(
  orderId: string,
  newDriverId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Find the order's delivery
    const delivery = await prisma.delivery.findFirst({
      where: { orderId },
      select: {
        id: true,
        status: true,
        driverId: true,
        Driver: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!delivery) {
      return { success: false, error: "No delivery found for this order" };
    }

    // Don't allow reassigning if delivery is in progress or completed
    if (
      delivery.status === "PICKED_UP" ||
      delivery.status === "IN_TRANSIT" ||
      delivery.status === "DELIVERED"
    ) {
      return {
        success: false,
        error: `Cannot reassign driver when delivery status is ${delivery.status}`,
      };
    }

    // Check if it's the same driver
    if (delivery.driverId === newDriverId) {
      return {
        success: false,
        error: "Order is already assigned to this driver",
      };
    }

    // Validate new driver exists
    const newDriver = await prisma.driver.findUnique({
      where: { id: newDriverId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!newDriver) {
      return { success: false, error: "Driver not found" };
    }

    // Validate new driver is available for assignment
    if (newDriver.status === "BUSY") {
      return {
        success: false,
        error: "Driver is currently busy and cannot be assigned to this order",
      };
    }

    if (newDriver.status === "OFFLINE") {
      return {
        success: false,
        error: "Driver is offline and cannot be assigned to this order",
      };
    }

    // Update the delivery
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        driverId: newDriverId,
        assignedAt: new Date(), // Update assignment time
      },
    });

    // Log the reassignment
    await logAction({
      entityType: "Delivery",
      entityId: delivery.id,
      action: AuditAction.DELIVERY_DRIVER_CHANGED,
      diff: {
        orderId,
        fromDriver: delivery.Driver.name,
        toDriver: newDriver.name,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/deliveries");

    return { success: true };
  } catch (error) {
    console.error("Error reassigning driver:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reassign driver",
    };
  }
}
