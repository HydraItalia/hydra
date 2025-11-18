"use client";

import { useCallback, useMemo } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteStop } from "@/types/route";
import { Map, Loader2 } from "lucide-react";
import { decodePolyline } from "@/lib/polyline";

interface RouteMapProps {
  stops: RouteStop[];
  polyline?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  clickableIcons: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export function RouteMap({ stops, polyline }: RouteMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Decode polyline if available
  const decodedPath = useMemo(() => {
    if (!polyline) return [];
    try {
      return decodePolyline(polyline);
    } catch (error) {
      console.error("Error decoding polyline:", error);
      return [];
    }
  }, [polyline]);

  // Calculate map center
  const center = useMemo(() => {
    if (stops.length === 0) {
      // Default to Rome
      return { lat: 41.9028, lng: 12.4964 };
    }

    // Calculate center from stops with valid coordinates
    const validStops = stops.filter(
      (stop): stop is RouteStop & { lat: number; lng: number } =>
        stop.lat !== null && stop.lng !== null
    );

    if (validStops.length === 0) {
      // No valid coordinates, default to Rome
      return { lat: 41.9028, lng: 12.4964 };
    }

    const avgLat =
      validStops.reduce((sum, stop) => sum + stop.lat, 0) / validStops.length;
    const avgLng =
      validStops.reduce((sum, stop) => sum + stop.lng, 0) / validStops.length;

    return { lat: avgLat, lng: avgLng };
  }, [stops]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (stops.length > 0) {
        // Create bounds and fit map to show all stops with valid coordinates
        const bounds = new google.maps.LatLngBounds();
        let hasValidStops = false;

        stops.forEach((stop) => {
          if (stop.lat !== null && stop.lng !== null) {
            bounds.extend({ lat: stop.lat, lng: stop.lng });
            hasValidStops = true;
          }
        });

        if (hasValidStops) {
          map.fitBounds(bounds);
        }
      }
    },
    [stops]
  );

  if (loadError) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Map className="h-5 w-5" />
            Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load Google Maps. Please check your API key configuration.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Error: {loadError.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Route Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Route Map
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {stops.length} stop{stops.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={onLoad}
        >
          {/* Render markers for each stop with valid coordinates */}
          {stops.map((stop, index) => {
            // Skip stops without valid coordinates
            if (stop.lat === null || stop.lng === null) return null;

            return (
              <Marker
                key={stop.deliveryId}
                position={{ lat: stop.lat, lng: stop.lng }}
                label={{
                  text: `${index + 1}`,
                  color: "white",
                  fontWeight: "bold",
                }}
                title={`Stop ${index + 1}: ${stop.clientName}`}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 15,
                  fillColor:
                    index === 0
                      ? "#22c55e"
                      : index === stops.length - 1
                      ? "#ef4444"
                      : "#3b82f6",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                }}
              />
            );
          })}

          {/* Render polyline if available */}
          {decodedPath.length > 0 && (
            <Polyline
              path={decodedPath}
              options={{
                strokeColor: "#3b82f6",
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
            />
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}
