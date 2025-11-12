"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { ProductDrawer } from "./product-drawer";
import { ProductUnit } from "@prisma/client";

type VendorOffer = {
  vendorProductId: string;
  vendorId: string;
  vendorName: string;
  priceCents: number;
  inStock: boolean;
  leadTimeDays: number | null;
};

type ProductResult = {
  productId: string;
  productName: string;
  unit: ProductUnit;
  categorySlug: string;
  bestOffer?: VendorOffer;
  offersCount: number;
};

type ProductWithOffers = ProductResult & {
  allOffers: VendorOffer[];
};

type ProductGridWithDrawerProps = {
  products: ProductResult[];
  productOffersMap: Record<string, VendorOffer[]>;
};

export function ProductGridWithDrawer({
  products,
  productOffersMap,
}: ProductGridWithDrawerProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithOffers | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleProductClick = (product: ProductResult) => {
    const productWithOffers: ProductWithOffers = {
      ...product,
      allOffers: productOffersMap[product.productId] || [],
    };
    setSelectedProduct(productWithOffers);
    setDrawerOpen(true);
  };

  return (
    <>
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            onClick={() => handleProductClick(product)}
          />
        ))}
      </div>

      {/* Product Drawer */}
      {selectedProduct && (
        <ProductDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          product={selectedProduct}
          allOffers={selectedProduct.allOffers}
        />
      )}
    </>
  );
}
