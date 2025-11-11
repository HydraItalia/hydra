"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGridWithDrawer } from "./product-grid-with-drawer";
import { CatalogProduct } from "@/data/catalog";

type InfiniteGridProps = {
  initialData: CatalogProduct[];
  initialCursor: string | null;
  pageSize?: number;
};

export function InfiniteGrid({
  initialData,
  initialCursor,
  pageSize = 24,
}: InfiniteGridProps) {
  const [items, setItems] = useState<CatalogProduct[]>(initialData);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!sentinel.current || !cursor) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loading) return;

        setLoading(true);

        try {
          const url = new URL("/api/catalog", window.location.origin);

          // Copy current search params
          const group = searchParams.get("group");
          const category = searchParams.get("category");
          const q = searchParams.get("q");
          const inStock = searchParams.get("inStock");

          if (group) url.searchParams.set("group", group);
          if (category) url.searchParams.set("category", category);
          if (q) url.searchParams.set("q", q);
          if (inStock) url.searchParams.set("inStock", inStock);

          url.searchParams.set("cursor", cursor);
          url.searchParams.set("pageSize", String(pageSize));

          const res = await fetch(url);
          const json = await res.json();

          setItems((prev) => [...prev, ...json.data]);
          setCursor(json.nextCursor);
        } catch (error) {
          console.error("Failed to load more items:", error);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [cursor, loading, pageSize, searchParams]);

  // Note: This component doesn't include pricing/offers logic
  // It's a simplified example. For full functionality, you'd need to
  // transform CatalogProduct into ProductResult on the client side
  // or create a dedicated API endpoint that returns enriched data.

  return (
    <>
      <div className="text-sm text-muted-foreground mb-4">
        Showing {items.length} products
      </div>

      {/* Simplified grid - in production, you'd need to enrich with offers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {item.category.name}
            </p>
            <p className="text-sm">{item.vendorProducts.length} offers</p>
          </div>
        ))}
      </div>

      <div
        ref={sentinel}
        className="py-8 text-center text-sm text-muted-foreground"
      >
        {cursor
          ? loading
            ? "Loading more..."
            : "Scroll to load more"
          : "• End of results •"}
      </div>
    </>
  );
}
