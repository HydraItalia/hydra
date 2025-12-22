/**
 * AUDIT LOGGING USAGE EXAMPLES
 *
 * This file demonstrates how to use the audit logging helpers in server actions.
 * Copy these patterns when implementing Phase 9 features.
 */

import { logAction, AuditAction } from "../audit";

// ============================================================================
// EXAMPLE 1: Order Status Update
// ============================================================================

async function updateOrderStatus(orderId: string, newStatus: string) {
  // ... update order in database ...

  // Log the action
  await logAction({
    entityType: "Order",
    entityId: orderId,
    action: AuditAction.ORDER_STATUS_UPDATED,
    diff: {
      from: "SUBMITTED",
      to: newStatus,
    },
  });
}

// ============================================================================
// EXAMPLE 2: Agent Assignment to Order
// ============================================================================

async function assignAgentToOrder(orderId: string, agentUserId: string) {
  // ... fetch agent details ...
  const agent = { id: agentUserId, name: "Andrea", agentCode: "ANDREA" };

  // ... update order ...

  // Log with detailed diff
  await logAction({
    entityType: "Order",
    entityId: orderId,
    action: AuditAction.AGENT_ASSIGNED_TO_ORDER,
    diff: {
      agentUserId: agent.id,
      agentName: agent.name,
      agentCode: agent.agentCode,
    },
  });
}

// ============================================================================
// EXAMPLE 3: Client Update
// ============================================================================

async function updateClient(
  clientId: string,
  updates: {
    name?: string;
    region?: string;
    address?: string;
  }
) {
  // ... update client in database ...

  // Log what changed
  await logAction({
    entityType: "Client",
    entityId: clientId,
    action: AuditAction.CLIENT_UPDATED,
    diff: updates, // Pass the updates object directly
  });
}

// ============================================================================
// EXAMPLE 4: Client Archive (Soft Delete)
// ============================================================================

async function archiveClient(clientId: string) {
  // ... set deletedAt = now() ...

  // Log without diff (simple action)
  await logAction({
    entityType: "Client",
    entityId: clientId,
    action: AuditAction.CLIENT_ARCHIVED,
  });
}

// ============================================================================
// EXAMPLE 5: Delivery Creation
// ============================================================================

async function createDeliveryForOrder(orderId: string, driverId: string) {
  // ... create delivery record ...
  const deliveryId = "delivery-123";

  // Log with context
  await logAction({
    entityType: "Delivery",
    entityId: deliveryId,
    action: AuditAction.DELIVERY_CREATED,
    diff: {
      orderId,
      driverId,
      status: "ASSIGNED",
    },
  });
}

// ============================================================================
// EXAMPLE 6: Agent-Client Relationship
// ============================================================================

async function assignAgentToClient(clientId: string, agentUserId: string) {
  // ... create AgentClient record ...

  // Log the relationship creation
  await logAction({
    entityType: "Client",
    entityId: clientId,
    action: AuditAction.AGENT_ASSIGNED_TO_CLIENT,
    diff: {
      agentUserId,
    },
  });
}

async function unassignAgentFromClient(clientId: string, agentUserId: string) {
  // ... delete AgentClient record ...

  // Log the relationship deletion
  await logAction({
    entityType: "Client",
    entityId: clientId,
    action: AuditAction.AGENT_UNASSIGNED_FROM_CLIENT,
    diff: {
      agentUserId,
    },
  });
}

// ============================================================================
// KEY PRINCIPLES:
// ============================================================================
//
// 1. **Always log mutations**: Every create, update, delete should be logged
//
// 2. **Use descriptive diffs**: Include enough context to understand what changed
//    - Good: { from: 'SUBMITTED', to: 'CONFIRMED' }
//    - Good: { agentUserId: 'xyz', agentName: 'Andrea' }
//    - Bad: {} (empty diff tells us nothing)
//
// 3. **Actor is automatic**: Don't pass actorUserId - it's captured from session
//
// 4. **Non-blocking**: logAction() won't throw errors - operations continue even if audit fails
//
// 5. **Use constants**: Always use AuditAction.* constants, never strings
//    - Good: AuditAction.ORDER_STATUS_UPDATED
//    - Bad: 'ORDER_STATUS_UPDATED' (won't get type checking)
//
// 6. **Entity types**: Use PascalCase model names
//    - Order, Client, Vendor, Delivery, Agreement
//
// 7. **Timing**: Log AFTER successful mutation, not before
//    - This ensures we only log successful changes
//
// ============================================================================
