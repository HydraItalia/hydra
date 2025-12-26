"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import type { OrderStatus } from "@prisma/client";

/**
 * Shared authorization helper for CLIENT users
 * @returns clientId for the authenticated CLIENT user
 * @throws Error if user is not authenticated, not a CLIENT, or has no clientId
 */
async function requireClientUser(): Promise<string> {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Only CLIENT users can access orders");
  }

  if (!user.clientId) {
    throw new Error("User does not have an associated client");
  }

  return user.clientId;
}

/**
 * Shared authorization helper for ADMIN/AGENT users
 * @returns user object for the authenticated ADMIN or AGENT user
 * @throws Error if user is not authenticated or not an ADMIN/AGENT
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
 * Paginated orders result
 */
export type OrdersResult = {
  data: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    totalCents: number;
    itemCount: number;
  }[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
};

/**
 * Order detail result with items
 */
export type OrderDetail = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalCents: number;
  clientId: string;
  OrderItem: {
    id: string;
    productName: string;
    vendorName: string;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

/**
 * Fetch paginated orders for the current CLIENT user
 *
 * Authorization: Only CLIENT users can access their own orders
 *
 * @param params.page - Page number (1-indexed)
 * @param params.pageSize - Number of orders per page
 * @returns Paginated orders
 * @throws Error if user is not authenticated or not a CLIENT
 */
export async function fetchOrdersForClient(params: {
  page: number;
  pageSize: number;
}): Promise<OrdersResult> {
  // 1. Authorization check
  const clientId = await requireClientUser();

  // 2. Parse and validate pagination params
  const page = Math.max(params.page, 1);
  const pageSize = Math.min(Math.max(params.pageSize, 10), 100);
  const offset = (page - 1) * pageSize;

  // 3. Fetch orders and count in parallel
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: {
        clientId,
        deletedAt: null,
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        totalCents: true,
        _count: {
          select: {
            OrderItem: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize,
      skip: offset,
    }),
    prisma.order.count({
      where: {
        clientId,
        deletedAt: null,
      },
    }),
  ]);

  // 4. Map to result format
  const data = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    totalCents: order.totalCents,
    itemCount: order._count.OrderItem,
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
 * Fetch order details by ID for the current CLIENT user
 *
 * Authorization: Only the CLIENT who owns the order can view it
 *
 * @param orderId - The order ID to fetch
 * @returns Order details with items
 * @throws Error if user is not authorized or order not found
 */
export async function fetchOrderById(orderId: string): Promise<OrderDetail> {
  // 1. Authorization check
  const clientId = await requireClientUser();

  // 2. Fetch order with authorization
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      clientId, // Authorization: must belong to this client
      deletedAt: null,
    },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      totalCents: true,
      clientId: true,
      OrderItem: {
        select: {
          id: true,
          productName: true,
          vendorName: true,
          qty: true,
          unitPriceCents: true,
          lineTotalCents: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  // 3. Validate order exists
  if (!order) {
    throw new Error("Order not found");
  }

  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
  };
}

/**
 * Admin orders result type
 */
export type AdminOrdersResult = {
  data: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    totalCents: number;
    clientName: string;
    assignedAgentName: string | null;
    itemCount: number;
    delivery: {
      id: string;
      status: string;
      driverName: string | null;
    } | null;
  }[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
};

/**
 * Admin orders filter parameters
 */
export type AdminOrderFilters = {
  status?: string;
  clientId?: string;
  agentUserId?: string | null; // null = filter for unassigned orders
  driverId?: string | null; // null = filter for orders with no driver assigned
  searchQuery?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Fetch all orders for ADMIN/AGENT users with filters
 *
 * Authorization: Only ADMIN and AGENT users can access this
 * - ADMIN: sees all orders
 * - AGENT: sees only orders assigned to them
 *
 * @param filters - Filter and pagination parameters
 * @returns Paginated orders with client and agent info
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchAllOrdersForAdmin(
  filters: AdminOrderFilters = {}
): Promise<AdminOrdersResult> {
  // 1. Authorization check
  const user = await requireAdminOrAgent();

  // 2. Parse and validate params
  const page = Math.max(filters.page || 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize || 20, 10), 100);
  const offset = (page - 1) * pageSize;

  // 3. Build where clause
  const where: any = {
    deletedAt: null,
  };

  // AGENT scoping: only see orders assigned to them
  if (user.role === "AGENT") {
    where.assignedAgentUserId = user.id;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  // Only ADMIN can filter by agent (agents already scoped to their own)
  if (user.role === "ADMIN" && filters.agentUserId !== undefined) {
    // Explicitly check for undefined to allow null (unassigned filter)
    where.assignedAgentUserId = filters.agentUserId;
  }

  if (filters.driverId !== undefined) {
    // Explicitly check for undefined to allow null (no driver filter)
    if (filters.driverId === null) {
      // Filter for orders with no delivery assigned
      where.Delivery = null;
    } else {
      // Filter for orders with specific driver
      where.Delivery = {
        driverId: filters.driverId,
      };
    }
  }

  if (filters.searchQuery) {
    where.orderNumber = {
      contains: filters.searchQuery,
      mode: "insensitive",
    };
  }

  // 4. Fetch orders and count in parallel
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        totalCents: true,
        Client: {
          select: {
            name: true,
          },
        },
        User_Order_assignedAgentUserIdToUser: {
          select: {
            name: true,
            email: true,
          },
        },
        Delivery: {
          select: {
            id: true,
            status: true,
            Driver: {
              select: {
                name: true,
              },
            },
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
      take: pageSize,
      skip: offset,
    }),
    prisma.order.count({ where }),
  ]);

  // 5. Map to result format
  const data = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    totalCents: order.totalCents,
    clientName: order.Client.name || "Unknown Client",
    assignedAgentName: order.User_Order_assignedAgentUserIdToUser?.name || null,
    itemCount: order._count.OrderItem,
    delivery: order.Delivery
      ? {
          id: order.Delivery.id,
          status: order.Delivery.status,
          driverName: order.Delivery.Driver?.name || null,
        }
      : null,
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
 * Admin order detail with full information
 */
export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  notes: string | null;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    region: string | null;
    fullAddress: string | null;
    shortAddress: string | null;
  };
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedAgent: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  orderItems: {
    id: string;
    productName: string;
    vendorName: string;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
  delivery: {
    id: string;
    status: string;
    driverName: string | null;
  } | null;
  auditLogs: {
    id: string;
    action: string;
    diff: any;
    createdAt: string;
    actorName: string | null;
    actorEmail: string | null;
  }[];
};

