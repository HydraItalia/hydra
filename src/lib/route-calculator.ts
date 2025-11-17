/**
 * Phase 7.2 - Route Calculation Logic
 *
 * This module computes optimized delivery routes for drivers
 * using Google Directions API.
 */

import { prisma } from "@/lib/prisma";
import { DeliveryStatus } from "@prisma/client";
import { DriverRoute, RouteStop, DeliveryForRoute } from "@/types/route";
import { getOptimizedRoute, buildDirectionsRequest } from "./google-directions";

// Default origin (stub for now - can be made configurable per driver)
const DEFAULT_ORIGIN_LAT = 39.2238; // Cagliari, Sardinia
const DEFAULT_ORIGIN_LNG = 9.1217;

/**
 * Get optimized route for a specific driver
 *
 * @param driverId - The driver's ID
 * @param date - Optional date to filter deliveries (defaults to today)
 * @returns Promise with the optimized DriverRoute
 */
export async function getOptimizedDriverRoute(
  driverId: string,
  date?: Date
): Promise<DriverRoute> {
  // Default to today if no date provided
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all active deliveries for this driver for today
  const deliveries = await prisma.delivery.findMany({
    where: {
      driverId,
      status: {
        in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] as DeliveryStatus[],
      },
      assignedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      order: {
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Handle empty case
  if (deliveries.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }

  // Filter deliveries with valid coordinates
  // Type assertion needed because schema hasn't been migrated yet
  const validDeliveries = deliveries.filter((d) => {
    const order = d.order as any;
    return (
      order.deliveryLat !== null &&
      order.deliveryLng !== null &&
      order.deliveryAddress !== null
    );
  }) as unknown as DeliveryForRoute[];

  if (validDeliveries.length === 0) {
    // All deliveries lack coordinates
    return {
      stops: deliveries.map((d) => {
        const order = d.order as any;
        return {
          deliveryId: d.id,
          orderId: d.orderId,
          clientName: d.order.client.name,
          address: order.deliveryAddress || "Address not set",
          lat: 0,
          lng: 0,
          status: d.status,
        };
      }),
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }

  // Build destinations array
  const destinations = validDeliveries.map((d) => ({
    lat: d.order.deliveryLat,
    lng: d.order.deliveryLng,
  }));

  // Get optimized route from Google Directions API
  try {
    const directionsRequest = buildDirectionsRequest(
      { lat: DEFAULT_ORIGIN_LAT, lng: DEFAULT_ORIGIN_LNG },
      destinations,
      true // optimize waypoints
    );

    const directionsResponse = await getOptimizedRoute(directionsRequest);

    if (!directionsResponse.routes || directionsResponse.routes.length === 0) {
      throw new Error("No routes returned from Google Directions API");
    }

    const route = directionsResponse.routes[0];
    const waypointOrder = route.waypoint_order || [];

    // Map waypoint order back to deliveries
    let orderedDeliveries: DeliveryForRoute[];

    if (waypointOrder.length > 0) {
      // Google optimized the waypoints
      // waypoint_order is an array of indices into the original waypoints array
      // The destination is not included in waypoint_order
      orderedDeliveries = waypointOrder.map((index) => validDeliveries[index]);

      // Add the last delivery (destination) at the end
      if (validDeliveries.length > waypointOrder.length) {
        orderedDeliveries.push(validDeliveries[validDeliveries.length - 1]);
      }
    } else {
      // No optimization or single destination
      orderedDeliveries = validDeliveries;
    }

    // Build RouteStop array with leg information
    const stops: RouteStop[] = orderedDeliveries.map((delivery, index) => {
      const leg = route.legs[index];

      return {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        clientName: delivery.order.client.name,
        address: delivery.order.deliveryAddress,
        lat: delivery.order.deliveryLat,
        lng: delivery.order.deliveryLng,
        status: delivery.status,
        etaMinutes: leg ? Math.round(leg.duration.value / 60) : undefined,
        legDistanceKm: leg ? leg.distance.value / 1000 : undefined,
      };
    });

    // Calculate totals
    const totalDistanceKm = route.legs.reduce(
      (sum, leg) => sum + leg.distance.value / 1000,
      0
    );
    const totalDurationMinutes = route.legs.reduce(
      (sum, leg) => sum + leg.duration.value / 60,
      0
    );

    return {
      stops,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10, // Round to 1 decimal
      totalDurationMinutes: Math.round(totalDurationMinutes),
      polyline: route.overview_polyline.points,
    };
  } catch (error) {
    console.error("Error calculating optimized route:", error);

    // Fallback: return deliveries in their current order without optimization
    const stops: RouteStop[] = validDeliveries.map((delivery) => ({
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      clientName: delivery.order.client.name,
      address: delivery.order.deliveryAddress,
      lat: delivery.order.deliveryLat,
      lng: delivery.order.deliveryLng,
      status: delivery.status,
    }));

    return {
      stops,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }
}

/**
 * Update route sequence in the database
 *
 * @param route - The optimized route with stop order
 */
export async function saveRouteSequence(
  route: DriverRoute
): Promise<void> {
  // Update each delivery with its sequence number
  // Type assertion needed until schema is migrated
  const updatePromises = route.stops.map((stop, index) =>
    prisma.delivery.update({
      where: { id: stop.deliveryId },
      data: { routeSequence: index + 1 } as any,
    })
  );

  await Promise.all(updatePromises);
}
