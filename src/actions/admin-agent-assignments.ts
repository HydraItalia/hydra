"use server";

/**
 * Phase 9.8 - Agent Assignment & Audit Enforcement
 *
 * Server actions for managing agent assignments to clients, vendors, and orders.
 * All assignment changes are logged to the audit trail for compliance and debugging.
 */

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Assign an agent to a client
 *
 * ADMIN-ONLY: Only admins can manage agent assignments
 *
 * @param clientId - The client to assign the agent to
 * @param agentUserId - The user ID of the agent to assign
 * @returns Success status
 */
export async function assignAgentToClient(
  clientId: string,
  agentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authorization check - ADMIN only
    const user = await requireRole("ADMIN");

    // 2. Validate agent exists and has AGENT role
    const agent = await prisma.user.findUnique({
      where: { id: agentUserId, role: "AGENT", deletedAt: null },
      select: { id: true, name: true, email: true, agentCode: true },
    });

    if (!agent) {
      return { success: false, error: "Agent not found or invalid role" };
    }

    // 3. Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // 4. Check if assignment already exists
    const existingAssignment = await prisma.agentClient.findUnique({
      where: {
        userId_clientId: {
          userId: agentUserId,
          clientId,
        },
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: "Agent is already assigned to this client",
      };
    }

    // 5. Create assignment
    await prisma.agentClient.create({
      data: {
        userId: agentUserId,
        clientId,
      },
    });

    // 6. Log to audit trail
    await logAction({
      entityType: "Client",
      entityId: clientId,
      action: AuditAction.AGENT_ASSIGNED_TO_CLIENT,
      diff: {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        agentCode: agent.agentCode,
        clientName: client.name,
      },
    });

    // 7. Revalidate relevant pages
    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/agents");
    revalidatePath(`/dashboard/agents/${agentUserId}`);

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
 * Remove an agent from a client
 *
 * ADMIN-ONLY: Only admins can manage agent assignments
 *
 * @param clientId - The client to remove the agent from
 * @param agentUserId - The user ID of the agent to remove
 * @returns Success status
 */
export async function removeAgentFromClient(
  clientId: string,
  agentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authorization check - ADMIN only
    await requireRole("ADMIN");

    // 2. Get agent and client info for audit log
    const [agent, client] = await Promise.all([
      prisma.user.findUnique({
        where: { id: agentUserId },
        select: { id: true, name: true, email: true, agentCode: true },
      }),
      prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true },
      }),
    ]);

    if (!agent || !client) {
      return { success: false, error: "Agent or client not found" };
    }

    // 3. Delete assignment
    const deleted = await prisma.agentClient.deleteMany({
      where: {
        userId: agentUserId,
        clientId,
      },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Assignment not found" };
    }

    // 4. Log to audit trail
    await logAction({
      entityType: "Client",
      entityId: clientId,
      action: AuditAction.AGENT_UNASSIGNED_FROM_CLIENT,
      diff: {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        agentCode: agent.agentCode,
        clientName: client.name,
      },
    });

    // 5. Revalidate relevant pages
    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/agents");
    revalidatePath(`/dashboard/agents/${agentUserId}`);

    return { success: true };
  } catch (error) {
    console.error("Error removing agent from client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove agent",
    };
  }
}

/**
 * Assign an agent to a vendor
 *
 * ADMIN-ONLY: Only admins can manage agent assignments
 *
 * @param vendorId - The vendor to assign the agent to
 * @param agentUserId - The user ID of the agent to assign
 * @returns Success status
 */
