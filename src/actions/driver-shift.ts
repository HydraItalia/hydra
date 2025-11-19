"use server";

/**
 * Phase 7.2 - Driver Shift Server Actions
 *
 * Server actions for managing driver shifts including start-of-shift wizard.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FuelLevel,
  DriverShift,
  Vehicle,
  DriverStop,
  Client,
  DriverStopStatus,
} from "@prisma/client";

/**
 * Get today's date range (start of day to end of day)
 * Avoids Date mutation issues by using explicit Date construction
 */
function getTodayDateRange() {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );
  return { startOfDay, endOfDay };
}

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

// Types for Phase 7.3 - Route List with Map Links
export type StopWithClient = DriverStop & {
  client: Pick<Client, "id" | "name" | "fullAddress" | "shortAddress">;
};

export type ShiftWithVehicleAndStops = DriverShift & {
  vehicle: Vehicle;
  stops: StopWithClient[];
};

// Types for Phase 7.4 - Live Route Progress
export type RouteProgress = {
  shift: ShiftWithVehicleAndStops;
  totalStops: number;
  completedStops: number;
  skippedStops: number;
  pendingStops: number;
  currentStop: StopWithClient | null;
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

    // Get today's date range
    const { startOfDay, endOfDay } = getTodayDateRange();

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

    // Validate optional startTime
    if (input.startTime) {
      const providedTime = new Date(input.startTime);
      const now = new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (providedTime.getTime() > now.getTime() + oneDayInMs) {
        return {
          success: false,
          error: "Start time cannot be more than 1 day in the future",
        };
      }

      if (providedTime.getTime() < now.getTime() - 7 * oneDayInMs) {
        return {
          success: false,
          error: "Start time cannot be more than 7 days in the past",
        };
      }
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });

    if (!vehicle) {
      return { success: false, error: "Vehicle not found" };
    }

    // Get today's date range
    const { startOfDay, endOfDay } = getTodayDateRange();

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
        date: startOfDay,
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

/**
 * Phase 7.3 - Get current driver's shift with stops
 *
 * Returns the current open shift for today along with all stops
 * ordered by sequence number. Each stop includes client info
 * for displaying name and address.
 *
 * @returns The current shift with vehicle and stops, or null if none exists
 */
export async function getCurrentDriverShiftWithStops(): Promise<
  | { success: true; shift: ShiftWithVehicleAndStops | null }
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

    // Get today's date range
    const { startOfDay, endOfDay } = getTodayDateRange();

    // Find an open shift for today (no endTime set) with stops
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
        stops: {
          orderBy: {
            sequenceNumber: "asc",
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                fullAddress: true,
                shortAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return { success: true, shift };
  } catch (error) {
    console.error("Error fetching shift with stops:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch shift with stops",
    };
  }
}

/**
 * Phase 7.3 - Update driver stop status
 *
 * Marks a stop as COMPLETED or SKIPPED. Only allows transitions
 * from PENDING to either COMPLETED or SKIPPED.
 *
 * @param stopId - The ID of the stop to update
 * @param status - The new status (COMPLETED or SKIPPED)
 * @param cashCollectedCents - Optional cash collected in cents
 * @param bonCollectedCents - Optional bon collected in cents
 * @returns The updated stop
 */
