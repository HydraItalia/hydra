"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, CheckCircle2, LogOut } from "lucide-react";
import { RouteProgress } from "@/actions/driver-shift";

type RouteProgressWidgetProps = {
  progress: RouteProgress | null;
};

export function RouteProgressWidget({ progress }: RouteProgressWidgetProps) {
  if (!progress) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today&apos;s Route</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Start a shift to see your route for today.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { totalStops, completedStops, currentStop } = progress;
  const progressPercent =
    totalStops > 0 ? (completedStops / totalStops) * 100 : 0;
  const allDone = totalStops > 0 && completedStops === totalStops;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today&apos;s Route</CardTitle>
          <Badge variant="secondary" className="font-mono">
            {completedStops} / {totalStops}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                allDone ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Current/Next stop info */}
        {allDone ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">All stops completed!</span>
          </div>
        ) : currentStop ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Next stop:</p>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">
                {currentStop.client.name}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No stops assigned.</p>
        )}

        {/* Action button */}
        {allDone ? (
          <Button className="w-full" asChild>
            <Link href="/dashboard/shift/close">
              <LogOut className="h-4 w-4 mr-2" />
              Close Shift
            </Link>
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href="/dashboard/route">
              Go to Route
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
