"use server";

import { z } from "zod";
import { auth } from "../../auth";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// ─── Vendor Onboarding ────────────────────────────────────────────────────────

import {
  vendorOnboardingSchema,
  type VendorOnboardingInput,
} from "@/lib/schemas/vendor-onboarding";

export type { VendorOnboardingInput };

const REQUIRED_DOC_TYPES = new Set([
  "CHAMBER_OF_COMMERCE_EXTRACT",
  "LEGAL_REP_ID",
  "SIGNED_CONTRACT",
  "SIGNED_GDPR_FORM",
]);

export async function submitVendorOnboarding(
  data: VendorOnboardingInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Idempotency: check if user already submitted onboarding
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, role: true, onboardingData: true },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    if (
      existingUser.role !== "CLIENT" ||
      (existingUser.onboardingData !== null &&
        existingUser.status === "PENDING")
    ) {
      if (existingUser.onboardingData !== null) {
        return { success: false, error: "Onboarding already submitted" };
      }
    }

    // Validate input
    const validation = vendorOnboardingSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    const validated = validation.data;
    const now = new Date();

    // Format address string for legacy Vendor.address field
    const addr = validated.registeredOfficeAddress;
    const legacyAddress = addr
      ? [addr.street, addr.city, addr.province, addr.postalCode]
          .filter(Boolean)
          .join(", ")
      : null;

    // Create Vendor + VendorProfile + VendorDocument[] + VendorUser + update User
    await prisma.$transaction(async (tx) => {
      const vendorId = createId();
      const profileId = createId();

      // 1. Create Vendor (legacy fields populated for backward compat)
      await tx.vendor.create({
        data: {
          id: vendorId,
          name: validated.tradeName || validated.legalName,
          contactEmail: validated.adminContact.email,
          contactPhone: validated.adminContact.phone,
          address: legacyAddress,
          businessHours: validated.openingHours || null,
        },
      });

      // 2. Create VendorProfile (all detailed onboarding data)
      await tx.vendorProfile.create({
        data: {
          id: profileId,
          vendorId,
          // Section 1: General
          legalName: validated.legalName,
          tradeName: validated.tradeName || null,
          industry: validated.industry || null,
          description: validated.description || null,
          foundedAt: validated.foundedAt ? new Date(validated.foundedAt) : null,
          employeeCount: validated.employeeCount ?? null,
          // Section 2: Legal & Tax
          vatNumber: validated.vatNumber || null,
          taxCode: validated.taxCode || null,
          chamberOfCommerceRegistration:
            validated.chamberOfCommerceRegistration || null,
          registeredOfficeAddress:
            validated.registeredOfficeAddress ?? undefined,
          operatingAddress: validated.operatingAddress ?? undefined,
          pecEmail: validated.pecEmail || null,
          sdiRecipientCode: validated.sdiRecipientCode || null,
          taxRegime: validated.taxRegime || null,
          licenses: validated.licenses || null,
          // Section 3: Contacts
          adminContact: validated.adminContact,
          commercialContact: validated.commercialContact,
          technicalContact: validated.technicalContact ?? undefined,
          // Section 4: Banking
          bankAccountHolder: validated.bankAccountHolder || null,
          iban: validated.iban || null,
          bankNameAndBranch: validated.bankNameAndBranch || null,
          preferredPaymentMethod: validated.preferredPaymentMethod ?? undefined,
          paymentTerms: validated.paymentTerms ?? undefined,
          invoicingNotes: validated.invoicingNotes || null,
          // Section 6: Operational
          openingHours: validated.openingHours || null,
          closingDays: validated.closingDays || null,
          warehouseAccess: validated.warehouseAccess || null,
          emergencyContacts: validated.emergencyContacts ?? undefined,
          operationalNotes: validated.operationalNotes || null,
          // Section 7: Consents (timestamps auto-set server-side)
          dataProcessingConsent: validated.dataProcessingConsent,
          dataProcessingTimestamp: validated.dataProcessingConsent ? now : null,
          marketingConsent: validated.marketingConsent,
          marketingTimestamp: validated.marketingConsent ? now : null,
          logoUsageConsent: validated.logoUsageConsent,
          logoUsageTimestamp: validated.logoUsageConsent ? now : null,
          consentVersion: "1.0",
        },
      });

      // 3. Create VendorDocument metadata rows
      if (validated.documents?.length) {
        await tx.vendorDocument.createMany({
          data: validated.documents.map((doc) => ({
            id: createId(),
            vendorProfileId: profileId,
            type: doc.type,
            label: doc.label,
            fileName: doc.fileName || null,
            notes: doc.notes || null,
            required: REQUIRED_DOC_TYPES.has(doc.type),
          })),
        });
      }

      // 4. Create VendorUser junction (OWNER)
      await tx.vendorUser.create({
        data: { vendorId, userId, role: "OWNER" },
      });

      // 5. Update User: set role, status, store onboarding snapshot, link vendor
      await tx.user.update({
        where: { id: userId },
        data: {
          name: validated.tradeName || validated.legalName,
          role: "VENDOR",
          status: "PENDING",
          vendorId,
          onboardingData: JSON.parse(JSON.stringify(validated)),
        },
      });
    });

    // Audit log — no PII (no emails, phones, IBAN, tax codes)
    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.ONBOARDING_SUBMITTED,
      diff: {
        role: "VENDOR",
        legalName: validated.legalName,
      },
    });

    revalidatePath("/pending");

    return { success: true };
  } catch (error) {
    // Log only error message and userId — no form data
    console.error(
      "Vendor onboarding error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit onboarding",
    };
  }
}

