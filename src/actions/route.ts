"use server";

/**
 * Phase 7.2 - Route Planning Server Actions
 *
 * Server actions for fetching and recalculating driver routes.
 */

import { currentUser } from "@/lib/auth";
import {
  getOptimizedDriverRoute,
  saveRouteSequence,
} from "@/lib/route-calculator";
import { DriverRoute } from "@/types/route";

/**
 * Get the current driver's optimized route
 *
 * @returns Promise with the driver's route or error
 */
export async function getMyRoute(): Promise<
  { success: true; route: DriverRoute } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can access routes" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    const route = await getOptimizedDriverRoute(user.driverId);

    return { success: true, route };
  } catch (error) {
    console.error("Error fetching driver route:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch route",
    };
  }
}

/**
 * Recalculate the driver's route and update sequence in database
 *
 * @returns Promise with the newly optimized route or error
 */
export async function recalculateDriverRoute(): Promise<
  { success: true; route: DriverRoute } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can recalculate routes" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Calculate optimized route
    const route = await getOptimizedDriverRoute(user.driverId);

    // Save the sequence to database
    if (route.stops.length > 0) {
      await saveRouteSequence(route);
    }

    return { success: true, route };
  } catch (error) {
    console.error("Error recalculating driver route:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to recalculate route",
    };
  }
}

/**
 * Get route for a specific driver (Admin/Agent only)
 *
 * @param driverId - The driver's ID
 * @returns Promise with the driver's route or error
 */
export async function getDriverRoute(
  driverId: string
): Promise<
  { success: true; route: DriverRoute } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (!driverId || !driverId.trim()) {
      return { success: false, error: "Invalid driver ID" };
    }

    // Only admins and agents can view other drivers' routes
    if (user.role !== "ADMIN" && user.role !== "AGENT") {
      return {
        success: false,
        error: "Insufficient permissions to view driver routes",
      };
    }

    const route = await getOptimizedDriverRoute(driverId);
    return { success: true, route };
  } catch (error) {
    console.error("Error fetching driver route:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch route",
    };
  }
}
