"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { CartSheetItem } from "./cart-sheet-item";

export function CartSheet() {
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.itemCount());
  const totalCents = useCartStore((state) => state.totalCents());
  const update = useCartStore((state) => state.update);
  const remove = useCartStore((state) => state.remove);
  const isLoading = useCartStore((state) => state.isLoading);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1 || newQty > 9999) {
      toast.error("Quantity must be between 1 and 9999");
      return;
    }
    try {
      await update(itemId, newQty);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update cart"
      );
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await remove(itemId);
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </Badge>
          )}
          <span className="sr-only">
            Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Your cart is empty"
              : `${itemCount} ${
                  itemCount === 1 ? "item" : "items"
                } in your cart`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <SheetClose asChild>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/catalog">Browse Catalog</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartSheetItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold">{formatCurrency(totalCents)}</span>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <SheetClose asChild>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/cart">View Full Cart</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/catalog">Continue Shopping</Link>
                  </Button>
                </SheetClose>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
