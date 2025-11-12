"use client"

import { ShoppingCart, X, Minus, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart"
import { formatCurrency } from "@/lib/utils"

export function CartSheet() {
  const items = useCartStore((state) => state.items)
  const itemCount = useCartStore((state) => state.itemCount())
  const totalCents = useCartStore((state) => state.totalCents())
  const update = useCartStore((state) => state.update)
  const remove = useCartStore((state) => state.remove)
  const isLoading = useCartStore((state) => state.isLoading)

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    try {
      await update(itemId, newQty)
    } catch (error) {
      console.error("Failed to update cart item:", error)
    }
  }

  const handleRemove = async (itemId: string) => {
    try {
      await remove(itemId)
    } catch (error) {
      console.error("Failed to remove cart item:", error)
    }
  }

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
          <span className="sr-only">Shopping Cart ({itemCount} items)</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Your cart is empty"
              : `${itemCount} ${itemCount === 1 ? "item" : "items"} in your cart`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/catalog">Browse Catalog</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.imageUrl && (
                      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium leading-none">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.vendorName}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleQuantityChange(item.id, item.qty - 1)
                            }
                            disabled={isLoading || item.qty <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">
                            {item.qty}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleQuantityChange(item.id, item.qty + 1)
                            }
                            disabled={isLoading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.productUnit}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm font-medium">
                        {formatCurrency(item.qty * item.unitPriceCents)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemove(item.id)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </div>
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
                <Button asChild className="w-full">
                  <Link href="/dashboard/cart">View Full Cart</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/catalog">Continue Shopping</Link>
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
