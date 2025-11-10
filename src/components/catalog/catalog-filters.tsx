"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { Search, X } from "lucide-react";
import { useState, useTransition } from "react";

type Vendor = {
  id: string;
  name: string;
};

type CatalogFiltersProps = {
  vendors: Vendor[];
  selectedVendorId?: string;
  searchQuery?: string;
  inStockOnly: boolean;
};

export function CatalogFilters({
  vendors,
  selectedVendorId,
  searchQuery,
  inStockOnly,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery || "");

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/dashboard/catalog?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: search || null });
  };

  const clearSearch = () => {
    setSearch("");
    updateParams({ q: null });
  };

  const handleVendorChange = (value: string) => {
    updateParams({ vendorId: value === "all" ? null : value });
  };

  const handleStockToggle = () => {
    updateParams({ inStock: inStockOnly ? null : "true" });
  };

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <Label htmlFor="search">Search products</Label>
          <form onSubmit={handleSearch} className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>
        </div>

        {/* Vendor Filter */}
        <div>
          <Label htmlFor="vendor">Filter by vendor</Label>
          <Select
            value={selectedVendorId || "all"}
            onValueChange={handleVendorChange}
          >
            <SelectTrigger id="vendor" className="mt-1">
              <SelectValue placeholder="All vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* In Stock Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="inStock"
          checked={inStockOnly}
          onChange={handleStockToggle}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="inStock" className="cursor-pointer">
          Show in-stock products only
        </Label>
      </div>

      {/* Active Filters */}
      {(searchQuery || selectedVendorId || inStockOnly) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                updateParams({ q: null });
              }}
            >
              Search: {searchQuery}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
          {selectedVendorId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateParams({ vendorId: null })}
            >
              Vendor:{" "}
              {vendors.find((v) => v.id === selectedVendorId)?.name}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
          {inStockOnly && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateParams({ inStock: null })}
            >
              In stock only
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              router.push("/dashboard/catalog");
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
