/**
 * Payment Retry Cron Job (Issue #104)
 *
 * Finds SubOrders eligible for payment retry and processes them.
 * Protected by CRON_SECRET environment variable.
 *
 * Vercel Cron configuration: see vercel.json
 * Runs every 5 minutes to process failed payments.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import {
  authorizeSubOrderCharge,
  captureSubOrderPayment,
} from "@/lib/stripe-auth";
import {
  MAX_RETRY_ATTEMPTS,
  isAuthorizationExpired,
} from "@/lib/stripe-errors";
import { logSystemAction, AuditAction } from "@/lib/audit";

/**
 * Validate cron job authorization
 *
 * Supports:
 * 1. Vercel Cron (Pro/Enterprise) - automatically sends Authorization header with CRON_SECRET
 * 2. Manual testing - same Authorization header format
 * 3. Development fallback - if no CRON_SECRET configured, allow in dev only
 */
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  // Primary auth: CRON_SECRET via Authorization header
  // Vercel Cron (Pro/Enterprise) sends this automatically when CRON_SECRET is set
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Development fallback: allow if no CRON_SECRET configured (dev only)
  if (!cronSecret && process.env.NODE_ENV === "development") {
    console.warn("[Payment Retry] CRON_SECRET not set, allowing in dev mode");
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  // Validate authorization
  if (!isAuthorized(request)) {
    console.warn("[Payment Retry] Unauthorized cron job attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  console.log("[Payment Retry] Starting payment retry job...");

  try {
    // Find SubOrders eligible for retry:
    // - paymentStatus = FAILED
    // - nextPaymentRetryAt <= now (scheduled for retry)
    // - paymentAttemptCount < MAX_RETRY_ATTEMPTS
    // - NOT marked as requiresClientUpdate (permanent failures)
    const eligibleSubOrders = await prisma.subOrder.findMany({
      where: {
        paymentStatus: PaymentStatus.FAILED,
        nextPaymentRetryAt: {
          lte: new Date(),
        },
        paymentAttemptCount: {
          lt: MAX_RETRY_ATTEMPTS,
        },
        requiresClientUpdate: false,
      },
      select: {
        id: true,
        subOrderNumber: true,
        stripeChargeId: true,
        paymentAttemptCount: true,
        authorizationExpiresAt: true,
        Order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        Vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 50, // Process max 50 at a time to avoid timeout
      orderBy: {
        nextPaymentRetryAt: "asc", // Oldest retries first
      },
    });

    console.log(
      `[Payment Retry] Found ${eligibleSubOrders.length} SubOrders eligible for retry`
    );

    const results: Array<{
      subOrderId: string;
      subOrderNumber: string;
      action: "authorize" | "capture" | "skipped";
      success: boolean;
      error?: string;
    }> = [];

    for (const subOrder of eligibleSubOrders) {
      // Skip if order is canceled
      if (subOrder.Order.status === "CANCELED") {
        console.log(
          `[Payment Retry] Skipping ${subOrder.subOrderNumber} - order is canceled`
        );
        results.push({
          subOrderId: subOrder.id,
          subOrderNumber: subOrder.subOrderNumber,
          action: "skipped",
          success: true,
          error: "Order is canceled",
        });
        continue;
      }

      // Determine which operation to retry
      let result: { success: boolean; error?: string };
      let action: "authorize" | "capture";

      if (!subOrder.stripeChargeId) {
        // No PaymentIntent exists - retry authorization
        action = "authorize";
        console.log(
          `[Payment Retry] Retrying authorization for ${
            subOrder.subOrderNumber
          } (attempt ${subOrder.paymentAttemptCount + 1})`
        );

        result = await authorizeSubOrderCharge(subOrder.id);
      } else {
        // PaymentIntent exists - check if authorization is expired
        if (isAuthorizationExpired(subOrder.authorizationExpiresAt)) {
          console.log(
            `[Payment Retry] Authorization expired for ${subOrder.subOrderNumber}, marking as requires client update`
          );

          // Mark as requiring manual intervention
          await prisma.subOrder.update({
            where: { id: subOrder.id },
            data: {
              requiresClientUpdate: true,
              paymentLastErrorCode: "charge_expired_for_capture",
              paymentLastErrorMessage:
                "Payment authorization has expired (7-day limit)",
              nextPaymentRetryAt: null,
            },
          });

          await logSystemAction({
            entityType: "SubOrder",
            entityId: subOrder.id,
            action: AuditAction.PAYMENT_CAPTURE_FAILED,
            diff: {
              subOrderNumber: subOrder.subOrderNumber,
              reason: "authorization_expired",
              attemptCount: subOrder.paymentAttemptCount,
            },
          });

          results.push({
            subOrderId: subOrder.id,
            subOrderNumber: subOrder.subOrderNumber,
            action: "skipped",
            success: false,
            error: "Authorization expired",
          });
          continue;
        }

        // Retry capture
        action = "capture";
        console.log(
          `[Payment Retry] Retrying capture for ${
            subOrder.subOrderNumber
          } (attempt ${subOrder.paymentAttemptCount + 1})`
        );

        result = await captureSubOrderPayment(subOrder.id);
      }

      // Log the retry attempt
      await logSystemAction({
        entityType: "SubOrder",
        entityId: subOrder.id,
        action: AuditAction.PAYMENT_RETRY_ATTEMPTED,
        diff: {
          subOrderNumber: subOrder.subOrderNumber,
          operation: action,
          attemptCount: subOrder.paymentAttemptCount + 1,
          success: result.success,
          error: result.error || null,
        },
      });

      results.push({
        subOrderId: subOrder.id,
        subOrderNumber: subOrder.subOrderNumber,
        action,
        success: result.success,
        error: result.error,
      });

      // Log result
      if (result.success) {
        console.log(
          `[Payment Retry] SUCCESS: ${action} for ${subOrder.subOrderNumber}`
        );
      } else {
        console.log(
          `[Payment Retry] FAILED: ${action} for ${subOrder.subOrderNumber}: ${result.error}`
        );
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[Payment Retry] Job completed in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`
    );

    return NextResponse.json({
      success: true,
      processed: results.length,
      succeeded: successCount,
      failed: failureCount,
      duration: `${duration}ms`,
      results,
    });
  } catch (error) {
    console.error("[Payment Retry] Job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
