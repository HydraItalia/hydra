"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { DeliveryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";

/**
 * Helper function to verify driver authentication and authorization
 * @returns Object containing authenticated user and their driverId
 * @throws Error if user is not authenticated, not a DRIVER, or missing driverId
 */
async function requireDriverAuth() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can access this resource");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  return { user, driverId: user.driverId };
}

/**
 * Fetch deliveries assigned to the current driver
 * Includes order details, client info, and order items
 */
export async function getMyDeliveries(params?: {
  page?: number;
  pageSize?: number;
  status?: DeliveryStatus;
}) {
  const { driverId } = await requireDriverAuth();

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const status = params?.status;

  // Validate pagination parameters
  if (page < 1) {
    throw new Error("Page must be at least 1");
  }

  if (pageSize < 1 || pageSize > 100) {
    throw new Error("Page size must be between 1 and 100");
  }

  const where = {
    driverId,
    ...(status && { status }),
  };

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        Order: {
          include: {
            Client: true,
            OrderItem: {
              include: {
                VendorProduct: {
                  include: {
                    Product: true,
                    Vendor: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { assignedAt: "asc" }, // Oldest first (priority)
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.delivery.count({ where }),
  ]);

  return {
    data: deliveries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a specific delivery by ID
 * Validates that the delivery belongs to the current driver
 */
export async function getDeliveryById(deliveryId: string) {
  const { driverId } = await requireDriverAuth();

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId, // Ensure driver can only see their own
    },
    include: {
      Order: {
        include: {
          Client: true,
          OrderItem: {
            include: {
              VendorProduct: {
                include: {
                  Product: true,
                  Vendor: true,
                },
              },
            },
          },
        },
      },
      Driver: true,
    },
  });

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  return delivery;
}

/**
 * Update delivery status to PICKED_UP
 */
export async function markAsPickedUp(deliveryId: string) {
  const { driverId } = await requireDriverAuth();

  // Atomic update with status verification to prevent race conditions
  try {
    const updated = await prisma.delivery.update({
      where: {
        id: deliveryId,
        driverId,
        status: "ASSIGNED",
      },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
      },
      include: {
        Order: true,
      },
    });

    revalidatePath("/dashboard/deliveries");
    revalidatePath(`/dashboard/deliveries/${deliveryId}`);

    return updated;
  } catch (error) {
    // Prisma throws P2025 error if no record found matching the where clause
    throw new Error("Delivery not found or status transition not allowed");
  }
}

/**
 * Update delivery status to IN_TRANSIT
 */
export async function markAsInTransit(deliveryId: string) {
  const { driverId } = await requireDriverAuth();

  // Atomic update with status verification to prevent race conditions
  try {
    const updated = await prisma.delivery.update({
      where: {
        id: deliveryId,
        driverId,
        status: "PICKED_UP",
      },
      data: {
        status: "IN_TRANSIT",
        inTransitAt: new Date(),
      },
      include: {
        Order: true,
      },
    });

    revalidatePath("/dashboard/deliveries");
    revalidatePath(`/dashboard/deliveries/${deliveryId}`);

    return updated;
  } catch (error) {
    throw new Error("Delivery not found or status transition not allowed");
  }
}

/**
 * Update delivery status to DELIVERED
 */
export async function markAsDelivered(deliveryId: string, notes?: string) {
  const { driverId } = await requireDriverAuth();

  // Use transaction to ensure atomic updates of both delivery and order
  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Atomic update with status verification to prevent race conditions
      const delivery = await tx.delivery.update({
        where: {
          id: deliveryId,
          driverId,
          status: "IN_TRANSIT",
        },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          notes,
        },
        include: {
          Order: true,
        },
      });

      // Also update the order status to DELIVERED
      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          status: "DELIVERED",
        },
      });

      return delivery;
    });

    revalidatePath("/dashboard/deliveries");
    revalidatePath(`/dashboard/deliveries/${deliveryId}`);

    return updated;
  } catch (error) {
    throw new Error("Delivery not found or status transition not allowed");
  }
}

/**
 * Update delivery status to EXCEPTION
 */
