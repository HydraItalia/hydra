"use client";

import { useState, FormEvent } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface PaymentMethodFormProps {
  clientId: string;
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
}

export function PaymentMethodForm({
  clientId,
  clientSecret,
  onSuccess,
  onCancel,
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm the SetupIntent
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href, // Fallback, but we handle success here
        },
        redirect: "if_required", // Don't redirect, handle success inline
      });

      if (stripeError) {
        setError(stripeError.message || "Failed to save payment method");
        setIsProcessing(false);
        return;
      }

      if (setupIntent?.status === "succeeded") {
        const paymentMethodId = setupIntent.payment_method as string;

        // Update client record with payment method
        await updateClientPaymentMethod(paymentMethodId);

        setSuccess(true);
        setTimeout(() => {
          onSuccess(paymentMethodId);
        }, 1500); // Show success message briefly before closing
      } else {
        setError("Payment method setup did not complete successfully");
        setIsProcessing(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setIsProcessing(false);
    }
  };

  const updateClientPaymentMethod = async (paymentMethodId: string) => {
    // This will be handled by webhook in the future
    // For now, we could add a manual update endpoint if needed
    console.log("Payment method saved:", paymentMethodId);
  };

  if (success) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          Payment method saved successfully!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Your payment information is encrypted and securely stored by Stripe.
          </p>
          <p className="mt-1">We never see or store your card details.</p>
        </div>

        <div className="rounded-lg border p-4">
          <PaymentElement />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Save Payment Method"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
