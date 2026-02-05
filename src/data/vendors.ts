"use server";

/**
 * Phase 9.5.1 - Vendor List Data Loader
 *
 * Data fetching functions for vendor management
 */

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// ── Public Vendor Queries (for driver onboarding) ─────────────────────────────

export type ApprovedVendorOption = {
  id: string;
  name: string;
  tradeName: string | null;
};

/**
 * Fetch approved vendors for driver company selection dropdown.
 * No auth required - public for onboarding flow.
 */
export async function fetchApprovedVendors(
  search?: string
): Promise<ApprovedVendorOption[]> {
  const vendors = await prisma.vendor.findMany({
    where: {
      deletedAt: null,
      // Vendor must have an approved user
      User: {
        status: "APPROVED",
      },
      ...(search && search.trim()
        ? {
            OR: [
              { name: { contains: search.trim(), mode: "insensitive" } },
              {
                VendorProfile: {
                  tradeName: { contains: search.trim(), mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      VendorProfile: {
        select: { tradeName: true },
      },
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return vendors.map((v) => ({
    id: v.id,
    name: v.name,
    tradeName: v.VendorProfile?.tradeName ?? null,
  }));
}

/**
 * Resolve a driver invite token to vendor info.
 * Returns null if invalid/expired/consumed or vendor is deleted/unapproved.
 */
export async function resolveDriverInvite(token: string): Promise<{
  vendorId: string;
  vendorName: string;
  inviteToken: string;
} | null> {
  const now = new Date();

  // Query with all constraints at the database level
  const invite = await prisma.driverInvite.findFirst({
    where: {
      token,
      consumedAt: null,
      expiresAt: { gt: now },
      vendor: {
        deletedAt: null,
        User: { status: "APPROVED" },
      },
    },
    include: {
      vendor: {
        select: { id: true, name: true },
      },
    },
  });

  if (!invite) return null;

  return {
    vendorId: invite.vendor.id,
    vendorName: invite.vendor.name,
    inviteToken: token,
  };
}

// ── Admin/Agent Vendor Queries ────────────────────────────────────────────────

export type VendorFilters = {
  region?: string;
  hasProducts?: boolean;
  agentUserId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "region";
  sortOrder?: "asc" | "desc";
  // NOTE: productCount sorting removed - would require database-level sorting
  // to work correctly with pagination. Consider adding a computed column
  // or aggregation in the future.
};

export type VendorListResult = {
  id: string;
  name: string;
  region: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  businessHours: string | null;
  productCount: number;
  agreementCount: number;
  assignedAgents: Array<{
    userId: string;
    name: string | null;
    agentCode: string | null;
  }>;
  createdAt: string;
};

/**
 * Fetch all vendors for admin/agent with filtering and pagination
 * - ADMIN: sees all vendors (can filter by agent)
 * - AGENT: sees only their assigned vendors
 */
export async function fetchAllVendorsForAdmin(
  filters: VendorFilters = {}
): Promise<{
  data: VendorListResult[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}> {
  // Require ADMIN or AGENT role
  const user = await requireRole("ADMIN", "AGENT");

  const {
    region,
    hasProducts,
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
  const where: Prisma.VendorWhereInput = {
    deletedAt: null,
  };

  // AGENT scoping: only see assigned vendors
  if (user.role === "AGENT") {
    where.AgentVendor = {
      some: { userId: user.id },
    };
  }

  if (region) {
    where.region = region;
  }

  if (hasProducts !== undefined) {
    if (hasProducts) {
      where.VendorProduct = {
        some: {
          isActive: true,
          deletedAt: null,
        },
      };
    } else {
      where.VendorProduct = { none: {} };
    }
  }

  // Only ADMIN can filter by agent (agents already scoped)
  if (user.role === "ADMIN" && agentUserId) {
    where.AgentVendor = {
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

  // Fetch vendors and total count in parallel
  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        AgentVendor: {
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
        _count: {
          select: {
            VendorProduct: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
            Agreement: { where: { deletedAt: null } },
          },
        },
      },
      orderBy,
      skip,
      take: validPageSize,
    }),
    prisma.vendor.count({ where }),
  ]);

  // Map to result type
  const data: VendorListResult[] = vendors.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    region: vendor.region,
    contactEmail: vendor.contactEmail,
    contactPhone: vendor.contactPhone,
    address: vendor.address,
    businessHours: vendor.businessHours,
    productCount: (vendor as any)._count.VendorProduct,
    agreementCount: (vendor as any)._count.Agreement,
    assignedAgents: (vendor as any).AgentVendor.filter(
      (av: any) => av.User != null
    ).map((av: any) => ({
      userId: av.User.id,
      name: av.User.name,
      agentCode: av.User.agentCode,
    })),
    createdAt: vendor.createdAt.toISOString(),
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
export async function getVendorRegions(): Promise<string[]> {
  await requireRole("ADMIN", "AGENT");

  const regions = await prisma.vendor.findMany({
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
export async function getAgentsForVendorFilter(): Promise<
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

export type VendorDetail = {
  // Basic info
  id: string;
  name: string;
  region: string | null;
  address: string | null;
  businessHours: string | null;
  notes: string | null;

  // Contact
  contactEmail: string | null;
  contactPhone: string | null;

  // Tracking
  createdAt: string;

  // Relationships
  user: { email: string; name: string | null } | null;
  assignedAgents: Array<{
    userId: string;
    name: string | null;
    agentCode: string | null;
  }>;
  products: Array<{
    id: string;
    isActive: boolean;
    stockQty: number;
    vendorSku: string;
    product: {
      id: string;
      name: string;
    };
  }>;
  agreements: Array<{
    id: string;
    client: { id: string; name: string };
    priceMode: string;
    discountPct: number | null;
    createdAt: string;
  }>;
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    agreementCount: number;
  };
};

/**
 * Fetch single vendor by ID for detail view
 * - ADMIN: can see any vendor
 * - AGENT: can only see their assigned vendors
 */
export async function getVendorById(vendorId: string): Promise<VendorDetail> {
  const user = await requireRole("ADMIN", "AGENT");

  // Build where clause with agent scoping
  const whereClause: Prisma.VendorWhereInput = {
    id: vendorId,
    deletedAt: null,
  };

  // AGENT scoping: only see assigned vendors
  if (user.role === "AGENT") {
    whereClause.AgentVendor = {
      some: { userId: user.id },
    };
  }

  // Fetch vendor, total product count, and low stock count in parallel
  const [vendor, totalProductCount, lowStockCount] = await Promise.all([
    prisma.vendor.findFirst({
      where: whereClause,
      include: {
        User: {
          select: {
            email: true,
            name: true,
          },
        },
        AgentVendor: {
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
        VendorProduct: {
          where: { deletedAt: null },
          include: {
            Product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [
            { isActive: "desc" },
            { stockQty: "asc" }, // Low stock first within each isActive group
          ],
          take: 50, // Limit for performance
        },
        Agreement: {
          where: { deletedAt: null },
          include: {
            Client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            VendorProduct: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
            Agreement: { where: { deletedAt: null } },
          },
        },
      },
    }),
    // Separate count query for total products (all non-deleted)
    prisma.vendorProduct.count({
      where: {
        vendorId,
        deletedAt: null,
      },
    }),
    // Separate count query for low stock products (accurate for inventory decisions)
    prisma.vendorProduct.count({
      where: {
        vendorId,
        deletedAt: null,
        isActive: true,
        stockQty: { lte: 10 },
      },
    }),
  ]);

  if (!vendor) {
    throw new Error(`Vendor not found or access denied`);
  }

  // Map to result type - use any casting for flexibility with Prisma includes
  const typedVendor = vendor as any;

  return {
    // Basic info
    id: vendor.id,
    name: vendor.name,
    region: vendor.region,
    address: vendor.address,
    businessHours: vendor.businessHours,
    notes: vendor.notes,

    // Contact
    contactEmail: vendor.contactEmail,
    contactPhone: vendor.contactPhone,

    // Tracking
    createdAt: vendor.createdAt.toISOString(),

    // Relationships
    user: vendor.User
      ? {
          email: vendor.User.email,
          name: vendor.User.name,
        }
      : null,
    assignedAgents: (vendor as any).AgentVendor.filter(
      (av: any) => av.User != null
    ).map((av: any) => ({
      userId: av.User.id,
      name: av.User.name,
      agentCode: av.User.agentCode,
    })),
    products: (vendor as any).VendorProduct.map((vp: any) => ({
      id: vp.id,
      isActive: vp.isActive,
      stockQty: vp.stockQty,
      vendorSku: vp.vendorSku,
      product: {
        id: vp.Product.id,
        name: vp.Product.name,
      },
    })),
    agreements: (vendor as any).Agreement.map((agreement: any) => ({
      id: agreement.id,
      client: {
        id: agreement.Client.id,
        name: agreement.Client.name,
      },
      priceMode: agreement.priceMode,
      discountPct: agreement.discountPct,
      createdAt: agreement.createdAt.toISOString(),
    })),
    stats: {
      totalProducts: totalProductCount,
      activeProducts: typedVendor._count.VendorProduct,
      lowStockProducts: lowStockCount,
      agreementCount: typedVendor._count.Agreement,
    },
  };
}
