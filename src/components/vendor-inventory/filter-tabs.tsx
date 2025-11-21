"use client";

import { InventoryFilter } from "@/actions/vendor-inventory";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface FilterTabsProps {
  currentFilter: InventoryFilter;
  counts?: {
    all: number;
    active: number;
    inactive: number;
    lowStock: number;
  };
}

export function FilterTabs({ currentFilter, counts }: FilterTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (value: InventoryFilter) => {
    const params = new URLSearchParams(searchParams);
    if (value === "ALL") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    router.push(`/dashboard/inventory?${params.toString()}`);
  };

  const filters: { value: InventoryFilter; label: string; count?: number }[] = [
    { value: "ALL", label: "All", count: counts?.all },
    { value: "ACTIVE", label: "Active", count: counts?.active },
    { value: "INACTIVE", label: "Inactive", count: counts?.inactive },
    { value: "LOW_STOCK", label: "Low Stock", count: counts?.lowStock },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentFilter === filter.value ? "default" : "outline"}
          onClick={() => handleFilterChange(filter.value)}
          size="sm"
        >
          {filter.label}
          {filter.count !== undefined && (
            <span
              className={cn(
                "ml-2 rounded-full px-2 py-0.5 text-xs",
                currentFilter === filter.value
                  ? "bg-primary-foreground text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {filter.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