export async function assignAgentToVendor(
  vendorId: string,
  agentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authorization check - ADMIN only
    await requireRole("ADMIN");

    // 2. Validate agent exists and has AGENT role
    const agent = await prisma.user.findUnique({
      where: { id: agentUserId, role: "AGENT", deletedAt: null },
      select: { id: true, name: true, email: true, agentCode: true },
    });

    if (!agent) {
      return { success: false, error: "Agent not found or invalid role" };
    }

    // 3. Validate vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    // 4. Check if assignment already exists
    const existingAssignment = await prisma.agentVendor.findUnique({
      where: {
        userId_vendorId: {
          userId: agentUserId,
          vendorId,
        },
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: "Agent is already assigned to this vendor",
      };
    }

    // 5. Create assignment
    await prisma.agentVendor.create({
      data: {
        userId: agentUserId,
        vendorId,
      },
    });

    // 6. Log to audit trail
    await logAction({
      entityType: "Vendor",
      entityId: vendorId,
      action: AuditAction.AGENT_ASSIGNED_TO_VENDOR,
      diff: {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        agentCode: agent.agentCode,
        vendorName: vendor.name,
      },
    });

    // 7. Revalidate relevant pages
    revalidatePath("/dashboard/vendors");
    revalidatePath(`/dashboard/vendors/${vendorId}`);
    revalidatePath("/dashboard/agents");
    revalidatePath(`/dashboard/agents/${agentUserId}`);

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
 * Remove an agent from a vendor
 *
 * ADMIN-ONLY: Only admins can manage agent assignments
 *
 * @param vendorId - The vendor to remove the agent from
 * @param agentUserId - The user ID of the agent to remove
 * @returns Success status
 */
export async function removeAgentFromVendor(
  vendorId: string,
  agentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authorization check - ADMIN only
    await requireRole("ADMIN");

    // 2. Get agent and vendor info for audit log
    const [agent, vendor] = await Promise.all([
      prisma.user.findUnique({
        where: { id: agentUserId },
        select: { id: true, name: true, email: true, agentCode: true },
      }),
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, name: true },
      }),
    ]);

    if (!agent || !vendor) {
      return { success: false, error: "Agent or vendor not found" };
    }

    // 3. Delete assignment
    const deleted = await prisma.agentVendor.deleteMany({
      where: {
        userId: agentUserId,
        vendorId,
      },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Assignment not found" };
    }

    // 4. Log to audit trail
    await logAction({
      entityType: "Vendor",
      entityId: vendorId,
      action: AuditAction.AGENT_UNASSIGNED_FROM_VENDOR,
      diff: {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        agentCode: agent.agentCode,
        vendorName: vendor.name,
      },
    });

    // 5. Revalidate relevant pages
    revalidatePath("/dashboard/vendors");
    revalidatePath(`/dashboard/vendors/${vendorId}`);
    revalidatePath("/dashboard/agents");
    revalidatePath(`/dashboard/agents/${agentUserId}`);

    return { success: true };
  } catch (error) {
    console.error("Error removing agent from vendor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove agent",
    };
  }
}

/**
 * Assign an agent to an order
 *
 * ADMIN-ONLY: Only admins can manage agent assignments
 *
 * @param orderId - The order to assign the agent to
 * @param agentUserId - The user ID of the agent to assign
 * @returns Success status
 */
export async function assignAgentToOrder(
  orderId: string,
  agentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authorization check - ADMIN only
    await requireRole("ADMIN");

    // 2. Validate agent exists and has AGENT role
    const agent = await prisma.user.findUnique({
      where: { id: agentUserId, role: "AGENT", deletedAt: null },
      select: { id: true, name: true, email: true, agentCode: true },
    });

    if (!agent) {
      return { success: false, error: "Agent not found or invalid role" };
    }

    // 3. Get order with current assignment
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        assignedAgentUserId: true,
        Client: {
          select: { name: true },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // 4. Check if already assigned to this agent
    if (order.assignedAgentUserId === agentUserId) {
      return {
        success: false,
        error: "Agent is already assigned to this order",
      };
    }

    // 5. Update order assignment
    await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedAgentUserId: agentUserId,
      },
    });

    // 6. Log to audit trail
    await logAction({
      entityType: "Order",
      entityId: orderId,
      action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
      diff: {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        agentCode: agent.agentCode,
        orderNumber: order.orderNumber,
        clientName: order.Client.name,
      },
    });

    // 7. Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/agents");
    revalidatePath(`/dashboard/agents/${agentUserId}`);

    return { success: true };
  } catch (error) {
    console.error("Error assigning agent to order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign agent",
    };
  }
}

