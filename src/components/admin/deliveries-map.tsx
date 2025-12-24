"use client";

import { useCallback, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDeliveryResult } from "@/data/deliveries";
import type { DeliveryStatus } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";

type DeliveriesMapProps = {
  deliveries: AdminDeliveryResult[];
};

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 41.9028, // Rome, Italy (default center)
  lng: 12.4964,
};

/**
 * Get marker color based on delivery status
 */
function getMarkerColor(status: DeliveryStatus): string {
  const colors: Record<DeliveryStatus, string> = {
    ASSIGNED: "#3b82f6", // blue
    PICKED_UP: "#8b5cf6", // purple
    IN_TRANSIT: "#f59e0b", // amber
    DELIVERED: "#10b981", // green
    EXCEPTION: "#ef4444", // red
  };
  return colors[status] || "#6b7280";
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: DeliveryStatus) {
  const variants: Record<
    DeliveryStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ASSIGNED: "outline",
    PICKED_UP: "default",
    IN_TRANSIT: "secondary",
    DELIVERED: "secondary",
    EXCEPTION: "destructive",
  };
  return variants[status] || "outline";
}

/**
 * Get status display name
 */
function getStatusDisplay(status: DeliveryStatus): string {
  const displays: Record<DeliveryStatus, string> = {
    ASSIGNED: "Assigned",
    PICKED_UP: "Picked Up",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    EXCEPTION: "Exception",
  };
  return displays[status] || status;
}

export function AdminDeliveriesMap({ deliveries }: DeliveriesMapProps) {
  const [selectedDelivery, setSelectedDelivery] =
    useState<AdminDeliveryResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Filter deliveries that have coordinates
  const deliveriesWithLocation = deliveries.filter(
    (d) => d.deliveryLat !== null && d.deliveryLng !== null
  );

  // Calculate center based on deliveries
  const center = useCallback(() => {
    if (deliveriesWithLocation.length === 0) return defaultCenter;

    const avgLat =
      deliveriesWithLocation.reduce((sum, d) => sum + (d.deliveryLat || 0), 0) /
      deliveriesWithLocation.length;
    const avgLng =
      deliveriesWithLocation.reduce((sum, d) => sum + (d.deliveryLng || 0), 0) /
      deliveriesWithLocation.length;

    return { lat: avgLat, lng: avgLng };
  }, [deliveriesWithLocation]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);

      // Fit bounds to show all markers
      if (deliveriesWithLocation.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        deliveriesWithLocation.forEach((delivery) => {
          if (delivery.deliveryLat && delivery.deliveryLng) {
            bounds.extend({
              lat: delivery.deliveryLat,
              lng: delivery.deliveryLng,
            });
          }
        });
        map.fitBounds(bounds);
      }
    },
    [deliveriesWithLocation]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!googleMapsApiKey) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Google Maps API key not configured
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment
          </p>
        </div>
      </div>
    );
  }

  if (deliveriesWithLocation.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No deliveries with location data
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Deliveries will appear on the map when they have delivery
            coordinates
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center()}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {deliveriesWithLocation.map((delivery) => {
          const color = getMarkerColor(delivery.status);
          // Create a simple colored marker using data URL
          const markerIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
            </svg>`
          )}`;

          return (
            <Marker
              key={delivery.id}
              position={{
                lat: delivery.deliveryLat!,
                lng: delivery.deliveryLng!,
              }}
              onClick={() => setSelectedDelivery(delivery)}
              icon={{
                url: markerIcon,
                scaledSize:
                  typeof window !== "undefined" && window.google
                    ? new window.google.maps.Size(32, 32)
                    : undefined,
              }}
            />
          );
        })}

        {selectedDelivery &&
          selectedDelivery.deliveryLat &&
          selectedDelivery.deliveryLng && (
            <InfoWindow
              position={{
                lat: selectedDelivery.deliveryLat,
                lng: selectedDelivery.deliveryLng,
              }}
              onCloseClick={() => setSelectedDelivery(null)}
            >
              <div className="p-2 min-w-[250px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/orders/${selectedDelivery.orderId}`}
                      className="font-mono font-medium hover:underline text-sm"
                    >
                      {selectedDelivery.orderNumber}
                    </Link>
                    <Badge variant={getStatusVariant(selectedDelivery.status)}>
                      {getStatusDisplay(selectedDelivery.status)}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client: </span>
                      <span className="font-medium">
                        {selectedDelivery.clientName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Driver: </span>
                      <span className="font-medium">
                        {selectedDelivery.driverName}
                      </span>
                    </div>
                    {selectedDelivery.deliveryAddress && (
                      <div>
                        <span className="text-muted-foreground">Address: </span>
                        <span className="text-xs">
                          {selectedDelivery.deliveryAddress}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Assigned: </span>
                      <span className="text-xs">
                        {formatDateTime(selectedDelivery.assignedAt)}
                      </span>
                    </div>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="w-full"
                    variant="outline"
                  >
                    <Link href={`/dashboard/deliveries/${selectedDelivery.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </InfoWindow>
          )}
      </GoogleMap>
    </LoadScript>
  );
}
