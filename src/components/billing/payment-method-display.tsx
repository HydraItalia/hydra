"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentMethodDisplayProps {
  paymentMethodId: string;
  onUpdate: () => void;
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
  isDefault = false,
}: PaymentMethodDisplayProps) {
  const [details, setDetails] = useState<PaymentMethodDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        <Button variant="outline" onClick={onUpdate}>
          Update
        </Button>
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