/**
 * Reassign an order from one agent to another
 *
 * ADMIN-ONLY: Only admins can manage agent assignments
 * Logs a special AGENT_REASSIGNED action to track the transition
 *
 * @param orderId - The order to reassign
 * @param newAgentUserId - The user ID of the new agent
 * @returns Success status
 */
export async function reassignOrder(
  orderId: string,
  newAgentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authorization check - ADMIN only
    await requireRole("ADMIN");

    // 2. Validate new agent exists and has AGENT role
    const newAgent = await prisma.user.findUnique({
      where: { id: newAgentUserId, role: "AGENT", deletedAt: null },
      select: { id: true, name: true, email: true, agentCode: true },
    });

    if (!newAgent) {
      return { success: false, error: "New agent not found or invalid role" };
    }

    // 3. Get order with current assignment
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        assignedAgentUserId: true,
        User_Order_assignedAgentUserIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            agentCode: true,
          },
        },
        Client: {
          select: { name: true },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // 4. Check if there's actually a current assignment to reassign from
    if (!order.assignedAgentUserId) {
      // No current assignment - just use regular assignment
      return assignAgentToOrder(orderId, newAgentUserId);
    }

    // 5. Check if trying to reassign to the same agent
    if (order.assignedAgentUserId === newAgentUserId) {
      return {
        success: false,
        error: "Order is already assigned to this agent",
      };
    }

    const oldAgent = order.User_Order_assignedAgentUserIdToUser;

    // 6. Update order assignment
    await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedAgentUserId: newAgentUserId,
      },
    });

    // 7. Log to audit trail with both old and new agent info
    await logAction({
      entityType: "Order",
      entityId: orderId,
      action: AuditAction.AGENT_REASSIGNED,
      diff: {
        oldAgentId: oldAgent?.id,
        oldAgentName: oldAgent?.name,
        oldAgentEmail: oldAgent?.email,
        oldAgentCode: oldAgent?.agentCode,
        newAgentId: newAgent.id,
        newAgentName: newAgent.name,
        newAgentEmail: newAgent.email,
        newAgentCode: newAgent.agentCode,
        orderNumber: order.orderNumber,
        clientName: order.Client.name,
      },
    });

    // 8. Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/agents");
    if (oldAgent) {
      revalidatePath(`/dashboard/agents/${oldAgent.id}`);
    }
    revalidatePath(`/dashboard/agents/${newAgentUserId}`);

    return { success: true };
  } catch (error) {
    console.error("Error reassigning order:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reassign order",
    };
  }
}

/**
 * Unassign an agent from an order
 *
 * ADMIN-ONLY: Only admins can manage agent assignments
 *
 * @param orderId - The order to unassign the agent from
 * @returns Success status
 */
export async function unassignAgentFromOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authorization check - ADMIN only
    await requireRole("ADMIN");

    // 2. Get order with current assignment
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        assignedAgentUserId: true,
        User_Order_assignedAgentUserIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            agentCode: true,
          },
        },
        Client: {
          select: { name: true },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!order.assignedAgentUserId) {
      return { success: false, error: "Order has no assigned agent" };
    }

    const agent = order.User_Order_assignedAgentUserIdToUser;

    // 3. Remove assignment
    await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedAgentUserId: null,
      },
    });

    // 4. Log to audit trail
    await logAction({
      entityType: "Order",
      entityId: orderId,
      action: AuditAction.AGENT_UNASSIGNED_FROM_ORDER,
      diff: {
        agentId: agent?.id,
        agentName: agent?.name,
        agentEmail: agent?.email,
        agentCode: agent?.agentCode,
        orderNumber: order.orderNumber,
        clientName: order.Client.name,
      },
    });

    // 5. Revalidate relevant pages
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/agents");
    if (agent) {
      revalidatePath(`/dashboard/agents/${agent.id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error unassigning agent from order:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unassign agent",
    };
  }
}
