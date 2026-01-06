"use server";

/**
 * Phase 9.3.1 - Delivery Assignment Actions (Admin/Agent)
 * Updated for SubOrder support (Phase 12)
 *
 * Server actions for admin/agent to create deliveries and assign drivers.
 * Deliveries are now assigned to SubOrders (vendor-specific) instead of Orders.
 * Only accessible to ADMIN and AGENT roles.
 */

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

/**
 * Type guard to validate SubOrder exists on a delivery
 * Provides type narrowing for TypeScript
 */
function validateSubOrderExists<T extends { SubOrder: unknown }>(
  delivery: T
): delivery is T & { SubOrder: NonNullable<T["SubOrder"]> } {
  return delivery.SubOrder !== null && delivery.SubOrder !== undefined;
}

/**
 * Create delivery for a SubOrder and assign to a driver
 * UPDATED: Now works with SubOrders instead of Orders
 *
 * @param subOrderId - The ID of the SubOrder
 * @param driverId - The ID of the driver to assign
 * @param routeSequence - Optional sequence number for driver's route
 * @returns Success result with delivery ID or error
 */
export async function createDeliveryForSubOrder(
  subOrderId: string,
  driverId: string,
  routeSequence?: number
): Promise<
  { success: true; deliveryId: string } | { success: false; error: string }
> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate SubOrder exists and is ready for delivery
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: {
        Delivery: {
          select: { id: true },
        },
        Order: {
          select: {
            id: true,
            deliveryAddress: true,
            deliveryLat: true,
            deliveryLng: true,
          },
        },
        Vendor: {
          select: { name: true },
        },
      },
    });

    if (!subOrder) {
      return { success: false, error: "SubOrder not found" };
    }

    if (subOrder.status !== "READY") {
      return {
        success: false,
        error: "SubOrder must be READY to assign delivery",
      };
    }

    if (subOrder.Delivery) {
      return {
        success: false,
        error: "SubOrder already has a delivery assigned",
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
        error: "Driver is currently busy and cannot be assigned",
      };
    }

    if (driver.status === "OFFLINE") {
      return {
        success: false,
        error: "Driver is offline and cannot be assigned",
      };
    }

    // Create delivery linked to SubOrder
    const delivery = await prisma.delivery.create({
      data: {
        id: createId(),
        subOrderId: subOrder.id,
        driverId,
        status: "ASSIGNED",
        routeSequence: routeSequence ?? null,
        assignedAt: new Date(),
      },
    });

    // Log the delivery creation
    await logAction({
      entityType: "Delivery",
      entityId: delivery.id,
      action: AuditAction.DELIVERY_CREATED,
      diff: {
        subOrderId: subOrder.id,
        subOrderNumber: subOrder.subOrderNumber,
        orderId: subOrder.Order.id,
        vendorName: subOrder.Vendor.name,
        driverId,
        driverName: driver.name,
        routeSequence,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${subOrder.Order.id}`);
    revalidatePath("/dashboard/deliveries");

    return { success: true, deliveryId: delivery.id };
  } catch (error) {
    console.error("Error creating delivery for SubOrder:", error);
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

/**
 * Reassign SubOrder to a different driver
 * UPDATED: SubOrder-specific version
 *
 * @param subOrderId - The ID of the SubOrder
 * @param newDriverId - The ID of the new driver
 * @returns Success result or error
 */
export async function reassignDriverToSubOrder(
  subOrderId: string,
  newDriverId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Find the SubOrder's delivery
    const delivery = await prisma.delivery.findFirst({
      where: { subOrderId },
      select: {
        id: true,
        status: true,
        driverId: true,
        Driver: {
          select: {
            name: true,
          },
        },
        SubOrder: {
          select: {
            id: true,
            subOrderNumber: true,
            orderId: true,
            Vendor: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!delivery) {
      return { success: false, error: "No delivery found for this SubOrder" };
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
        error: "SubOrder is already assigned to this driver",
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
        error: "Driver is currently busy and cannot be assigned",
      };
    }

    if (newDriver.status === "OFFLINE") {
      return {
        success: false,
        error: "Driver is offline and cannot be assigned",
      };
    }

    // Verify SubOrder data exists
    if (!validateSubOrderExists(delivery)) {
      return {
        success: false,
        error: "SubOrder data not found for delivery",
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
        subOrderId: delivery.SubOrder.id,
        subOrderNumber: delivery.SubOrder.subOrderNumber,
        orderId: delivery.SubOrder.orderId,
        vendorName: delivery.SubOrder.Vendor.name,
        fromDriver: delivery.Driver.name,
        toDriver: newDriver.name,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${delivery.SubOrder.orderId}`);
    revalidatePath("/dashboard/deliveries");

    return { success: true };
  } catch (error) {
    console.error("Error reassigning driver to SubOrder:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reassign driver",
    };
  }
}

/**
 * Unassign driver from SubOrder (delete delivery record)
 * UPDATED: SubOrder-specific version
 *
 * @param subOrderId - The ID of the SubOrder
 * @returns Success result or error
 */
export async function unassignDriverFromSubOrder(
  subOrderId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Find the SubOrder's delivery
    const delivery = await prisma.delivery.findFirst({
      where: { subOrderId },
      select: {
        id: true,
        status: true,
        Driver: {
          select: {
            name: true,
          },
        },
        SubOrder: {
          select: {
            id: true,
            subOrderNumber: true,
            orderId: true,
            Vendor: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!delivery) {
      return { success: false, error: "No delivery found for this SubOrder" };
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

    // Verify SubOrder data exists
    if (!validateSubOrderExists(delivery)) {
      return {
        success: false,
        error: "SubOrder data not found for delivery",
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
        subOrderId: delivery.SubOrder.id,
        subOrderNumber: delivery.SubOrder.subOrderNumber,
        orderId: delivery.SubOrder.orderId,
        vendorName: delivery.SubOrder.Vendor.name,
        driverName: delivery.Driver.name,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${delivery.SubOrder.orderId}`);
    revalidatePath("/dashboard/deliveries");

    return { success: true };
  } catch (error) {
    console.error("Error unassigning driver from SubOrder:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unassign driver",
    };
  }
}
