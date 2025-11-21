"use server";

/**
 * Phase 6.3 - Vendor Order Management Server Actions
 *
 * Server actions for vendors to view and manage orders containing their products.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  Order,
  OrderItem,
  Client,
  VendorProduct,
  Product,
  OrderStatus,
} from "@prisma/client";

// Extended types with relations
export type VendorOrderListItem = Order & {
  Client: Client;
  OrderItem: (OrderItem & {
    VendorProduct: VendorProduct;
  })[];
  _count: {
    OrderItem: number;
  };
};

export type VendorOrderDetail = Order & {
  Client: Client;
  OrderItem: (OrderItem & {
    VendorProduct: VendorProduct & {
      Product: Product;
    };
  })[];
};

// Result type for server actions
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all orders containing products from this vendor
 */
export async function getVendorOrders(
  statusFilter?: OrderStatus
): Promise<ActionResult<VendorOrderListItem[]>> {
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

    // Build where conditions
    const whereConditions: {
      OrderItem: {
        some: {
          VendorProduct: {
            vendorId: string;
          };
        };
      };
      status?: OrderStatus;
      deletedAt: null;
    } = {
      OrderItem: {
        some: {
          VendorProduct: {
            vendorId: user.vendorId,
          },
        },
      },
      deletedAt: null,
    };

    if (statusFilter) {
      whereConditions.status = statusFilter;
    }

    const orders = await prisma.order.findMany({
      where: whereConditions,
      include: {
        Client: true,
        OrderItem: {
          where: {
            VendorProduct: {
              vendorId: user.vendorId,
            },
          },
          include: {
            VendorProduct: true,
          },
        },
        _count: {
          select: {
            OrderItem: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: orders };
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
    };
  }
}

/**
 * Get detailed order information for a specific order
 * Only returns order if it contains this vendor's products
 */
export async function getVendorOrderDetail(
  orderId: string
): Promise<ActionResult<VendorOrderDetail>> {
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

    // Fetch order with vendor product filter
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        deletedAt: null,
        OrderItem: {
          some: {
            VendorProduct: {
              vendorId: user.vendorId,
            },
          },
        },
      },
      include: {
        Client: true,
        OrderItem: {
          where: {
            VendorProduct: {
              vendorId: user.vendorId,
            },
          },
          include: {
            VendorProduct: {
              include: {
                Product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found or unauthorized" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error fetching vendor order detail:", error);
    return {
      success: false,
      error: "Failed to fetch order details",
    };
  }
}

/**
 * Update order status
 * Note: This is a simplified version. In a real system, you might have
 * vendor-specific status fields or more complex state transitions.
 */
export async function updateVendorOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResult<Order>> {
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

    // Verify vendor has products in this order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        deletedAt: null,
        OrderItem: {
          some: {
            VendorProduct: {
              vendorId: user.vendorId,
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found or unauthorized" };
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      DRAFT: ["SUBMITTED", "CANCELED"],
      SUBMITTED: ["CONFIRMED", "CANCELED"],
      CONFIRMED: ["FULFILLING", "CANCELED"],
      FULFILLING: ["DELIVERED", "CANCELED"],
      DELIVERED: [],
      CANCELED: [],
    };

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${order.status} to ${newStatus}`,
      };
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);

    return { success: true, data: updatedOrder };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: "Failed to update order status",
    };
  }
}

/**
 * Get order statistics for vendor dashboard
 */
export async function getVendorOrderStats(): Promise<
  ActionResult<{
    totalOrders: number;
    submittedOrders: number;
    confirmedOrders: number;
    fulfillingOrders: number;
    deliveredOrders: number;
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
      deletedAt: null,
      OrderItem: {
        some: {
          VendorProduct: {
            vendorId: user.vendorId,
          },
        },
      },
    };

    const [
      totalOrders,
      submittedOrders,
      confirmedOrders,
      fulfillingOrders,
      deliveredOrders,
    ] = await Promise.all([
      prisma.order.count({ where: baseWhere }),
      prisma.order.count({ where: { ...baseWhere, status: "SUBMITTED" } }),
      prisma.order.count({ where: { ...baseWhere, status: "CONFIRMED" } }),
      prisma.order.count({ where: { ...baseWhere, status: "FULFILLING" } }),
      prisma.order.count({ where: { ...baseWhere, status: "DELIVERED" } }),
    ]);

    return {
      success: true,
      data: {
        totalOrders,
        submittedOrders,
        confirmedOrders,
        fulfillingOrders,
        deliveredOrders,
      },
    };
  } catch (error) {
    console.error("Error fetching vendor order stats:", error);
    return {
      success: false,
      error: "Failed to fetch order statistics",
    };
  }
}
