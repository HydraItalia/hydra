"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, CreditCard, AlertCircle } from "lucide-react";

interface StripeConnectOnboardingProps {
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export function StripeConnectOnboarding({
  stripeAccountId,
  chargesEnabled,
  payoutsEnabled,
}: StripeConnectOnboardingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartOnboarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Failed to start onboarding";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Response body is not valid JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Redirect to Stripe onboarding - validate URL to prevent open redirect
      const url = new URL(data.url);
      if (
        !url.hostname.endsWith(".stripe.com") &&
        url.hostname !== "stripe.com"
      ) {
        throw new Error("Invalid onboarding URL");
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("Error starting onboarding:", err);
      const message =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out. Please try again."
            : err.message
          : "An error occurred";
      setError(message);
      setIsLoading(false);
    }
  };

  // Not onboarded yet
  if (!stripeAccountId) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">Payment Receiving</span>
              <Badge variant="secondary">Not Set Up</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Connect your Stripe account to receive payments for orders
            </p>
            <Button
              onClick={handleStartOnboarding}
              disabled={isLoading}
              size="sm"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Stripe Account
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Onboarding incomplete (account exists but not enabled)
  if (!chargesEnabled || !payoutsEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">Payment Receiving</span>
              <Badge variant="outline" className="border-yellow-600">
                Incomplete
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Your Stripe account setup is incomplete. Complete the onboarding
              process to receive payments.
            </p>
            <Button
              onClick={handleStartOnboarding}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Onboarding
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Fully onboarded and enabled
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">Payment Receiving</span>
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Your Stripe account is connected and ready to receive payments
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Charges enabled</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Payouts enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
