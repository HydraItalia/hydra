"use server";

/**
 * Phase 9.4.1 - Client List Data Loader
 *
 * Data fetching functions for client management
 */

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ClientFilters = {
  region?: string;
  hasAgreement?: boolean;
  agentUserId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "region";
  sortOrder?: "asc" | "desc";
  // NOTE: orderCount sorting removed - would require database-level sorting
  // to work correctly with pagination. Consider adding a computed column
  // or aggregation in the future.
};

export type ClientListResult = {
  id: string;
  name: string;
  region: string | null;
  shortAddress: string | null;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  pinColor: string | null;
  hidden: boolean;
  lastVisitAt: string | null;
  totalVisits: number;
  assignedAgents: Array<{
    userId: string;
    name: string | null;
    agentCode: string | null;
  }>;
  agreementCount: number;
  orderCount: number;
  createdAt: string;
};

/**
 * Fetch all clients for admin/agent with filtering and pagination
 */
export async function fetchAllClientsForAdmin(
  filters: ClientFilters = {}
): Promise<{
  data: ClientListResult[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}> {
  // Require ADMIN or AGENT role
  await requireRole("ADMIN", "AGENT");

  const {
    region,
    hasAgreement,
    agentUserId,
    searchQuery,
    page = 1,
    pageSize = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = filters;

  // Validate pagination
  const validPage = Math.max(page, 1);
  const validPageSize = Math.min(Math.max(pageSize, 10), 100);
  const skip = (validPage - 1) * validPageSize;

  // Build where clause
  const where: any = {
    deletedAt: null,
  };

  if (region) {
    where.region = region;
  }

  if (hasAgreement !== undefined) {
    if (hasAgreement) {
      where.Agreement = { some: {} };
    } else {
      where.Agreement = { none: {} };
    }
  }

  if (agentUserId) {
    where.AgentClient = {
      some: { userId: agentUserId },
    };
  }

  if (searchQuery && searchQuery.trim()) {
    where.name = {
      contains: searchQuery.trim(),
      mode: "insensitive" as const,
    };
  }

  // Build orderBy clause
  let orderBy: any;
  if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "region") {
    orderBy = { region: sortOrder };
  } else {
    // Default to name sorting
    orderBy = { name: sortOrder };
  }

  // Fetch clients and total count in parallel
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        AgentClient: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                agentCode: true,
              },
            },
          },
        },
        ClientStats: {
          select: {
            totalVisits: true,
          },
        },
        _count: {
          select: {
            Agreement: true,
            Order: true,
          },
        },
      },
      orderBy,
      skip,
      take: validPageSize,
    }),
    prisma.client.count({ where }),
  ]);

  // Map to result type
  const data: ClientListResult[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    region: client.region,
    shortAddress: client.shortAddress,
    deliveryAddress: client.deliveryAddress,
    deliveryLat: client.deliveryLat,
    deliveryLng: client.deliveryLng,
    email: client.email,
    phone: client.phone,
    contactPerson: client.contactPerson,
    pinColor: client.pinColor,
    hidden: client.hidden,
    lastVisitAt: client.lastVisitAt?.toISOString() || null,
    totalVisits: (client as any).ClientStats?.totalVisits || 0,
    assignedAgents: (client as any).AgentClient.filter(
      (ac: any) => ac.User != null
    ).map((ac: any) => ({
      userId: ac.User.id,
      name: ac.User.name,
      agentCode: ac.User.agentCode,
    })),
    agreementCount: (client as any)._count.Agreement,
    orderCount: (client as any)._count.Order,
    createdAt: client.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / validPageSize);

  return {
    data,
    total,
    currentPage: validPage,
    totalPages,
    pageSize: validPageSize,
  };
}

/**
 * Get unique regions for filter dropdown
 */
export async function getClientRegions(): Promise<string[]> {
  await requireRole("ADMIN", "AGENT");

  const regions = await prisma.client.findMany({
    where: {
      deletedAt: null,
      region: { not: null },
    },
    select: { region: true },
    distinct: ["region"],
    orderBy: { region: "asc" },
  });

  return regions.map((r) => r.region).filter((r): r is string => r !== null);
}

