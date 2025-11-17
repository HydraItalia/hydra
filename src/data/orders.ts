"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

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
  items: {
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
            items: true,
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
    itemCount: order._count.items,
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
      items: {
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
