import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
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

    // Retrieve payment method from Stripe
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

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

    // Return specific error messages
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve payment method" },
      { status: 500 }
    );
  }
}
