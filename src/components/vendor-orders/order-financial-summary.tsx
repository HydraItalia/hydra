"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Info } from "lucide-react";

interface OrderFinancialSummaryProps {
  grossTotalCents: number | null;
  vatTotalCents: number | null;
  netTotalCents: number | null;
  hydraFeeCents: number | null;
}

/**
 * Compute display-only VAT percentage from net and VAT amounts.
 * Returns null if calculation is not possible.
 */
function computeDisplayVatPercent(
  netCents: number | null,
  vatCents: number | null
): number | null {
  if (netCents === null || vatCents === null || netCents <= 0) {
    return null;
  }
  // Round to 2 decimal places for display
  return Math.round((vatCents / netCents) * 100 * 100) / 100;
}

/**
 * Financial breakdown component for vendor order detail view.
 * Displays stored snapshot values only (no recomputation).
 * Gracefully handles null values for backward compatibility with older orders.
 */
export function OrderFinancialSummary({
  grossTotalCents,
  vatTotalCents,
  netTotalCents,
  hydraFeeCents,
}: OrderFinancialSummaryProps) {
  // Check if we have the required financial data
  const hasFinancialData =
    grossTotalCents !== null &&
    vatTotalCents !== null &&
    netTotalCents !== null;

  // Compute display-only VAT percentage
  const vatPercent = computeDisplayVatPercent(netTotalCents, vatTotalCents);

  if (!hasFinancialData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Financial breakdown not available for older orders.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Breakdown</CardTitle>
        <CardDescription>
          VAT and fee summary for this sub-order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Financial rows */}
        <div className="space-y-3">
          {/* Gross Total */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gross Total</span>
            <span className="font-semibold">
              {formatCurrency(grossTotalCents)}
            </span>
          </div>

          {/* VAT */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              VAT{vatPercent !== null ? ` (${vatPercent}%)` : ""}
            </span>
            <span className="font-medium">
              {formatCurrency(vatTotalCents)}
            </span>
          </div>

          {/* Net Amount */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Net Amount</span>
            <span className="font-medium">
              {formatCurrency(netTotalCents)}
            </span>
          </div>

          <Separator />

          {/* Platform Fee */}
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2">
              <span className="text-sm text-muted-foreground">
                Platform Fee
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded-full">
                <Info className="h-3 w-3" />
                <span>Informational — not yet deducted</span>
              </div>
            </div>
            <span className="font-medium">
              {hydraFeeCents !== null
                ? formatCurrency(hydraFeeCents)
                : "N/A"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
