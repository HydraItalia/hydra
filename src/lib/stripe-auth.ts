/**
 * Stripe Pre-Authorization Logic
 *
 * Handles pre-authorizing vendor charges using Stripe PaymentIntents
 * with manual capture. Vendor is the merchant of record.
 */

import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

// Initialize Stripe lazily
function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Please add it to your environment variables."
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
    timeout: 25000, // 25 second timeout for Stripe API calls
    maxNetworkRetries: 2, // Retry failed requests up to 2 times
  });

  return stripeInstance;
}

export type AuthorizationResult = {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
};

/**
 * Pre-authorize a charge for a SubOrder on the vendor's Stripe Connected Account
 *
 * @param subOrderId - The ID of the SubOrder to authorize
 * @returns Result with success status and PaymentIntent ID or error
 */
export async function authorizeSubOrderCharge(
  subOrderId: string
): Promise<AuthorizationResult> {
  try {
    // Fetch SubOrder with related data
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: {
        Vendor: {
          select: {
            id: true,
            name: true,
            stripeAccountId: true,
            chargesEnabled: true,
          },
        },
        Order: {
          select: {
            id: true,
            orderNumber: true,
            Client: {
              select: {
                id: true,
                name: true,
                stripeCustomerId: true,
                defaultPaymentMethodId: true,
              },
            },
          },
        },
      },
    });

    if (!subOrder) {
      return {
        success: false,
        error: "SubOrder not found",
      };
    }

    // Check if already authorized - verify PaymentIntent is still valid
    // This prevents race conditions and validates the payment state before returning
    if (subOrder.stripeChargeId) {
      const stripe = getStripe();
      try {
        // Fetch the PaymentIntent from Stripe to verify its current state
        // We can't trust the database alone - the PaymentIntent could be canceled, expired, or failed
        const existingPI = await stripe.paymentIntents.retrieve(
          subOrder.stripeChargeId,
          {},
          {
            stripeAccount: subOrder.Vendor.stripeAccountId || undefined,
          }
        );

        // Only return success if PaymentIntent is in a valid state
        if (
          existingPI.status === "requires_capture" ||
          existingPI.status === "succeeded"
        ) {
          return {
            success: true,
            paymentIntentId: subOrder.stripeChargeId,
          };
        }

        // If PaymentIntent is canceled/failed, continue to create a new one
        console.warn(
          `[Pre-Auth] Existing PaymentIntent ${subOrder.stripeChargeId} has status ${existingPI.status}, creating new one`
        );
      } catch (error) {
        // If we can't retrieve the PaymentIntent (deleted, invalid, etc.), create a new one
        console.warn(
          `[Pre-Auth] Could not retrieve existing PaymentIntent ${subOrder.stripeChargeId}, creating new one`
        );
      }
    }

    // Validate client has payment method
    if (!subOrder.Order.Client.stripeCustomerId) {
      return {
        success: false,
        error: "Client does not have a Stripe Customer ID",
      };
    }

    if (!subOrder.Order.Client.defaultPaymentMethodId) {
      return {
        success: false,
        error: "Client does not have a default payment method",
      };
    }

    // Validate vendor has Stripe Connect enabled
    if (!subOrder.Vendor.stripeAccountId) {
      return {
        success: false,
        error: "Vendor does not have a Stripe Connect account",
      };
    }

    if (!subOrder.Vendor.chargesEnabled) {
      return {
        success: false,
        error: "Vendor is not enabled to accept charges",
      };
    }

    // Create PaymentIntent with platform as merchant of record
    // Funds will automatically transfer to the vendor's connected account
    // This is the recommended approach for marketplace platforms
    const stripe = getStripe();

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: subOrder.subTotalCents,
          currency: "eur",
          customer: subOrder.Order.Client.stripeCustomerId,
          payment_method: subOrder.Order.Client.defaultPaymentMethodId,
          capture_method: "manual", // Pre-authorize only, don't capture funds
          confirm: true, // Immediately confirm the payment
          off_session: true, // Payment is being made without customer present
          transfer_data: {
            destination: subOrder.Vendor.stripeAccountId, // Funds go to vendor
          },
          metadata: {
            subOrderId: subOrder.id,
            subOrderNumber: subOrder.subOrderNumber,
            orderId: subOrder.Order.id,
            orderNumber: subOrder.Order.orderNumber,
            vendorId: subOrder.Vendor.id,
            vendorName: subOrder.Vendor.name,
            clientId: subOrder.Order.Client.id,
            clientName: subOrder.Order.Client.name,
            source: "hydra-pre-auth",
          },
        },
        {
          idempotencyKey: `pre-auth-${subOrderId}`, // Prevent duplicate charges on retry
        }
      );
    } catch (error) {
      // If PaymentIntent creation fails, don't update database
      if (error instanceof Stripe.errors.StripeError) {
        console.error(
          `[Pre-Auth] Stripe error for SubOrder ${subOrderId}:`,
          error.message
        );
      }
      throw error; // Re-throw to be handled by outer catch
    }

    // Map Stripe status to payment status
    let paymentStatus: PaymentStatus;
    switch (paymentIntent.status) {
      case "requires_capture":
        paymentStatus = PaymentStatus.PROCESSING;
        break;
      case "requires_action":
      case "requires_payment_method":
        paymentStatus = PaymentStatus.PENDING;
        break;
      case "canceled":
        paymentStatus = PaymentStatus.FAILED;
        break;
      case "succeeded":
        paymentStatus = PaymentStatus.SUCCEEDED;
        break;
      default:
        console.warn(
          `[Pre-Auth] Unexpected PaymentIntent status: ${paymentIntent.status}`
        );
        paymentStatus = PaymentStatus.PENDING;
    }

    // Update SubOrder with PaymentIntent ID and status
    // Use updateMany with conditional where to prevent race conditions
    // Only update if stripeChargeId is still null
    try {
      const updateResult = await prisma.subOrder.updateMany({
        where: {
          id: subOrderId,
          stripeChargeId: null, // Only update if not already authorized
        },
        data: {
          stripeChargeId: paymentIntent.id,
          paymentStatus,
        },
      });

      // If no rows were updated, another process already authorized this
      if (updateResult.count === 0) {
        console.warn(
          `[Pre-Auth] SubOrder ${subOrderId} was authorized by another process, canceling new PaymentIntent ${paymentIntent.id}`
        );

        // Cancel the newly created PaymentIntent since we don't need it
        try {
          await stripe.paymentIntents.cancel(
            paymentIntent.id,
            {},
            {
              stripeAccount: subOrder.Vendor.stripeAccountId,
            }
          );
          console.log(
            `[Pre-Auth] Canceled duplicate PaymentIntent ${paymentIntent.id}`
          );
        } catch (cancelError) {
          // Log but don't fail - the important thing is we detected the race condition
          console.error(
            `[Pre-Auth] Failed to cancel duplicate PaymentIntent ${paymentIntent.id}:`,
            cancelError
          );
        }

        // Fetch the existing charge ID that won the race
        const existingSubOrder = await prisma.subOrder.findUnique({
          where: { id: subOrderId },
          select: { stripeChargeId: true },
        });

        if (!existingSubOrder?.stripeChargeId) {
          // This should never happen - if update count was 0, another process must have set it
          throw new Error(
            `[Pre-Auth] Race condition detected but could not retrieve existing stripeChargeId for SubOrder ${subOrderId}`
          );
        }

        // Return the existing PaymentIntent ID
        return {
          success: true,
          paymentIntentId: existingSubOrder.stripeChargeId,
        };
      }
    } catch (dbError) {
      // Database update failed - log for reconciliation
      console.error(
        `[Pre-Auth] Database update failed for SubOrder ${subOrderId}, PaymentIntent ${paymentIntent.id} is orphaned`,
        dbError
      );

      // Attempt to cancel the PaymentIntent to prevent orphaned charges
      try {
        await stripe.paymentIntents.cancel(
          paymentIntent.id,
          {},
          {
            stripeAccount: subOrder.Vendor.stripeAccountId,
          }
        );
        console.log(
          `[Pre-Auth] Canceled orphaned PaymentIntent ${paymentIntent.id}`
        );
      } catch (cancelError) {
        console.error(
          `[Pre-Auth] Failed to cancel orphaned PaymentIntent ${paymentIntent.id}`,
          cancelError
        );
      }

      throw dbError; // Re-throw database error
    }

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Authorize charge error:", error);

    // Handle Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      // Map Stripe error codes to user-friendly messages
      const safeCodeMessages: Record<string, string> = {
        resource_missing: "Payment resource not found",
        payment_method_not_available:
          "Payment method is not available for this transaction",
        card_declined: "Card was declined",
        insufficient_funds: "Insufficient funds",
        invalid_account: "Invalid Stripe account",
      };

      const message =
        safeCodeMessages[error.code ?? ""] || "Failed to authorize charge";

      return {
        success: false,
        error: message,
      };
    }

    return {
      success: false,
      error: "Failed to authorize charge",
    };
  }
}
