import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, canManageClient } from "@/lib/auth";
import Stripe from "stripe";

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Please add it to your environment variables."
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
  });
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
 * }
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
    const { clientId } = body;

    // Validate request
    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
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
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
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
      payment_method_types: ["card"], // Can add more types like 'sepa_debit', 'us_bank_account'
      metadata: {
        clientId: client.id,
        clientName: client.name,
        source: "hydra",
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("SetupIntent API error:", error);

    // Return specific error messages
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create SetupIntent" },
      { status: 500 }
    );
  }
}
