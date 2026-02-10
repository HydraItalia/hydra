/**
 * Audit Logging Helper
 *
 * Provides type-safe audit logging for all admin/agent actions.
 * Automatically captures the current user as the actor.
 *
 * Usage:
 * ```typescript
 * import { logAction } from '@/lib/audit'
 *
 * await logAction({
 *   entityType: 'Order',
 *   entityId: orderId,
 *   action: 'ORDER_STATUS_UPDATED',
 *   diff: { from: 'SUBMITTED', to: 'CONFIRMED' },
 * })
 * ```
 */

import { prisma } from "./prisma";
import { currentUser } from "./auth";
import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@prisma/client";

/**
 * Type-safe audit action names
 * Add new actions as Phase 9 features are implemented
 */
export const AuditAction = {
  // Order actions
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_STATUS_UPDATED: "ORDER_STATUS_UPDATED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_NOTES_UPDATED: "ORDER_NOTES_UPDATED",

  // Order assignment actions
  AGENT_ASSIGNED_TO_ORDER: "AGENT_ASSIGNED_TO_ORDER",
  AGENT_UNASSIGNED_FROM_ORDER: "AGENT_UNASSIGNED_FROM_ORDER",
  AGENT_REASSIGNED: "AGENT_REASSIGNED", // When order is reassigned from one agent to another

  // Delivery actions
  DELIVERY_CREATED: "DELIVERY_CREATED",
  DELIVERY_STATUS_UPDATED: "DELIVERY_STATUS_UPDATED",
  DELIVERY_DRIVER_ASSIGNED: "DELIVERY_DRIVER_ASSIGNED",
  DELIVERY_DRIVER_CHANGED: "DELIVERY_DRIVER_CHANGED",
  DELIVERY_DELETED: "DELIVERY_DELETED",

  // Client actions
  CLIENT_CREATED: "CLIENT_CREATED",
  CLIENT_UPDATED: "CLIENT_UPDATED",
  CLIENT_ARCHIVED: "CLIENT_ARCHIVED",
  CLIENT_RESTORED: "CLIENT_RESTORED",

  // Client-Agent relationship actions
  AGENT_ASSIGNED_TO_CLIENT: "AGENT_ASSIGNED_TO_CLIENT",
  AGENT_UNASSIGNED_FROM_CLIENT: "AGENT_UNASSIGNED_FROM_CLIENT",

  // Vendor actions
  VENDOR_CREATED: "VENDOR_CREATED",
  VENDOR_UPDATED: "VENDOR_UPDATED",
  VENDOR_ARCHIVED: "VENDOR_ARCHIVED",
  VENDOR_RESTORED: "VENDOR_RESTORED",

  // Vendor-Agent relationship actions
  AGENT_ASSIGNED_TO_VENDOR: "AGENT_ASSIGNED_TO_VENDOR",
  AGENT_UNASSIGNED_FROM_VENDOR: "AGENT_UNASSIGNED_FROM_VENDOR",

  // Agreement actions (future)
  AGREEMENT_CREATED: "AGREEMENT_CREATED",
  AGREEMENT_UPDATED: "AGREEMENT_UPDATED",
  AGREEMENT_DELETED: "AGREEMENT_DELETED",

  // Driver actions (future)
  DRIVER_CREATED: "DRIVER_CREATED",
  DRIVER_UPDATED: "DRIVER_UPDATED",
  DRIVER_ARCHIVED: "DRIVER_ARCHIVED",

  // Shift actions (admin oversight)
  SHIFT_CREATED_BY_ADMIN: "SHIFT_CREATED_BY_ADMIN",
  SHIFT_CLOSED_BY_ADMIN: "SHIFT_CLOSED_BY_ADMIN",

  // Payment actions (Issue #104)
  PAYMENT_AUTHORIZATION_FAILED: "PAYMENT_AUTHORIZATION_FAILED",
  PAYMENT_AUTHORIZATION_SUCCEEDED: "PAYMENT_AUTHORIZATION_SUCCEEDED",
  PAYMENT_CAPTURE_FAILED: "PAYMENT_CAPTURE_FAILED",
  PAYMENT_CAPTURE_SUCCEEDED: "PAYMENT_CAPTURE_SUCCEEDED",
  PAYMENT_RETRY_ATTEMPTED: "PAYMENT_RETRY_ATTEMPTED",
  PAYMENT_RETRY_SCHEDULED: "PAYMENT_RETRY_SCHEDULED",
  PAYMENT_MARKED_REQUIRES_UPDATE: "PAYMENT_MARKED_REQUIRES_UPDATE",
  PAYMENT_MANUAL_RETRY: "PAYMENT_MANUAL_RETRY",

  // Onboarding actions
  ONBOARDING_SUBMITTED: "ONBOARDING_SUBMITTED",

  // User approval actions
  USER_APPROVED: "USER_APPROVED",
  USER_REJECTED: "USER_REJECTED",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_REACTIVATED: "USER_REACTIVATED",

  // VendorUser linking actions
  VENDOR_USER_LINKED: "VENDOR_USER_LINKED",
  VENDOR_USER_UNLINKED: "VENDOR_USER_UNLINKED",
  VENDOR_USER_ROLE_UPDATED: "VENDOR_USER_ROLE_UPDATED",

  // ClientVendor linking actions
  CLIENT_VENDOR_CREATED: "CLIENT_VENDOR_CREATED",
  CLIENT_VENDOR_APPROVED: "CLIENT_VENDOR_APPROVED",
  CLIENT_VENDOR_REJECTED: "CLIENT_VENDOR_REJECTED",
  CLIENT_VENDOR_REMOVED: "CLIENT_VENDOR_REMOVED",

  // Import batch actions
  IMPORT_BATCH_CREATED: "IMPORT_BATCH_CREATED",
  IMPORT_BATCH_VALIDATED: "IMPORT_BATCH_VALIDATED",
  IMPORT_BATCH_COMMITTED: "IMPORT_BATCH_COMMITTED",
  IMPORT_BATCH_FAILED: "IMPORT_BATCH_FAILED",

  // Import template actions
  IMPORT_TEMPLATE_CREATED: "IMPORT_TEMPLATE_CREATED",
  IMPORT_TEMPLATE_UPDATED: "IMPORT_TEMPLATE_UPDATED",
  IMPORT_TEMPLATE_ARCHIVED: "IMPORT_TEMPLATE_ARCHIVED",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * Log an action to the audit trail
 *
 * @param entityType - The type of entity being acted upon (e.g., 'Order', 'Client', 'Vendor')
 * @param entityId - The ID of the entity
 * @param action - The action being performed (use AuditAction constants)
 * @param diff - Optional before/after state or additional context
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * // Log order status update
 * await logAction({
 *   entityType: 'Order',
 *   entityId: orderId,
 *   action: AuditAction.ORDER_STATUS_UPDATED,
 *   diff: { from: 'SUBMITTED', to: 'CONFIRMED' },
 * })
 *
 * // Log agent assignment
 * await logAction({
 *   entityType: 'Order',
 *   entityId: orderId,
 *   action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
 *   diff: { agentUserId: 'xyz', agentName: 'Andrea' },
 * })
 * ```
 */
export async function logAction({
  entityType,
  entityId,
  action,
  diff,
}: {
  entityType: string;
  entityId: string;
  action: AuditActionType;
  diff?: Record<string, any> | null;
}): Promise<void> {
  try {
    // Get current user (actor)
    const user = await currentUser();

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        id: createId(),
        actorUserId: user?.id || null,
        entityType,
        entityId,
        action,
        diff: diff ? (diff as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit failures shouldn't break operations
    console.error("Failed to create audit log:", {
      entityType,
      entityId,
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Log multiple actions in bulk (for batch operations)
 *
 * @param actions - Array of audit log entries
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await logBulkActions([
 *   {
 *     entityType: 'Order',
 *     entityId: order1Id,
 *     action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
 *     diff: { agentUserId: 'xyz' },
 *   },
 *   {
 *     entityType: 'Order',
 *     entityId: order2Id,
 *     action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
 *     diff: { agentUserId: 'xyz' },
 *   },
 * ])
 * ```
 */
export async function logBulkActions(
  actions: Array<{
    entityType: string;
    entityId: string;
    action: AuditActionType;
    diff?: Record<string, any> | null;
  }>,
): Promise<void> {
  try {
    const user = await currentUser();

    await prisma.auditLog.createMany({
      data: actions.map(({ entityType, entityId, action, diff }) => ({
        id: createId(),
        actorUserId: user?.id || null,
        entityType,
        entityId,
        action,
        diff: diff ? (diff as Prisma.InputJsonValue) : Prisma.JsonNull,
      })),
    });
  } catch (error) {
    console.error("Failed to create bulk audit logs:", {
      count: actions.length,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get audit logs for a specific entity
 *
 * @param entityType - The type of entity
 * @param entityId - The ID of the entity
 * @param options - Optional query options (limit, include user)
 * @returns Promise<AuditLog[]>
 *
 * @example
 * ```typescript
 * // Get order history
 * const logs = await getAuditLogs('Order', orderId, {
 *   limit: 20,
 *   includeUser: true,
 * })
 * ```
 */
export async function getAuditLogs(
  entityType: string,
  entityId: string,
  options?: {
    limit?: number;
    includeUser?: boolean;
  },
) {
  const { limit, includeUser = true } = options || {};

  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: includeUser
      ? {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              agentCode: true,
            },
          },
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Log a system action (for cron jobs and automated processes)
 * Does NOT require a current user - uses null as actor
 *
 * @param params - Same as logAction but without user context
 * @returns Promise<void>
 */
export async function logSystemAction({
  entityType,
  entityId,
  action,
  diff,
}: {
  entityType: string;
  entityId: string;
  action: AuditActionType;
  diff?: Record<string, any> | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: createId(),
        actorUserId: null, // System action - no user
        entityType,
        entityId,
        action,
        diff: diff ? (diff as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Failed to create system audit log:", {
      entityType,
      entityId,
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get recent audit logs for admin dashboard
 *
 * @param options - Query options
 * @returns Promise<AuditLog[]>
 *
 * @example
 * ```typescript
 * // Get last 50 actions across platform
 * const recentActivity = await getRecentAuditLogs({ limit: 50 })
 * ```
 */
export async function getRecentAuditLogs(options?: {
  limit?: number;
  entityType?: string;
  actorUserId?: string;
}) {
  const { limit = 50, entityType, actorUserId } = options || {};

  return prisma.auditLog.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(actorUserId && { actorUserId }),
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          agentCode: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