// ─── Client Onboarding ────────────────────────────────────────────────────────

const clientOnboardingSchema = z.object({
  businessName: z
    .string()
    .min(1, "Business or contact name is required")
    .max(255),
  region: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  contactPerson: z.string().max(255).optional(),
  email: z
    .string()
    .email("Invalid email")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  vendorName: z.string().max(255).optional(),
});

export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;

export async function submitClientOnboarding(
  data: ClientOnboardingInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Idempotency check
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, role: true, onboardingData: true },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    if (existingUser.onboardingData !== null) {
      return { success: false, error: "Onboarding already submitted" };
    }

    // Validate input
    const validation = clientOnboardingSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    const validated = validation.data;

    // Look up vendor if specified
    let vendorId: string | null = null;
    if (validated.vendorName?.trim()) {
      const vendor = await prisma.vendor.findFirst({
        where: {
          name: { contains: validated.vendorName.trim(), mode: "insensitive" },
          deletedAt: null,
        },
        select: { id: true },
      });
      if (vendor) {
        vendorId = vendor.id;
      }
    }

    // Create Client + update User + optional ClientVendor in a transaction
    await prisma.$transaction(async (tx) => {
      const clientId = createId();

      // Create Client record
      await tx.client.create({
        data: {
          id: clientId,
          name: validated.businessName,
          region: validated.region || null,
          notes: validated.notes || null,
          contactPerson: validated.contactPerson || null,
          email: validated.email || null,
          phone: validated.phone || null,
          fullAddress: validated.address || null,
        },
      });

      // Update User
      await tx.user.update({
        where: { id: userId },
        data: {
          name: validated.contactPerson || validated.businessName,
          role: "CLIENT",
          status: "PENDING",
          clientId,
          onboardingData: validated as any,
        },
      });

      // If vendor found, create a pending ClientVendor link
      if (vendorId) {
        await tx.clientVendor.create({
          data: {
            id: createId(),
            clientId,
            vendorId,
            status: "PENDING",
          },
        });
      }
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.ONBOARDING_SUBMITTED,
      diff: {
        role: "CLIENT",
        businessName: validated.businessName,
        vendorName: validated.vendorName || null,
      },
    });

    revalidatePath("/pending");

    return { success: true };
  } catch (error) {
    console.error("Client onboarding error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit onboarding",
    };
  }
}

// ─── Driver Onboarding ────────────────────────────────────────────────────────

const driverOnboardingSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  phone: z.string().min(1, "Phone number is required").max(50),
  region: z.string().max(100).optional(),
  vehicleInfo: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type DriverOnboardingInput = z.infer<typeof driverOnboardingSchema>;

export async function submitDriverOnboarding(
  data: DriverOnboardingInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Idempotency check
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, role: true, onboardingData: true },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    if (existingUser.onboardingData !== null) {
      return { success: false, error: "Onboarding already submitted" };
    }

    // Validate input
    const validation = driverOnboardingSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    const validated = validation.data;

    // Create Driver + update User in a transaction
    await prisma.$transaction(async (tx) => {
      const driverId = createId();

      // Create Driver record
      await tx.driver.create({
        data: {
          id: driverId,
          name: validated.fullName,
          phone: validated.phone || null,
        },
      });

      // Update User
      await tx.user.update({
        where: { id: userId },
        data: {
          name: validated.fullName,
          role: "DRIVER",
          status: "PENDING",
          driverId,
          onboardingData: validated as any,
        },
      });
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.ONBOARDING_SUBMITTED,
      diff: { role: "DRIVER", fullName: validated.fullName },
    });

    revalidatePath("/pending");

    return { success: true };
  } catch (error) {
    console.error("Driver onboarding error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit onboarding",
    };
  }
}

// ─── Agent Onboarding ─────────────────────────────────────────────────────────

const agentOnboardingSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  phone: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export type AgentOnboardingInput = z.infer<typeof agentOnboardingSchema>;

/**
 * Generate a unique agent code from the user's name.
 * Format: uppercase first name + random 4-digit suffix if needed.
 */
async function generateAgentCode(fullName: string): Promise<string> {
  const base = fullName
    .trim()
    .split(/\s+/)[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 10);

  const code = base || "AGENT";

  // Check uniqueness, append suffix if needed
  const existing = await prisma.user.findUnique({
    where: { agentCode: code },
    select: { id: true },
  });

  if (!existing) return code;

  // Add random suffix
  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const candidate = `${code}${suffix}`;
    const taken = await prisma.user.findUnique({
      where: { agentCode: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  // Fallback to cuid-based code
  return `${code}${createId().slice(0, 6).toUpperCase()}`;
}

export async function submitAgentOnboarding(
  data: AgentOnboardingInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Idempotency check
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, role: true, onboardingData: true },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    if (existingUser.onboardingData !== null) {
      return { success: false, error: "Onboarding already submitted" };
    }

    // Validate input
    const validation = agentOnboardingSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    const validated = validation.data;

    // Generate unique agent code
    const agentCode = await generateAgentCode(validated.fullName);

    // Update User
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: validated.fullName,
        role: "AGENT",
        status: "PENDING",
        agentCode,
        onboardingData: validated as any,
      },
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.ONBOARDING_SUBMITTED,
      diff: { role: "AGENT", fullName: validated.fullName, agentCode },
    });

    revalidatePath("/pending");

    return { success: true };
  } catch (error) {
    console.error("Agent onboarding error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit onboarding",
    };
  }
}
