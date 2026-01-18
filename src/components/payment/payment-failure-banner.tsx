"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard } from "lucide-react";

interface PaymentFailureBannerProps {
  hasPaymentFailure: boolean;
  requiresClientUpdate?: boolean;
  variant?: "client" | "vendor" | "admin";
}

export function PaymentFailureBanner({
  hasPaymentFailure,
  requiresClientUpdate = false,
  variant = "client",
}: PaymentFailureBannerProps) {
  if (!hasPaymentFailure) {
    return null;
  }

  if (variant === "client") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Payment Issue</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>
            {requiresClientUpdate
              ? "There was an issue with your payment method. Please update your payment information to complete this order."
              : "We encountered an issue processing your payment. Our team is working to resolve it."}
          </span>
          {requiresClientUpdate && (
            <Button asChild size="sm" variant="outline" className="w-fit">
              <Link href="/dashboard/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Update Payment Method
              </Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "vendor") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Payment Pending</AlertTitle>
        <AlertDescription>
          {requiresClientUpdate
            ? "Payment failed - client needs to update payment method"
            : "Payment processing encountered an issue. The admin team is handling it."}
        </AlertDescription>
      </Alert>
    );
  }

  // Admin variant
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Payment Failed</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>
          {requiresClientUpdate
            ? "Payment failed - client needs to update payment method"
            : "Payment processing failed. Review in Failed Payments dashboard."}
        </span>
        <Button asChild size="sm" variant="outline" className="w-fit">
          <Link href="/dashboard/payments/failed">View Failed Payments</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
