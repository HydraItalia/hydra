"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { FeeReportResult } from "@/actions/admin-fee-report";

interface FeeReportTableProps {
  data: FeeReportResult;
  onPageChange: (page: number) => void;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatCentsOrNull(cents: number | null): string {
  if (cents === null) return "N/A";
  return formatCurrency(cents);
}

export function FeeReportTable({ data, onPageChange }: FeeReportTableProps) {
  const {
    rows,
    vendorTotals,
    overallTotals,
    pagination,
    hasHistoricalOrdersWarning,
  } = data;

  return (
    <div className="space-y-6">
      {/* Historical Orders Warning */}
      {hasHistoricalOrdersWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Historical Orders Warning</AlertTitle>
          <AlertDescription>
            {overallTotals.rowsWithNullSnapshots} order(s) do not have VAT/fee
            snapshots (created before this feature was implemented). These
            orders show &quot;N/A&quot; values and are excluded from totals.
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Totals Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Totals</CardTitle>
          <CardDescription>
            Summary of all {overallTotals.rowCount} paid sub-orders in the
            selected date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sub-Orders</p>
              <p className="text-2xl font-bold">{overallTotals.rowCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gross Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(overallTotals.grossTotalCents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VAT Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(overallTotals.vatTotalCents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(overallTotals.netTotalCents)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hydra Fees</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(overallTotals.hydraFeeCents)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Vendor Totals */}
      {vendorTotals.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Breakdown</CardTitle>
            <CardDescription>Totals by vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Hydra Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorTotals.map((vendor) => (
                  <TableRow key={vendor.vendorId}>
                    <TableCell className="font-medium">
                      {vendor.vendorName}
                      {vendor.rowsWithNullSnapshots > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({vendor.rowsWithNullSnapshots} N/A)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {vendor.rowCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(vendor.grossTotalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(vendor.vatTotalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(vendor.netTotalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(vendor.hydraFeeCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Individual Rows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sub-Order Details</CardTitle>
          <CardDescription>
            Showing {rows.length} of {pagination.totalRows} sub-orders (page{" "}
            {pagination.page} of {pagination.totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Sub-Order #</TableHead>
                <TableHead>Paid At</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Hydra Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No paid sub-orders found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.vendorName}
                    </TableCell>
                    <TableCell>{row.subOrderNumber}</TableCell>
                    <TableCell>{formatDate(row.paidAt)}</TableCell>
                    <TableCell className="text-right">
                      {formatCentsOrNull(row.grossTotalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCentsOrNull(row.vatTotalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCentsOrNull(row.netTotalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCentsOrNull(row.hydraFeeCents)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
