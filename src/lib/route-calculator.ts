/**
 * Phase 7.2 - Route Calculation Logic
 *
 * This module computes optimized delivery routes for drivers
 * using Google Directions API.
 */

import { prisma } from "@/lib/prisma";
import { DeliveryStatus } from "@prisma/client";
import { DriverRoute, RouteStop } from "@/types/route";
import { getOptimizedRoute, buildDirectionsRequest } from "./google-directions";

// Default origin (stub for now - can be made configurable per driver)
const DEFAULT_ORIGIN_LAT = 41.9028; // Rome, Italy (Colosseum)
const DEFAULT_ORIGIN_LNG = 12.4964;

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
      // Old deliveries: linked to Order directly
      Order: {
        include: {
          Client: true,
        },
      },
      // New deliveries: linked to SubOrder
      SubOrder: {
        include: {
          Order: {
            include: {
              Client: true,
            },
          },
        },
      },
    },
  });

  console.log(
    `[Route Calculator] Found ${deliveries.length} deliveries for driver ${driverId}`
  );

  // Handle empty case
  if (deliveries.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }

  // Filter deliveries with valid coordinates
  // Get the Order from either direct link (old) or via SubOrder (new)
  type DeliveryWithOrder = (typeof deliveries)[number];

  /**
   * Helper function to build a RouteStop from a delivery
   * Reduces duplication and ensures consistent behavior
   */
  function buildRouteStop(
    delivery: DeliveryWithOrder,
    options?: { etaMinutes?: number; legDistanceKm?: number }
  ): RouteStop {
    const order = delivery.SubOrder ? delivery.SubOrder.Order : delivery.Order;

    // Ensure at least one identifier is present
    if (!delivery.orderId && !delivery.subOrderId) {
      throw new Error(
        `Delivery ${delivery.id} has neither orderId nor subOrderId`
      );
    }

    const baseStop = {
      deliveryId: delivery.id,
      clientName: order!.Client.name,
      address: order!.deliveryAddress!,
      lat: order!.deliveryLat!,
      lng: order!.deliveryLng!,
      status: delivery.status,
      ...(options?.etaMinutes !== undefined && {
        etaMinutes: options.etaMinutes,
      }),
      ...(options?.legDistanceKm !== undefined && {
        legDistanceKm: options.legDistanceKm,
      }),
    };

    // Match the RouteStop union type requirements
    if (delivery.subOrderId) {
      return {
        ...baseStop,
        orderId: delivery.orderId,
        subOrderId: delivery.subOrderId,
      };
    } else {
      return {
        ...baseStop,
        orderId: delivery.orderId!,
        subOrderId: delivery.subOrderId,
      };
    }
  }

  const validDeliveries = deliveries.filter((d) => {
    const order = d.SubOrder ? d.SubOrder.Order : d.Order;
    return (
      order &&
      order.deliveryLat != null &&
      order.deliveryLng != null &&
      order.deliveryAddress != null
    );
  }) as Array<
    DeliveryWithOrder & {
      Order: {
        deliveryLat: number;
        deliveryLng: number;
        deliveryAddress: string;
      } & DeliveryWithOrder["Order"];
    }
  >;

  console.log(
    `[Route Calculator] ${validDeliveries.length} deliveries have valid coordinates`
  );

  if (validDeliveries.length > 0) {
    const firstDelivery = deliveries[0];
    const firstOrder = firstDelivery.SubOrder
      ? firstDelivery.SubOrder.Order
      : firstDelivery.Order;
    console.log(`[Route Calculator] Raw first delivery Order:`, {
      id: firstOrder?.id,
      deliveryLat: firstOrder?.deliveryLat,
      deliveryLng: firstOrder?.deliveryLng,
    });

    const sampleDelivery = validDeliveries[0];
    const sampleOrder = sampleDelivery.SubOrder
      ? sampleDelivery.SubOrder.Order
      : sampleDelivery.Order;
    console.log(`[Route Calculator] Sample coordinates after validation:`, {
      lat: sampleOrder.deliveryLat,
      lng: sampleOrder.deliveryLng,
      address: sampleOrder.deliveryAddress,
    });
  }

  if (validDeliveries.length === 0) {
    // All deliveries lack coordinates - return empty route
    // Note: We don't return stops with (0,0) coordinates as that represents
    // a real location (Gulf of Guinea) and could be misleading
    console.warn(
      `[Route Calculator] No deliveries with valid coordinates found for driver ${driverId}`
    );
    return {
      stops: [],
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }

  // Build destinations array
  // Since validDeliveries are filtered to have non-null coordinates, we can safely assert
  const destinations = validDeliveries.map((d) => {
    const order = d.SubOrder ? d.SubOrder.Order : d.Order;
    return {
      lat: order.deliveryLat!,
      lng: order.deliveryLng!,
    };
  });

  console.log(`[Route Calculator] Destinations for Google API:`, destinations);

  // Get optimized route from Google Directions API
  try {
    const directionsRequest = buildDirectionsRequest(
      { lat: DEFAULT_ORIGIN_LAT, lng: DEFAULT_ORIGIN_LNG },
      destinations,
      {
        optimizeWaypoints: true,
        region: "it", // Italy
        language: "it", // Italian
        unitSystem: "METRIC",
        // Optional: use current time for traffic-aware routing
        // departureTime: new Date(),
        // trafficModel: "best_guess",
      }
    );

    const directionsResponse = await getOptimizedRoute(directionsRequest);

    if (!directionsResponse.routes || directionsResponse.routes.length === 0) {
      throw new Error("No routes returned from Google Directions API");
    }

    const route = directionsResponse.routes[0];
    const waypointOrder = route.waypoint_order || [];

    // Map waypoint order back to deliveries
    let orderedDeliveries: typeof validDeliveries;

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
      return buildRouteStop(delivery, {
        etaMinutes: leg ? Math.round(leg.duration.value / 60) : undefined,
        legDistanceKm: leg ? leg.distance.value / 1000 : undefined,
      });
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
    const stops: RouteStop[] = validDeliveries.map((delivery) =>
      buildRouteStop(delivery)
    );

    return {
      stops,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }
}

/**
 * Update route sequence in the database with transaction safety
 *
 * @param route - The optimized route with stop order
 */
export async function saveRouteSequence(route: DriverRoute): Promise<void> {
  if (route.stops.length === 0) {
    return; // Nothing to update
  }

  // Use transaction to ensure all updates succeed or all fail
  // This prevents partial updates that could leave route sequence inconsistent
  await prisma.$transaction(
    route.stops.map((stop, index) =>
      prisma.delivery.update({
        where: { id: stop.deliveryId },
        // Cast data to any to avoid transient typing mismatches with generated Prisma types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { routeSequence: index + 1 } as any,
      })
    )
  );
}
