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

/** VAT breakdown for a single vendor */
interface VendorBreakdown {
  vendorId: string;
  vendorName: string;
  itemCount?: number;
  netTotalCents: number;
  vatTotalCents: number;
  grossTotalCents: number;
}

interface VatBreakdownProps {
  /** Per-vendor VAT breakdown (for multi-vendor orders) */
  vendors: VendorBreakdown[];
  /** Overall totals (nullable for graceful handling of missing data) */
  totals: {
    netTotalCents: number | null;
    vatTotalCents: number | null;
    grossTotalCents: number | null;
  };
  /** Effective VAT percentage for display (display-only) */
  effectiveVatPercent?: number | null;
  /** Whether this is a finalized order (shows different labels) */
  isFinalized?: boolean;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

/**
 * Compute display-only VAT percentage from net and VAT amounts.
 * Returns null if calculation is not possible.
 */
function computeDisplayVatPercent(
  netCents: number,
  vatCents: number
): number | null {
  if (netCents <= 0) {
    return null;
  }
  // Round to 2 decimal places for display
  return Math.round((vatCents / netCents) * 100 * 100) / 100;
}

/**
 * Client-facing VAT breakdown component.
 * Shows Net (Imponibile), VAT (IVA), and Gross (Totale) breakdown.
 * Does NOT show platform fees (that's vendor/admin-only).
 */
export function VatBreakdown({
  vendors,
  totals,
  effectiveVatPercent,
  isFinalized = false,
  compact = false,
}: VatBreakdownProps) {
  const hasMultipleVendors = vendors.length > 1;

  // Check if we have valid data
  const hasValidData =
    totals.netTotalCents !== null &&
    totals.vatTotalCents !== null &&
    totals.grossTotalCents !== null;

  if (!hasValidData) {
    return null;
  }

  // After validation, we know these are not null
  const netCents = totals.netTotalCents!;
  const vatCents = totals.vatTotalCents!;
  const grossCents = totals.grossTotalCents!;

  // Compute effective VAT % if not provided
  const displayVatPercent =
    effectiveVatPercent ?? computeDisplayVatPercent(netCents, vatCents);

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Imponibile (Net) */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Imponibile</span>
          <span>{formatCurrency(netCents)}</span>
        </div>

        {/* IVA */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            IVA{displayVatPercent !== null ? ` (${displayVatPercent}%)` : ""}
          </span>
          <span>{formatCurrency(vatCents)}</span>
        </div>

        <Separator />

        {/* Totale (Gross) */}
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Totale</span>
          <span>{formatCurrency(grossCents)}</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {isFinalized ? "Riepilogo Ordine" : "Riepilogo IVA"}
        </CardTitle>
        {hasMultipleVendors && (
          <CardDescription>
            {vendors.length} fornitori in questo ordine
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Per-vendor breakdown for multi-vendor orders */}
        {hasMultipleVendors && (
          <>
            <div className="space-y-3">
              {vendors.map((vendor) => {
                const vendorVatPercent = computeDisplayVatPercent(
                  vendor.netTotalCents,
                  vendor.vatTotalCents
                );

                return (
                  <div
                    key={vendor.vendorId}
                    className="rounded-lg bg-muted/50 p-3 space-y-2"
                  >
                    <div className="font-medium text-sm">
                      {vendor.vendorName}
                      {vendor.itemCount != null && vendor.itemCount > 0 && (
                        <span className="text-muted-foreground font-normal ml-2">
                          ({vendor.itemCount}{" "}
                          {vendor.itemCount === 1 ? "articolo" : "articoli"})
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Imponibile</span>
                        <p className="font-medium">
                          {formatCurrency(vendor.netTotalCents)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          IVA
                          {vendorVatPercent !== null
                            ? ` (${vendorVatPercent}%)`
                            : ""}
                        </span>
                        <p className="font-medium">
                          {formatCurrency(vendor.vatTotalCents)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Totale</span>
                        <p className="font-medium">
                          {formatCurrency(vendor.grossTotalCents)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="text-sm font-medium text-muted-foreground">
              Totale Complessivo
            </div>
          </>
        )}

        {/* Overall totals */}
        <div className="space-y-2">
          {/* Imponibile (Net) */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Imponibile</span>
            <span className="font-medium">{formatCurrency(netCents)}</span>
          </div>

          {/* IVA */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              IVA{displayVatPercent !== null ? ` (${displayVatPercent}%)` : ""}
            </span>
            <span className="font-medium">{formatCurrency(vatCents)}</span>
          </div>

          <Separator />

          {/* Totale (Gross) */}
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Totale</span>
            <span>{formatCurrency(grossCents)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