/**
 * Get agents for filter dropdown
 */
export async function getAgentsForClientFilter(): Promise<
  Array<{ id: string; name: string | null; agentCode: string | null }>
> {
  await requireRole("ADMIN", "AGENT");

  const agents = await prisma.user.findMany({
    where: {
      role: "AGENT",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      agentCode: true,
    },
    orderBy: { name: "asc" },
  });

  return agents;
}

export type ClientDetail = {
  // Basic info
  id: string;
  name: string;
  region: string | null;
  fullAddress: string | null;
  shortAddress: string | null;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  notes: string | null;

  // Contact
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  taxId: string | null;

  // UI
  pinColor: string | null;
  hidden: boolean;

  // Integration
  externalId: string | null;
  freezco: boolean | null;
  mandanti: string | null;

  // Tracking
  lastVisitAt: string | null;
  createdAt: string;

  // Relationships
  user: { email: string; name: string | null } | null;
  assignedAgents: Array<{
    userId: string;
    name: string | null;
    agentCode: string | null;
  }>;
  agreements: Array<{
    id: string;
    vendor: { id: string; name: string };
    priceMode: string;
    discountPct: number | null;
    createdAt: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    totalCents: number;
    status: string;
  }>;
  stats: {
    totalVisits: number;
    agreementCount: number;
    orderCount: number;
  } | null;
};

/**
 * Fetch single client by ID for detail view
 */
export async function getClientById(clientId: string): Promise<ClientDetail> {
  await requireRole("ADMIN", "AGENT");

  const client = await prisma.client.findUnique({
    where: { id: clientId, deletedAt: null },
    include: {
      User: {
        select: {
          email: true,
          name: true,
        },
      },
      AgentClient: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              agentCode: true,
            },
          },
        },
      },
      Agreement: {
        where: { deletedAt: null },
        include: {
          Vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      Order: {
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          totalCents: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      ClientStats: true,
      _count: {
        select: {
          Agreement: true,
          Order: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  // Map to result type
  return {
    id: client.id,
    name: client.name,
    region: client.region,
    fullAddress: client.fullAddress,
    shortAddress: client.shortAddress,
    deliveryAddress: client.deliveryAddress,
    deliveryLat: client.deliveryLat,
    deliveryLng: client.deliveryLng,
    notes: client.notes,

    // Contact
    contactPerson: client.contactPerson,
    email: client.email,
    phone: client.phone,
    taxId: client.taxId,

    // UI
    pinColor: client.pinColor,
    hidden: client.hidden,

    // Integration
    externalId: client.externalId,
    freezco: client.freezco,
    mandanti: client.mandanti,

    // Tracking
    lastVisitAt: client.lastVisitAt?.toISOString() || null,
    createdAt: client.createdAt.toISOString(),

    // Relationships
    user: client.User
      ? {
          email: client.User.email,
          name: client.User.name,
        }
      : null,
    assignedAgents: (client as any).AgentClient.filter(
      (ac: any) => ac.User != null
    ).map((ac: any) => ({
      userId: ac.User.id,
      name: ac.User.name,
      agentCode: ac.User.agentCode,
    })),
    agreements: (client as any).Agreement.map((agreement: any) => ({
      id: agreement.id,
      vendor: {
        id: agreement.Vendor.id,
        name: agreement.Vendor.name,
      },
      priceMode: agreement.priceMode,
      discountPct: agreement.discountPct,
      createdAt: agreement.createdAt.toISOString(),
    })),
    recentOrders: (client as any).Order.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      totalCents: order.totalCents,
      status: order.status,
    })),
    stats: (client as any).ClientStats
      ? {
          totalVisits: (client as any).ClientStats.totalVisits,
          agreementCount: (client as any)._count.Agreement,
          orderCount: (client as any)._count.Order,
        }
      : null,
  };
}
