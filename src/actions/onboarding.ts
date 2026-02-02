"use server";

import { z } from "zod";
import { auth } from "../../auth";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// ─── Vendor Onboarding ────────────────────────────────────────────────────────

const vendorOnboardingSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(255),
  contactEmail: z
    .string()
    .email("Invalid email")
    .max(255)
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  businessHours: z.string().max(255).optional(),
});

export type VendorOnboardingInput = z.infer<typeof vendorOnboardingSchema>;

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
      // Already submitted — role has been set or onboarding data exists
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

    // Create Vendor + VendorUser + update User in a transaction
    await prisma.$transaction(async (tx) => {
      const vendorId = createId();

      // Create Vendor record
      await tx.vendor.create({
        data: {
          id: vendorId,
          name: validated.businessName,
          contactEmail: validated.contactEmail || null,
          contactPhone: validated.contactPhone || null,
          address: validated.address || null,
          region: validated.region || null,
          businessHours: validated.businessHours || null,
        },
      });

      // Create VendorUser junction (OWNER)
      await tx.vendorUser.create({
        data: {
          vendorId,
          userId,
          role: "OWNER",
        },
      });

      // Update User: set role, status, store onboarding data, link vendor
      await tx.user.update({
        where: { id: userId },
        data: {
          role: "VENDOR",
          status: "PENDING",
          vendorId,
          onboardingData: validated as any,
        },
      });
    });

    await logAction({
      entityType: "User",
      entityId: userId,
      action: AuditAction.ONBOARDING_SUBMITTED,
      diff: { role: "VENDOR", businessName: validated.businessName },
    });

    revalidatePath("/pending");

    return { success: true };
  } catch (error) {
    console.error("Vendor onboarding error:", error);
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
