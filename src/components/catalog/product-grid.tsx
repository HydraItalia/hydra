import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Store, ShoppingCart } from "lucide-react";
import { ProductUnit } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

type ProductResult = {
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

type ProductGridProps = {
  products: ProductResult[];
};

const unitLabels: Record<ProductUnit, string> = {
  KG: "per kg",
  L: "per liter",
  PIECE: "per piece",
  BOX: "per box",
  SERVICE: "per service",
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.productId} className="flex flex-col">
          <CardHeader className="pb-3">
            {/* Product Image Placeholder */}
            <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center mb-3">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>

            {/* Product Name */}
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {product.productName}
            </h3>

            {/* Unit */}
            <p className="text-sm text-muted-foreground">
              Sold {unitLabels[product.unit]}
            </p>
          </CardHeader>

          <CardContent className="flex-1 space-y-3">
            {/* Best Offer */}
            {product.bestOffer ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {formatCurrency(product.bestOffer.priceCents)}
                  </span>
                  <Badge
                    variant={
                      product.bestOffer.inStock ? "default" : "secondary"
                    }
                  >
                    {product.bestOffer.inStock
                      ? "In Stock"
                      : product.bestOffer.leadTimeDays
                      ? `${product.bestOffer.leadTimeDays}d lead time`
                      : "Out of Stock"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>{product.bestOffer.vendorName}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No offers available
              </div>
            )}

            {/* Offers Count */}
            {product.offersCount > 1 && (
              <p className="text-xs text-muted-foreground">
                +{product.offersCount - 1} other vendor
                {product.offersCount - 1 > 1 ? "s" : ""}
              </p>
            )}
          </CardContent>

          <CardFooter className="pt-3">
            <Button className="w-full" disabled={!product.bestOffer?.inStock}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