/**
 * Fetch full order details for ADMIN/AGENT users
 *
 * Authorization: Only ADMIN and AGENT users can access this
 * - ADMIN: can see any order
 * - AGENT: can only see orders assigned to them
 *
 * @param orderId - The order ID to fetch
 * @returns Full order details with audit logs
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchAdminOrderDetail(
  orderId: string
): Promise<AdminOrderDetail> {
  // 1. Authorization check
  const user = await requireAdminOrAgent();

  // 2. Build where clause with agent scoping
  const whereClause: any = {
    id: orderId,
    deletedAt: null,
  };

  // AGENT scoping: only see orders assigned to them
  if (user.role === "AGENT") {
    whereClause.assignedAgentUserId = user.id;
  }

  // 3. Fetch order with full details and audit logs
  const [order, auditLogs] = await Promise.all([
    prisma.order.findFirst({
      where: whereClause,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            region: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
        User_Order_submitterUserIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        User_Order_assignedAgentUserIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        OrderItem: {
          select: {
            id: true,
            productName: true,
            vendorName: true,
            qty: true,
            unitPriceCents: true,
            lineTotalCents: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        Delivery: {
          select: {
            id: true,
            status: true,
            Driver: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        entityType: "Order",
        entityId: orderId,
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  // 4. Validate order exists
  if (!order) {
    throw new Error("Order not found or access denied");
  }

  // 5. Format and return
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalCents: order.totalCents,
    notes: order.notes,
    deliveryAddress: order.deliveryAddress,
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    client: {
      id: order.Client.id,
      name: order.Client.name,
      region: order.Client.region,
      fullAddress: order.Client.fullAddress,
      shortAddress: order.Client.shortAddress,
    },
    submittedBy: {
      id: order.User_Order_submitterUserIdToUser.id,
      name: order.User_Order_submitterUserIdToUser.name,
      email: order.User_Order_submitterUserIdToUser.email,
    },
    assignedAgent: order.User_Order_assignedAgentUserIdToUser
      ? {
          id: order.User_Order_assignedAgentUserIdToUser.id,
          name: order.User_Order_assignedAgentUserIdToUser.name,
          email: order.User_Order_assignedAgentUserIdToUser.email,
        }
      : null,
    orderItems: order.OrderItem.map((item) => ({
      id: item.id,
      productName: item.productName,
      vendorName: item.vendorName,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
    delivery: order.Delivery
      ? {
          id: order.Delivery.id,
          status: order.Delivery.status,
          driverName: order.Delivery.Driver?.name || null,
        }
      : null,
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      diff: log.diff,
      createdAt: log.createdAt.toISOString(),
      actorName: log.User?.name || null,
      actorEmail: log.User?.email || null,
    })),
  };
}

/**
 * Unassigned order result type
 */
export type UnassignedOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  totalCents: number;
  itemCount: number;
  client: {
    id: string;
    name: string;
    region: string | null;
    suggestedAgents: {
      id: string;
      name: string | null;
      email: string;
      agentCode: string | null;
    }[];
  };
};

