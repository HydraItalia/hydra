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
} from "@/types/route";

// Configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json";

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
    origin: `${request.origin.lat},${request.origin.lng}`,
    destination: `${request.destination.lat},${request.destination.lng}`,
    mode: request.travelMode.toLowerCase(),
  });

  // Add waypoints if present
  if (request.waypoints && request.waypoints.length > 0) {
    const waypointsParam = request.waypoints
      .map((wp) => `${wp.location.lat},${wp.location.lng}`)
      .join("|");

    params.append("waypoints",
      `${request.optimizeWaypoints ? "optimize:true|" : ""}${waypointsParam}`
    );
  }

  const url = `${DIRECTIONS_API_URL}?${params.toString()}`;

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

    if (data.status !== "OK") {
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
 * Build a DirectionsRequest from a list of coordinates
 *
 * @param origin - Starting point
 * @param destinations - Array of destination coordinates
 * @param optimize - Whether to optimize waypoint order
 * @returns DirectionsRequest object
 */
export function buildDirectionsRequest(
  origin: { lat: number; lng: number },
  destinations: Array<{ lat: number; lng: number }>,
  optimize: boolean = true
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
    optimizeWaypoints: optimize,
    travelMode: "DRIVING",
  };
}