export async function updateDriverStopStatus(
  stopId: string,
  status: "COMPLETED" | "SKIPPED",
  cashCollectedCents?: number,
  bonCollectedCents?: number
): Promise<
  { success: true; stop: StopWithClient } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can update stops" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Find the stop and verify it belongs to the current driver's shift
    const stop = await prisma.driverStop.findUnique({
      where: { id: stopId },
      include: {
        shift: true,
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    if (!stop) {
      return { success: false, error: "Stop not found" };
    }

    if (stop.shift.driverId !== user.driverId) {
      return {
        success: false,
        error: "You can only update stops from your own shifts",
      };
    }

    if (stop.status !== DriverStopStatus.PENDING) {
      return {
        success: false,
        error: `Cannot update stop status from ${stop.status}. Only PENDING stops can be updated.`,
      };
    }

    // Validate payment amounts
    if (
      status === "SKIPPED" &&
      (cashCollectedCents !== undefined || bonCollectedCents !== undefined)
    ) {
      return {
        success: false,
        error: "Cannot collect payment for skipped stops",
      };
    }

    if (
      cashCollectedCents !== undefined &&
      (typeof cashCollectedCents !== "number" || cashCollectedCents < 0)
    ) {
      return {
        success: false,
        error: "Cash collected must be a non-negative number",
      };
    }

    if (
      bonCollectedCents !== undefined &&
      (typeof bonCollectedCents !== "number" || bonCollectedCents < 0)
    ) {
      return {
        success: false,
        error: "Bon collected must be a non-negative number",
      };
    }

    // Update the stop
    const updatedStop = await prisma.driverStop.update({
      where: { id: stopId },
      data: {
        status:
          status === "COMPLETED"
            ? DriverStopStatus.COMPLETED
            : DriverStopStatus.SKIPPED,
        cashCollectedCents: cashCollectedCents ?? null,
        bonCollectedCents: bonCollectedCents ?? null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    return { success: true, stop: updatedStop };
  } catch (error) {
    console.error("Error updating stop status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update stop status",
    };
  }
}

/**
 * Phase 7.4 - Get today's route progress for driver
 *
 * Returns the current shift with stops and computed progress metrics.
 * The "current stop" is the first PENDING stop by sequence number.
 *
 * @returns Route progress with counts and current stop
 */
export async function getTodayRouteProgressForDriver(): Promise<
  | { success: true; progress: RouteProgress }
  | { success: true; progress: null }
  | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return {
        success: false,
        error: "Only drivers can access route progress",
      };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Get today's date range
    const { startOfDay, endOfDay } = getTodayDateRange();

    // Find an open shift for today with stops
    const shift = await prisma.driverShift.findFirst({
      where: {
        driverId: user.driverId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        endTime: null,
      },
      include: {
        vehicle: true,
        stops: {
          orderBy: {
            sequenceNumber: "asc",
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                fullAddress: true,
                shortAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    if (!shift) {
      return { success: true, progress: null };
    }

    // Compute progress metrics
    const totalStops = shift.stops.length;
    const completedStops = shift.stops.filter(
      (stop) => stop.status === DriverStopStatus.COMPLETED
    ).length;
    const skippedStops = shift.stops.filter(
      (stop) => stop.status === DriverStopStatus.SKIPPED
    ).length;
    const pendingStops = shift.stops.filter(
      (stop) => stop.status === DriverStopStatus.PENDING
    ).length;

    // Current stop is the first PENDING stop by sequence
    const currentStop =
      shift.stops.find((stop) => stop.status === DriverStopStatus.PENDING) ??
      null;

    return {
      success: true,
      progress: {
        shift,
        totalStops,
        completedStops,
        skippedStops,
        pendingStops,
        currentStop,
      },
    };
  } catch (error) {
    console.error("Error fetching route progress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch route progress",
    };
  }
}

/**
 * Phase 7.4 - Start a stop
 *
 * Marks a stop as started by setting startedAt timestamp.
 * Does not change the status (remains PENDING until completed).
 *
 * @param stopId - The ID of the stop to start
 * @returns The updated stop
 */
export async function startStop(
  stopId: string
): Promise<
  { success: true; stop: StopWithClient } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can start stops" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Find the stop and verify ownership
    const stop = await prisma.driverStop.findUnique({
      where: { id: stopId },
      include: {
        shift: true,
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    if (!stop) {
      return { success: false, error: "Stop not found" };
    }

    if (stop.shift.driverId !== user.driverId) {
      return {
        success: false,
        error: "You can only start stops from your own shifts",
      };
    }

    if (stop.status !== DriverStopStatus.PENDING) {
      return {
        success: false,
        error: `Cannot start a stop that is ${stop.status}`,
      };
    }

    // Only update if not already started
    if (stop.startedAt) {
      return { success: true, stop };
    }

    // Start the stop
    const updatedStop = await prisma.driverStop.update({
      where: { id: stopId },
      data: {
        startedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    return { success: true, stop: updatedStop };
  } catch (error) {
    console.error("Error starting stop:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start stop",
    };
  }
}

/**
 * Phase 7.4 - Complete a stop
 *
 * Marks a stop as completed with optional payment collection.
 * Sets completedAt timestamp and updates status to COMPLETED.
 *
 * @param stopId - The ID of the stop to complete
 * @param cashCollectedCents - Optional cash collected in cents
 * @param bonCollectedCents - Optional bon collected in cents
 * @returns The updated stop
 */
export async function completeStop(
  stopId: string,
  cashCollectedCents?: number,
  bonCollectedCents?: number
): Promise<
  { success: true; stop: StopWithClient } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can complete stops" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Validate payment amounts
    if (
      cashCollectedCents !== undefined &&
      (typeof cashCollectedCents !== "number" || cashCollectedCents < 0)
    ) {
      return {
        success: false,
        error: "Cash collected must be a non-negative number",
      };
    }

    if (
      bonCollectedCents !== undefined &&
      (typeof bonCollectedCents !== "number" || bonCollectedCents < 0)
    ) {
      return {
        success: false,
        error: "Bon collected must be a non-negative number",
      };
    }

    // Find the stop and verify ownership
    const stop = await prisma.driverStop.findUnique({
      where: { id: stopId },
      include: {
        shift: true,
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    if (!stop) {
      return { success: false, error: "Stop not found" };
    }

    if (stop.shift.driverId !== user.driverId) {
      return {
        success: false,
        error: "You can only complete stops from your own shifts",
      };
    }

    if (stop.status !== DriverStopStatus.PENDING) {
      return {
        success: false,
        error: `Cannot complete a stop that is ${stop.status}`,
      };
    }

    // Complete the stop
    const now = new Date();
    const updatedStop = await prisma.driverStop.update({
      where: { id: stopId },
      data: {
        status: DriverStopStatus.COMPLETED,
        startedAt: stop.startedAt ?? now, // Set startedAt if not already set
        completedAt: now,
        cashCollectedCents: cashCollectedCents ?? null,
        bonCollectedCents: bonCollectedCents ?? null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    return { success: true, stop: updatedStop };
  } catch (error) {
    console.error("Error completing stop:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete stop",
    };
  }
}

/**
 * Phase 7.4 - Skip a stop
 *
 * Marks a stop as skipped.
 * Sets completedAt timestamp to track when it was skipped.
 *
 * @param stopId - The ID of the stop to skip
 * @returns The updated stop
 */
export async function skipStop(
  stopId: string
): Promise<
  { success: true; stop: StopWithClient } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can skip stops" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Find the stop and verify ownership
    const stop = await prisma.driverStop.findUnique({
      where: { id: stopId },
      include: {
        shift: true,
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    if (!stop) {
      return { success: false, error: "Stop not found" };
    }

    if (stop.shift.driverId !== user.driverId) {
      return {
        success: false,
        error: "You can only skip stops from your own shifts",
      };
    }

    if (stop.status !== DriverStopStatus.PENDING) {
      return {
        success: false,
        error: `Cannot skip a stop that is ${stop.status}`,
      };
    }

    // Skip the stop
    const updatedStop = await prisma.driverStop.update({
      where: { id: stopId },
      data: {
        status: DriverStopStatus.SKIPPED,
        completedAt: new Date(), // Track when it was skipped
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            fullAddress: true,
            shortAddress: true,
          },
        },
      },
    });

    return { success: true, stop: updatedStop };
  } catch (error) {
    console.error("Error skipping stop:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to skip stop",
    };
  }
}

// Types for Phase 7.5 - End-of-Shift Close
export type CloseShiftInput = {
  endKm: number;
  endFuelLevel: FuelLevel;
  closingNotes?: string;
  cashReturnedConfirmed: boolean;
};

export type ShiftSummary = {
  shift: ShiftWithVehicleAndStops;
  totalStops: number;
  completedStops: number;
  skippedStops: number;
  distanceKm: number | null;
  totalCashCollectedCents: number;
  totalBonCollectedCents: number;
};

/**
 * Phase 7.5 - Close the current driver shift
 *
 * Marks the shift as closed by setting endTime, endKm, endFuelLevel,
 * and optionally closingNotes. Requires confirmation that cash/bon
 * has been returned.
 *
 * @param input - The closing data
 * @returns Success or error
 */
export async function closeShift(
  input: CloseShiftInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can close shifts" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Validate input
    if (typeof input.endKm !== "number" || input.endKm < 0) {
      return { success: false, error: "Final km must be a positive number" };
    }

    if (!Number.isInteger(input.endKm)) {
      return { success: false, error: "Final km must be a whole number" };
    }

    if (!Object.values(FuelLevel).includes(input.endFuelLevel)) {
      return { success: false, error: "Invalid fuel level" };
    }

    if (!input.cashReturnedConfirmed) {
      return {
        success: false,
        error: "You must confirm that cash and bon have been returned",
      };
    }

    // Get today's date range
    const { startOfDay, endOfDay } = getTodayDateRange();

    // Find the current open shift
    const shift = await prisma.driverShift.findFirst({
      where: {
        driverId: user.driverId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        endTime: null,
      },
    });

    if (!shift) {
      return { success: false, error: "No open shift found for today" };
    }

    // Validate endKm >= startKm
    if (input.endKm < shift.startKm) {
      return {
        success: false,
        error: `Final km (${input.endKm}) must be greater than or equal to starting km (${shift.startKm})`,
      };
    }

    // Close the shift
    await prisma.driverShift.update({
      where: { id: shift.id },
      data: {
        endKm: input.endKm,
        endFuelLevel: input.endFuelLevel,
        endTime: new Date(),
        closingNotes: input.closingNotes || null,
        cashReturnedConfirmed: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error closing shift:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to close shift",
    };
  }
}

/**
 * Phase 7.5 - Get closed shift summary for today
 *
 * Returns the closed shift with computed summary statistics.
 *
 * @returns Shift summary with stats
 */
export async function getClosedShiftSummary(): Promise<
  | { success: true; summary: ShiftSummary }
  | { success: true; summary: null }
  | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "DRIVER") {
      return { success: false, error: "Only drivers can access shift summary" };
    }

    if (!user.driverId) {
      return {
        success: false,
        error: "User is not associated with a driver account",
      };
    }

    // Get today's date range
    const { startOfDay, endOfDay } = getTodayDateRange();

    // Find today's closed shift
    const shift = await prisma.driverShift.findFirst({
      where: {
        driverId: user.driverId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        endTime: { not: null },
      },
      include: {
        vehicle: true,
        stops: {
          orderBy: {
            sequenceNumber: "asc",
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                fullAddress: true,
                shortAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        endTime: "desc",
      },
    });

    if (!shift) {
      return { success: true, summary: null };
    }

    // Compute summary stats
    const totalStops = shift.stops.length;
    const completedStops = shift.stops.filter(
      (stop) => stop.status === DriverStopStatus.COMPLETED
    ).length;
    const skippedStops = shift.stops.filter(
      (stop) => stop.status === DriverStopStatus.SKIPPED
    ).length;

    const distanceKm =
      shift.endKm !== null && shift.startKm !== null
        ? shift.endKm - shift.startKm
        : null;

    const totalCashCollectedCents = shift.stops.reduce(
      (sum, stop) => sum + (stop.cashCollectedCents || 0),
      0
    );
    const totalBonCollectedCents = shift.stops.reduce(
      (sum, stop) => sum + (stop.bonCollectedCents || 0),
      0
    );

    return {
      success: true,
      summary: {
        shift,
        totalStops,
        completedStops,
        skippedStops,
        distanceKm,
        totalCashCollectedCents,
        totalBonCollectedCents,
      },
    };
  } catch (error) {
    console.error("Error fetching shift summary:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch shift summary",
    };
  }
}
