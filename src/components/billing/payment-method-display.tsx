"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PaymentMethodDisplayProps {
  paymentMethodId: string;
  onUpdate: () => void;
  onRemove: () => void;
  isDefault?: boolean;
}

interface PaymentMethodDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export function PaymentMethodDisplay({
  paymentMethodId,
  onUpdate,
  onRemove,
  isDefault = false,
}: PaymentMethodDisplayProps) {
  const [details, setDetails] = useState<PaymentMethodDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethodDetails = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/stripe/payment-methods/${paymentMethodId}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to fetch payment method details");
      }

      const data = await response.json();
      setDetails(data);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error fetching payment method:", err);

      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError("Could not load payment method details");
      }
    } finally {
      setIsLoading(false);
    }
  }, [paymentMethodId]);

  const handleRemove = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setIsRemoving(true);
      setError(null);

      const response = await fetch(
        `/api/stripe/payment-methods/${paymentMethodId}`,
        {
          method: "DELETE",
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove payment method");
      }

      // Success - call parent callback
      onRemove();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error removing payment method:", err);

      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to remove payment method"
        );
      }
    } finally {
      setIsRemoving(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethodDetails();
  }, [fetchPaymentMethodDetails]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || "Payment method information unavailable"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 flex items-center justify-center bg-muted rounded">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {formatBrand(details.brand)} ending in {details.last4}
            </p>
            <p className="text-sm text-muted-foreground">
              Expires {details.expMonth}/{details.expYear}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onUpdate} disabled={isRemoving}>
            Update
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isRemoving}>
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this payment method? You will
                  need to add a new one to place orders.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove}>
                  Remove Payment Method
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isDefault && (
        <p className="text-xs text-muted-foreground">
          This is your default payment method. It will be used for all orders
          unless you specify otherwise.
        </p>
      )}
    </div>
  );
}

function formatBrand(brand: string): string {
  const brandMap: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };

  return (
    brandMap[brand.toLowerCase()] ||
    brand.charAt(0).toUpperCase() + brand.slice(1)
  );
}
