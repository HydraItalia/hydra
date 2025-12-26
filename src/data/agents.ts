"use server";

/**
 * Phase 9.6.1 - Agent Workload List Data Loader
 *
 * Data fetching functions for agent workload management
 */

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { subDays } from "date-fns";
import { Prisma, OrderStatus } from "@prisma/client";

// Constants for agent detail queries
const RECENT_ORDERS_DAYS = 30;
const ACTIVE_ORDERS_LIMIT = 20;

export type AgentFilters = {
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "clients" | "vendors" | "workload";
  sortOrder?: "asc" | "desc";
};

export type AgentListResult = {
  id: string;
  name: string | null;
  email: string;
  agentCode: string | null;
  clientCount: number;
  vendorCount: number;
  activeOrderCount: number;
  submittedOrderCount: number;
  confirmedOrderCount: number;
  createdAt: string;
};

/**
 * Fetch all agents for admin with filtering, sorting, and pagination
 * ADMIN-ONLY access
 */
export async function fetchAllAgentsForAdmin(
  filters: AgentFilters = {}
): Promise<{
  data: AgentListResult[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}> {
  // CRITICAL: Admin only - NOT agent!
  await requireRole("ADMIN");

  const {
    searchQuery,
    page = 1,
    pageSize = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = filters;

  // Validate pagination params
  const validPage = Math.max(page, 1);
  const validPageSize = Math.min(Math.max(pageSize, 10), 100);

  // Build base where clause
  const where: any = {
    role: "AGENT",
    deletedAt: null,
  };

  // TODO: Performance optimization for large agent counts (>1000):
  // When sortBy === "name", use database-level orderBy with skip/take
  // instead of fetching all agents into memory. Current approach is
  // necessary for computed field sorting (clients, vendors, workload)
  // but could be optimized for the name sort case.

  // Add search filter (case insensitive)
  if (searchQuery && searchQuery.trim()) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
      { agentCode: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Fetch agents with relations
  const agents = await prisma.user.findMany({
    where,
    include: {
      AgentClient: {
        select: { clientId: true },
      },
      AgentVendor: {
        select: { vendorId: true },
      },
      Order_Order_assignedAgentUserIdToUser: {
        where: {
          status: { in: [OrderStatus.SUBMITTED, OrderStatus.CONFIRMED] },
          deletedAt: null,
        },
        select: { id: true, status: true },
      },
    },
    orderBy: { name: "asc" }, // Default ordering
  });

  // Map to result type with computed counts
  const mappedAgents = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    agentCode: agent.agentCode,
    clientCount: agent.AgentClient.length,
    vendorCount: agent.AgentVendor.length,
    activeOrderCount: agent.Order_Order_assignedAgentUserIdToUser.length,
    submittedOrderCount: agent.Order_Order_assignedAgentUserIdToUser.filter(
      (o) => o.status === OrderStatus.SUBMITTED
    ).length,
    confirmedOrderCount: agent.Order_Order_assignedAgentUserIdToUser.filter(
      (o) => o.status === OrderStatus.CONFIRMED
    ).length,
    createdAt: agent.createdAt.toISOString(),
  }));

  // Apply sorting
  const sortedAgents = mappedAgents.sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case "name":
        compareValue = (a.name || "").localeCompare(b.name || "");
        break;
      case "clients":
        compareValue = a.clientCount - b.clientCount;
        break;
      case "vendors":
        compareValue = a.vendorCount - b.vendorCount;
        break;
      case "workload":
        compareValue = a.activeOrderCount - b.activeOrderCount;
        break;
      default:
        compareValue = (a.name || "").localeCompare(b.name || "");
    }

    return sortOrder === "desc" ? -compareValue : compareValue;
  });

  // Apply pagination
  const total = sortedAgents.length;
  const totalPages = Math.ceil(total / validPageSize);
  const skip = (validPage - 1) * validPageSize;
  const paginatedAgents = sortedAgents.slice(skip, skip + validPageSize);

  return {
    data: paginatedAgents,
    total,
    currentPage: validPage,
    totalPages,
    pageSize: validPageSize,
  };
}

/**
 * Phase 9.6.2 - Agent Detail Data Loader
 */

