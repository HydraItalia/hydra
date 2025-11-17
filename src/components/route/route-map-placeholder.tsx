"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteStop } from "@/types/route";
import { Map } from "lucide-react";

interface RouteMapPlaceholderProps {
  stops: RouteStop[];
  polyline?: string;
}

/**
 * Placeholder component for route map visualization
 *
 * This component is structured to be easily replaced with a real map
 * implementation (e.g., Google Maps, Mapbox, Leaflet) in the future.
 *
 * To integrate a real map:
 * 1. Install a map library (e.g., @react-google-maps/api, react-leaflet)
 * 2. Replace the placeholder content with the map component
 * 3. Use the `stops` prop to render markers
 * 4. Use the `polyline` prop to render the route path
 */
export function RouteMapPlaceholder({
  stops,
  polyline,
}: RouteMapPlaceholderProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Route Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-lg p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Map className="mx-auto h-16 w-16 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">
                Map Visualization Coming Soon
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {stops.length} stop{stops.length !== 1 ? "s" : ""} on route
              </p>
            </div>

            {/* Debug info - remove in production */}
            <details className="text-left mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Route Data (for development)
              </summary>
              <pre className="mt-2 text-xs bg-background p-4 rounded border overflow-auto max-h-64">
                {JSON.stringify(
                  {
                    stops: stops.map((s) => ({
                      id: s.deliveryId,
                      client: s.clientName,
                      lat: s.lat,
                      lng: s.lng,
                    })),
                    polyline: polyline ? `${polyline.slice(0, 50)}...` : null,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
