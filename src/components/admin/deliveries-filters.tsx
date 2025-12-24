"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AvailableDriver } from "@/data/orders";

const DELIVERY_STATUSES = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "EXCEPTION", label: "Exception" },
];

type DeliveriesFiltersProps = {
  drivers: AvailableDriver[];
};

export function AdminDeliveriesFilters({ drivers }: DeliveriesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [driverFilter, setDriverFilter] = useState(
    searchParams.get("driver") || "all"
  );

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "all");
    setDriverFilter(searchParams.get("driver") || "all");
  }, [searchParams.toString()]);

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatusFilter(value);
      const params = new URLSearchParams(searchParams);
      if (value && value !== "all") {
        params.set("status", value);
      } else {
        params.delete("status");
      }
      params.delete("page"); // Reset to page 1 on filter change
      router.push(`/dashboard/deliveries?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleDriverChange = useCallback(
    (value: string) => {
      setDriverFilter(value);
      const params = new URLSearchParams(searchParams);
      if (value && value !== "all") {
        params.set("driver", value);
      } else {
        params.delete("driver");
      }
      params.delete("page"); // Reset to page 1 on filter change
      router.push(`/dashboard/deliveries?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleClearFilters = useCallback(() => {
    setStatusFilter("all");
    setDriverFilter("all");
    router.push("/dashboard/deliveries");
  }, [router]);

  const hasActiveFilters =
    (statusFilter && statusFilter !== "all") ||
    (driverFilter && driverFilter !== "all");

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      {/* Status Filter */}
      <div className="space-y-2 md:w-[200px]">
        <Label htmlFor="status">Status</Label>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger id="status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {DELIVERY_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Driver Filter */}
      <div className="space-y-2 md:w-[200px]">
        <Label htmlFor="driver">Driver</Label>
        <Select value={driverFilter} onValueChange={handleDriverChange}>
          <SelectTrigger id="driver">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleClearFilters}
          title="Clear all filters"
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
