"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Gauge, Fuel, Clock } from "lucide-react";
import { FuelLevel } from "@prisma/client";

type ShiftSummaryCardProps = {
  vehicle: {
    licensePlate: string;
    description: string;
  };
  startKm: number;
  startFuelLevel: FuelLevel;
  startTime: Date;
  completedStops: number;
  totalStops: number;
};

const fuelLevelLabels: Record<FuelLevel, string> = {
  EMPTY: "Empty",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Full",
};

const fuelLevelColors: Record<FuelLevel, string> = {
  EMPTY: "bg-red-500",
  QUARTER: "bg-orange-500",
  HALF: "bg-yellow-500",
  THREE_QUARTERS: "bg-lime-500",
  FULL: "bg-green-500",
};

export function ShiftSummaryCard({
  vehicle,
  startKm,
  startFuelLevel,
  startTime,
  completedStops,
  totalStops,
}: ShiftSummaryCardProps) {
  const formattedTime = new Date(startTime).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Current Shift</CardTitle>
          <Badge variant="secondary" className="font-mono">
            {completedStops} / {totalStops} stops
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Shift details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Vehicle */}
          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{vehicle.licensePlate}</p>
              <p className="text-xs text-muted-foreground truncate">
                {vehicle.description}
              </p>
            </div>
          </div>

          {/* Start time */}
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{formattedTime}</p>
              <p className="text-xs text-muted-foreground">Start time</p>
            </div>
          </div>

          {/* Starting KM */}
          <div className="flex items-start gap-2">
            <Gauge className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{startKm.toLocaleString()} km</p>
              <p className="text-xs text-muted-foreground">Starting</p>
            </div>
          </div>

          {/* Fuel level */}
          <div className="flex items-start gap-2">
            <Fuel className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${fuelLevelColors[startFuelLevel]}`}
              />
              <p className="font-medium">{fuelLevelLabels[startFuelLevel]}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
