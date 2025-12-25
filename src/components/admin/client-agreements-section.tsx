"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type Agreement = {
  id: string;
  vendor: { id: string; name: string };
  priceMode: string;
  discountPct: number | null;
  createdAt: string;
};

type ClientAgreementsSectionProps = {
  agreements: Agreement[];
};

function formatPriceMode(mode: string): string {
  return mode.charAt(0) + mode.slice(1).toLowerCase();
}

export function ClientAgreementsSection({
  agreements,
}: ClientAgreementsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreements</CardTitle>
        <CardDescription>
          Vendor agreements for this client ({agreements.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {agreements.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No agreements found for this client
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/vendors/${agreement.vendor.id}`}
                        className="font-medium hover:underline truncate"
                      >
                        {agreement.vendor.name}
                      </Link>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {formatPriceMode(agreement.priceMode)}
                      </Badge>
                      {agreement.discountPct !== null &&
                        agreement.discountPct > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {agreement.discountPct}% discount
                          </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created {formatDate(agreement.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
