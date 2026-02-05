"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

// Required documents for driver activation
const REQUIRED_DOCUMENT_TYPES: string[] = [
  "ID_DOCUMENT",
  "DRIVING_LICENSE",
  "SIGNED_GDPR_FORM",
];

export type DriverDashboardProfile = {
  // Base driver info
  id: string;
  name: string;
  taxCode: string | null;
  onboardingStatus: string;
  approvedAt: string | null;

  // Company link
  companyLink: {
    id: string;
    status: string;
    vendorId: string | null;
    vendorName: string | null;
    linkedAt: string;
  } | null;

  // Expiring licenses (within 90 days)
  expiringLicenses: Array<{
    id: string;
    licenseType: string;
    licenseNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;

  // Document checklist
  documents: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
    hasFile: boolean;
    isVerified: boolean;
  }>;

  // Activation readiness
  activationReadiness: {
    isReady: boolean;
    missingRequirements: string[];
    hasAllRequiredDocs: boolean;
    hasActiveCompanyLink: boolean;
    hasValidLicenses: boolean;
  };
};

/**
 * Fetch driver profile data for dashboard display.
 * Includes onboarding status, licenses, documents, company link, and activation readiness.
 */
export async function fetchDriverDashboardProfile(): Promise<DriverDashboardProfile | null> {
  const user = await currentUser();

  if (!user?.driverId) {
    return null;
  }

  const driver = await prisma.driver.findUnique({
    where: { id: user.driverId },
    select: {
      id: true,
      name: true,
      taxCode: true,
      onboardingStatus: true,
      approvedAt: true,
      licenses: {
        select: {
          id: true,
          licenseType: true,
          licenseNumber: true,
          expiryDate: true,
          isVerified: true,
        },
        orderBy: { expiryDate: "asc" },
      },
      documents: {
        select: {
          id: true,
          type: true,
          label: true,
          required: true,
          fileUrl: true,
          isVerified: true,
        },
      },
      companyLinks: {
        where: {
          status: { in: ["PENDING", "ACTIVE"] },
        },
        select: {
          id: true,
          status: true,
          vendorId: true,
          linkedAt: true,
          vendor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { linkedAt: "desc" },
      },
    },
  });

  if (!driver) {
    return null;
  }

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Find licenses expiring within 90 days (excludes already expired)
  const expiringLicenses = driver.licenses
    .filter((lic) => lic.expiryDate > now && lic.expiryDate <= ninetyDaysFromNow)
    .map((lic) => {
      const daysUntilExpiry = Math.ceil(
        (lic.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      return {
        id: lic.id,
        licenseType: lic.licenseType,
        licenseNumber: lic.licenseNumber,
        expiryDate: lic.expiryDate.toISOString(),
        daysUntilExpiry,
      };
    });

  // Map documents to checklist format
  const documents = driver.documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    label: doc.label,
    required: doc.required,
    hasFile: !!doc.fileUrl,
    isVerified: doc.isVerified,
  }));

  // Get company link - prefer ACTIVE over PENDING
  const companyLink =
    driver.companyLinks.find((link) => link.status === "ACTIVE") ??
    driver.companyLinks[0] ??
    null;

  // Calculate activation readiness
  const presentDocTypes: string[] = documents.map((d) => d.type);
  const missingRequiredDocs = REQUIRED_DOCUMENT_TYPES.filter(
    (type) => !presentDocTypes.includes(type)
  );
  const allRequiredDocsHaveFiles =
    missingRequiredDocs.length === 0 &&
    documents
      .filter((d) => REQUIRED_DOCUMENT_TYPES.includes(d.type as string))
      .every((d) => d.hasFile);

  // Check if any company link is ACTIVE (not just the selected one)
  const hasActiveCompanyLink = driver.companyLinks.some(
    (link) => link.status === "ACTIVE"
  );
  const hasValidLicenses =
    driver.licenses.length > 0 &&
    driver.licenses.some((lic) => lic.expiryDate > now);

  const missingRequirements: string[] = [];
  if (missingRequiredDocs.length > 0) {
    missingRequirements.push(
      `Missing documents: ${missingRequiredDocs.map((t) => t.replace(/_/g, " ")).join(", ")}`
    );
  }
  if (!allRequiredDocsHaveFiles && missingRequiredDocs.length === 0) {
    const docsNeedingUpload = documents
      .filter((d) => REQUIRED_DOCUMENT_TYPES.includes(d.type) && !d.hasFile)
      .map((d) => d.type.replace(/_/g, " "));
    if (docsNeedingUpload.length > 0) {
      missingRequirements.push(
        `Documents need upload: ${docsNeedingUpload.join(", ")}`
      );
    }
  }
  if (!hasActiveCompanyLink) {
    missingRequirements.push("Company link pending activation");
  }
  if (!hasValidLicenses) {
    missingRequirements.push("No valid licenses on file");
  }

  const isReady =
    allRequiredDocsHaveFiles && hasActiveCompanyLink && hasValidLicenses;

  return {
    id: driver.id,
    name: driver.name,
    taxCode: driver.taxCode,
    onboardingStatus: driver.onboardingStatus,
    approvedAt: driver.approvedAt?.toISOString() ?? null,
    companyLink: companyLink
      ? {
          id: companyLink.id,
          status: companyLink.status,
          vendorId: companyLink.vendorId,
          vendorName: companyLink.vendor?.name ?? null,
          linkedAt: companyLink.linkedAt.toISOString(),
        }
      : null,
    expiringLicenses,
    documents,
    activationReadiness: {
      isReady,
      missingRequirements,
      hasAllRequiredDocs: missingRequiredDocs.length === 0,
      hasActiveCompanyLink,
      hasValidLicenses,
    },
  };
}
