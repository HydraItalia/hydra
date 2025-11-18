/**
 * Phase 7.2 - Google Directions API Integration
 *
 * This module handles communication with Google Directions API
 * to compute optimized routes for driver deliveries.
 */

import {
  DirectionsRequest,
  DirectionsResponse,
  DirectionsWaypoint,
  DirectionsLocation,
} from "@/types/route";

// Configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json";

/**
 * Convert DirectionsLocation to string format for API
 */
function formatLocation(location: DirectionsLocation): string {
  if (typeof location === "string") {
    return location; // Address string
  }
  if ("placeId" in location) {
    return `place_id:${location.placeId}`;
  }
  return `${location.lat},${location.lng}`; // Lat/lng coordinates
}

/**
 * Fetch optimized route from Google Directions API
 *
 * @param request - Directions request configuration
 * @returns Promise with directions response
 * @throws Error if API key is missing or request fails
 */
export async function getOptimizedRoute(
  request: DirectionsRequest
): Promise<DirectionsResponse> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not configured. Please add it to your environment variables."
    );
  }

  // Build query parameters
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    origin: formatLocation(request.origin),
    destination: formatLocation(request.destination),
    mode: (request.travelMode || "DRIVING").toLowerCase(),
  });

  // Add waypoints if present
  if (request.waypoints && request.waypoints.length > 0) {
    const waypointsParam = request.waypoints
      .map((wp) => formatLocation(wp.location))
      .join("|");

    params.append(
      "waypoints",
      `${request.optimizeWaypoints ? "optimize:true|" : ""}${waypointsParam}`
    );
  }

  // Route preferences
  if (request.alternatives) params.append("alternatives", "true");
  if (request.avoidHighways) params.append("avoid", "highways");
  if (request.avoidTolls) params.append("avoid", "tolls");
  if (request.avoidFerries) params.append("avoid", "ferries");
  if (request.avoidIndoor) params.append("avoid", "indoor");

  // Traffic and timing
  if (request.departureTime) {
    const timestamp =
      request.departureTime instanceof Date
        ? Math.floor(request.departureTime.getTime() / 1000)
        : request.departureTime;
    params.append("departure_time", timestamp.toString());
  }
  if (request.arrivalTime) {
    const timestamp =
      request.arrivalTime instanceof Date
        ? Math.floor(request.arrivalTime.getTime() / 1000)
        : request.arrivalTime;
    params.append("arrival_time", timestamp.toString());
  }
  if (request.trafficModel) {
    params.append("traffic_model", request.trafficModel);
  }

  // Transit options
  if (request.transitMode && request.transitMode.length > 0) {
    params.append("transit_mode", request.transitMode.join("|"));
  }
  if (request.transitRoutingPreference) {
    params.append("transit_routing_preference", request.transitRoutingPreference);
  }

  // Units and localization
  if (request.unitSystem) {
    params.append("units", request.unitSystem.toLowerCase());
  }
  if (request.region) {
    params.append("region", request.region);
  }
  if (request.language) {
    params.append("language", request.language);
  }

  const url = `${DIRECTIONS_API_URL}?${params.toString()}`;

  // Debug logging
  console.log("[Google Directions] Request URL:", url);
  console.log("[Google Directions] Request params:", {
    origin: request.origin,
    destination: request.destination,
    waypointsCount: request.waypoints?.length || 0,
  });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 5 minutes to avoid redundant API calls
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(
        `Google Directions API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: DirectionsResponse = await response.json();

    console.log("[Google Directions] API Response:", {
      status: data.status,
      routesCount: data.routes?.length || 0,
      error_message: data.error_message,
    });

    if (data.status !== "OK") {
      console.error("[Google Directions] Full API response:", JSON.stringify(data, null, 2));
      throw new Error(
        `Google Directions API error: ${data.status}${
          data.error_message ? ` - ${data.error_message}` : ""
        }`
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching Google Directions:", error);
    throw error;
  }
}

/**
 * Build a DirectionsRequest from a list of locations
 *
 * @param origin - Starting point (lat/lng, place ID, or address)
 * @param destinations - Array of destination locations
 * @param options - Additional options for the request
 * @returns DirectionsRequest object
 */
export function buildDirectionsRequest(
  origin: DirectionsLocation,
  destinations: DirectionsLocation[],
  options: Partial<DirectionsRequest> = {}
): DirectionsRequest {
  if (destinations.length === 0) {
    throw new Error("At least one destination is required");
  }

  // If only one destination, make it the destination (no waypoints)
  if (destinations.length === 1) {
    return {
      origin,
      destination: destinations[0],
      travelMode: "DRIVING",
      optimizeWaypoints: false,
      ...options,
    };
  }

  // Multiple destinations: last one is destination, others are waypoints
  const waypoints: DirectionsWaypoint[] = destinations
    .slice(0, -1)
    .map((dest) => ({
      location: dest,
      stopover: true,
    }));

  return {
    origin,
    destination: destinations[destinations.length - 1],
    waypoints,
    optimizeWaypoints: true,
    travelMode: "DRIVING",
    // Apply additional options (e.g., avoidTolls, departureTime, etc.)
    ...options,
  };
}
