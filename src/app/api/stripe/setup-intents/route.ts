import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, canManageClient } from "@/lib/auth";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

// Initialize Stripe lazily to avoid build-time errors
// Caches the instance to avoid repeated initialization
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
 * POST /api/stripe/setup-intents
 *
 * Creates a Stripe SetupIntent to save a payment method for a client.
 * Requires authentication and that the client has a Stripe Customer ID.
 *
 * Request body:
 * {
 *   clientId: string
 *   paymentMethodTypes?: string[] // Optional, defaults to ["card"]
 * }
 *
 * Supported payment method types:
 * - "card" (default)
 * - "sepa_debit"
 * - "us_bank_account"
 * - "bacs_debit"
 * - And more: https://docs.stripe.com/api/setup_intents/create#create_setup_intent-payment_method_types
 *
 * Response:
 * {
 *   clientSecret: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { clientId, paymentMethodTypes = ["card"] } = body;

    // Validate request
    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Validate payment method types
    if (!Array.isArray(paymentMethodTypes) || paymentMethodTypes.length === 0) {
      return NextResponse.json(
        { error: "paymentMethodTypes must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch client from database
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Ensure client has a Stripe Customer ID
    if (!client.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "Client does not have a Stripe Customer ID. Please create a customer first.",
        },
        { status: 400 }
      );
    }

    // Authorization: Check if user has access to this client
    const canManage = await canManageClient(user, clientId);

    if (!canManage) {
      return NextResponse.json(
        {
          error:
            "Forbidden - you do not have permission to manage this client's payment methods",
        },
        { status: 403 }
      );
    }

    // Create SetupIntent
    const stripe = getStripe();
    const setupIntent = await stripe.setupIntents.create({
      customer: client.stripeCustomerId,
      payment_method_types: paymentMethodTypes,
      metadata: {
        clientId: client.id,
        clientName: client.name,
        source: "hydra",
      },
    });

    if (!setupIntent.client_secret) {
      throw new Error("SetupIntent created without client_secret");
    }

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("SetupIntent API error:", error);

    // Return sanitized error messages
    if (error instanceof Stripe.errors.StripeError) {
      // Map Stripe error types to safe, user-friendly messages
      const safeTypeMessages: Record<string, string> = {
        invalid_request_error: "Invalid payment setup request",
        api_connection_error: "Payment service temporarily unavailable",
        api_error: "Payment service error",
        authentication_error: "Authentication failed",
        rate_limit_error: "Too many requests, please try again later",
      };

      // Map specific error codes
      const safeCodeMessages: Record<string, string> = {
        resource_missing: "Customer not found",
      };

      const message =
        safeCodeMessages[error.code ?? ""] ??
        safeTypeMessages[error.type] ??
        "Failed to initialize payment setup";

      return NextResponse.json(
        { error: message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create SetupIntent" },
      { status: 500 }
    );
  }
}
