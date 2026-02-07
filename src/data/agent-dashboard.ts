"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

// Required documents for agent activation
const REQUIRED_DOCUMENT_TYPES: string[] = [
  "ID_DOCUMENT",
  "TAX_CODE_CARD",
  "CHAMBER_OF_COMMERCE_EXTRACT",
  "ENASARCO_CERTIFICATE",
];

export type AgentDashboardProfile = {
  // Base agent info
  id: string;
  name: string;
  agentCode: string | null;
  taxCode: string;
  status: string;
  approvedAt: string | null;

  // Professional info
  agentType: string;
  coveredTerritories: string[];
  sectors: string[];
  chamberName: string | null;
  chamberRegistrationNumber: string | null;
  enasarcoNumber: string | null;

  // Document checklist
  documents: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
    hasFile: boolean;
    isVerified: boolean;
  }>;

  // Expiring documents (within 90 days)
  expiringDocuments: Array<{
    id: string;
    type: string;
    label: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;

  // Activation readiness
  activationReadiness: {
    isReady: boolean;
    missingRequirements: string[];
    hasAllRequiredDocs: boolean;
    hasProfile: boolean;
  };
};

/**
 * Fetch agent profile data for dashboard display.
 * Includes status, professional info, territories, sectors, documents, and activation readiness.
 */
export async function fetchAgentDashboardProfile(): Promise<AgentDashboardProfile | null> {
  const user = await currentUser();

  if (!user?.agentId) {
    return null;
  }

  const agent = await prisma.agent.findUnique({
    where: { id: user.agentId },
    select: {
      id: true,
      name: true,
      agentCode: true,
      taxCode: true,
      status: true,
      approvedAt: true,
      profile: {
        select: {
          agentType: true,
          coveredTerritories: true,
          sectors: true,
          chamberName: true,
          chamberRegistrationNumber: true,
          enasarcoNumber: true,
        },
      },
      documents: {
        select: {
          id: true,
          type: true,
          label: true,
          required: true,
          fileUrl: true,
          isVerified: true,
          expiryDate: true,
        },
      },
    },
  });

  if (!agent) {
    return null;
  }

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Find documents expiring within 90 days (excludes already expired)
  const expiringDocuments = agent.documents
    .filter(
      (doc) =>
        doc.expiryDate && doc.expiryDate > now && doc.expiryDate <= ninetyDaysFromNow
    )
    .map((doc) => {
      const daysUntilExpiry = Math.ceil(
        (doc.expiryDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      return {
        id: doc.id,
        type: doc.type,
        label: doc.label,
        expiryDate: doc.expiryDate!.toISOString(),
        daysUntilExpiry,
      };
    });

  // Map documents to checklist format
  const documents = agent.documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    label: doc.label,
    required: doc.required,
    hasFile: !!doc.fileUrl,
    isVerified: doc.isVerified,
  }));

  // Calculate activation readiness
  const presentDocTypes: string[] = documents.map((d) => d.type);
  const missingRequiredDocs = REQUIRED_DOCUMENT_TYPES.filter(
    (type) => !presentDocTypes.includes(type)
  );
  const allRequiredDocsHaveFiles =
    missingRequiredDocs.length === 0 &&
    documents
      .filter((d) => REQUIRED_DOCUMENT_TYPES.includes(d.type))
      .every((d) => d.hasFile);

  const hasProfile = !!agent.profile;

  const missingRequirements: string[] = [];
  if (!hasProfile) {
    missingRequirements.push("Profile not complete");
  }
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

  const isReady = hasProfile && allRequiredDocsHaveFiles;

  return {
    id: agent.id,
    name: agent.name,
    agentCode: agent.agentCode,
    taxCode: agent.taxCode,
    status: agent.status,
    approvedAt: agent.approvedAt?.toISOString() ?? null,

    // Professional info from profile
    agentType: agent.profile?.agentType ?? "UNKNOWN",
    coveredTerritories: agent.profile?.coveredTerritories ?? [],
    sectors: agent.profile?.sectors ?? [],
    chamberName: agent.profile?.chamberName ?? null,
    chamberRegistrationNumber: agent.profile?.chamberRegistrationNumber ?? null,
    enasarcoNumber: agent.profile?.enasarcoNumber ?? null,

    documents,
    expiringDocuments,
    activationReadiness: {
      isReady,
      missingRequirements,
      hasAllRequiredDocs: missingRequiredDocs.length === 0,
      hasProfile,
    },
  };
}
