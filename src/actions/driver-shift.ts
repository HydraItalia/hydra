"use server";

/**
 * Phase 7.2 - Driver Shift Server Actions
 *
 * Server actions for managing driver shifts including start-of-shift wizard.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FuelLevel, DriverShift, Vehicle } from "@prisma/client";

// Types for the server actions
export type StartShiftInput = {
  vehicleId: string;
  startKm: number;
  startFuelLevel: FuelLevel;
  startTime?: Date;
};

export type ShiftWithVehicle = DriverShift & {
  vehicle: Vehicle;
};

/**
 * Get the current driver's shift for today
 *
 * An "open" shift is defined as a shift for today's date that has no endTime.
 * This allows drivers to end shifts and start new ones on the same day if needed.
 *
 * @returns The current shift with vehicle info, or null if none exists
 */
export async function getCurrentDriverShiftForToday(): Promise<
  | { success: true; shift: ShiftWithVehicle | null }
  | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can access shifts" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Get today's date range (start of day to end of day)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find an open shift for today (no endTime set)
    const shift = await prisma.driverShift.findFirst({
      where: {
        driverId: user.driverId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        endTime: null, // Open shift
      },
      include: {
        vehicle: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return { success: true, shift };
  } catch (error) {
    console.error("Error fetching current shift:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch current shift",
    };
  }
}

/**
 * Get available vehicles for the driver
 *
 * For now, returns all vehicles. In the future, this can be filtered
 * to only show vehicles assigned to the driver.
 *
 * @returns List of available vehicles
 */
export async function getAvailableVehiclesForDriver(): Promise<
  | {
      success: true;
      vehicles: Pick<Vehicle, "id" | "licensePlate" | "description">[];
    }
  | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can access vehicles" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // For now, return all vehicles
    // In the future, filter by driver assignment
    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        licensePlate: true,
        description: true,
      },
      orderBy: {
        licensePlate: "asc",
      },
    });

    return { success: true, vehicles };
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch vehicles",
    };
  }
}

/**
 * Start a new driver shift
 *
 * Creates a new DriverShift record for today.
 * Only one open shift per driver per day is allowed.
 *
 * @param input - The shift start data
 * @returns The created shift
 */
export async function startDriverShift(
  input: StartShiftInput
): Promise<
  { success: true; shift: ShiftWithVehicle } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can start shifts" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Validate input
    if (!input.vehicleId || !input.vehicleId.trim()) {
      return { success: false, error: "Vehicle is required" };
    }

    if (typeof input.startKm !== "number" || input.startKm < 0) {
      return { success: false, error: "Starting km must be a positive number" };
    }

    if (!Number.isInteger(input.startKm)) {
      return { success: false, error: "Starting km must be a whole number" };
    }

    if (!Object.values(FuelLevel).includes(input.startFuelLevel)) {
      return { success: false, error: "Invalid fuel level" };
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });

    if (!vehicle) {
      return { success: false, error: "Vehicle not found" };
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check if there's already an open shift for today
    const existingShift = await prisma.driverShift.findFirst({
      where: {
        driverId: user.driverId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        endTime: null,
      },
    });

    if (existingShift) {
      return {
        success: false,
        error:
          "You already have an open shift for today. Please end it before starting a new one.",
      };
    }

    // Create the new shift
    const startTime = input.startTime || new Date();
    const shift = await prisma.driverShift.create({
      data: {
        driverId: user.driverId,
        vehicleId: input.vehicleId,
        date: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
        startKm: input.startKm,
        startFuelLevel: input.startFuelLevel,
        startTime,
      },
      include: {
        vehicle: true,
      },
    });

    return { success: true, shift };
  } catch (error) {
    console.error("Error starting shift:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start shift",
    };
  }
}