export type AgentDetail = {
  id: string;
  name: string | null;
  email: string;
  agentCode: string | null;
  createdAt: string;
  assignedClients: Array<{
    clientId: string;
    clientName: string;
    region: string | null;
    recentOrderCount: number;
  }>;
  assignedVendors: Array<{
    vendorId: string;
    vendorName: string;
    region: string | null;
    activeProductCount: number;
  }>;
  activeOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    totalCents: number;
    status: OrderStatus;
    clientName: string;
  }>;
  stats: {
    totalClients: number;
    totalVendors: number;
    activeOrderCount: number;
    submittedOrderCount: number;
    confirmedOrderCount: number;
  };
};

/**
 * Fetch single agent by user ID for detail view
 * ADMIN-ONLY access
 */
export async function getAgentById(userId: string): Promise<AgentDetail> {
  // CRITICAL: Admin only - NOT agent!
  await requireRole("ADMIN");

  const agent = await prisma.user.findUnique({
    where: { id: userId, role: "AGENT", deletedAt: null },
    include: {
      AgentClient: {
        include: {
          Client: {
            select: {
              id: true,
              name: true,
              region: true,
              Order: {
                where: {
                  createdAt: { gte: subDays(new Date(), RECENT_ORDERS_DAYS) },
                  deletedAt: null,
                },
                select: { id: true },
              },
            },
          },
        },
      },
      AgentVendor: {
        include: {
          Vendor: {
            select: {
              id: true,
              name: true,
              region: true,
              VendorProduct: {
                where: { isActive: true, deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      },
      Order_Order_assignedAgentUserIdToUser: {
        where: {
          status: {
            in: [
              OrderStatus.SUBMITTED,
              OrderStatus.CONFIRMED,
              OrderStatus.FULFILLING,
            ],
          },
          deletedAt: null,
        },
        include: {
          Client: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: ACTIVE_ORDERS_LIMIT,
      },
    },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${userId}`);
  }

  // Type-safe mapping using Prisma generated types
  type AgentWithRelations = Prisma.UserGetPayload<{
    include: {
      AgentClient: {
        include: {
          Client: {
            select: {
              id: true;
              name: true;
              region: true;
              Order: {
                select: { id: true };
              };
            };
          };
        };
      };
      AgentVendor: {
        include: {
          Vendor: {
            select: {
              id: true;
              name: true;
              region: true;
              VendorProduct: {
                select: { id: true };
              };
            };
          };
        };
      };
      Order_Order_assignedAgentUserIdToUser: {
        include: {
          Client: { select: { name: true } };
        };
      };
    };
  }>;

  const typedAgent = agent as AgentWithRelations;

  // Calculate stats
  const totalClients = typedAgent.AgentClient.length;
  const totalVendors = typedAgent.AgentVendor.length;
  const activeOrders = typedAgent.Order_Order_assignedAgentUserIdToUser;
  const activeOrderCount = activeOrders.length;
  const submittedOrderCount = activeOrders.filter(
    (o) => o.status === OrderStatus.SUBMITTED
  ).length;
  const confirmedOrderCount = activeOrders.filter(
    (o) => o.status === OrderStatus.CONFIRMED
  ).length;

  return {
    // Basic info
    id: agent.id,
    name: agent.name,
    email: agent.email,
    agentCode: agent.agentCode,
    createdAt: agent.createdAt.toISOString(),

    // Assigned Clients
    assignedClients: typedAgent.AgentClient.map((ac) => ({
      clientId: ac.Client.id,
      clientName: ac.Client.name,
      region: ac.Client.region,
      recentOrderCount: ac.Client.Order.length,
    })),

    // Assigned Vendors
    assignedVendors: typedAgent.AgentVendor.map((av) => ({
      vendorId: av.Vendor.id,
      vendorName: av.Vendor.name,
      region: av.Vendor.region,
      activeProductCount: av.Vendor.VendorProduct.length,
    })),

    // Active Orders
    activeOrders: activeOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      totalCents: order.totalCents,
      status: order.status,
      clientName: order.Client.name,
    })),

    // Stats
    stats: {
      totalClients,
      totalVendors,
      activeOrderCount,
      submittedOrderCount,
      confirmedOrderCount,
    },
  };
}