/**
 * Fetch unassigned orders for ADMIN/AGENT users
 *
 * Returns orders that are SUBMITTED but have no assigned agent.
 * Includes suggested agents based on AgentClient relationships.
 *
 * Authorization: Only ADMIN and AGENT users can access this
 * - ADMIN: sees all unassigned orders
 * - AGENT: sees only unassigned orders for their assigned clients
 *
 * @returns Unassigned orders with suggested agents
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchUnassignedOrders(): Promise<UnassignedOrder[]> {
  // 1. Authorization check
  const user = await requireAdminOrAgent();

  // 2. Build where clause
  const where: any = {
    status: "SUBMITTED",
    assignedAgentUserId: null,
    deletedAt: null,
  };

  // AGENT scoping: only see unassigned orders for their assigned clients
  if (user.role === "AGENT") {
    where.Client = {
      AgentClient: {
        some: {
          userId: user.id,
        },
      },
    };
  }

  // 3. Fetch orders with no assigned agent and SUBMITTED status
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      totalCents: true,
      _count: {
        select: {
          OrderItem: true,
        },
      },
      Client: {
        select: {
          id: true,
          name: true,
          region: true,
          AgentClient: {
            select: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  agentCode: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc", // Oldest first
    },
  });

  // 4. Map to result format
  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    totalCents: order.totalCents,
    itemCount: order._count.OrderItem,
    client: {
      id: order.Client.id,
      name: order.Client.name,
      region: order.Client.region,
      suggestedAgents: order.Client.AgentClient.map((ac) => ({
        id: ac.User.id,
        name: ac.User.name,
        email: ac.User.email,
        agentCode: ac.User.agentCode,
      })),
    },
  }));
}

/**
 * Agent result type
 */
export type Agent = {
  id: string;
  name: string | null;
  email: string;
  agentCode: string | null;
};

/**
 * Fetch all agents for ADMIN/AGENT users
 *
 * Returns all users with AGENT role.
 *
 * Authorization: Only ADMIN and AGENT users can access this
 *
 * @returns List of all agents
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchAllAgents(): Promise<Agent[]> {
  // 1. Authorization check
  await requireAdminOrAgent();

  // 2. Fetch all agents
  const agents = await prisma.user.findMany({
    where: {
      role: "AGENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      agentCode: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return agents;
}

/**
 * Order ready for delivery result type
 */
export type OrderReadyForDelivery = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    shortAddress: string | null;
  };
  itemCount: number;
};

/**
 * Fetch orders ready for delivery (CONFIRMED with no Delivery record)
 *
 * Authorization: Only ADMIN and AGENT users can access this
 * - ADMIN: sees all confirmed orders ready for delivery
 * - AGENT: sees only their assigned orders ready for delivery
 *
 * @returns Orders ready for driver assignment
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchOrdersReadyForDelivery(): Promise<
  OrderReadyForDelivery[]
> {
  // 1. Authorization check
  const user = await requireAdminOrAgent();

  // 2. Build where clause
  const where: any = {
    status: "CONFIRMED",
    Delivery: null, // No delivery exists
    deletedAt: null,
  };

  // AGENT scoping: only see their assigned orders
  if (user.role === "AGENT") {
    where.assignedAgentUserId = user.id;
  }

  // 3. Fetch confirmed orders without delivery
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      deliveryAddress: true,
      deliveryLat: true,
      deliveryLng: true,
      updatedAt: true,
      Client: {
        select: {
          id: true,
          name: true,
          shortAddress: true,
        },
      },
      _count: {
        select: {
          OrderItem: true,
        },
      },
    },
    orderBy: {
      updatedAt: "asc", // Oldest first
    },
  });

  // 4. Map to result format
  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalCents: order.totalCents,
    deliveryAddress: order.deliveryAddress,
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    updatedAt: order.updatedAt.toISOString(),
    client: {
      id: order.Client.id,
      name: order.Client.name,
      shortAddress: order.Client.shortAddress,
    },
    itemCount: order._count.OrderItem,
  }));
}

/**
 * Available driver result type
 */
export type AvailableDriver = {
  id: string;
  name: string;
  status: string;
  activeDeliveryCount: number;
};

/**
 * Fetch available drivers (ONLINE or OFFLINE status)
 *
 * Authorization: Only ADMIN and AGENT users can access this
 *
 * @returns List of available drivers with workload
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchAvailableDrivers(): Promise<AvailableDriver[]> {
  // 1. Authorization check
  await requireAdminOrAgent();

  // 2. Fetch drivers with active delivery count
  const drivers = await prisma.driver.findMany({
    where: {
      status: {
        in: ["ONLINE", "OFFLINE"],
      },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      status: true,
      Delivery: {
        where: {
          status: {
            in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"],
          },
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // 3. Map to result format with active delivery count
  return drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    status: driver.status,
    activeDeliveryCount: driver.Delivery.length,
  }));
}
