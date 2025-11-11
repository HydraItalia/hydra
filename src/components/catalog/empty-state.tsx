"use client";

import { useRouter } from "next/navigation";
import { PackageOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  hasActiveFilters: boolean;
};

export function EmptyState({ hasActiveFilters }: EmptyStateProps) {
  const router = useRouter();

  const handleClearFilters = () => {
    router.replace("/dashboard/catalog");
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        {hasActiveFilters ? (
          <Search className="h-10 w-10 text-muted-foreground" />
        ) : (
          <PackageOpen className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {hasActiveFilters ? "No products found" : "No products available"}
      </h3>

      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {hasActiveFilters
          ? "We couldn't find any products matching your search criteria. Try adjusting your filters or search terms."
          : "There are no products in this category yet. Check back later or explore other categories."}
      </p>

      {hasActiveFilters && (
        <Button onClick={handleClearFilters} variant="outline">
          Clear all filters
        </Button>
      )}
    </div>
  );
}
