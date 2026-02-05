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

export type VendorProfileDetail = {
  legalName: string;
  tradeName: string | null;
  industry: string | null;
  description: string | null;
  foundedAt: string | null;
  employeeCount: number | null;
  vatNumber: string | null;
  taxCode: string | null;
  chamberOfCommerceRegistration: string | null;
  registeredOfficeAddress: any;
  operatingAddress: any;
  pecEmail: string | null;
  sdiRecipientCode: string | null;
  taxRegime: string | null;
  licenses: string | null;
  adminContact: any;
  commercialContact: any;
  technicalContact: any;
  bankAccountHolder: string | null;
  iban: string | null;
  bankNameAndBranch: string | null;
  preferredPaymentMethod: string | null;
  paymentTerms: string | null;
  invoicingNotes: string | null;
  openingHours: string | null;
  closingDays: string | null;
  warehouseAccess: string | null;
  emergencyContacts: any;
  operationalNotes: string | null;
  dataProcessingConsent: boolean;
  dataProcessingTimestamp: string | null;
  marketingConsent: boolean;
  marketingTimestamp: string | null;
  logoUsageConsent: boolean;
  logoUsageTimestamp: string | null;
  consentVersion: string | null;
  Document: Array<{
    id: string;
    type: string;
    label: string;
    fileName: string | null;
    notes: string | null;
    required: boolean;
  }>;
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
  VendorProfile: VendorProfileDetail | null;
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
      Vendor: {
        select: {
          id: true,
          name: true,
          VendorProfile: {
            select: {
              legalName: true,
              tradeName: true,
              industry: true,
              description: true,
              foundedAt: true,
              employeeCount: true,
              vatNumber: true,
              taxCode: true,
              chamberOfCommerceRegistration: true,
              registeredOfficeAddress: true,
              operatingAddress: true,
              pecEmail: true,
              sdiRecipientCode: true,
              taxRegime: true,
              licenses: true,
              adminContact: true,
              commercialContact: true,
              technicalContact: true,
              bankAccountHolder: true,
              iban: true,
              bankNameAndBranch: true,
              preferredPaymentMethod: true,
              paymentTerms: true,
              invoicingNotes: true,
              openingHours: true,
              closingDays: true,
              warehouseAccess: true,
              emergencyContacts: true,
              operationalNotes: true,
              dataProcessingConsent: true,
              dataProcessingTimestamp: true,
              marketingConsent: true,
              marketingTimestamp: true,
              logoUsageConsent: true,
              logoUsageTimestamp: true,
              consentVersion: true,
              Document: {
                select: {
                  id: true,
                  type: true,
                  label: true,
                  fileName: true,
                  notes: true,
                  required: true,
                },
              },
            },
          },
        },
      },
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

  const profile = user.Vendor?.VendorProfile ?? null;

  return {
    ...user,
    Vendor: user.Vendor ? { id: user.Vendor.id, name: user.Vendor.name } : null,
    createdAt: user.createdAt.toISOString(),
    approvedAt: user.approvedAt?.toISOString() ?? null,
    VendorProfile: profile
      ? {
          ...profile,
          foundedAt: profile.foundedAt?.toISOString() ?? null,
          dataProcessingTimestamp:
            profile.dataProcessingTimestamp?.toISOString() ?? null,
          marketingTimestamp:
            profile.marketingTimestamp?.toISOString() ?? null,
          logoUsageTimestamp:
            profile.logoUsageTimestamp?.toISOString() ?? null,
        }
      : null,
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
