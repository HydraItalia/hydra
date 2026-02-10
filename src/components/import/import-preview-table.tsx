"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getImportBatchRows } from "@/actions/vendor-import";
import { EditRowDialog } from "./edit-row-dialog";
import type { BatchRow } from "@/lib/import/batch-service";

interface ImportPreviewTableProps {
  batchId: string;
  initialRows: BatchRow[];
  initialPage: number;
  initialTotalPages: number;
  initialTotal: number;
  editable?: boolean;
  onRowUpdated?: (batchErrorCount: number) => void;
}

function rowStatusVariant(status: string) {
  switch (status) {
    case "VALID":
      return "default" as const;
    case "ERROR":
      return "destructive" as const;
    case "COMMITTED":
      return "default" as const;
    case "SKIPPED":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function ImportPreviewTable({
  batchId,
  initialRows,
  initialPage,
  initialTotalPages,
  initialTotal,
  editable,
  onRowUpdated,
}: ImportPreviewTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [editingRow, setEditingRow] = useState<BatchRow | null>(null);

  const fetchPage = (newPage: number, filter?: string) => {
    startTransition(async () => {
      const result = await getImportBatchRows(batchId, {
        page: newPage,
        statusFilter: filter,
      });
      if (result.success && result.data) {
        setRows(result.data.rows);
        setPage(result.data.page);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      } else {
        toast.error(result.error || "Failed to load rows");
      }
    });
  };

  const toggleFilter = (filter?: string) => {
    const newFilter = statusFilter === filter ? undefined : filter;
    setStatusFilter(newFilter);
    fetchPage(1, newFilter);
  };

  const handleRowUpdated = (
    rowId: string,
    status: string,
    errors: string[],
    normalizedData: Record<string, unknown>,
    batchErrorCount: number,
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, status, errors, normalizedData }
          : r,
      ),
    );
    onRowUpdated?.(batchErrorCount);
  };

  return (
    <div className="space-y-3">
      {/* Filter toggles */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFilter(undefined)}
          disabled={isPending}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "ERROR" ? "destructive" : "outline"}
          size="sm"
          onClick={() => toggleFilter("ERROR")}
          disabled={isPending}
        >
          Errors Only
        </Button>
      </div>

      <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="rounded-lg border min-w-full inline-block align-middle">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap w-16">
                  Row #
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap w-24">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                  Category
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap w-20">
                  Unit
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap w-24">
                  Price
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap w-24">
                  In Stock
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !isPending ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No rows to display
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const normalized = row.normalizedData as Record<
                    string,
                    any
                  > | null;
                  const errors = Array.isArray(row.errors)
                    ? (row.errors as string[])
                    : [];
                  const isError = row.status === "ERROR";
                  const isClickable = editable && isError;

                  return (
                    <tr
                      key={row.id}
                      className={[
                        isError ? "bg-red-50 dark:bg-red-950/20" : undefined,
                        isClickable
                          ? "cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                          : undefined,
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined}
                      onClick={isClickable ? () => setEditingRow(row) : undefined}
                    >
                      <td className="py-2 px-4 text-sm">{row.rowIndex + 1}</td>
                      <td className="py-2 px-4">
                        <Badge variant={rowStatusVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {normalized?.name || "-"}
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {normalized?.category || "-"}
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {normalized?.unit || "-"}
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {normalized?.priceCents != null
                          ? `${(normalized.priceCents / 100).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {normalized?.inStock != null
                          ? normalized.inStock
                            ? "Yes"
                            : "No"
                          : "-"}
                      </td>
                      <td className="py-2 px-4 text-sm text-red-600">
                        <span className="flex items-center gap-1.5">
                          {errors.length > 0 ? errors.join("; ") : ""}
                          {isClickable && (
                            <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} row{total !== 1 ? "s" : ""} - Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => fetchPage(page - 1, statusFilter)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => fetchPage(page + 1, statusFilter)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {editingRow && (
        <EditRowDialog
          batchId={batchId}
          row={editingRow}
          open={!!editingRow}
          onOpenChange={(open) => {
            if (!open) setEditingRow(null);
          }}
          onRowUpdated={handleRowUpdated}
        />
      )}
    </div>
  );
}
