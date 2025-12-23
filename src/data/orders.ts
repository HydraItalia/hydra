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
  agentUserId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Fetch all orders for ADMIN/AGENT users with filters
 *
 * Authorization: Only ADMIN and AGENT users can access this
 *
 * @param filters - Filter and pagination parameters
 * @returns Paginated orders with client and agent info
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchAllOrdersForAdmin(
  filters: AdminOrderFilters = {}
): Promise<AdminOrdersResult> {
  // 1. Authorization check
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    throw new Error("Only ADMIN and AGENT users can access all orders");
  }

  // 2. Parse and validate params
  const page = Math.max(filters.page || 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize || 20, 10), 100);
  const offset = (page - 1) * pageSize;

  // 3. Build where clause
  const where: any = {
    deletedAt: null,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters.agentUserId) {
    where.assignedAgentUserId = filters.agentUserId;
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
 *
 * @param orderId - The order ID to fetch
 * @returns Full order details with audit logs
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchAdminOrderDetail(
  orderId: string
): Promise<AdminOrderDetail> {
  // 1. Authorization check
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    throw new Error("Only ADMIN and AGENT users can access order details");
  }

  // 2. Fetch order with full details and audit logs
  const [order, auditLogs] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
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

  // 3. Validate order exists
  if (!order) {
    throw new Error("Order not found");
  }

  // 4. Format and return
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
 *
 * @returns Unassigned orders with suggested agents
 * @throws Error if user is not authenticated or not ADMIN/AGENT
 */
export async function fetchUnassignedOrders(): Promise<UnassignedOrder[]> {
  // 1. Authorization check
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    throw new Error("Only ADMIN and AGENT users can access unassigned orders");
  }

  // 2. Fetch orders with no assigned agent and SUBMITTED status
  const orders = await prisma.order.findMany({
    where: {
      status: "SUBMITTED",
      assignedAgentUserId: null,
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

  // 3. Map to result format
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
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    throw new Error("Only ADMIN and AGENT users can access agents list");
  }

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
