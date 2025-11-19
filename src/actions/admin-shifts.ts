"use server";

/**
 * Phase 7.6 - Admin/Agent Shift Overview Server Actions
 *
 * Server actions for backoffice shift viewing and reconciliation.
 * Only accessible to ADMIN and AGENT roles.
 */

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FuelLevel, DriverStopStatus } from "@prisma/client";

// Types
export type ShiftStatus = "OPEN" | "CLOSED";

export type ShiftListItem = {
  id: string;
  date: Date;
  driverName: string;
  vehicleLabel: string;
  totalKm: number | null;
  totalCashCents: number;
  totalBonCents: number;
  status: ShiftStatus;
};

export type ListShiftsParams = {
  page: number;
  pageSize?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

export type ListShiftsResult = {
  items: ShiftListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ShiftStopDetail = {
  id: string;
  sequenceNumber: number;
  status: DriverStopStatus;
  clientName: string;
  clientShortAddress: string | null;
  cashCollectedCents: number | null;
  bonCollectedCents: number | null;
};

export type ShiftDetails = {
  id: string;
  date: Date;
  driverName: string;
  vehicleLabel: string;
  startKm: number;
  endKm: number | null;
  startFuelLevel: FuelLevel;
  endFuelLevel: FuelLevel | null;
  startTime: Date;
  endTime: Date | null;
  totalKm: number | null;
  totalCashCents: number;
  totalBonCents: number;
  closingNotes: string | null;
  cashReturnedConfirmed: boolean;
  stops: ShiftStopDetail[];
};

/**
 * List shifts with pagination for admin/agent backoffice view
 *
 * @param params - Pagination and filter parameters
 * @returns Paginated list of shifts with computed totals
 */
export async function listShiftsPage(
  params: ListShiftsParams
): Promise<
  { success: true; result: ListShiftsResult } | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "ADMIN" && user.role !== "AGENT") {
      return {
        success: false,
        error: "Only ADMIN and AGENT can access shift overview",
      };
    }

    const page = Math.max(1, params.page);
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: {
      date?: { gte?: Date; lte?: Date };
    } = {};

    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) {
        where.date.gte = params.dateFrom;
      }
      if (params.dateTo) {
        where.date.lte = params.dateTo;
      }
    }

    // Get total count
    const totalCount = await prisma.driverShift.count({ where });

    // Fetch shifts with relations
    const shifts = await prisma.driverShift.findMany({
      where,
      include: {
        driver: {
          select: {
            name: true,
          },
        },
        vehicle: {
          select: {
            licensePlate: true,
            description: true,
          },
        },
        stops: {
          select: {
            cashCollectedCents: true,
            bonCollectedCents: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      skip,
      take: pageSize,
    });

    // Transform to list items
    const items: ShiftListItem[] = shifts.map((shift) => {
      // Compute totals from stops
      const totalCashCents = shift.stops.reduce(
        (sum, stop) => sum + (stop.cashCollectedCents || 0),
        0
      );
      const totalBonCents = shift.stops.reduce(
        (sum, stop) => sum + (stop.bonCollectedCents || 0),
        0
      );

      // Compute total km if both values present
      const totalKm =
        shift.endKm !== null ? shift.endKm - shift.startKm : null;

      return {
        id: shift.id,
        date: shift.date,
        driverName: shift.driver.name,
        vehicleLabel: `${shift.vehicle.licensePlate} – ${shift.vehicle.description}`,
        totalKm,
        totalCashCents,
        totalBonCents,
        status: shift.endTime === null ? "OPEN" : "CLOSED",
      };
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      result: {
        items,
        totalCount,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error listing shifts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list shifts",
    };
  }
}

/**
 * Get detailed information for a single shift
 *
 * @param shiftId - The ID of the shift to retrieve
 * @returns Shift details with stops and computed totals
 */
export async function getShiftDetails(
  shiftId: string
): Promise<
  | { success: true; shift: ShiftDetails }
  | { success: true; shift: null }
  | { success: false; error: string }
> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.role !== "ADMIN" && user.role !== "AGENT") {
      return {
        success: false,
        error: "Only ADMIN and AGENT can access shift details",
      };
    }

    const shift = await prisma.driverShift.findUnique({
      where: { id: shiftId },
      include: {
        driver: {
          select: {
            name: true,
          },
        },
        vehicle: {
          select: {
            licensePlate: true,
            description: true,
          },
        },
        stops: {
          orderBy: {
            sequenceNumber: "asc",
          },
          include: {
            client: {
              select: {
                name: true,
                shortAddress: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      return { success: true, shift: null };
    }

    // Compute totals
    const totalCashCents = shift.stops.reduce(
      (sum, stop) => sum + (stop.cashCollectedCents || 0),
      0
    );
    const totalBonCents = shift.stops.reduce(
      (sum, stop) => sum + (stop.bonCollectedCents || 0),
      0
    );
    const totalKm =
      shift.endKm !== null ? shift.endKm - shift.startKm : null;

    // Transform stops
    const stops: ShiftStopDetail[] = shift.stops.map((stop) => ({
      id: stop.id,
      sequenceNumber: stop.sequenceNumber,
      status: stop.status,
      clientName: stop.client.name,
      clientShortAddress: stop.client.shortAddress,
      cashCollectedCents: stop.cashCollectedCents,
      bonCollectedCents: stop.bonCollectedCents,
    }));

    const shiftDetails: ShiftDetails = {
      id: shift.id,
      date: shift.date,
      driverName: shift.driver.name,
      vehicleLabel: `${shift.vehicle.licensePlate} – ${shift.vehicle.description}`,
      startKm: shift.startKm,
      endKm: shift.endKm,
      startFuelLevel: shift.startFuelLevel,
      endFuelLevel: shift.endFuelLevel,
      startTime: shift.startTime,
      endTime: shift.endTime,
      totalKm,
      totalCashCents,
      totalBonCents,
      closingNotes: shift.closingNotes,
      cashReturnedConfirmed: shift.cashReturnedConfirmed,
      stops,
    };

    return { success: true, shift: shiftDetails };
  } catch (error) {
    console.error("Error fetching shift details:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch shift details",
    };
  }
}
