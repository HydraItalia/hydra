"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const SUCCESS_MESSAGE_DURATION = 1500;

interface PaymentMethodFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
}

export function PaymentMethodForm({
  onSuccess,
  onCancel,
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track mounted state to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear timeout to prevent memory leak
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

      // Validate setupIntent and payment_method exist
      if (!setupIntent) {
        setError("Setup failed to complete");
        setIsProcessing(false);
        return;
      }

      if (setupIntent.status === "succeeded" && setupIntent.payment_method) {
        // Handle both string and PaymentMethod object types
        const paymentMethodId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method.id;

        // NOTE: Client record update will be handled by Stripe webhooks (Issue #96)
        // The webhook endpoint will listen for setup_intent.succeeded events
        // and update the Client model's defaultPaymentMethodId and hasPaymentMethod fields.
        // This ensures consistency even if the user closes their browser.

        setSuccess(true);

        // Show success message briefly before closing
        // Use isMountedRef to prevent calling callback after unmount
        // Store timeout ref to clear on unmount
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            onSuccess(paymentMethodId);
          }
        }, SUCCESS_MESSAGE_DURATION);
      } else {
        setError(
          setupIntent.payment_method
            ? "Payment method setup did not complete successfully"
            : "No payment method was attached"
        );
        setIsProcessing(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setIsProcessing(false);
    }
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
