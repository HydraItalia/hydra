/**
 * Stripe Pre-Authorization Logic
 *
 * Handles pre-authorizing vendor charges using Stripe PaymentIntents
 * with manual capture. Vendor is the merchant of record.
 */

import { prisma } from "@/lib/prisma";
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

    // Check if already authorized
    if (subOrder.stripeChargeId) {
      return {
        success: true,
        paymentIntentId: subOrder.stripeChargeId,
      };
    }

    // Validate client has payment method
    if (!subOrder.Order.Client.stripeCustomerId) {
      return {
        success: false,
        error: `Client ${subOrder.Order.Client.name} does not have a Stripe Customer ID`,
      };
    }

    if (!subOrder.Order.Client.defaultPaymentMethodId) {
      return {
        success: false,
        error: `Client ${subOrder.Order.Client.name} does not have a default payment method`,
      };
    }

    // Validate vendor has Stripe Connect enabled
    if (!subOrder.Vendor.stripeAccountId) {
      return {
        success: false,
        error: `Vendor ${subOrder.Vendor.name} does not have a Stripe Connect account`,
      };
    }

    if (!subOrder.Vendor.chargesEnabled) {
      return {
        success: false,
        error: `Vendor ${subOrder.Vendor.name} is not enabled to accept charges`,
      };
    }

    // Create PaymentIntent directly on vendor's connected account
    // The vendor is the merchant of record, so funds go directly to them
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: subOrder.subTotalCents,
        currency: "eur",
        customer: subOrder.Order.Client.stripeCustomerId,
        payment_method: subOrder.Order.Client.defaultPaymentMethodId,
        capture_method: "manual", // Pre-authorize only, don't capture funds
        confirm: true, // Immediately confirm the payment
        off_session: true, // Payment is being made without customer present
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
        stripeAccount: subOrder.Vendor.stripeAccountId, // Create on vendor's account
      }
    );

    // Update SubOrder with PaymentIntent ID and status
    await prisma.subOrder.update({
      where: { id: subOrderId },
      data: {
        stripeChargeId: paymentIntent.id,
        paymentStatus:
          paymentIntent.status === "requires_capture"
            ? "PROCESSING"
            : "PENDING",
      },
    });

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
