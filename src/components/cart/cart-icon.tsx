"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart"

export function CartIcon() {
  const itemCount = useCartStore((state) => state.itemCount())

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/dashboard/cart">
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
      </Link>
    </Button>
  )
}
