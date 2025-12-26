"use server";

/**
 * Phase 9.5.2 - Vendor Management Actions (Admin/Agent)
 *
 * Server actions for admin/agent to manage vendors.
 * Only accessible to ADMIN and AGENT roles (except archiveVendor which is ADMIN only).
 */

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Update vendor information
 *
 * @param vendorId - The ID of the vendor to update
 * @param data - The fields to update
 * @returns Success result or error
 */
export async function updateVendor(
  vendorId: string,
  data: {
    name?: string;
    region?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    businessHours?: string;
    notes?: string;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate vendor exists
    const existing = await prisma.vendor.findUnique({
      where: { id: vendorId, deletedAt: null },
    });

    if (!existing) {
      return { success: false, error: "Vendor not found" };
    }

    // Update vendor
    await prisma.vendor.update({
      where: { id: vendorId },
      data,
    });

    // Log the update
    await logAction({
      entityType: "Vendor",
      entityId: vendorId,
      action: AuditAction.VENDOR_UPDATED,
      diff: data,
    });

    // Revalidate pages
    revalidatePath(`/dashboard/vendors/${vendorId}`);
    revalidatePath("/dashboard/vendors");

    return { success: true };
  } catch (error) {
    console.error("Error updating vendor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update vendor",
    };
  }
}

/**
 * Archive (soft delete) a vendor
 * Only accessible to ADMIN role
 *
 * @param vendorId - The ID of the vendor to archive
 * @returns Success result or error
 */
export async function archiveVendor(
  vendorId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN role only
    await requireRole("ADMIN");

    // Validate vendor exists
    const existing = await prisma.vendor.findUnique({
      where: { id: vendorId, deletedAt: null },
    });

    if (!existing) {
      return { success: false, error: "Vendor not found" };
    }

    // Soft delete the vendor
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { deletedAt: new Date() },
    });

    // Log the archive
    await logAction({
      entityType: "Vendor",
      entityId: vendorId,
      action: AuditAction.VENDOR_ARCHIVED,
    });

    // Revalidate pages
    revalidatePath("/dashboard/vendors");

    return { success: true };
  } catch (error) {
    console.error("Error archiving vendor:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to archive vendor",
    };
  }
}

/**
 * Assign an agent to a vendor
 *
 * @param vendorId - The ID of the vendor
 * @param agentUserId - The ID of the agent user to assign
 * @returns Success result or error
 */
export async function assignAgentToVendor(
  vendorId: string,
  agentUserId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId, deletedAt: null },
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    // Validate agent exists and has AGENT role
    const agent = await prisma.user.findUnique({
      where: { id: agentUserId, deletedAt: null },
      select: { id: true, role: true, name: true, agentCode: true },
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    if (agent.role !== "AGENT") {
      return { success: false, error: "User is not an agent" };
    }

    // Check if already assigned
    const existing = await prisma.agentVendor.findUnique({
      where: {
        userId_vendorId: {
          userId: agentUserId,
          vendorId,
        },
      },
    });

    if (existing) {
      return { success: false, error: "Agent already assigned to this vendor" };
    }

    // Create the assignment
    await prisma.agentVendor.create({
      data: {
        userId: agentUserId,
        vendorId,
      },
    });

    // Log the assignment
    await logAction({
      entityType: "Vendor",
      entityId: vendorId,
      action: AuditAction.AGENT_ASSIGNED_TO_VENDOR,
      diff: {
        agentUserId,
        agentName: agent.name,
        agentCode: agent.agentCode,
      },
    });

    // Revalidate pages
    revalidatePath(`/dashboard/vendors/${vendorId}`);
    revalidatePath("/dashboard/vendors");

    return { success: true };
  } catch (error) {
    console.error("Error assigning agent to vendor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign agent",
    };
  }
}

/**
 * Unassign an agent from a vendor
 *
 * @param vendorId - The ID of the vendor
 * @param agentUserId - The ID of the agent user to unassign
 * @returns Success result or error
 */
export async function unassignAgentFromVendor(
  vendorId: string,
  agentUserId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId, deletedAt: null },
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    // Check if assignment exists
    const existing = await prisma.agentVendor.findUnique({
      where: {
        userId_vendorId: {
          userId: agentUserId,
          vendorId,
        },
      },
      include: {
        User: {
          select: { name: true, agentCode: true },
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Agent not assigned to this vendor" };
    }

    // Delete the assignment
    await prisma.agentVendor.delete({
      where: {
        userId_vendorId: {
          userId: agentUserId,
          vendorId,
        },
      },
    });

    // Log the unassignment
    await logAction({
      entityType: "Vendor",
      entityId: vendorId,
      action: AuditAction.AGENT_UNASSIGNED_FROM_VENDOR,
      diff: {
        agentUserId,
        agentName: existing.User.name,
        agentCode: existing.User.agentCode,
      },
    });

    // Revalidate pages
    revalidatePath(`/dashboard/vendors/${vendorId}`);
    revalidatePath("/dashboard/vendors");

    return { success: true };
  } catch (error) {
    console.error("Error unassigning agent from vendor:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unassign agent",
    };
  }
}
