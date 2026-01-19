"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getVendorsForFeeReport } from "@/actions/admin-fee-report";

interface FeeReportFiltersProps {
  onExportCsv: () => void;
  isExporting: boolean;
}

export function FeeReportFilters({
  onExportCsv,
  isExporting,
}: FeeReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for vendors dropdown
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [vendorsLoading, setVendorsLoading] = useState(true);

  // Get current filter values from URL
  const currentVendorId = searchParams.get("vendorId") || "";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";

  // Load vendors on mount
  useEffect(() => {
    async function loadVendors() {
      const result = await getVendorsForFeeReport();
      if (result.success) {
        setVendors(result.data);
      } else {
        console.error("Failed to load vendors:", result.error);
      }
      setVendorsLoading(false);
    }
    loadVendors();
  }, []);

  // Update URL with new filter values
  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Reset to page 1 when filters change
        params.set("page", "1");

        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === "") {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        }

        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleVendorChange = (value: string) => {
    updateFilters({ vendorId: value === "all" ? null : value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ startDate: e.target.value || null });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ endDate: e.target.value || null });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      router.push("?");
    });
  };

  const hasActiveFilters =
    currentVendorId || currentStartDate || currentEndDate;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Vendor Filter */}
        <div className="space-y-2">
          <Label htmlFor="vendor-filter">Vendor</Label>
          <Select
            value={currentVendorId || "all"}
            onValueChange={handleVendorChange}
            disabled={vendorsLoading || isPending}
          >
            <SelectTrigger id="vendor-filter" className="w-[200px]">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="start-date">Paid From</Label>
          <Input
            id="start-date"
            type="date"
            value={currentStartDate}
            onChange={handleStartDateChange}
            disabled={isPending}
            className="w-[160px]"
            max={currentEndDate || undefined}
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="end-date">Paid To</Label>
          <Input
            id="end-date"
            type="date"
            value={currentEndDate}
            onChange={handleEndDateChange}
            disabled={isPending}
            className="w-[160px]"
            min={currentStartDate || undefined}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={isPending}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Export Button */}
      <Button onClick={onExportCsv} disabled={isExporting || isPending}>
        {isExporting ? "Exporting..." : "Export CSV"}
      </Button>
    </div>
  );
}