export async function markAsException(
  deliveryId: string,
  exceptionReason: string
) {
  const { driverId } = await requireDriverAuth();

  if (!exceptionReason || exceptionReason.trim().length === 0) {
    throw new Error("Exception reason is required");
  }

  // Atomic update with status verification to prevent race conditions
  // Can mark as exception from any status except DELIVERED or EXCEPTION
  try {
    const updated = await prisma.delivery.update({
      where: {
        id: deliveryId,
        driverId,
        status: {
          notIn: ["DELIVERED", "EXCEPTION"],
        },
      },
      data: {
        status: "EXCEPTION",
        exceptionAt: new Date(),
        exceptionReason,
      },
      include: {
        Order: true,
      },
    });

    revalidatePath("/dashboard/deliveries");
    revalidatePath(`/dashboard/deliveries/${deliveryId}`);

    return updated;
  } catch (error) {
    throw new Error(
      "Delivery not found or cannot mark as exception (already delivered or exception)"
    );
  }
}

/**
 * Get delivery statistics for the current driver
 */
export async function getDeliveryStats() {
  const { driverId } = await requireDriverAuth();

  const [assigned, pickedUp, inTransit, delivered, exception, totalToday] =
    await Promise.all([
      prisma.delivery.count({
        where: { driverId, status: "ASSIGNED" },
      }),
      prisma.delivery.count({
        where: { driverId, status: "PICKED_UP" },
      }),
      prisma.delivery.count({
        where: { driverId, status: "IN_TRANSIT" },
      }),
      prisma.delivery.count({
        where: { driverId, status: "DELIVERED" },
      }),
      prisma.delivery.count({
        where: { driverId, status: "EXCEPTION" },
      }),
      prisma.delivery.count({
        where: {
          driverId,
          assignedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
          },
        },
      }),
    ]);

  return {
    assigned,
    pickedUp,
    inTransit,
    delivered,
    exception,
    totalToday,
    activeDeliveries: assigned + pickedUp + inTransit,
  };
}

/**
 * Helper function to verify admin/agent authentication
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
async function requireAdminOrAgent() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    throw new Error("Only ADMIN and AGENT users can access this resource");
  }

  return user;
}

/**
 * Admin delivery filters
 */
export type AdminDeliveryFilters = {
  status?: DeliveryStatus;
  driverId?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Admin delivery result type
 */
export type AdminDeliveryResult = {
  id: string;
  orderNumber: string;
  clientName: string;
  driverName: string;
  status: DeliveryStatus;
  assignedAt: string;
  orderId: string;
};

/**
 * Fetch all deliveries for ADMIN/AGENT users with filters
 */
export async function fetchAllDeliveriesForAdmin(
  filters: AdminDeliveryFilters = {}
): Promise<{
  data: AdminDeliveryResult[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}> {
  // Authorization check
  await requireAdminOrAgent();

  // Parse and validate params
  const page = Math.max(filters.page || 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize || 20, 10), 100);
  const offset = (page - 1) * pageSize;

  // Build where clause
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.driverId) {
    where.driverId = filters.driverId;
  }

  // Fetch deliveries and count in parallel
  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        Order: {
          select: {
            orderNumber: true,
            Client: {
              select: {
                name: true,
              },
            },
          },
        },
        Driver: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
      skip: offset,
      take: pageSize,
    }),
    prisma.delivery.count({ where }),
  ]);

  // Map to result format
  const data: AdminDeliveryResult[] = deliveries.map((delivery) => ({
    id: delivery.id,
    orderNumber: delivery.Order.orderNumber,
    clientName: delivery.Order.Client.name,
    driverName: delivery.Driver.name,
    status: delivery.status,
    assignedAt: delivery.assignedAt.toISOString(),
    orderId: delivery.orderId,
  }));

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    total,
    currentPage: page,
    totalPages,
    pageSize,
  };
}

/**
 * Get delivery statistics for ADMIN/AGENT users
 */
export async function getDeliveryStatsForAdmin(): Promise<{
  assigned: number;
  pickedUp: number;
  inTransit: number;
  deliveredToday: number;
  exception: number;
}> {
  // Authorization check
  await requireAdminOrAgent();

  const startOfToday = startOfDay(new Date());

  const [assigned, pickedUp, inTransit, deliveredToday, exception] =
    await Promise.all([
      prisma.delivery.count({
        where: { status: "ASSIGNED" },
      }),
      prisma.delivery.count({
        where: { status: "PICKED_UP" },
      }),
      prisma.delivery.count({
        where: { status: "IN_TRANSIT" },
      }),
      prisma.delivery.count({
        where: {
          status: "DELIVERED",
          deliveredAt: { gte: startOfToday },
        },
      }),
      prisma.delivery.count({
        where: { status: "EXCEPTION" },
      }),
    ]);

  return {
    assigned,
    pickedUp,
    inTransit,
    deliveredToday,
    exception,
  };
}
