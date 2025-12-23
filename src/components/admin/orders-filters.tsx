"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ORDER_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "FULFILLING", label: "Fulfilling" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELED", label: "Canceled" },
];

export function AdminOrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setStatusFilter(searchParams.get("status") || "all");
  }, [searchParams.toString()]);

  // Debounced search handler
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const timer = setTimeout(() => {
      if (searchQuery) {
        currentParams.set("search", searchQuery);
      } else {
        currentParams.delete("search");
      }
      currentParams.delete("page"); // Reset to page 1 on search
      router.push(`/dashboard/orders?${currentParams.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams.toString()]);

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
      router.push(`/dashboard/orders?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    router.push("/dashboard/orders");
  }, [router]);

  const hasActiveFilters =
    searchQuery || (statusFilter && statusFilter !== "all");

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      {/* Search Input */}
      <div className="flex-1 space-y-2">
        <Label htmlFor="search">Search by Order Number</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Search order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2 md:w-[200px]">
        <Label htmlFor="status">Status</Label>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger id="status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
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
