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
  lat: number | null; // null when coordinates are missing
  lng: number | null; // null when coordinates are missing
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
 * https://developers.google.com/maps/documentation/directions/get-directions
 */

// Location can be lat/lng, place ID, or address string
export type DirectionsLocation =
  | { lat: number; lng: number }
  | { placeId: string }
  | string; // Address string

export type DirectionsWaypoint = {
  location: DirectionsLocation;
  stopover?: boolean;
  via?: boolean; // If true, instructs the Directions service to avoid tolls on the route
};

export type DirectionsRequest = {
  // Origin and destination (required)
  origin: DirectionsLocation;
  destination: DirectionsLocation;

  // Travel mode (defaults to DRIVING)
  travelMode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

  // Waypoints (optional)
  waypoints?: DirectionsWaypoint[];
  optimizeWaypoints?: boolean;

  // Route preferences
  alternatives?: boolean; // If true, return alternative routes
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  avoidIndoor?: boolean;

  // Traffic and timing (for DRIVING or TRANSIT)
  departureTime?: Date | number; // Unix timestamp or Date
  arrivalTime?: Date | number; // Only for TRANSIT mode
  trafficModel?: "best_guess" | "pessimistic" | "optimistic";

  // Transit-specific options
  transitMode?: ("bus" | "subway" | "train" | "tram" | "rail")[];
  transitRoutingPreference?: "less_walking" | "fewer_transfers";

  // Units and localization
  unitSystem?: "METRIC" | "IMPERIAL";
  region?: string; // ccTLD two-character value (e.g., "us", "uk", "it")
  language?: string; // Language code (e.g., "en", "it", "fr")
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
  routeSequence: number | null;
  createdAt: Date;
  updatedAt: Date;
  Order: {
    id: string;
    orderNumber: string;
    deliveryLat: number | null;
    deliveryLng: number | null;
    deliveryAddress: string | null;
    Client: {
      name: string;
    };
  };
};
