"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

export function AgentsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUserTyping = useRef(false);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );

  // Sync state with URL changes (browser back/forward)
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Debounced search (500ms)
  useEffect(() => {
    if (!isUserTyping.current) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchQuery && searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      } else {
        params.delete("search");
      }

      // Reset to page 1 when search changes
      params.delete("page");

      router.push(`/dashboard/agents?${params.toString()}`);
      isUserTyping.current = false;
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    router.push("/dashboard/agents");
  }, [router]);

  const hasActiveFilters = searchQuery.trim() !== "";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents by name, email, or code..."
          value={searchQuery}
          onChange={(e) => {
            isUserTyping.current = true;
            setSearchQuery(e.target.value);
          }}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}
