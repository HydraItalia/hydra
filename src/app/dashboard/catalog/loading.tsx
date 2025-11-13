import { PageHeader } from "@/components/shared/page-header";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";

export default function CatalogLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Product Catalog" subtitle="Loading products..." />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Skeleton */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="space-y-4">
            <div className="h-10 bg-muted animate-pulse rounded-md" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Filters Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
            <div className="w-full sm:w-32 h-10 bg-muted animate-pulse rounded-md" />
          </div>

          {/* Product Grid Skeleton */}
          <CatalogSkeleton />
        </div>
      </div>
    </div>
  );
}
