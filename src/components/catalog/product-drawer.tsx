"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductUnit } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Star, ShoppingCart, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";

type VendorOffer = {
  vendorProductId: string;
  vendorId: string;
  vendorName: string;
  priceCents: number;
  inStock: boolean;
  leadTimeDays: number | null;
};

type ProductDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    productId: string;
    productName: string;
    unit: ProductUnit;
    categorySlug: string;
    bestOffer?: VendorOffer;
    offersCount: number;
  };
  allOffers: VendorOffer[];
};

export function ProductDrawer({
  open,
  onOpenChange,
  product,
  allOffers,
}: ProductDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  // Track quantities for each vendor
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const addToCart = useCartStore((state) => state.add);

  // Sort offers: in-stock first, then by price
  const sortedOffers = [...allOffers].sort((a, b) => {
    // In-stock items first
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;
    // Then by price
    return a.priceCents - b.priceCents;
  });

  // Get quantity for a vendor (default to 1)
  const getQuantity = (vendorProductId: string) =>
    quantities[vendorProductId] || 1;

  // Set quantity for a vendor
  const setQuantity = (vendorProductId: string, qty: number) => {
    if (qty >= 1 && qty <= 9999) {
      setQuantities((prev) => ({ ...prev, [vendorProductId]: qty }));
    }
  };

  const handleAddToCart = async (vendorProductId: string) => {
    const quantity = getQuantity(vendorProductId);
    setAddingToCart(vendorProductId);
    try {
      await addToCart(vendorProductId, quantity);
      toast.success(`Added ${quantity} to cart!`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
      console.error(error);
    } finally {
      setAddingToCart(null);
    }
  };

  const content = (
    <>
      {/* Product Info */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.productName}</h2>
            <Badge variant="outline" className="mb-4">
              {product.categorySlug}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare prices from {product.offersCount}{" "}
          {product.offersCount === 1 ? "vendor" : "vendors"}
        </p>
      </div>

      {/* Vendor Pricing Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Price / {product.unit}</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOffers.map((offer) => {
              const isBestOffer =
                product.bestOffer?.vendorId === offer.vendorId;
              const quantity = getQuantity(offer.vendorProductId);

              return (
                <TableRow
                  key={offer.vendorId}
                  className={isBestOffer ? "bg-accent/50" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isBestOffer && (
                        <Star
                          className="h-4 w-4 text-yellow-500 fill-yellow-500"
                          aria-label="Best offer"
                        />
                      )}
                      {offer.vendorName}
                      {isBestOffer && (
                        <Badge variant="default" className="ml-1 text-xs">
                          Best offer
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(offer.priceCents)}
                  </TableCell>
                  <TableCell>
                    {offer.inStock ? (
                      <Badge variant="default" className="bg-green-600">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {offer.leadTimeDays !== null
                          ? `${offer.leadTimeDays}d lead time`
                          : "Out of Stock"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setQuantity(offer.vendorProductId, quantity - 1)
                        }
                        disabled={!offer.inStock || quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max="9999"
                        value={quantity}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            // Reset to 1 when input is cleared
                            setQuantity(offer.vendorProductId, 1);
                            return;
                          }
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 9999) {
                            setQuantity(offer.vendorProductId, val);
                          } else if (!isNaN(val)) {
                            // Clamp to valid range
                            const clamped = Math.min(Math.max(val, 1), 9999);
                            setQuantity(offer.vendorProductId, clamped);
                          }
                        }}
                        className="w-16 h-8 text-center"
                        disabled={!offer.inStock}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setQuantity(offer.vendorProductId, quantity + 1)
                        }
                        disabled={!offer.inStock || quantity >= 9999}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        !offer.inStock || addingToCart === offer.vendorProductId
                      }
                      onClick={() => handleAddToCart(offer.vendorProductId)}
                    >
                      {addingToCart === offer.vendorProductId ? (
                        "Adding..."
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Product Details: {product.productName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Compare vendor prices and availability for {product.productName}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Product Details: {product.productName}</DrawerTitle>
          <DrawerDescription>
            Compare vendor prices and availability for {product.productName}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">{content}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
