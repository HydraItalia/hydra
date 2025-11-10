"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductUnit } from "@prisma/client";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: {
    productId: string;
    productName: string;
    unit: ProductUnit;
    categorySlug: string;
    bestOffer?: {
      vendorId: string;
      vendorName: string;
      priceCents: number;
      inStock: boolean;
      leadTimeDays: number | null;
    };
    offersCount: number;
  };
  onClick?: () => void;
};

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { productName, unit, bestOffer, offersCount } = product;

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`View details for ${productName}`}
    >
      <CardContent className="p-4">
        {/* Product Image Placeholder */}
        <div className="aspect-square bg-muted rounded-md mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {productName}
        </h3>

        {/* Best Offer Info */}
        {bestOffer ? (
          <div className="space-y-2">
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatCurrency(bestOffer.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {unit}
              </span>
            </div>

            {/* Vendor Name */}
            <p className="text-sm text-muted-foreground">
              from <span className="font-medium">{bestOffer.vendorName}</span>
            </p>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {bestOffer.inStock ? (
                <Badge variant="default" className="bg-green-600">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {bestOffer.leadTimeDays !== null
                    ? `${bestOffer.leadTimeDays}d lead time`
                    : "Out of Stock"}
                </Badge>
              )}
              {offersCount > 1 && (
                <span className="text-xs text-muted-foreground">
                  +{offersCount - 1} more {offersCount - 1 === 1 ? "offer" : "offers"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No offers available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
