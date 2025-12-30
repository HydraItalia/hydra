import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
 * POST /api/stripe/customers
 *
 * Creates or retrieves a Stripe Customer for a client.
 * Idempotent: If customer already exists, returns existing customer ID.
 *
 * Request body:
 * {
 *   clientId: string
 * }
 *
 * Response:
 * {
 *   customerId: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
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
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Idempotency: If customer already exists, return existing ID
    if (client.stripeCustomerId) {
      // Verify customer still exists in Stripe
      try {
        const stripe = getStripe();
        const existingCustomer = await stripe.customers.retrieve(
          client.stripeCustomerId
        );

        // If customer was deleted in Stripe, we need to create a new one
        if (existingCustomer.deleted) {
          throw new Error("Customer was deleted in Stripe");
        }

        return NextResponse.json({
          customerId: client.stripeCustomerId,
          existing: true,
        });
      } catch (error) {
        // If customer doesn't exist in Stripe, continue to create new one
        console.warn(
          `Stripe customer ${client.stripeCustomerId} not found, creating new one`
        );
      }
    }

    // Create new Stripe Customer
    const stripe = getStripe();
    const customer = await stripe.customers.create({
      name: client.name,
      email: client.email || undefined,
      metadata: {
        clientId: client.id,
        source: "hydra",
      },
    });

    // Store customer ID in database
    await prisma.client.update({
      where: { id: clientId },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return NextResponse.json({
      customerId: customer.id,
      existing: false,
    });
  } catch (error) {
    console.error("Stripe Customer API error:", error);

    // Return sanitized error messages
    if (error instanceof Stripe.errors.StripeError) {
      // Map Stripe error types to safe, user-friendly messages
      const safeTypeMessages: Record<string, string> = {
        invalid_request_error: "Invalid customer data",
        api_connection_error: "Payment service temporarily unavailable",
        api_error: "Payment service error",
        authentication_error: "Authentication failed",
        rate_limit_error: "Too many requests, please try again later",
      };

      // Map specific error codes (if needed in the future)
      const safeCodeMessages: Record<string, string> = {};

      const message =
        safeCodeMessages[error.code ?? ""] ??
        safeTypeMessages[error.type] ??
        "Failed to create customer";

      return NextResponse.json(
        { error: message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create Stripe customer" },
      { status: 500 }
    );
  }
}
