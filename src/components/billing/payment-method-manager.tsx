"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentMethodForm } from "./payment-method-form";
import { PaymentMethodDisplay } from "./payment-method-display";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
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
  clientName,
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

  // Ensure Stripe customer exists before adding card
  const ensureStripeCustomer = async (): Promise<string | null> => {
    if (stripeCustomerId) {
      return stripeCustomerId;
    }

    try {
      const response = await fetch("/api/stripe/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create Stripe customer");
      }

      const data = await response.json();
      return data.customerId;
    } catch (err) {
      console.error("Error creating Stripe customer:", err);
      throw err;
    }
  };

  const handleAddCard = async () => {
    setError(null);
    setIsLoading(true);

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
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initialize payment setup");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setIsAddingCard(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
            clientId={clientId}
            clientSecret={clientSecret}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Elements>
      )}
    </div>
  );
}
