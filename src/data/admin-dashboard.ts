/**
 * Data loaders for Admin/Agent Dashboard (Phase 9.0)
 *
 * Provides real-time statistics and activity feeds for mission control interface.
 */

import { prisma } from "@/lib/prisma";

/**
 * Dashboard statistics for Admin/Agent home page
 */
export type DashboardStats = {
  unassignedOrders: number;
  pendingDeliveries: number;
  activeShifts: number;
  totalVendors: number;
  totalClients: number;
  totalOrders: number;
};

/**
 * Get real-time statistics for admin/agent dashboard
 *
 * @returns Dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    unassignedOrders,
    pendingDeliveries,
    activeShifts,
    totalVendors,
    totalClients,
    totalOrders,
  ] = await Promise.all([
    // Unassigned orders (SUBMITTED with no assigned agent)
    prisma.order.count({
      where: {
        status: "SUBMITTED",
        assignedAgentUserId: null,
      },
    }),

    // Pending deliveries (CONFIRMED orders with no Delivery record)
    prisma.order.count({
      where: {
        status: "CONFIRMED",
        Delivery: null,
      },
    }),

    // Active shifts (shifts with no end time)
    prisma.driverShift.count({
      where: { endTime: null },
    }),

    // Total vendors (not deleted)
    prisma.vendor.count({
      where: { deletedAt: null },
    }),

    // Total clients (not deleted)
    prisma.client.count({
      where: { deletedAt: null },
    }),

    // Total orders
    prisma.order.count(),
  ]);

  return {
    unassignedOrders,
    pendingDeliveries,
    activeShifts,
    totalVendors,
    totalClients,
    totalOrders,
  };
}

/**
 * Recent order for activity feed
 */
export type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  client: {
    id: string;
    name: string;
  };
  itemCount: number;
  totalCents: number;
};

/**
 * Get recent submitted orders for activity feed
 *
 * @param limit - Number of orders to fetch (default: 5)
 * @returns Array of recent orders
 */
export async function getRecentSubmittedOrders(
  limit: number = 5
): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: "SUBMITTED",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      Client: {
        select: {
          id: true,
          name: true,
        },
      },
      OrderItem: {
        select: {
          id: true,
        },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    client: {
      id: order.Client?.id ?? "",
      name: order.Client?.name ?? "Unknown",
    },
    itemCount: order.OrderItem?.length ?? 0,
    totalCents: order.totalCents,
  }));
}

/**
 * Recent delivery for activity feed
 */
export type RecentDelivery = {
  id: string;
  status: string;
  deliveredAt: Date | null;
  order: {
    id: string;
    orderNumber: string;
    client: {
      id: string;
      name: string;
    };
  };
  driver: {
    id: string;
    name: string;
  };
};

/**
 * Get recent completed deliveries for activity feed
 *
 * @param limit - Number of deliveries to fetch (default: 5)
 * @param todayOnly - Only fetch deliveries from today (default: true)
 * @returns Array of recent deliveries
 */
export async function getRecentDeliveries(
  limit: number = 5,
  todayOnly: boolean = true
): Promise<RecentDelivery[]> {
  const whereClause: any = {
    status: "DELIVERED",
  };

  if (todayOnly) {
    whereClause.deliveredAt = {
      gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
    };
  }

  const deliveries = await prisma.delivery.findMany({
    where: whereClause,
    orderBy: {
      deliveredAt: "desc",
    },
    take: limit,
    include: {
      Order: {
        include: {
          Client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      Driver: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return deliveries.map((delivery) => ({
    id: delivery.id,
    status: delivery.status,
    deliveredAt: delivery.deliveredAt,
    order: {
      id: delivery.Order.id,
      orderNumber: delivery.Order.orderNumber,
      client: {
        id: delivery.Order.Client.id,
        name: delivery.Order.Client.name,
      },
    },
    driver: {
      id: delivery.Driver.id,
      name: delivery.Driver.name,
    },
  }));
}

/**
 * Active driver shift for activity feed
 */
export type ActiveShift = {
  id: string;
  driver: {
    id: string;
    name: string;
  };
  vehicle: {
    licensePlate: string;
    description: string | null;
  };
  startTime: Date;
  stopCount: number;
  completedStops: number;
};

/**
 * Get active driver shifts for activity feed
 *
 * @param limit - Number of shifts to fetch (default: 10)
 * @returns Array of active shifts
 */
export async function getActiveShifts(
  limit: number = 10
): Promise<ActiveShift[]> {
  const shifts = await prisma.driverShift.findMany({
    where: {
      endTime: null,
    },
    orderBy: {
      startTime: "desc",
    },
    take: limit,
    include: {
      driver: {
        select: {
          id: true,
          name: true,
        },
      },
      vehicle: {
        select: {
          licensePlate: true,
          description: true,
        },
      },
      stops: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return shifts.map((shift) => ({
    id: shift.id,
    driver: {
      id: shift.driver.id,
      name: shift.driver.name,
    },
    vehicle: {
      licensePlate: shift.vehicle.licensePlate,
      description: shift.vehicle.description,
    },
    startTime: shift.startTime,
    stopCount: shift.stops.length,
    completedStops: shift.stops.filter((stop) => stop.status === "COMPLETED")
      .length,
  }));
}
