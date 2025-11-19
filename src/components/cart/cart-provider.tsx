"use client"

import { useEffect } from "react"
import { ProductUnit } from "@prisma/client"
import { useCartStore, type CartItem } from "@/store/cart"

type CartProviderProps = {
  children: React.ReactNode
  initialCart?: {
    CartItem: Array<{
      id: string
      vendorProductId: string
      qty: number
      unitPriceCents: number
      VendorProduct?: {
        Product?: {
          name: string
          unit: string
          imageUrl?: string | null
        }
        Vendor?: {
          name: string
        }
      }
    }>
  }
}

export function CartProvider({ children, initialCart }: CartProviderProps) {
  const setItems = useCartStore((state) => state.setItems)

  useEffect(() => {
    if (initialCart?.CartItem) {
      const items = initialCart.CartItem
        .filter((item) => {
          const isValid = item?.VendorProduct?.Product && item?.VendorProduct?.Vendor
          if (!isValid) {
            console.warn('Filtered out invalid cart item:', {
              id: item?.id,
              vendorProductId: item?.vendorProductId,
              hasVendorProduct: !!item?.VendorProduct,
              hasProduct: !!item?.VendorProduct?.Product,
              hasVendor: !!item?.VendorProduct?.Vendor,
            })
          }
          return isValid
        })
        .map((item): CartItem => ({
          id: item.id,
          vendorProductId: item.vendorProductId,
          qty: item.qty,
          unitPriceCents: item.unitPriceCents,
          productName: item.VendorProduct!.Product!.name,
          vendorName: item.VendorProduct!.Vendor!.name,
          productUnit: item.VendorProduct!.Product!.unit as ProductUnit,
          imageUrl: item.VendorProduct!.Product!.imageUrl ?? null,
        }))
      setItems(items)
    }
    // Only run on mount to avoid re-renders when parent re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
