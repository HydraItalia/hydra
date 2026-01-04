"use server";

/**
 * Phase 6.3 - Vendor Order Management Server Actions
 * Updated for SubOrder support (Phase 12)
 *
 * Server actions for vendors to view and manage their SubOrders.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubOrderStatus, DeliveryStatus } from "@prisma/client";

// Type for SubOrder list items
export type VendorSubOrderListItem = {
  id: string;
  subOrderNumber: string;
  status: SubOrderStatus;
  subTotalCents: number;
  createdAt: Date;
  confirmedAt: Date | null;
  readyAt: Date | null;
  Order: {
    orderNumber: string;
    clientName: string;
  };
  itemCount: number;
  hasDelivery: boolean;
  deliveryStatus?: DeliveryStatus;
};

// Type for SubOrder detail view
export type VendorSubOrderDetail = {
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
    id: string;
    productName: string;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
  Delivery: {
    status: DeliveryStatus;
    driverName: string | null;
    assignedAt: Date;
  } | null;
};

// Result type for server actions
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all SubOrders for this vendor
 * Replaces the old getVendorOrders function
 */
export async function getVendorOrders(
  statusFilter?: SubOrderStatus
): Promise<ActionResult<VendorSubOrderListItem[]>> {
  try {
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

    // Query SubOrders directly
    const subOrders = await prisma.subOrder.findMany({
      where: {
        vendorId: user.vendorId,
        ...(statusFilter && { status: statusFilter }),
      },
      include: {
        Order: {
          include: {
            Client: {
              select: { name: true },
            },
          },
        },
        Delivery: {
          include: {
            Driver: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            OrderItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to VendorSubOrderListItem
    const result: VendorSubOrderListItem[] = subOrders.map((subOrder) => ({
      id: subOrder.id,
      subOrderNumber: subOrder.subOrderNumber,
      status: subOrder.status,
      subTotalCents: subOrder.subTotalCents,
      createdAt: subOrder.createdAt,
      confirmedAt: subOrder.confirmedAt,
      readyAt: subOrder.readyAt,
      Order: {
        orderNumber: subOrder.Order.orderNumber,
        clientName: subOrder.Order.Client.name,
      },
      itemCount: subOrder._count.OrderItem,
      hasDelivery: !!subOrder.Delivery,
      deliveryStatus: subOrder.Delivery?.status,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching vendor SubOrders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
    };
  }
}

/**
 * Get detailed SubOrder information
 * Updated to work with SubOrders
 */
export async function getVendorOrderDetail(
  subOrderId: string
): Promise<ActionResult<VendorSubOrderDetail>> {
  try {
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

    // Fetch SubOrder for this vendor
    const subOrder = await prisma.subOrder.findFirst({
      where: {
        id: subOrderId,
        vendorId: user.vendorId,
      },
      include: {
        Order: {
          include: {
            Client: {
              select: { name: true },
            },
          },
        },
        OrderItem: {
          select: {
            id: true,
            productName: true,
            qty: true,
            unitPriceCents: true,
            lineTotalCents: true,
          },
        },
        Delivery: {
          include: {
            Driver: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!subOrder) {
      return { success: false, error: "SubOrder not found or unauthorized" };
    }

    // Transform to VendorSubOrderDetail
    const result: VendorSubOrderDetail = {
      id: subOrder.id,
      subOrderNumber: subOrder.subOrderNumber,
      status: subOrder.status,
      subTotalCents: subOrder.subTotalCents,
      confirmedAt: subOrder.confirmedAt,
      readyAt: subOrder.readyAt,
      canceledAt: subOrder.canceledAt,
      vendorNotes: subOrder.vendorNotes,
      createdAt: subOrder.createdAt,
      Order: {
        orderNumber: subOrder.Order.orderNumber,
        clientName: subOrder.Order.Client.name,
        deliveryAddress: subOrder.Order.deliveryAddress,
      },
      OrderItem: subOrder.OrderItem,
      Delivery: subOrder.Delivery
        ? {
            status: subOrder.Delivery.status,
            driverName: subOrder.Delivery.Driver?.name || null,
            assignedAt: subOrder.Delivery.assignedAt,
          }
        : null,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching vendor SubOrder detail:", error);
    return {
      success: false,
      error: "Failed to fetch order details",
    };
  }
}

/**
 * @deprecated Use updateSubOrderStatus from vendor-suborders.ts instead
 * This function is kept for backward compatibility but should not be used for new SubOrders
 */
export async function updateVendorOrderStatus(
  _orderId: string,
  _newStatus: SubOrderStatus
): Promise<ActionResult<{ message: string }>> {
  return {
    success: false,
    error:
      "This function is deprecated. Use updateSubOrderStatus from vendor-suborders.ts instead",
  };
}

/**
 * Get SubOrder statistics for vendor dashboard
 * Updated to count SubOrders instead of Orders
 */
export async function getVendorOrderStats(): Promise<
  ActionResult<{
    totalOrders: number;
    pendingOrders: number;
    submittedOrders: number;
    confirmedOrders: number;
    fulfillingOrders: number;
    readyOrders: number;
  }>
> {
  try {
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

    const baseWhere = {
      vendorId: user.vendorId,
    };

    const [
      totalOrders,
      pendingOrders,
      submittedOrders,
      confirmedOrders,
      fulfillingOrders,
      readyOrders,
    ] = await Promise.all([
      prisma.subOrder.count({ where: baseWhere }),
      prisma.subOrder.count({ where: { ...baseWhere, status: "PENDING" } }),
      prisma.subOrder.count({ where: { ...baseWhere, status: "SUBMITTED" } }),
      prisma.subOrder.count({ where: { ...baseWhere, status: "CONFIRMED" } }),
      prisma.subOrder.count({ where: { ...baseWhere, status: "FULFILLING" } }),
      prisma.subOrder.count({ where: { ...baseWhere, status: "READY" } }),
    ]);

    return {
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        submittedOrders,
        confirmedOrders,
        fulfillingOrders,
        readyOrders,
      },
    };
  } catch (error) {
    console.error("Error fetching vendor SubOrder stats:", error);
    return {
      success: false,
      error: "Failed to fetch order statistics",
    };
  }
}
