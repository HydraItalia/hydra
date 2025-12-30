import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Stripe singleton
let stripeInstance: Stripe | null = null;

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

/**
 * GET /api/stripe/payment-methods/[id]
 *
 * Retrieves payment method details for display purposes.
 * Returns only safe, displayable information (brand, last4, exp date).
 *
 * Authentication required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    const { id: paymentMethodId } = await params;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    // Get user's Stripe customer ID for authorization
    let userStripeCustomerId: string | null = null;

    if (user.role === "CLIENT") {
      // For CLIENT users, get their client record
      if (!user.clientId) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      const client = await prisma.client.findUnique({
        where: { id: user.clientId },
        select: { stripeCustomerId: true },
      });

      if (!client || !client.stripeCustomerId) {
        return NextResponse.json(
          { error: "Payment method not found" },
          { status: 404 }
        );
      }

      userStripeCustomerId = client.stripeCustomerId;
    } else if (user.role === "ADMIN") {
      // ADMIN can view any payment method (for support purposes)
      // Note: In production, you may want to log admin access for audit purposes
      userStripeCustomerId = null; // Skip ownership check for admins
    } else {
      // Other roles should not have access
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // Retrieve payment method from Stripe
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // CRITICAL: Verify ownership (unless admin)
    if (
      userStripeCustomerId &&
      paymentMethod.customer !== userStripeCustomerId
    ) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // Only return card details (most common payment method type)
    if (paymentMethod.type !== "card" || !paymentMethod.card) {
      return NextResponse.json(
        { error: "Unsupported payment method type" },
        { status: 400 }
      );
    }

    // Return safe, displayable information only
    return NextResponse.json({
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expMonth: paymentMethod.card.exp_month,
      expYear: paymentMethod.card.exp_year,
    });
  } catch (error) {
    console.error("Payment Method API error:", error);

    // Return sanitized error messages
    if (error instanceof Stripe.errors.StripeError) {
      // Map Stripe error codes to safe, user-friendly messages
      const safeMessages: Record<string, string> = {
        resource_missing: "Payment method not found",
        invalid_request_error: "Invalid request",
        api_connection_error: "Payment service temporarily unavailable",
        api_error: "Payment service error",
        authentication_error: "Authentication failed",
        rate_limit_error: "Too many requests, please try again later",
      };

      const message = safeMessages[error.code ?? ""] ?? "Payment method error";

      return NextResponse.json(
        { error: message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve payment method" },
      { status: 500 }
    );
  }
}
