"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentMethodForm } from "./payment-method-form";
import { PaymentMethodDisplay } from "./payment-method-display";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured");
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

interface PaymentMethodManagerProps {
  clientId: string;
  clientName: string;
  stripeCustomerId: string | null;
  hasPaymentMethod: boolean;
  defaultPaymentMethodId: string | null;
}

export function PaymentMethodManager({
  clientId,
  stripeCustomerId,
  hasPaymentMethod: initialHasPaymentMethod,
  defaultPaymentMethodId: initialDefaultPaymentMethodId,
}: PaymentMethodManagerProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(
    initialHasPaymentMethod
  );
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState(
    initialDefaultPaymentMethodId
  );
  // Cache customer ID to prevent duplicate customer creation
  const [cachedCustomerId, setCachedCustomerId] = useState(stripeCustomerId);

  // Ensure Stripe customer exists before adding card
  const ensureStripeCustomer = async (): Promise<string | null> => {
    if (cachedCustomerId) {
      return cachedCustomerId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch("/api/stripe/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create Stripe customer");
      }

      const data = await response.json();
      // Cache the customer ID to prevent duplicate creation
      setCachedCustomerId(data.customerId);
      return data.customerId;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error creating Stripe customer:", err);

      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw err;
    }
  };

  const handleAddCard = async () => {
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Ensure customer exists
      const customerId = await ensureStripeCustomer();
      if (!customerId) {
        throw new Error("Failed to create Stripe customer");
      }

      // Create SetupIntent
      const response = await fetch("/api/stripe/setup-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initialize payment setup");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setIsAddingCard(true);
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsAddingCard(false);
    setClientSecret(null);
    setError(null);
  };

  const handleSuccess = (paymentMethodId: string) => {
    setHasPaymentMethod(true);
    setDefaultPaymentMethodId(paymentMethodId);
    setIsAddingCard(false);
    setClientSecret(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isAddingCard && (
        <>
          {hasPaymentMethod && defaultPaymentMethodId ? (
            <PaymentMethodDisplay
              paymentMethodId={defaultPaymentMethodId}
              onUpdate={handleAddCard}
              isDefault={true}
            />
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No payment method on file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a payment method to enable seamless ordering
                </p>
              </div>
              <Button onClick={handleAddCard} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Payment Method
              </Button>
            </div>
          )}
        </>
      )}

      {isAddingCard && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentMethodForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Elements>
      )}
    </div>
  );
}
