"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X, Loader2 } from "lucide-react";

type CatalogFiltersProps = {
  initial: {
    group?: "food" | "beverage" | "services";
    category?: string;
    q?: string;
    inStock?: boolean;
  };
};

export function CatalogFilters({ initial }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  // Local state for immediate UI feedback
  const [search, setSearch] = useState(initial.q || "");
  const [inStockOnly, setInStockOnly] = useState(initial.inStock || false);

  // Sync state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setInStockOnly(searchParams.get("inStock") === "1");
  }, [searchParams]);

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

      // Reset to page 1 when filters change
      params.delete("page");

      startTransition(() => {
        router.replace(`/dashboard/catalog?${params.toString()}`);
      });
    },
    [searchParams, router]
  );

  // Debounced search update
  useEffect(() => {
    if (!isTypingRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (search && search.trim()) {
        params.set("q", search.trim());
      } else {
        params.delete("q");
      }

      // Reset to page 1 when search changes
      params.delete("page");

      startTransition(() => {
        router.replace(`/dashboard/catalog?${params.toString()}`);
      });
      isTypingRef.current = false;
    }, 500); // Increased to 500ms like admin search

    return () => clearTimeout(timer);
  }, [search, searchParams, router]);

  const handleInStockToggle = (checked: boolean) => {
    setInStockOnly(checked);
    updateURL({ inStock: checked ? "true" : undefined });
  };

  const handleClearFilters = () => {
    setSearch("");
    setInStockOnly(false);
    updateURL({ q: undefined, inStock: undefined });
  };

  const hasActiveFilters = search || inStockOnly;

  return (
    <>
      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Searching products...
            </p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Search */}
          <div>
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
                  onChange={(e) => {
                    isTypingRef.current = true;
                    setSearch(e.target.value);
                  }}
                  className="pl-9 pr-10"
                  disabled={isPending}
                />
                {isPending ? (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                ) : search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                ) : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Products supplied by multiple trusted vendors
            </p>
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
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
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
    </>
  );
}
