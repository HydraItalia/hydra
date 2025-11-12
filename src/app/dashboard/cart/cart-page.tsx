"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/store/cart"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

type CartPageProps = {
  cart: Awaited<ReturnType<typeof import("@/data/cart").getCart>>
}

export function CartPage({ cart }: CartPageProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const { setItems, update, remove, clear, totalCents, itemCount, isLoading } =
    useCartStore()

  // Initialize store with server data
  useEffect(() => {
    const items = cart.items.map((item) => ({
      id: item.id,
      vendorProductId: item.vendorProductId,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      productName: item.vendorProduct.product.name,
      vendorName: item.vendorProduct.vendor.name,
      productUnit: item.vendorProduct.product.unit,
      imageUrl: item.vendorProduct.product.imageUrl,
    }))
    setItems(items)
    setIsHydrated(true)
  }, [cart, setItems])

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    try {
      await update(itemId, newQty)
      toast.success("Cart updated")
    } catch (error) {
      toast.error("Failed to update cart")
    }
  }

  const handleRemove = async (itemId: string) => {
    try {
      await remove(itemId)
      toast.success("Item removed from cart")
    } catch (error) {
      toast.error("Failed to remove item")
    }
  }

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return
    try {
      await clear()
      toast.success("Cart cleared")
    } catch (error) {
      toast.error("Failed to clear cart")
    }
  }

  if (!isHydrated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
          <CardDescription>Loading your cart...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const count = itemCount()
  const total = totalCents()

  if (count === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
          <CardDescription>Your cart is empty</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-4">
            You haven't added any items yet
          </p>
          <Button asChild>
            <Link href="/dashboard/catalog">Browse Catalog</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {count} {count === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={isLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cart Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Product</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {useCartStore.getState().items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.imageUrl ? (
                        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.vendorName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.productUnit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPriceCents)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(item.id, item.qty - 1)
                          }
                          disabled={isLoading || item.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(item.id, item.qty + 1)
                          }
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.qty * item.unitPriceCents)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" size="lg" disabled>
              Checkout (Coming Soon)
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/catalog">Continue Shopping</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
