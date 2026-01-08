import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { authorizeSubOrderCharge } from "@/lib/stripe-auth";

/**
 * POST /api/stripe/authorize-charge
 *
 * Pre-authorizes a charge for a SubOrder on the vendor's Stripe Connected Account.
 * Creates a PaymentIntent with capture_method: 'manual' to hold funds without capturing.
 * The vendor is the merchant of record - funds go directly to them when captured.
 *
 * Request body:
 * {
 *   subOrderId: string
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   paymentIntentId?: string
 *   error?: string
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

    // Only ADMIN and AGENT roles can pre-authorize charges
    if (user.role !== "ADMIN" && user.role !== "AGENT") {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { subOrderId } = body;

    // Validate request
    if (!subOrderId) {
      return NextResponse.json(
        { error: "subOrderId is required" },
        { status: 400 }
      );
    }

    // Authorize the charge using the shared module
    const result = await authorizeSubOrderCharge(subOrderId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (error) {
    console.error("Authorize charge API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to authorize charge",
      },
      { status: 500 }
    );
  }
}
