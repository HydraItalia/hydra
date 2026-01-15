"use server";

/**
 * Admin Payment Actions (Issue #104)
 *
 * Server actions for admin/agent to manage failed payments.
 * Only accessible to ADMIN and AGENT roles.
 */

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@prisma/client";
import {
  authorizeSubOrderCharge,
  captureSubOrderPayment,
} from "@/lib/stripe-auth";
import {
  isAuthorizationExpired,
  MAX_RETRY_ATTEMPTS,
} from "@/lib/stripe-errors";

/**
 * Fetch failed payments for admin dashboard
 *
 * @returns Array of SubOrders with payment failures
 */
export async function getFailedPayments() {
  try {
    await requireRole("ADMIN", "AGENT");

    const failedPayments = await prisma.subOrder.findMany({
      where: {
        paymentStatus: PaymentStatus.FAILED,
      },
      include: {
        Order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            Client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        Vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { requiresClientUpdate: "asc" }, // Non-requires-update first (retryable)
        { lastPaymentAttemptAt: "desc" }, // Most recent first
      ],
    });

    return {
      success: true as const,
      data: failedPayments,
    };
  } catch (error) {
    console.error("Error fetching failed payments:", error);
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch failed payments",
    };
  }
}

/**
 * Get payment status summary for dashboard
 */
export async function getPaymentStatusSummary() {
  try {
    await requireRole("ADMIN", "AGENT");

    const [failed, processing, pendingRetry, requiresUpdate] =
      await Promise.all([
        prisma.subOrder.count({
          where: { paymentStatus: PaymentStatus.FAILED },
        }),
        prisma.subOrder.count({
          where: { paymentStatus: PaymentStatus.PROCESSING },
        }),
        prisma.subOrder.count({
          where: {
            paymentStatus: PaymentStatus.FAILED,
            nextPaymentRetryAt: { not: null },
            requiresClientUpdate: false,
            paymentAttemptCount: { lt: MAX_RETRY_ATTEMPTS },
          },
        }),
        prisma.subOrder.count({
          where: {
            paymentStatus: PaymentStatus.FAILED,
            requiresClientUpdate: true,
          },
        }),
      ]);

    return {
      success: true as const,
      data: {
        failed,
        processing,
        pendingRetry,
        requiresUpdate,
      },
    };
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch payment summary",
    };
  }
}

/**
 * Manually retry a failed payment
 *
 * @param subOrderId - The ID of the SubOrder to retry payment for
 * @returns Result with success status
 */
export async function retryPayment(
  subOrderId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireRole("ADMIN", "AGENT");

    // Fetch the SubOrder
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      select: {
        id: true,
        subOrderNumber: true,
        stripeChargeId: true,
        paymentStatus: true,
        paymentAttemptCount: true,
        authorizationExpiresAt: true,
        Order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!subOrder) {
      return { success: false, error: "SubOrder not found" };
    }

    // Validate order is not canceled
    if (subOrder.Order.status === "CANCELED") {
      return {
        success: false,
        error: "Cannot retry payment for canceled order",
      };
    }

    // Validate payment is in failed state
    if (subOrder.paymentStatus !== PaymentStatus.FAILED) {
      return {
        success: false,
        error: `Payment is not in failed state (current: ${subOrder.paymentStatus})`,
      };
    }

    // Determine which operation to perform
    let result: { success: boolean; error?: string };
    let operation: "authorize" | "capture";

    if (!subOrder.stripeChargeId) {
      // No PaymentIntent - retry authorization
      operation = "authorize";
      result = await authorizeSubOrderCharge(subOrder.id);
    } else {
      // Check if authorization is expired
      if (isAuthorizationExpired(subOrder.authorizationExpiresAt)) {
        return {
          success: false,
          error:
            "Authorization has expired. A new order may be required, or contact the client to update payment method.",
        };
      }

      // Retry capture
      operation = "capture";
      result = await captureSubOrderPayment(subOrder.id);
    }

    // Log the manual retry
    await logAction({
      entityType: "SubOrder",
      entityId: subOrderId,
      action: AuditAction.PAYMENT_MANUAL_RETRY,
      diff: {
        subOrderNumber: subOrder.subOrderNumber,
        operation,
        attemptCount: subOrder.paymentAttemptCount + 1,
        success: result.success,
        error: result.error || null,
      },
    });

    // Revalidate pages
    revalidatePath("/dashboard/payments/failed");
    revalidatePath(`/dashboard/orders/${subOrder.Order.id}`);

    if (!result.success) {
      return { success: false, error: result.error || "Payment retry failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error retrying payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retry payment",
    };
  }
}

/**
 * Mark a SubOrder as requiring client payment method update
 *
 * @param subOrderId - The ID of the SubOrder
 * @returns Result with success status
 */
export async function markRequiresClientUpdate(
  subOrderId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireRole("ADMIN", "AGENT");

    // Fetch the SubOrder
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      select: {
        id: true,
        subOrderNumber: true,
        paymentStatus: true,
        requiresClientUpdate: true,
      },
    });

    if (!subOrder) {
      return { success: false, error: "SubOrder not found" };
    }

    // Validate payment is in failed state
    if (subOrder.paymentStatus !== PaymentStatus.FAILED) {
      return {
        success: false,
        error: `Payment is not in failed state (current: ${subOrder.paymentStatus})`,
      };
    }

    // Check if already marked
    if (subOrder.requiresClientUpdate) {
      return { success: true }; // Idempotent
    }

    // Update the SubOrder
    await prisma.subOrder.update({
      where: { id: subOrderId },
      data: {
        requiresClientUpdate: true,
        nextPaymentRetryAt: null, // Stop auto-retries
      },
    });

    // Log the action
    await logAction({
      entityType: "SubOrder",
      entityId: subOrderId,
      action: AuditAction.PAYMENT_MARKED_REQUIRES_UPDATE,
      diff: {
        subOrderNumber: subOrder.subOrderNumber,
      },
    });

    // Revalidate pages
    revalidatePath("/dashboard/payments/failed");

    return { success: true };
  } catch (error) {
    console.error("Error marking requires client update:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark as requiring client update",
    };
  }
}

/**
 * Clear the requires client update flag (after client updates payment method)
 *
 * @param subOrderId - The ID of the SubOrder
 * @returns Result with success status
 */
export async function clearRequiresClientUpdate(
  subOrderId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireRole("ADMIN", "AGENT");

    // Fetch the SubOrder
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      select: {
        id: true,
        subOrderNumber: true,
        paymentStatus: true,
        requiresClientUpdate: true,
        paymentAttemptCount: true,
      },
    });

    if (!subOrder) {
      return { success: false, error: "SubOrder not found" };
    }

    // Check if not marked
    if (!subOrder.requiresClientUpdate) {
      return { success: true }; // Idempotent
    }

    // Update the SubOrder - schedule immediate retry
    await prisma.subOrder.update({
      where: { id: subOrderId },
      data: {
        requiresClientUpdate: false,
        nextPaymentRetryAt: new Date(), // Schedule immediate retry
      },
    });

    // Log the action
    await logAction({
      entityType: "SubOrder",
      entityId: subOrderId,
      action: AuditAction.PAYMENT_RETRY_SCHEDULED,
      diff: {
        subOrderNumber: subOrder.subOrderNumber,
        reason: "client_update_cleared",
      },
    });

    // Revalidate pages
    revalidatePath("/dashboard/payments/failed");

    return { success: true };
  } catch (error) {
    console.error("Error clearing requires client update:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to clear requires client update flag",
    };
  }
}
