"use server";

/**
 * Admin Fee Report Actions (N2.3)
 *
 * Server actions for admin fee report with vendor breakdown.
 * Only accessible to ADMIN role.
 */

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Types for fee report
export type FeeReportRow = {
  id: string;
  subOrderNumber: string;
  vendorId: string;
  vendorName: string;
  paidAt: Date;
  grossTotalCents: number | null;
  vatTotalCents: number | null;
  netTotalCents: number | null;
  hydraFeeCents: number | null;
};

export type VendorTotals = {
  vendorId: string;
  vendorName: string;
  rowCount: number;
  grossTotalCents: number;
  vatTotalCents: number;
  netTotalCents: number;
  hydraFeeCents: number;
  rowsWithNullSnapshots: number;
};

export type FeeReportResult = {
  rows: FeeReportRow[];
  vendorTotals: VendorTotals[];
  overallTotals: {
    rowCount: number;
    grossTotalCents: number;
    vatTotalCents: number;
    netTotalCents: number;
    hydraFeeCents: number;
    rowsWithNullSnapshots: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
  };
  hasHistoricalOrdersWarning: boolean;
};

export type FeeReportFilters = {
  vendorId?: string;
  startDate?: string; // ISO date string YYYY-MM-DD
  endDate?: string; // ISO date string YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

/**
 * Get fee report data with filtering and pagination
 */
export async function getFeeReport(
  filters: FeeReportFilters,
): Promise<
  { success: true; data: FeeReportResult } | { success: false; error: string }
> {
  try {
    // Require ADMIN role
    await requireRole("ADMIN");

    const page = Math.max(filters.page || 1, 1);
    const pageSize = Math.min(Math.max(filters.pageSize || 50, 10), 100);
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: {
      paymentStatus: "SUCCEEDED";
      paidAt: { not: null; gte?: Date; lte?: Date };
      vendorId?: string;
    } = {
      paymentStatus: "SUCCEEDED",
      paidAt: { not: null },
    };

    // Vendor filter
    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    // Date range filters (inclusive)
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      where.paidAt = { ...where.paidAt, gte: startDate };
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      where.paidAt = { ...where.paidAt, lte: endDate };
    }

    // Get total count for pagination
    const totalRows = await prisma.subOrder.count({ where });

    // Fetch paginated rows
    const subOrders = await prisma.subOrder.findMany({
      where,
      select: {
        id: true,
        subOrderNumber: true,
        vendorId: true,
        paidAt: true,
        grossTotalCents: true,
        vatTotalCents: true,
        netTotalCents: true,
        hydraFeeCents: true,
        Vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { paidAt: "desc" },
        { Vendor: { name: "asc" } },
        { subOrderNumber: "asc" },
      ],
      skip,
      take: pageSize,
    });

    // Transform to FeeReportRow
    const rows: FeeReportRow[] = subOrders.map((so) => ({
      id: so.id,
      subOrderNumber: so.subOrderNumber,
      vendorId: so.vendorId,
      vendorName: so.Vendor.name,
      paidAt: so.paidAt!,
      grossTotalCents: so.grossTotalCents,
      vatTotalCents: so.vatTotalCents,
      netTotalCents: so.netTotalCents,
      hydraFeeCents: so.hydraFeeCents,
    }));

    // Fetch ALL matching rows for vendor totals (ignoring pagination)
    const allSubOrders = await prisma.subOrder.findMany({
      where,
      select: {
        vendorId: true,
        grossTotalCents: true,
        vatTotalCents: true,
        netTotalCents: true,
        hydraFeeCents: true,
        Vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate vendor totals
    const vendorMap = new Map<string, VendorTotals>();
    let overallGross = 0;
    let overallVat = 0;
    let overallNet = 0;
    let overallFee = 0;
    let overallNullCount = 0;

    for (const so of allSubOrders) {
      const hasNullSnapshot =
        so.grossTotalCents === null ||
        so.vatTotalCents === null ||
        so.netTotalCents === null ||
        so.hydraFeeCents === null;

      if (!vendorMap.has(so.vendorId)) {
        vendorMap.set(so.vendorId, {
          vendorId: so.vendorId,
          vendorName: so.Vendor.name,
          rowCount: 0,
          grossTotalCents: 0,
          vatTotalCents: 0,
          netTotalCents: 0,
          hydraFeeCents: 0,
          rowsWithNullSnapshots: 0,
        });
      }

      const vendorTotals = vendorMap.get(so.vendorId)!;
      vendorTotals.rowCount++;

      if (hasNullSnapshot) {
        vendorTotals.rowsWithNullSnapshots++;
        overallNullCount++;
      } else {
        vendorTotals.grossTotalCents += so.grossTotalCents!;
        vendorTotals.vatTotalCents += so.vatTotalCents!;
        vendorTotals.netTotalCents += so.netTotalCents!;
        vendorTotals.hydraFeeCents += so.hydraFeeCents!;

        overallGross += so.grossTotalCents!;
        overallVat += so.vatTotalCents!;
        overallNet += so.netTotalCents!;
        overallFee += so.hydraFeeCents!;
      }
    }

    // Sort vendor totals by name
    const vendorTotals = Array.from(vendorMap.values()).sort((a, b) =>
      a.vendorName.localeCompare(b.vendorName),
    );

    const result: FeeReportResult = {
      rows,
      vendorTotals,
      overallTotals: {
        rowCount: allSubOrders.length,
        grossTotalCents: overallGross,
        vatTotalCents: overallVat,
        netTotalCents: overallNet,
        hydraFeeCents: overallFee,
        rowsWithNullSnapshots: overallNullCount,
      },
      pagination: {
        page,
        pageSize,
        totalRows,
        totalPages: Math.ceil(totalRows / pageSize),
      },
      hasHistoricalOrdersWarning: overallNullCount > 0,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching fee report:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch fee report",
    };
  }
}

/**
 * Get all vendors for the filter dropdown
 */
export async function getVendorsForFeeReport(): Promise<
  | { success: true; data: Array<{ id: string; name: string }> }
  | { success: false; error: string }
> {
  try {
    await requireRole("ADMIN");

    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: vendors };
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch vendors",
    };
  }
}

/**
 * Generate CSV content for fee report export
 */
export async function exportFeeReportCsv(
  filters: Omit<FeeReportFilters, "page" | "pageSize">,
): Promise<
  | { success: true; data: { csv: string; filename: string } }
  | { success: false; error: string }
> {
  try {
    await requireRole("ADMIN");

    // Build where clause (same as getFeeReport but without pagination)
    const where: {
      paymentStatus: "SUCCEEDED";
      paidAt: { not: null; gte?: Date; lte?: Date };
      vendorId?: string;
    } = {
      paymentStatus: "SUCCEEDED",
      paidAt: { not: null },
    };

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      where.paidAt = { ...where.paidAt, gte: startDate };
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.paidAt = { ...where.paidAt, lte: endDate };
    }

    // Fetch all matching rows (no pagination for export)
    const subOrders = await prisma.subOrder.findMany({
      where,
      select: {
        id: true,
        subOrderNumber: true,
        vendorId: true,
        paidAt: true,
        grossTotalCents: true,
        vatTotalCents: true,
        netTotalCents: true,
        hydraFeeCents: true,
        Vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { paidAt: "desc" },
        { Vendor: { name: "asc" } },
        { subOrderNumber: "asc" },
      ],
    });

    // CSV escaping helper
    function escapeCSV(value: string | null | undefined): string {
      if (value === null || value === undefined) return "";
      const str = String(value);
      // Escape quotes by doubling them
      if (
        str.includes('"') ||
        str.includes(",") ||
        str.includes("\n") ||
        str.includes("\r")
      ) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    // Format cents to currency string
    function formatCents(cents: number | null): string {
      if (cents === null) return "N/A";
      return (cents / 100).toFixed(2);
    }

    // Build CSV
    const headers = [
      "SubOrder ID",
      "SubOrder Number",
      "Vendor ID",
      "Vendor Name",
      "Paid At",
      "Gross Total (EUR)",
      "VAT (EUR)",
      "Net Total (EUR)",
      "Hydra Fee (EUR)",
    ];

    const rows = subOrders.map((so) => [
      escapeCSV(so.id),
      escapeCSV(so.subOrderNumber),
      escapeCSV(so.vendorId),
      escapeCSV(so.Vendor.name),
      escapeCSV(so.paidAt?.toISOString() || ""),
      formatCents(so.grossTotalCents),
      formatCents(so.vatTotalCents),
      formatCents(so.netTotalCents),
      formatCents(so.hydraFeeCents),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );

    // Generate filename
    const startStr = filters.startDate || "all";
    const endStr = filters.endDate || "all";
    let filename = `hydra-fee-report_${startStr}_to_${endStr}`;

    if (filters.vendorId) {
      const vendor = subOrders.find((so) => so.vendorId === filters.vendorId);
      if (vendor) {
        const vendorSlug = vendor.Vendor.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
        filename = `hydra-fee-report_${vendorSlug}_${startStr}_to_${endStr}`;
      }
    }

    filename += ".csv";

    return { success: true, data: { csv, filename } };
  } catch (error) {
    console.error("Error exporting fee report CSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export CSV",
    };
  }
}
