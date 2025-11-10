"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";

type FilterOption = {
  label: string;
  value: string;
};

type CatalogFiltersProps = {
  vendors: FilterOption[];
  initial: {
    group: "food" | "beverage" | "services";
    category?: string;
    vendorId?: string;
    q?: string;
    inStock?: boolean;
  };
};

export function CatalogFiltersNew({ vendors, initial }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Local state for immediate UI feedback
  const [search, setSearch] = useState(initial.q || "");
  const [selectedVendor, setSelectedVendor] = useState(
    initial.vendorId || "all"
  );
  const [inStockOnly, setInStockOnly] = useState(initial.inStock || false);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL({ q: search || undefined });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Restore focus to search input after transition
  useEffect(() => {
    if (!isPending && document.activeElement !== searchInputRef.current) {
      // Only restore focus if user was typing (search state has value)
      if (search && searchInputRef.current) {
        const input = searchInputRef.current;
        const length = input.value.length;
        input.focus();
        input.setSelectionRange(length, length);
      }
    }
  }, [isPending, search]);

  const updateURL = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Special handling for inStock boolean
      if ("inStock" in updates) {
        if (updates.inStock === "true") {
          params.set("inStock", "1");
        } else {
          params.delete("inStock");
        }
      }

      startTransition(() => {
        router.replace(`/dashboard/catalog?${params.toString()}`);
      });
    },
    [searchParams, router]
  );

  const handleVendorChange = (value: string) => {
    setSelectedVendor(value);
    // "all" means no vendor filter
    updateURL({ vendorId: value === "all" ? undefined : value });
  };

  const handleInStockToggle = (checked: boolean) => {
    setInStockOnly(checked);
    updateURL({ inStock: checked ? "true" : undefined });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedVendor("all");
    setInStockOnly(false);
    updateURL({ q: undefined, vendorId: undefined, inStock: undefined });
  };

  const hasActiveFilters =
    search || (selectedVendor && selectedVendor !== "all") || inStockOnly;

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <Label htmlFor="search">Search products</Label>
          <div className="relative flex gap-2 mt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                id="search"
                type="text"
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                disabled={isPending}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vendor Filter */}
        <div>
          <Label htmlFor="vendor">Filter by vendor</Label>
          <Select
            value={selectedVendor}
            onValueChange={handleVendorChange}
            disabled={isPending}
          >
            <SelectTrigger id="vendor" className="mt-1">
              <SelectValue placeholder="All vendors" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.value} value={vendor.value}>
                  {vendor.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* In Stock Toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="inStock"
          checked={inStockOnly}
          onCheckedChange={handleInStockToggle}
          disabled={isPending}
        />
        <Label htmlFor="inStock" className="cursor-pointer">
          Show in-stock products only
        </Label>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {search && (
            <Badge variant="secondary">
              Search: {search}
              <button
                type="button"
                onClick={() => setSearch("")}
                className="ml-1"
                aria-label="Clear search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedVendor && (
            <Badge variant="secondary">
              Vendor: {vendors.find((v) => v.value === selectedVendor)?.label}
              <button
                type="button"
                onClick={() => handleVendorChange("")}
                className="ml-1"
                aria-label="Clear vendor filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {inStockOnly && (
            <Badge variant="secondary">
              In stock only
              <button
                type="button"
                onClick={() => handleInStockToggle(false)}
                className="ml-1"
                aria-label="Clear in stock filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={isPending}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
