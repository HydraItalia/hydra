"use server";

/**
 * Phase 9.4.2 - Client Management Actions (Admin/Agent)
 *
 * Server actions for admin/agent to manage clients.
 * Only accessible to ADMIN and AGENT roles (except archiveClient which is ADMIN only).
 */

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Update client information
 *
 * @param clientId - The ID of the client to update
 * @param data - The fields to update
 * @returns Success result or error
 */
export async function updateClient(
  clientId: string,
  data: {
    name?: string;
    region?: string;
    fullAddress?: string;
    shortAddress?: string;
    deliveryAddress?: string;
    deliveryLat?: number | null;
    deliveryLng?: number | null;
    contactPerson?: string;
    email?: string;
    phone?: string;
    taxId?: string;
    notes?: string;
    pinColor?: string;
    hidden?: boolean;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate client exists
    const existing = await prisma.client.findUnique({
      where: { id: clientId, deletedAt: null },
    });

    if (!existing) {
      return { success: false, error: "Client not found" };
    }

    // Update client
    await prisma.client.update({
      where: { id: clientId },
      data,
    });

    // Log the update
    await logAction({
      entityType: "Client",
      entityId: clientId,
      action: AuditAction.CLIENT_UPDATED,
      diff: data,
    });

    // Revalidate pages
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/clients");

    return { success: true };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update client",
    };
  }
}

/**
 * Archive (soft delete) a client
 * Only accessible to ADMIN role
 *
 * @param clientId - The ID of the client to archive
 * @returns Success result or error
 */
export async function archiveClient(
  clientId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN role only
    await requireRole("ADMIN");

    // Validate client exists
    const existing = await prisma.client.findUnique({
      where: { id: clientId, deletedAt: null },
    });

    if (!existing) {
      return { success: false, error: "Client not found" };
    }

    // Soft delete the client
    await prisma.client.update({
      where: { id: clientId },
      data: { deletedAt: new Date() },
    });

    // Log the archive
    await logAction({
      entityType: "Client",
      entityId: clientId,
      action: AuditAction.CLIENT_ARCHIVED,
    });

    // Revalidate pages
    revalidatePath("/dashboard/clients");

    return { success: true };
  } catch (error) {
    console.error("Error archiving client:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to archive client",
    };
  }
}

/**
 * Assign an agent to a client
 *
 * @param clientId - The ID of the client
 * @param agentUserId - The ID of the agent user to assign
 * @returns Success result or error
 */
export async function assignAgentToClient(
  clientId: string,
  agentUserId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId, deletedAt: null },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
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
    const existing = await prisma.agentClient.findUnique({
      where: {
        userId_clientId: {
          userId: agentUserId,
          clientId,
        },
      },
    });

    if (existing) {
      return { success: false, error: "Agent already assigned to this client" };
    }

    // Create the assignment
    await prisma.agentClient.create({
      data: {
        userId: agentUserId,
        clientId,
      },
    });

    // Log the assignment
    await logAction({
      entityType: "Client",
      entityId: clientId,
      action: AuditAction.AGENT_ASSIGNED_TO_CLIENT,
      diff: {
        agentUserId,
        agentName: agent.name,
        agentCode: agent.agentCode,
      },
    });

    // Revalidate pages
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/clients");

    return { success: true };
  } catch (error) {
    console.error("Error assigning agent to client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign agent",
    };
  }
}

/**
 * Unassign an agent from a client
 *
 * @param clientId - The ID of the client
 * @param agentUserId - The ID of the agent user to unassign
 * @returns Success result or error
 */
export async function unassignAgentFromClient(
  clientId: string,
  agentUserId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Require ADMIN or AGENT role
    await requireRole("ADMIN", "AGENT");

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId, deletedAt: null },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Check if assignment exists
    const existing = await prisma.agentClient.findUnique({
      where: {
        userId_clientId: {
          userId: agentUserId,
          clientId,
        },
      },
      include: {
        User: {
          select: { name: true, agentCode: true },
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Agent not assigned to this client" };
    }

    // Delete the assignment
    await prisma.agentClient.delete({
      where: {
        userId_clientId: {
          userId: agentUserId,
          clientId,
        },
      },
    });

    // Log the unassignment
    await logAction({
      entityType: "Client",
      entityId: clientId,
      action: AuditAction.AGENT_UNASSIGNED_FROM_CLIENT,
      diff: {
        agentUserId,
        agentName: existing.User.name,
        agentCode: existing.User.agentCode,
      },
    });

    // Revalidate pages
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/clients");

    return { success: true };
  } catch (error) {
    console.error("Error unassigning agent from client:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unassign agent",
    };
  }
}
