"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FeeReportFilters } from "@/components/admin/fee-report-filters";
import { FeeReportTable } from "@/components/admin/fee-report-table";
import {
  getFeeReport,
  exportFeeReportCsv,
  type FeeReportResult,
} from "@/actions/admin-fee-report";
import { Loader2 } from "lucide-react";

export default function AdminFeeReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Report data state
  const [data, setData] = useState<FeeReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Extract filters from URL
  const vendorId = searchParams.get("vendorId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Fetch data when filters change
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getFeeReport({
        vendorId,
        startDate,
        endDate,
        page,
        pageSize: 50,
      });

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
        setData(null);
      }

      setLoading(false);
    }

    fetchData();
  }, [vendorId, startDate, endDate, page]);

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(newPage));
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  // Handle CSV export
  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);

    try {
      const result = await exportFeeReportCsv({
        vendorId,
        startDate,
        endDate,
      });

      if (result.success) {
        // Create blob and trigger download
        const blob = new Blob([result.data.csv], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [vendorId, startDate, endDate]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Report</h1>
        <p className="text-muted-foreground">
          View platform fees for paid sub-orders by vendor and date range.
        </p>
      </div>

      <FeeReportFilters onExportCsv={handleExportCsv} isExporting={isExporting} />

      {loading || isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      ) : data ? (
        <FeeReportTable data={data} onPageChange={handlePageChange} />
      ) : null}
    </div>
  );
}
