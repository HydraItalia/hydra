/**
 * Payment Retry Cron Job (Issue #104)
 *
 * Finds SubOrders eligible for payment retry and processes them.
 *
 * Authentication:
 * - Production: Requires Authorization: Bearer CRON_SECRET header
 *   (User-Agent is NOT trusted in production - can be spoofed)
 * - Development: Allows requests without CRON_SECRET for local testing
 *
 * Query params:
 * - ?dryRun=1 - Returns eligible SubOrders without processing
 *
 * Vercel Cron Configuration (vercel.json):
 * - Set CRON_SECRET in Vercel environment variables
 * - Configure cron job to include Authorization header with Bearer token
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
 * SECURITY: In production, CRON_SECRET is REQUIRED. User-Agent can be spoofed
 * and must not be trusted as the sole authentication method.
 *
 * Production behavior:
 * - CRON_SECRET must be set, otherwise all requests are rejected
 * - Only accepts Authorization: Bearer CRON_SECRET header
 * - User-Agent is ignored (can be spoofed)
 *
 * Development behavior:
 * - If CRON_SECRET is set, requires Bearer token
 * - If CRON_SECRET is not set, allows all requests (for local testing)
 */
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isProduction = process.env.NODE_ENV === "production";

  // Production: CRON_SECRET is required, User-Agent is not trusted
  if (isProduction) {
    if (!cronSecret) {
      console.error(
        "[Payment Retry] CRITICAL: CRON_SECRET not set in production. " +
          "All cron requests will be rejected. Set CRON_SECRET in your environment.",
      );
      return false;
    }
    // Only accept Bearer token in production
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Development: If CRON_SECRET is set, require it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Development fallback: allow all requests for local testing
  console.warn("[Payment Retry] CRON_SECRET not set, allowing in dev mode");
  return true;
}

export async function GET(request: NextRequest) {
  // Validate authorization
  if (!isAuthorized(request)) {
    console.warn("[Payment Retry] Unauthorized cron job attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const isDryRun = searchParams.get("dryRun") === "1";

  console.log(
    `[Payment Retry] Starting payment retry job...${isDryRun ? " (DRY RUN)" : ""}`,
  );

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
        paymentLastErrorCode: true,
        paymentLastErrorMessage: true,
        nextPaymentRetryAt: true,
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
      `[Payment Retry] Found ${eligibleSubOrders.length} SubOrders eligible for retry`,
    );

    // Dry run mode: return eligible SubOrders without processing
    if (isDryRun) {
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        dryRun: true,
        eligible: eligibleSubOrders.length,
        duration: `${duration}ms`,
        subOrders: eligibleSubOrders.map((so) => ({
          subOrderId: so.id,
          subOrderNumber: so.subOrderNumber,
          orderNumber: so.Order.orderNumber,
          vendorName: so.Vendor.name,
          attemptCount: so.paymentAttemptCount,
          lastErrorCode: so.paymentLastErrorCode,
          lastErrorMessage: so.paymentLastErrorMessage,
          nextRetryAt: so.nextPaymentRetryAt,
          hasStripeCharge: !!so.stripeChargeId,
          authExpired: isAuthorizationExpired(so.authorizationExpiresAt),
          orderCanceled: so.Order.status === "CANCELED",
          action: !so.stripeChargeId ? "authorize" : "capture",
        })),
      });
    }

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
          `[Payment Retry] Skipping ${subOrder.subOrderNumber} - order is canceled`,
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
          } (attempt ${subOrder.paymentAttemptCount + 1})`,
        );

        result = await authorizeSubOrderCharge(subOrder.id);
      } else {
        // PaymentIntent exists - check if authorization is expired
        if (isAuthorizationExpired(subOrder.authorizationExpiresAt)) {
          console.log(
            `[Payment Retry] Authorization expired for ${subOrder.subOrderNumber}, marking as requires client update`,
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
          } (attempt ${subOrder.paymentAttemptCount + 1})`,
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
          `[Payment Retry] SUCCESS: ${action} for ${subOrder.subOrderNumber}`,
        );
      } else {
        console.log(
          `[Payment Retry] FAILED: ${action} for ${subOrder.subOrderNumber}: ${result.error}`,
        );
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[Payment Retry] Job completed in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`,
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
      { status: 500 },
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
