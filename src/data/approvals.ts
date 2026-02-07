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

export type ClientProfileDetail = {
  clientType: string;
  // Personal details
  fullName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  personalTaxCode: string | null;
  personalPhone: string | null;
  personalEmail: string | null;
  personalPecEmail: string | null;
  residentialAddress: any;
  domicileAddress: any;
  idDocumentType: string | null;
  idDocumentNumber: string | null;
  idDocumentExpiry: string | null;
  idDocumentIssuer: string | null;
  // Company details
  legalName: string | null;
  tradeName: string | null;
  vatNumber: string | null;
  companyTaxCode: string | null;
  sdiRecipientCode: string | null;
  companyPecEmail: string | null;
  registeredOfficeAddress: any;
  operatingAddress: any;
  adminContact: any;
  operationalContact: any;
  // Billing
  invoicingNotes: string | null;
  // Operational
  preferredContactHours: string | null;
  specialRequirements: string | null;
  operationalNotes: string | null;
  // Consents
  dataProcessingConsent: boolean;
  dataProcessingTimestamp: string | null;
  marketingConsent: boolean;
  marketingTimestamp: string | null;
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

export type DriverProfileDetail = {
  // Driver base
  id: string;
  taxCode: string | null;
  onboardingStatus: string;
  approvedAt: string | null;
  createdAt: string;
  // Personal Data
  fullName: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  // Addresses
  residentialAddress: any;
  domicileAddress: any;
  // Contact
  phone: string;
  email: string;
  pecEmail: string | null;
  // Identity Document
  idDocumentType: string;
  idDocumentNumber: string;
  idDocumentExpiry: string;
  idDocumentIssuer: string;
  // Consents
  dataProcessingConsent: boolean;
  dataProcessingTimestamp: string | null;
  operationalCommsConsent: boolean;
  operationalCommsTimestamp: string | null;
  geolocationConsent: boolean;
  geolocationTimestamp: string | null;
  imageUsageConsent: boolean;
  imageUsageTimestamp: string | null;
  consentVersion: string | null;
  // Licenses
  licenses: Array<{
    id: string;
    licenseType: string;
    licenseNumber: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
    isCertification: boolean;
    isVerified: boolean;
  }>;
  // Documents
  documents: Array<{
    id: string;
    type: string;
    label: string;
    fileName: string | null;
    required: boolean;
    fileUrl: string | null;
    uploadedAt: string | null;
    expiryDate: string | null;
    isVerified: boolean;
  }>;
  // Company link
  companyLink: {
    id: string;
    status: string;
    companyType: string;
    vendorId: string | null;
    vendorName: string | null;
    linkedAt: string;
  } | null;
};

export type AgentProfileDetail = {
  // Agent base
  id: string;
  taxCode: string;
  agentCode: string | null;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  // Personal Data
  fullName: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  // Addresses
  residentialAddress: any;
  domicileAddress: any;
  // Contact
  phone: string;
  email: string;
  pecEmail: string | null;
  // Professional
  agentType: string;
  chamberRegistrationNumber: string;
  chamberRegistrationDate: string;
  chamberName: string;
  professionalAssociations: string | null;
  coveredTerritories: string[];
  sectors: string[];
  // Fiscal
  vatNumber: string;
  taxRegime: string;
  atecoCode: string;
  sdiRecipientCode: string;
  invoicingPecEmail: string;
  enasarcoNumber: string;
  enasarcoRegistrationDate: string;
  // Banking
  bankAccountHolder: string;
  iban: string;
  bankNameBranch: string;
  preferredPaymentMethod: string;
  commissionNotes: string | null;
  // Consents
  dataProcessingConsent: boolean;
  dataProcessingTimestamp: string | null;
  operationalCommsConsent: boolean;
  operationalCommsTimestamp: string | null;
  commercialImageConsent: boolean;
  commercialImageTimestamp: string | null;
  consentVersion: string | null;
  // Documents
  documents: Array<{
    id: string;
    type: string;
    label: string;
    fileName: string | null;
    notes: string | null;
    required: boolean;
    fileUrl: string | null;
    uploadedAt: string | null;
    expiryDate: string | null;
    isVerified: boolean;
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
  Agent: { id: string; name: string } | null;
  agentId: string | null;
  VendorUser: Array<{
    vendorId: string;
    role: string;
    Vendor: { id: string; name: string };
  }>;
  VendorProfile: VendorProfileDetail | null;
  ClientProfile: ClientProfileDetail | null;
  DriverProfile: DriverProfileDetail | null;
  AgentProfile: AgentProfileDetail | null;
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
      agentId: true,
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
      Client: {
        select: {
          id: true,
          name: true,
          ClientProfile: {
            select: {
              clientType: true,
              fullName: true,
              birthDate: true,
              birthPlace: true,
              personalTaxCode: true,
              personalPhone: true,
              personalEmail: true,
              personalPecEmail: true,
              residentialAddress: true,
              domicileAddress: true,
              idDocumentType: true,
              idDocumentNumber: true,
              idDocumentExpiry: true,
              idDocumentIssuer: true,
              legalName: true,
              tradeName: true,
              vatNumber: true,
              companyTaxCode: true,
              sdiRecipientCode: true,
              companyPecEmail: true,
              registeredOfficeAddress: true,
              operatingAddress: true,
              adminContact: true,
              operationalContact: true,
              invoicingNotes: true,
              preferredContactHours: true,
              specialRequirements: true,
              operationalNotes: true,
              dataProcessingConsent: true,
              dataProcessingTimestamp: true,
              marketingConsent: true,
              marketingTimestamp: true,
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
      Driver: {
        select: {
          id: true,
          name: true,
          taxCode: true,
          onboardingStatus: true,
          approvedAt: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
              birthDate: true,
              birthPlace: true,
              nationality: true,
              residentialAddress: true,
              domicileAddress: true,
              phone: true,
              email: true,
              pecEmail: true,
              idDocumentType: true,
              idDocumentNumber: true,
              idDocumentExpiry: true,
              idDocumentIssuer: true,
              dataProcessingConsent: true,
              dataProcessingTimestamp: true,
              operationalCommsConsent: true,
              operationalCommsTimestamp: true,
              geolocationConsent: true,
              geolocationTimestamp: true,
              imageUsageConsent: true,
              imageUsageTimestamp: true,
              consentVersion: true,
            },
          },
          licenses: {
            select: {
              id: true,
              licenseType: true,
              licenseNumber: true,
              issueDate: true,
              expiryDate: true,
              issuingAuthority: true,
              isCertification: true,
              isVerified: true,
            },
            orderBy: { expiryDate: "asc" },
          },
          documents: {
            select: {
              id: true,
              type: true,
              label: true,
              fileName: true,
              required: true,
              fileUrl: true,
              uploadedAt: true,
              expiryDate: true,
              isVerified: true,
            },
          },
          companyLinks: {
            select: {
              id: true,
              status: true,
              companyType: true,
              vendorId: true,
              linkedAt: true,
              vendor: {
                select: { id: true, name: true },
              },
            },
            where: {
              status: { in: ["PENDING", "ACTIVE"] },
            },
            take: 1,
          },
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          taxCode: true,
          agentCode: true,
          status: true,
          approvedAt: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
              birthDate: true,
              birthPlace: true,
              nationality: true,
              residentialAddress: true,
              domicileAddress: true,
              phone: true,
              email: true,
              pecEmail: true,
              agentType: true,
              chamberRegistrationNumber: true,
              chamberRegistrationDate: true,
              chamberName: true,
              professionalAssociations: true,
              coveredTerritories: true,
              sectors: true,
              vatNumber: true,
              taxRegime: true,
              atecoCode: true,
              sdiRecipientCode: true,
              invoicingPecEmail: true,
              enasarcoNumber: true,
              enasarcoRegistrationDate: true,
              bankAccountHolder: true,
              iban: true,
              bankNameBranch: true,
              preferredPaymentMethod: true,
              commissionNotes: true,
              dataProcessingConsent: true,
              dataProcessingTimestamp: true,
              operationalCommsConsent: true,
              operationalCommsTimestamp: true,
              commercialImageConsent: true,
              commercialImageTimestamp: true,
              consentVersion: true,
            },
          },
          documents: {
            select: {
              id: true,
              type: true,
              label: true,
              fileName: true,
              notes: true,
              required: true,
              fileUrl: true,
              uploadedAt: true,
              expiryDate: true,
              isVerified: true,
            },
          },
        },
      },
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

  const vendorProfile = user.Vendor?.VendorProfile ?? null;
  const clientProfile = user.Client?.ClientProfile ?? null;
  const driver = user.Driver as any;
  const driverProfile = driver?.profile ?? null;
  const driverCompanyLink = driver?.companyLinks?.[0] ?? null;
  const agent = user.agent as any;
  const agentProfile = agent?.profile ?? null;

  return {
    ...user,
    Vendor: user.Vendor ? { id: user.Vendor.id, name: user.Vendor.name } : null,
    Client: user.Client ? { id: user.Client.id, name: user.Client.name } : null,
    Driver: user.Driver ? { id: user.Driver.id, name: user.Driver.name } : null,
    Agent: agent ? { id: agent.id, name: agent.name } : null,
    createdAt: user.createdAt.toISOString(),
    approvedAt: user.approvedAt?.toISOString() ?? null,
    VendorProfile: vendorProfile
      ? {
          ...vendorProfile,
          foundedAt: vendorProfile.foundedAt?.toISOString() ?? null,
          dataProcessingTimestamp:
            vendorProfile.dataProcessingTimestamp?.toISOString() ?? null,
          marketingTimestamp:
            vendorProfile.marketingTimestamp?.toISOString() ?? null,
          logoUsageTimestamp:
            vendorProfile.logoUsageTimestamp?.toISOString() ?? null,
        }
      : null,
    ClientProfile: clientProfile
      ? {
          ...clientProfile,
          birthDate: clientProfile.birthDate?.toISOString() ?? null,
          idDocumentExpiry:
            clientProfile.idDocumentExpiry?.toISOString() ?? null,
          dataProcessingTimestamp:
            clientProfile.dataProcessingTimestamp?.toISOString() ?? null,
          marketingTimestamp:
            clientProfile.marketingTimestamp?.toISOString() ?? null,
        }
      : null,
    DriverProfile: driverProfile
      ? {
          id: driver.id,
          taxCode: driver.taxCode,
          onboardingStatus: driver.onboardingStatus,
          approvedAt: driver.approvedAt?.toISOString() ?? null,
          createdAt: driver.createdAt.toISOString(),
          fullName: driverProfile.fullName,
          birthDate: driverProfile.birthDate.toISOString(),
          birthPlace: driverProfile.birthPlace,
          nationality: driverProfile.nationality,
          residentialAddress: driverProfile.residentialAddress,
          domicileAddress: driverProfile.domicileAddress,
          phone: driverProfile.phone,
          email: driverProfile.email,
          pecEmail: driverProfile.pecEmail,
          idDocumentType: driverProfile.idDocumentType,
          idDocumentNumber: driverProfile.idDocumentNumber,
          idDocumentExpiry: driverProfile.idDocumentExpiry.toISOString(),
          idDocumentIssuer: driverProfile.idDocumentIssuer,
          dataProcessingConsent: driverProfile.dataProcessingConsent,
          dataProcessingTimestamp:
            driverProfile.dataProcessingTimestamp?.toISOString() ?? null,
          operationalCommsConsent: driverProfile.operationalCommsConsent,
          operationalCommsTimestamp:
            driverProfile.operationalCommsTimestamp?.toISOString() ?? null,
          geolocationConsent: driverProfile.geolocationConsent,
          geolocationTimestamp:
            driverProfile.geolocationTimestamp?.toISOString() ?? null,
          imageUsageConsent: driverProfile.imageUsageConsent,
          imageUsageTimestamp:
            driverProfile.imageUsageTimestamp?.toISOString() ?? null,
          consentVersion: driverProfile.consentVersion,
          licenses: driver.licenses.map((lic: any) => ({
            id: lic.id,
            licenseType: lic.licenseType,
            licenseNumber: lic.licenseNumber,
            issueDate: lic.issueDate.toISOString(),
            expiryDate: lic.expiryDate.toISOString(),
            issuingAuthority: lic.issuingAuthority,
            isCertification: lic.isCertification,
            isVerified: lic.isVerified,
          })),
          documents: driver.documents.map((doc: any) => ({
            id: doc.id,
            type: doc.type,
            label: doc.label,
            fileName: doc.fileName,
            required: doc.required,
            fileUrl: doc.fileUrl,
            uploadedAt: doc.uploadedAt?.toISOString() ?? null,
            expiryDate: doc.expiryDate?.toISOString() ?? null,
            isVerified: doc.isVerified,
          })),
          companyLink: driverCompanyLink
            ? {
                id: driverCompanyLink.id,
                status: driverCompanyLink.status,
                companyType: driverCompanyLink.companyType,
                vendorId: driverCompanyLink.vendorId,
                vendorName: driverCompanyLink.vendor?.name ?? null,
                linkedAt: driverCompanyLink.linkedAt.toISOString(),
              }
            : null,
        }
      : null,
    AgentProfile: agentProfile
      ? {
          id: agent.id,
          taxCode: agent.taxCode,
          agentCode: agent.agentCode,
          status: agent.status,
          approvedAt: agent.approvedAt?.toISOString() ?? null,
          createdAt: agent.createdAt.toISOString(),
          fullName: agentProfile.fullName,
          birthDate: agentProfile.birthDate.toISOString(),
          birthPlace: agentProfile.birthPlace,
          nationality: agentProfile.nationality,
          residentialAddress: agentProfile.residentialAddress,
          domicileAddress: agentProfile.domicileAddress,
          phone: agentProfile.phone,
          email: agentProfile.email,
          pecEmail: agentProfile.pecEmail,
          agentType: agentProfile.agentType,
          chamberRegistrationNumber: agentProfile.chamberRegistrationNumber,
          chamberRegistrationDate:
            agentProfile.chamberRegistrationDate.toISOString(),
          chamberName: agentProfile.chamberName,
          professionalAssociations: agentProfile.professionalAssociations,
          coveredTerritories: agentProfile.coveredTerritories,
          sectors: agentProfile.sectors,
          vatNumber: agentProfile.vatNumber,
          taxRegime: agentProfile.taxRegime,
          atecoCode: agentProfile.atecoCode,
          sdiRecipientCode: agentProfile.sdiRecipientCode,
          invoicingPecEmail: agentProfile.invoicingPecEmail,
          enasarcoNumber: agentProfile.enasarcoNumber,
          enasarcoRegistrationDate:
            agentProfile.enasarcoRegistrationDate.toISOString(),
          bankAccountHolder: agentProfile.bankAccountHolder,
          iban: agentProfile.iban,
          bankNameBranch: agentProfile.bankNameBranch,
          preferredPaymentMethod: agentProfile.preferredPaymentMethod,
          commissionNotes: agentProfile.commissionNotes,
          dataProcessingConsent: agentProfile.dataProcessingConsent,
          dataProcessingTimestamp:
            agentProfile.dataProcessingTimestamp?.toISOString() ?? null,
          operationalCommsConsent: agentProfile.operationalCommsConsent,
          operationalCommsTimestamp:
            agentProfile.operationalCommsTimestamp?.toISOString() ?? null,
          commercialImageConsent: agentProfile.commercialImageConsent,
          commercialImageTimestamp:
            agentProfile.commercialImageTimestamp?.toISOString() ?? null,
          consentVersion: agentProfile.consentVersion,
          documents: agent.documents.map((doc: any) => ({
            id: doc.id,
            type: doc.type,
            label: doc.label,
            fileName: doc.fileName,
            notes: doc.notes,
            required: doc.required,
            fileUrl: doc.fileUrl,
            uploadedAt: doc.uploadedAt?.toISOString() ?? null,
            expiryDate: doc.expiryDate?.toISOString() ?? null,
            isVerified: doc.isVerified,
          })),
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
