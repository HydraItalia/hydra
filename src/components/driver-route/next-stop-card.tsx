"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Play,
  Check,
  SkipForward,
  Loader2,
} from "lucide-react";
import { StopWithClient } from "@/actions/driver-shift";
import { buildMapsDirectionsUrl } from "@/lib/maps";
import { startStop, completeStop, skipStop } from "@/actions/driver-shift";
import { useRouter } from "next/navigation";

type NextStopCardProps = {
  stop: StopWithClient;
  sequenceNumber: number;
  totalStops: number;
};

export function NextStopCard({
  stop,
  sequenceNumber,
  totalStops,
}: NextStopCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const displayAddress =
    stop.client.shortAddress ||
    stop.client.fullAddress ||
    "Address not available";
  const canNavigate = !!stop.client.fullAddress;
  const mapsUrl = stop.client.fullAddress
    ? buildMapsDirectionsUrl(stop.client.fullAddress)
    : "#";
  const isStarted = !!stop.startedAt;

  const handleStart = async () => {
    setIsLoading("start");
    try {
      const result = await startStop(stop.id);
      if (!result.success) {
        console.error(result.error);
      }
      router.refresh();
    } finally {
      setIsLoading(null);
    }
  };

  const handleComplete = async () => {
    setIsLoading("complete");
    try {
      const result = await completeStop(stop.id);
      if (!result.success) {
        console.error(result.error);
      }
      router.refresh();
    } finally {
      setIsLoading(null);
    }
  };

  const handleSkip = async () => {
    setIsLoading("skip");
    try {
      const result = await skipStop(stop.id);
      if (!result.success) {
        console.error(result.error);
      }
      router.refresh();
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Next Stop</CardTitle>
          <Badge variant="secondary" className="font-mono">
            #{sequenceNumber} of {totalStops}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client info */}
        <div>
          <h3 className="text-xl font-semibold">{stop.client.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{displayAddress}</span>
          </div>
          {isStarted && (
            <p className="text-xs text-muted-foreground mt-1">
              Started at{" "}
              {new Date(stop.startedAt!).toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Action buttons - mobile friendly */}
        <div className="grid gap-3">
          {/* Navigate button */}
          <Button
            variant="outline"
            className="w-full h-12"
            asChild
            disabled={!canNavigate}
          >
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={!canNavigate ? "pointer-events-none opacity-50" : ""}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Open in Maps
            </a>
          </Button>

          {/* Start / Complete / Skip buttons */}
          <div className="grid grid-cols-2 gap-3">
            {!isStarted ? (
              <Button
                variant="secondary"
                className="h-12"
                onClick={handleStart}
                disabled={isLoading !== null}
              >
                {isLoading === "start" ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 mr-2" />
                )}
                Start
              </Button>
            ) : (
              <Button
                variant="default"
                className="h-12 bg-green-600 hover:bg-green-700"
                onClick={handleComplete}
                disabled={isLoading !== null}
              >
                {isLoading === "complete" ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                Done
              </Button>
            )}
            <Button
              variant="outline"
              className="h-12"
              onClick={handleSkip}
              disabled={isLoading !== null}
            >
              {isLoading === "skip" ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <SkipForward className="h-5 w-5 mr-2" />
              )}
              Skip
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
