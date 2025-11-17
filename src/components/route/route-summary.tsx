"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Route, Clock, MapPin } from "lucide-react";

interface RouteSummaryProps {
  totalStops: number;
  totalDistanceKm?: number;
  totalDurationMinutes?: number;
}

export function RouteSummary({
  totalStops,
  totalDistanceKm,
  totalDurationMinutes,
}: RouteSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stops</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStops}</div>
          <p className="text-xs text-muted-foreground">
            {totalStops === 0 ? "No deliveries" : "Active deliveries"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
          <Route className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalDistanceKm !== undefined
              ? `${totalDistanceKm.toFixed(1)} km`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground">Optimized route</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Est. Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalDurationMinutes !== undefined
              ? `${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground">Driving time</p>
        </CardContent>
      </Card>
    </div>
  );
}
