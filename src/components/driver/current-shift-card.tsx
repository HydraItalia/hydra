"use client";

/**
 * Phase 7.2 - Current Shift Card
 *
 * Displays information about the driver's current open shift.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Fuel, Gauge, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { FuelLevel } from "@prisma/client";

interface CurrentShiftProps {
  shift: {
    id: string;
    startKm: number;
    startFuelLevel: FuelLevel;
    startTime: Date;
    vehicle: {
      licensePlate: string;
      description: string;
    };
  };
}

const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  EMPTY: "Empty",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Full",
};

export function CurrentShiftCard({ shift }: CurrentShiftProps) {
  const startTime = new Date(shift.startTime);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Current Shift</CardTitle>
          <Badge variant="default">
            Active
          </Badge>
        </div>
        <CardDescription>
          You already have an open shift for today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{shift.vehicle.licensePlate}</p>
              <p className="text-xs text-muted-foreground">
                {shift.vehicle.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {startTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-muted-foreground">Start Time</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{shift.startKm.toLocaleString()} km</p>
              <p className="text-xs text-muted-foreground">Starting KM</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {FUEL_LEVEL_LABELS[shift.startFuelLevel]}
              </p>
              <p className="text-xs text-muted-foreground">Fuel Level</p>
            </div>
          </div>
        </div>

        <Button className="w-full gap-2" asChild>
          <Link href="/dashboard/route">
            <MapPin className="h-4 w-4" />
            View Today&apos;s Route
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
