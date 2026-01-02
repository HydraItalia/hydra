"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClientPaymentStatusProps {
  hasPaymentMethod: boolean;
  defaultPaymentMethodId: string | null;
  updatedAt: string;
}

interface PaymentMethodDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
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

export function ClientPaymentStatus({
  hasPaymentMethod,
  defaultPaymentMethodId,
  updatedAt,
}: ClientPaymentStatusProps) {
  const [details, setDetails] = useState<PaymentMethodDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPaymentMethod || !defaultPaymentMethodId) {
      return;
    }

    const fetchPaymentMethodDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/stripe/payment-methods/${defaultPaymentMethodId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payment method details");
        }

        const data = await response.json();
        setDetails(data);
      } catch (err) {
        console.error("Error fetching payment method:", err);
        setError("Could not load payment method details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethodDetails();
  }, [hasPaymentMethod, defaultPaymentMethodId]);

  // Show "No payment method" state
  if (!hasPaymentMethod) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <XCircle className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">Payment Method</span>
            <Badge variant="secondary">Not Set Up</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            No payment method on file
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Loading payment details...
        </span>
      </div>
    );
  }

  // Show error state
  if (error || !details) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || "Payment method information unavailable"}
        </AlertDescription>
      </Alert>
    );
  }

  // Format last updated date
  const lastUpdated = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Show payment method details
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">Payment Method</span>
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatBrand(details.brand)} ending in {details.last4}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Expires {details.expMonth}/{details.expYear % 100} • Last updated{" "}
            {lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}
