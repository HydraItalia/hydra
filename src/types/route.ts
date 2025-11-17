// Phase 7.2 - Route Planning Types

import { DeliveryStatus } from "@prisma/client";

/**
 * Represents a single stop in a driver's route
 */
export type RouteStop = {
  deliveryId: string;
  orderId: string;
  clientName: string;
  address: string;
  lat: number;
  lng: number;
  status: DeliveryStatus;
  etaMinutes?: number; // Estimated time from previous stop
  legDistanceKm?: number; // Distance from previous stop
};

/**
 * Represents a complete optimized route for a driver
 */
export type DriverRoute = {
  stops: RouteStop[];
  totalDistanceKm?: number;
  totalDurationMinutes?: number;
  polyline?: string; // Encoded polyline for map rendering
};

/**
 * Google Directions API Request Types
 */
export type DirectionsWaypoint = {
  location: {
    lat: number;
    lng: number;
  };
  stopover: boolean;
};

export type DirectionsRequest = {
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  waypoints?: DirectionsWaypoint[];
  optimizeWaypoints?: boolean;
  travelMode: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
};

/**
 * Google Directions API Response Types (simplified)
 */
export type DirectionsLeg = {
  distance: {
    value: number; // in meters
    text: string;
  };
  duration: {
    value: number; // in seconds
    text: string;
  };
  start_address: string;
  end_address: string;
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
};

export type DirectionsRoute = {
  legs: DirectionsLeg[];
  overview_polyline: {
    points: string; // Encoded polyline
  };
  waypoint_order?: number[]; // Present when optimizeWaypoints is true
  summary: string;
};

export type DirectionsResponse = {
  routes: DirectionsRoute[];
  status: string;
  error_message?: string;
};

/**
 * Internal delivery data structure for route calculation
 * This matches the Prisma query result from getOptimizedDriverRoute
 */
export type DeliveryForRoute = {
  id: string;
  orderId: string;
  driverId: string;
  status: DeliveryStatus;
  notes: string | null;
  exceptionReason: string | null;
  assignedAt: Date;
  pickedUpAt: Date | null;
  inTransitAt: Date | null;
  deliveredAt: Date | null;
  exceptionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: string;
    deliveryLat: number;
    deliveryLng: number;
    deliveryAddress: string;
    client: {
      name: string;
    };
  };
};
