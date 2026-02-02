"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserStatus, Role } from "@prisma/client";

export type ApprovalFilters = {
  status?: UserStatus;
  role?: Role;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type PendingUserResult = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
  onboardingData: any;
  createdAt: string;
};

export type ApprovalDetailResult = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
  onboardingData: any;
  createdAt: string;
  approvedAt: string | null;
  approvedByUserId: string | null;
  agentCode: string | null;
  vendorId: string | null;
  clientId: string | null;
  driverId: string | null;
  Vendor: { id: string; name: string } | null;
  Client: { id: string; name: string } | null;
  Driver: { id: string; name: string } | null;
  VendorUser: Array<{
    vendorId: string;
    role: string;
    Vendor: { id: string; name: string };
  }>;
};

export async function fetchApprovalDetail(
  userId: string,
): Promise<ApprovalDetailResult | null> {
  await requireRole("ADMIN");

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      onboardingData: true,
      createdAt: true,
      approvedAt: true,
      approvedByUserId: true,
      agentCode: true,
      vendorId: true,
      clientId: true,
      driverId: true,
      Vendor: { select: { id: true, name: true } },
      Client: { select: { id: true, name: true } },
      Driver: { select: { id: true, name: true } },
      VendorUser: {
        select: {
          vendorId: true,
          role: true,
          Vendor: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    approvedAt: user.approvedAt?.toISOString() ?? null,
  };
}

export async function fetchPendingUsers(
  filters: ApprovalFilters = {},
): Promise<{
  data: PendingUserResult[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}> {
  await requireRole("ADMIN");

  const { status = "PENDING", role, search, page = 1, pageSize = 20 } = filters;

  const where: any = {
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        onboardingData: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
    pageSize,
  };
}
