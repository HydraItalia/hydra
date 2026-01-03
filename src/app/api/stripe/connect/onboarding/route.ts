import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

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
 * POST /api/stripe/connect/onboarding
 *
 * Creates or retrieves a Stripe Connect account for a vendor and generates
 * an onboarding link for them to complete their account setup.
 *
 * Authentication: VENDOR role required
 *
 * Response:
 * {
 *   url: string - The URL to redirect the vendor to for onboarding
 *   accountId: string - The Stripe Connect account ID
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication - only VENDOR users can onboard
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "VENDOR") {
      return NextResponse.json(
        { error: "Only vendors can access this endpoint" },
        { status: 403 }
      );
    }

    if (!user.vendorId) {
      return NextResponse.json(
        { error: "Vendor record not found" },
        { status: 404 }
      );
    }

    // Fetch vendor record
    const vendor = await prisma.vendor.findUnique({
      where: { id: user.vendorId },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        stripeAccountId: true,
        chargesEnabled: true,
        payoutsEnabled: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor record not found" },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    let accountId = vendor.stripeAccountId;

    // If vendor doesn't have a Stripe account, create one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express", // Express accounts have simplified onboarding
        country: "IT", // Italy - adjust based on your business location
        email: vendor.contactEmail || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company", // Most vendors will be companies
        metadata: {
          vendorId: vendor.id,
          source: "hydra",
        },
      });

      accountId = account.id;

      // Store the account ID in the database
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          stripeAccountId: accountId,
        },
      });
    }

    // Generate account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/vendor/settings?refresh=true`,
      return_url: `${baseUrl}/dashboard/vendor/settings?onboarding=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    });
  } catch (error) {
    console.error("Stripe Connect onboarding error:", error);

    // Return sanitized error messages
    if (error instanceof Stripe.errors.StripeError) {
      const safeTypeMessages: Record<string, string> = {
        invalid_request_error: "Invalid account data",
        api_connection_error: "Payment service temporarily unavailable",
        api_error: "Payment service error",
        authentication_error: "Authentication failed",
        rate_limit_error: "Too many requests, please try again later",
      };

      const safeCodeMessages: Record<string, string> = {
        account_invalid: "Account setup is incomplete or invalid",
      };

      const message =
        safeCodeMessages[error.code ?? ""] ??
        safeTypeMessages[error.type] ??
        "Failed to create onboarding link";

      return NextResponse.json(
        { error: message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create onboarding link" },
      { status: 500 }
    );
  }
}
