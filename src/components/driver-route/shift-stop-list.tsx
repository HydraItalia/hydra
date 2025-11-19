"use client";

import { RouteStopItem } from "./route-stop-item";
import { StopWithClient } from "@/actions/driver-shift";

type ShiftStopListProps = {
  stops: StopWithClient[];
};

export function ShiftStopList({ stops }: ShiftStopListProps) {
  if (stops.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No stops assigned for this shift.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stops.map((stop) => (
        <RouteStopItem
          key={stop.id}
          sequenceNumber={stop.sequenceNumber}
          clientName={stop.client.name}
          fullAddress={stop.client.fullAddress}
          shortAddress={stop.client.shortAddress}
          status={stop.status}
          cashCollectedCents={stop.cashCollectedCents}
        />
      ))}
    </div>
  );
}
