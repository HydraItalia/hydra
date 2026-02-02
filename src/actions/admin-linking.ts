"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { VendorUserRole } from "@prisma/client";

type ActionResult = { success: true } | { success: false; error: string };

// ---------------------------------------------------------------------------
// A) VendorUser linking (user ↔ vendor)
// ---------------------------------------------------------------------------

export async function linkVendorUser({
  userId,
  vendorId,
  role,
}: {
  userId: string;
  vendorId: string;
  role: VendorUserRole;
}): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const [user, vendor] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true },
      }),
    ]);

    if (!user) return { success: false, error: "User not found" };
    if (!vendor) return { success: false, error: "Vendor not found" };

    await prisma.vendorUser.upsert({
      where: { vendorId_userId: { vendorId, userId } },
      create: { vendorId, userId, role },
      update: { role },
    });

    await logAction({
      entityType: "VendorUser",
      entityId: `${vendorId}:${userId}`,
      action: AuditAction.VENDOR_USER_LINKED,
      diff: { vendorId, userId, role },
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/approvals/${userId}`);
    revalidatePath("/dashboard/vendors");

    return { success: true };
  } catch (error) {
    console.error("Error linking vendor user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to link vendor user",
    };
  }
}

export async function unlinkVendorUser({
  userId,
  vendorId,
}: {
  userId: string;
  vendorId: string;
}): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    // deleteMany is idempotent — no error if row doesn't exist
    const result = await prisma.vendorUser.deleteMany({
      where: { vendorId, userId },
    });

    if (result.count === 0) {
      return { success: true }; // Already unlinked — idempotent
    }

    await logAction({
      entityType: "VendorUser",
      entityId: `${vendorId}:${userId}`,
      action: AuditAction.VENDOR_USER_UNLINKED,
      diff: { vendorId, userId },
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/approvals/${userId}`);
    revalidatePath("/dashboard/vendors");

    return { success: true };
  } catch (error) {
    console.error("Error unlinking vendor user:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unlink vendor user",
    };
  }
}

export async function updateVendorUserRole({
  userId,
  vendorId,
  role,
}: {
  userId: string;
  vendorId: string;
  role: VendorUserRole;
}): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const existing = await prisma.vendorUser.findUnique({
      where: { vendorId_userId: { vendorId, userId } },
      select: { role: true },
    });

    if (!existing) {
      return { success: false, error: "VendorUser link not found" };
    }

    if (existing.role === role) {
      return { success: true }; // Already the target role — idempotent
    }

    await prisma.vendorUser.update({
      where: { vendorId_userId: { vendorId, userId } },
      data: { role },
    });

    await logAction({
      entityType: "VendorUser",
      entityId: `${vendorId}:${userId}`,
      action: AuditAction.VENDOR_USER_ROLE_UPDATED,
      diff: { vendorId, userId, from: existing.role, to: role },
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath(`/dashboard/approvals/${userId}`);
    revalidatePath("/dashboard/vendors");

    return { success: true };
  } catch (error) {
    console.error("Error updating vendor user role:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update vendor user role",
    };
  }
}

// ---------------------------------------------------------------------------
// B) ClientVendor approval workflow (client ↔ vendor)
// ---------------------------------------------------------------------------

export async function createClientVendorLink({
  clientId,
  vendorId,
}: {
  clientId: string;
  vendorId: string;
}): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const [client, vendor] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true },
      }),
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true },
      }),
    ]);

    if (!client) return { success: false, error: "Client not found" };
    if (!vendor) return { success: false, error: "Vendor not found" };

    // Upsert: if link already exists, leave it as-is (idempotent)
    await prisma.clientVendor.upsert({
      where: { clientId_vendorId: { clientId, vendorId } },
      create: { clientId, vendorId, status: "PENDING" },
      update: {}, // No-op if exists
    });

    await logAction({
      entityType: "ClientVendor",
      entityId: `${clientId}:${vendorId}`,
      action: AuditAction.CLIENT_VENDOR_CREATED,
      diff: { clientId, vendorId },
    });

    revalidatePath("/dashboard/approvals");

    return { success: true };
  } catch (error) {
    console.error("Error creating client-vendor link:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create client-vendor link",
    };
  }
}

export async function approveClientVendor({
  clientId,
  vendorId,
}: {
  clientId: string;
  vendorId: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireRole("ADMIN");

    const link = await prisma.clientVendor.findUnique({
      where: { clientId_vendorId: { clientId, vendorId } },
      select: { id: true, status: true },
    });

    if (!link) {
      return { success: false, error: "Client-vendor link not found" };
    }

    if (link.status === "APPROVED") {
      return { success: true }; // Already approved — idempotent
    }

    await prisma.clientVendor.update({
      where: { clientId_vendorId: { clientId, vendorId } },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByUserId: admin.id,
      },
    });

    await logAction({
      entityType: "ClientVendor",
      entityId: `${clientId}:${vendorId}`,
      action: AuditAction.CLIENT_VENDOR_APPROVED,
      diff: { clientId, vendorId, previousStatus: link.status },
    });

    revalidatePath("/dashboard/approvals");

    return { success: true };
  } catch (error) {
    console.error("Error approving client-vendor link:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to approve client-vendor link",
    };
  }
}

export async function rejectClientVendor({
  clientId,
  vendorId,
}: {
  clientId: string;
  vendorId: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireRole("ADMIN");

    const link = await prisma.clientVendor.findUnique({
      where: { clientId_vendorId: { clientId, vendorId } },
      select: { id: true, status: true },
    });

    if (!link) {
      return { success: false, error: "Client-vendor link not found" };
    }

    if (link.status === "REJECTED") {
      return { success: true }; // Already rejected — idempotent
    }

    await prisma.clientVendor.update({
      where: { clientId_vendorId: { clientId, vendorId } },
      data: {
        status: "REJECTED",
        approvedAt: new Date(),
        approvedByUserId: admin.id,
      },
    });

    await logAction({
      entityType: "ClientVendor",
      entityId: `${clientId}:${vendorId}`,
      action: AuditAction.CLIENT_VENDOR_REJECTED,
      diff: { clientId, vendorId, previousStatus: link.status },
    });

    revalidatePath("/dashboard/approvals");

    return { success: true };
  } catch (error) {
    console.error("Error rejecting client-vendor link:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to reject client-vendor link",
    };
  }
}

export async function removeClientVendorLink({
  clientId,
  vendorId,
}: {
  clientId: string;
  vendorId: string;
}): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    // deleteMany is idempotent — no error if row doesn't exist
    const result = await prisma.clientVendor.deleteMany({
      where: { clientId, vendorId },
    });

    if (result.count === 0) {
      return { success: true }; // Already removed — idempotent
    }

    await logAction({
      entityType: "ClientVendor",
      entityId: `${clientId}:${vendorId}`,
      action: AuditAction.CLIENT_VENDOR_REMOVED,
      diff: { clientId, vendorId },
    });

    revalidatePath("/dashboard/approvals");

    return { success: true };
  } catch (error) {
    console.error("Error removing client-vendor link:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove client-vendor link",
    };
  }
}
