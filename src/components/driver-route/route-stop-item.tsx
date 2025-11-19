"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { DriverStopStatus } from "@prisma/client";
import { buildMapsDirectionsUrl } from "@/lib/maps";

type RouteStopItemProps = {
  sequenceNumber: number;
  clientName: string;
  fullAddress: string | null;
  shortAddress: string | null;
  status: DriverStopStatus;
  cashCollectedCents?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  isCurrent?: boolean;
};

const statusConfig: Record<
  DriverStopStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  COMPLETED: { label: "Done", variant: "default" },
  SKIPPED: { label: "Skipped", variant: "secondary" },
};

function formatTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  // Dates may be serialized as strings when passed from server to client components
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RouteStopItem({
  sequenceNumber,
  clientName,
  fullAddress,
  shortAddress,
  status,
  cashCollectedCents,
  startedAt,
  completedAt,
  isCurrent,
}: RouteStopItemProps) {
  const displayAddress = shortAddress || fullAddress || "Address not available";
  const canNavigate = !!fullAddress;
  const mapsUrl = fullAddress ? buildMapsDirectionsUrl(fullAddress) : "#";

  const { label: statusLabel, variant: statusVariant } = statusConfig[status];

  return (
    <Card
      className={`${
        status === "COMPLETED" || status === "SKIPPED" ? "opacity-60" : ""
      } ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Sequence number badge */}
          <div
            className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              status === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : status === "SKIPPED"
                ? "bg-gray-100 text-gray-500"
                : isCurrent
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {sequenceNumber}
          </div>

          {/* Stop details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-medium truncate">{clientName}</h3>
                {isCurrent && (
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <Badge variant={statusVariant} className="flex-shrink-0">
                {statusLabel}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{displayAddress}</span>
            </div>

            {/* Timing info */}
            {(startedAt || completedAt) && (
              <div className="flex gap-3 text-xs text-muted-foreground">
                {startedAt && <span>Started: {formatTime(startedAt)}</span>}
                {completedAt && (
                  <span>
                    {status === "SKIPPED" ? "Skipped" : "Completed"}:{" "}
                    {formatTime(completedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Cash collected (if completed) */}
            {status === "COMPLETED" &&
              cashCollectedCents != null &&
              cashCollectedCents > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  Cash: €{(cashCollectedCents / 100).toFixed(2)}
                </p>
              )}
          </div>

          {/* Navigate button */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              asChild
              disabled={!canNavigate}
            >
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Navigate to ${clientName}`}
                className={!canNavigate ? "pointer-events-none opacity-50" : ""}
              >
                <Navigation className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
