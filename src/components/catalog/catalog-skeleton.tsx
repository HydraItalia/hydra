import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardContent className="flex-1 p-4 space-y-3">
            {/* Product name */}
            <Skeleton className="h-5 w-3/4" />

            {/* Category badge */}
            <Skeleton className="h-5 w-20 rounded-full" />

            {/* Price */}
            <Skeleton className="h-8 w-24" />

            {/* Vendor info */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            {/* Add to Cart button */}
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
