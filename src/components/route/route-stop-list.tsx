"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RouteStop } from "@/types/route";
import { MapPin, Clock, ExternalLink, Navigation, Package } from "lucide-react";

interface RouteStopListProps {
  stops: RouteStop[];
}

const statusColors = {
  ASSIGNED: "bg-blue-500",
  PICKED_UP: "bg-yellow-500",
  IN_TRANSIT: "bg-orange-500",
  DELIVERED: "bg-green-500",
  EXCEPTION: "bg-red-500",
} as const;

const statusLabels = {
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
} as const;

/**
 * Generate a Google Maps deep link for a specific coordinate
 */
function getGoogleMapsLink(
  lat: number | null,
  lng: number | null
): string | null {
  // Return null if coordinates are missing
  if (lat === null || lng === null) {
    return null;
  }
  // Use google.com/maps/dir for navigation
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function RouteStopList({ stops }: RouteStopListProps) {
  if (stops.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Active Deliveries</p>
            <p className="text-sm text-muted-foreground mt-2">
              You don&apos;t have any deliveries scheduled for today.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {stops.map((stop, index) => (
        <Card
          key={stop.deliveryId}
          className="hover:bg-accent/50 transition-colors"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Stop Number Badge */}
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>

                {/* Stop Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{stop.clientName}</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {stop.address}
                  </CardDescription>

                  {/* ETA and Distance */}
                  {(stop.etaMinutes !== undefined ||
                    stop.legDistanceKm !== undefined) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      {stop.legDistanceKm !== undefined && (
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {stop.legDistanceKm.toFixed(1)} km
                        </span>
                      )}
                      {stop.etaMinutes !== undefined && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />~{stop.etaMinutes} min
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                className={`${
                  statusColors[stop.status]
                } text-white flex-shrink-0`}
                variant="default"
              >
                {statusLabels[stop.status]}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/deliveries/${stop.deliveryId}`}>
                  <Package className="h-3 w-3 mr-1" />
                  View Details
                </Link>
              </Button>

              {stop.lat !== null && stop.lng !== null && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={getGoogleMapsLink(stop.lat, stop.lng) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Open in Maps
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
