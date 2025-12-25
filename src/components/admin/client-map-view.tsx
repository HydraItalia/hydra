"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";

type ClientMapViewProps = {
  lat: number;
  lng: number;
  address: string;
};

export function ClientMapView({ lat, lng, address }: ClientMapViewProps) {
  // Validate coordinates
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.error("Invalid coordinates:", { lat, lng });
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>Invalid coordinates provided</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Using OpenStreetMap static tiles (no API key required)
  // Alternative: Google Maps Static API or Mapbox Static API
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lng - 0.01
  }%2C${lat - 0.01}%2C${lng + 0.01}%2C${
    lat + 0.01
  }&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Location</CardTitle>
            <CardDescription className="mt-1">{address}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Embedded Map */}
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden border">
            <iframe
              title="Client Location Map"
              src={mapUrl}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              className="w-full h-full"
              style={{ border: 0 }}
            />
          </div>

          {/* Coordinates */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">Coordinates</div>
            <div className="font-mono text-xs">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
          </div>

          {/* Google Maps Link */}
          <div className="pt-2 border-t">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Open in Google Maps
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
