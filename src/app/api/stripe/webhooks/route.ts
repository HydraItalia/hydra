import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
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
 * POST /api/stripe/webhooks
 *
 * Handles Stripe webhook events for SetupIntents, PaymentMethods, and Connect accounts.
 *
 * Events handled:
 * - setup_intent.succeeded: Updates client record when payment method is successfully set up
 * - payment_method.attached: Logs when payment method is attached to customer
 * - account.updated: Updates vendor capabilities when Connect account is updated
 *
 * Security:
 * - Verifies webhook signatures using STRIPE_WEBHOOK_SECRET
 * - Implements idempotent event handling
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the raw body as text (required for signature verification)
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("[WEBHOOK] Missing stripe-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[WEBHOOK] Signature verification failed:", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Log all webhook events for debugging
    console.log("[WEBHOOK] Received event:", {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Handle different event types
    switch (event.type) {
      case "setup_intent.succeeded":
        await handleSetupIntentSucceeded(event);
        break;

      case "payment_method.attached":
        await handlePaymentMethodAttached(event);
        break;

      case "account.updated":
        await handleAccountUpdated(event);
        break;

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Return 500 for unexpected errors
    // Stripe will retry the webhook
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handles setup_intent.succeeded event
 * Updates the client record with the new payment method
 */
async function handleSetupIntentSucceeded(event: Stripe.Event) {
  const setupIntent = event.data.object as Stripe.SetupIntent;

  console.log("[WEBHOOK] Processing setup_intent.succeeded:", {
    setupIntentId: setupIntent.id,
    customer: setupIntent.customer,
    paymentMethod: setupIntent.payment_method,
    status: setupIntent.status,
  });

  // Validate required fields
  if (!setupIntent.customer || !setupIntent.payment_method) {
    console.warn("[WEBHOOK] setup_intent.succeeded missing required fields:", {
      setupIntentId: setupIntent.id,
      hasCustomer: !!setupIntent.customer,
      hasPaymentMethod: !!setupIntent.payment_method,
    });
    return;
  }

  const customerId =
    typeof setupIntent.customer === "string"
      ? setupIntent.customer
      : setupIntent.customer.id;

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method.id;

  try {
    // Find client by Stripe customer ID
    const client = await prisma.client.findUnique({
      where: { stripeCustomerId: customerId },
      select: {
        id: true,
        name: true,
        defaultPaymentMethodId: true,
        hasPaymentMethod: true,
      },
    });

    if (!client) {
      console.warn("[WEBHOOK] No client found for Stripe customer:", {
        customerId,
        setupIntentId: setupIntent.id,
      });
      return;
    }

    // Idempotent check: Skip if this payment method is already set as default
    if (client.defaultPaymentMethodId === paymentMethodId) {
      console.log("[WEBHOOK] Payment method already set as default:", {
        clientId: client.id,
        paymentMethodId,
        setupIntentId: setupIntent.id,
      });
      return;
    }

    // Update client record
    await prisma.client.update({
      where: { id: client.id },
      data: {
        defaultPaymentMethodId: paymentMethodId,
        hasPaymentMethod: true,
      },
    });

    console.log("[WEBHOOK] Client updated successfully:", {
      clientId: client.id,
      clientName: client.name,
      paymentMethodId,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error("[WEBHOOK] Error updating client record:", {
      customerId,
      paymentMethodId,
      setupIntentId: setupIntent.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handles payment_method.attached event
 * Logs when a payment method is attached to a customer
 */
async function handlePaymentMethodAttached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  console.log("[WEBHOOK] Processing payment_method.attached:", {
    paymentMethodId: paymentMethod.id,
    customer: paymentMethod.customer,
    type: paymentMethod.type,
    card: paymentMethod.card
      ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        }
      : null,
  });

  // This event is primarily for logging/monitoring
  // The actual client record update happens in setup_intent.succeeded
}

/**
 * Handles account.updated event
 * Updates vendor capabilities when Stripe Connect account is updated
 */
async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;

  console.log("[WEBHOOK] Processing account.updated:", {
    accountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  });

  try {
    // Find vendor by Stripe account ID
    const vendor = await prisma.vendor.findUnique({
      where: { stripeAccountId: account.id },
      select: {
        id: true,
        name: true,
        chargesEnabled: true,
        payoutsEnabled: true,
      },
    });

    if (!vendor) {
      console.warn("[WEBHOOK] No vendor found for Stripe account:", {
        accountId: account.id,
      });
      return;
    }

    // Check if capabilities have changed
    const needsUpdate =
      vendor.chargesEnabled !== account.charges_enabled ||
      vendor.payoutsEnabled !== account.payouts_enabled;

    if (!needsUpdate) {
      console.log("[WEBHOOK] Vendor capabilities unchanged:", {
        vendorId: vendor.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
      return;
    }

    // Update vendor capabilities
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      },
    });

    console.log("[WEBHOOK] Vendor capabilities updated:", {
      vendorId: vendor.id,
      vendorName: vendor.name,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      accountId: account.id,
    });
  } catch (error) {
    console.error("[WEBHOOK] Error updating vendor capabilities:", {
      accountId: account.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to trigger webhook retry
  }
}
