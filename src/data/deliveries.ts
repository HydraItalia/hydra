"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { DeliveryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Fetch deliveries assigned to the current driver
 * Includes order details, client info, and order items
 */
export async function getMyDeliveries(params?: {
  page?: number;
  pageSize?: number;
  status?: DeliveryStatus;
}) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can access deliveries");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const status = params?.status;

  const where = {
    driverId: user.driverId,
    ...(status && { status }),
  };

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            client: true,
            items: {
              include: {
                vendorProduct: {
                  include: {
                    product: true,
                    vendor: true,
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
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can access deliveries");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: user.driverId, // Ensure driver can only see their own
    },
    include: {
      order: {
        include: {
          client: true,
          items: {
            include: {
              vendorProduct: {
                include: {
                  product: true,
                  vendor: true,
                },
              },
            },
          },
        },
      },
      driver: true,
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
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can update deliveries");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  // Verify ownership
  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: user.driverId,
    },
  });

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  if (delivery.status !== "ASSIGNED") {
    throw new Error(
      `Cannot mark as picked up. Current status: ${delivery.status}`
    );
  }

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: "PICKED_UP",
      pickedUpAt: new Date(),
    },
    include: {
      order: true,
    },
  });

  revalidatePath("/dashboard/deliveries");
  revalidatePath(`/dashboard/deliveries/${deliveryId}`);

  return updated;
}

/**
 * Update delivery status to IN_TRANSIT
 */
export async function markAsInTransit(deliveryId: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can update deliveries");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  // Verify ownership
  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: user.driverId,
    },
  });

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  if (delivery.status !== "PICKED_UP") {
    throw new Error(
      `Cannot mark as in transit. Current status: ${delivery.status}`
    );
  }

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: "IN_TRANSIT",
      inTransitAt: new Date(),
    },
    include: {
      order: true,
    },
  });

  revalidatePath("/dashboard/deliveries");
  revalidatePath(`/dashboard/deliveries/${deliveryId}`);

  return updated;
}

/**
 * Update delivery status to DELIVERED
 */
export async function markAsDelivered(deliveryId: string, notes?: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can update deliveries");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  // Verify ownership
  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: user.driverId,
    },
  });

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  if (delivery.status !== "IN_TRANSIT") {
    throw new Error(
      `Cannot mark as delivered. Current status: ${delivery.status}`
    );
  }

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
      notes,
    },
    include: {
      order: true,
    },
  });

  // Also update the order status to DELIVERED
  await prisma.order.update({
    where: { id: updated.orderId },
    data: {
      status: "DELIVERED",
    },
  });

  revalidatePath("/dashboard/deliveries");
  revalidatePath(`/dashboard/deliveries/${deliveryId}`);

  return updated;
}

/**
 * Update delivery status to EXCEPTION
 */
export async function markAsException(
  deliveryId: string,
  exceptionReason: string
) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can update deliveries");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  if (!exceptionReason || exceptionReason.trim().length === 0) {
    throw new Error("Exception reason is required");
  }

  // Verify ownership
  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: user.driverId,
    },
  });

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  // Can only mark as exception if not already delivered
  if (delivery.status === "DELIVERED") {
    throw new Error("Cannot mark delivered order as exception");
  }

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: "EXCEPTION",
      exceptionAt: new Date(),
      exceptionReason,
    },
    include: {
      order: true,
    },
  });

  revalidatePath("/dashboard/deliveries");
  revalidatePath(`/dashboard/deliveries/${deliveryId}`);

  return updated;
}

/**
 * Get delivery statistics for the current driver
 */
export async function getDeliveryStats() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "DRIVER") {
    throw new Error("Only DRIVER users can access delivery stats");
  }

  if (!user.driverId) {
    throw new Error("User is missing driverId");
  }

  const [assigned, pickedUp, inTransit, delivered, exception, totalToday] =
    await Promise.all([
      prisma.delivery.count({
        where: { driverId: user.driverId, status: "ASSIGNED" },
      }),
      prisma.delivery.count({
        where: { driverId: user.driverId, status: "PICKED_UP" },
      }),
      prisma.delivery.count({
        where: { driverId: user.driverId, status: "IN_TRANSIT" },
      }),
      prisma.delivery.count({
        where: { driverId: user.driverId, status: "DELIVERED" },
      }),
      prisma.delivery.count({
        where: { driverId: user.driverId, status: "EXCEPTION" },
      }),
      prisma.delivery.count({
        where: {
          driverId: user.driverId,
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
