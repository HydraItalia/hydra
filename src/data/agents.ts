"use server";

/**
 * Phase 9.6.1 - Agent Workload List Data Loader
 *
 * Data fetching functions for agent workload management
 */

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

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
          status: { in: ["SUBMITTED", "CONFIRMED"] },
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
      (o) => o.status === "SUBMITTED"
    ).length,
    confirmedOrderCount: agent.Order_Order_assignedAgentUserIdToUser.filter(
      (o) => o.status === "CONFIRMED"
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
