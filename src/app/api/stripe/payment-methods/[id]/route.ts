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

    // Debug logging for production troubleshooting
    console.log("[PaymentMethod GET] Auth check:", {
      hasUser: !!user,
      role: user?.role,
      clientId: user?.clientId,
    });

    if (!user) {
      console.log("[PaymentMethod GET] Returning 401 - no user session");
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
        console.log("[PaymentMethod GET] No clientId on user");
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      console.log("[PaymentMethod GET] Fetching client:", user.clientId);
      const client = await prisma.client.findUnique({
        where: { id: user.clientId },
        select: { stripeCustomerId: true },
      });
      console.log("[PaymentMethod GET] Client result:", {
        found: !!client,
        stripeCustomerId: client?.stripeCustomerId
      });

      if (!client || !client.stripeCustomerId) {
        console.log("[PaymentMethod GET] No client or stripeCustomerId - returning 404");
        return NextResponse.json(
          { error: "Payment method not found" },
          { status: 404 }
        );
      }

      userStripeCustomerId = client.stripeCustomerId;
    } else if (user.role === "ADMIN") {
      // ADMIN can view any payment method (for support purposes)
      console.log("[AUDIT] Admin accessed payment method", {
        adminId: user.id,
        paymentMethodId,
        action: "GET",
        timestamp: new Date().toISOString(),
      });
      userStripeCustomerId = null; // Skip ownership check for admins
    } else {
      // Other roles should not have access
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // Retrieve payment method from Stripe
    console.log("[PaymentMethod GET] Calling Stripe for:", paymentMethodId);
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log("[PaymentMethod GET] Stripe result:", {
      id: paymentMethod.id,
      customer: paymentMethod.customer,
      type: paymentMethod.type
    });

    // CRITICAL: Verify ownership (unless admin)
    if (
      userStripeCustomerId &&
      paymentMethod.customer !== userStripeCustomerId
    ) {
      console.log("[PaymentMethod GET] Ownership check FAILED:", {
        expected: userStripeCustomerId,
        actual: paymentMethod.customer
      });
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
    console.log("[PaymentMethod GET] SUCCESS - returning card details");
    return NextResponse.json({
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expMonth: paymentMethod.card.exp_month,
      expYear: paymentMethod.card.exp_year,
    });
  } catch (error) {
    console.error("[PaymentMethod GET] CATCH ERROR:", error);

    // Return sanitized error messages
    if (error instanceof Stripe.errors.StripeError) {
      // Map Stripe error types to safe, user-friendly messages
      const safeTypeMessages: Record<string, string> = {
        invalid_request_error: "Invalid request",
        api_connection_error: "Payment service temporarily unavailable",
        api_error: "Payment service error",
        authentication_error: "Authentication failed",
        rate_limit_error: "Too many requests, please try again later",
      };

      // Map specific error codes
      const safeCodeMessages: Record<string, string> = {
        resource_missing: "Payment method not found",
      };

      const message =
        safeCodeMessages[error.code ?? ""] ??
        safeTypeMessages[error.type] ??
        "Payment method error";

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

/**
 * DELETE /api/stripe/payment-methods/[id]
 *
 * Detaches a payment method from a customer and updates the client record.
 * Requires authentication and ownership verification.
 */
export async function DELETE(
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

    // Get user's client record and Stripe customer ID for authorization
    let clientRecord = null;
    let userStripeCustomerId: string | null = null;

    if (user.role === "CLIENT") {
      if (!user.clientId) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      clientRecord = await prisma.client.findUnique({
        where: { id: user.clientId },
        select: {
          id: true,
          stripeCustomerId: true,
          defaultPaymentMethodId: true,
        },
      });

      if (!clientRecord || !clientRecord.stripeCustomerId) {
        return NextResponse.json(
          { error: "Payment method not found" },
          { status: 404 }
        );
      }

      userStripeCustomerId = clientRecord.stripeCustomerId;
    } else if (user.role === "ADMIN") {
      // ADMIN can delete any payment method (for support)
      console.log("[AUDIT] Admin deleted payment method", {
        adminId: user.id,
        paymentMethodId,
        action: "DELETE",
        timestamp: new Date().toISOString(),
      });
      userStripeCustomerId = null; // Skip ownership check
    } else {
      // Other roles should not have access
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // Retrieve payment method from Stripe to verify ownership
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

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    // Update client record if this was their default payment method
    if (
      clientRecord &&
      clientRecord.defaultPaymentMethodId === paymentMethodId
    ) {
      // Check if customer has any remaining payment methods
      const remainingMethods = await stripe.paymentMethods.list({
        customer: clientRecord.stripeCustomerId!,
        limit: 1,
      });

      await prisma.client.update({
        where: { id: clientRecord.id },
        data: {
          defaultPaymentMethodId: null,
          hasPaymentMethod: remainingMethods.data.length > 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment method removed successfully",
    });
  } catch (error) {
    console.error("Delete Payment Method API error:", error);

    // Return sanitized error messages
    if (error instanceof Stripe.errors.StripeError) {
      // Map Stripe error types to safe, user-friendly messages
      const safeTypeMessages: Record<string, string> = {
        invalid_request_error: "Invalid request",
        api_connection_error: "Payment service temporarily unavailable",
        api_error: "Payment service error",
        authentication_error: "Authentication failed",
        rate_limit_error: "Too many requests, please try again later",
      };

      // Map specific error codes
      const safeCodeMessages: Record<string, string> = {
        resource_missing: "Payment method not found",
      };

      const message =
        safeCodeMessages[error.code ?? ""] ??
        safeTypeMessages[error.type] ??
        "Failed to remove payment method";

      return NextResponse.json(
        { error: message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 }
    );
  }
}
