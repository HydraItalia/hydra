"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/cart"

type CartProviderProps = {
  children: React.ReactNode
  initialCart?: {
    items: Array<{
      id: string
      vendorProductId: string
      qty: number
      unitPriceCents: number
      vendorProduct?: {
        product?: {
          name: string
          unit: string
          imageUrl?: string | null
        }
        vendor?: {
          name: string
        }
      }
    }>
  }
}

export function CartProvider({ children, initialCart }: CartProviderProps) {
  const setItems = useCartStore((state) => state.setItems)

  useEffect(() => {
    if (initialCart?.items) {
      const items = initialCart.items
        .filter((item) => {
          const isValid = item?.vendorProduct?.product && item?.vendorProduct?.vendor
          if (!isValid) {
            console.warn('Filtered out invalid cart item:', {
              id: item?.id,
              vendorProductId: item?.vendorProductId,
              hasVendorProduct: !!item?.vendorProduct,
              hasProduct: !!item?.vendorProduct?.product,
              hasVendor: !!item?.vendorProduct?.vendor,
            })
          }
          return isValid
        })
        .map((item) => ({
          id: item.id,
          vendorProductId: item.vendorProductId,
          qty: item.qty,
          unitPriceCents: item.unitPriceCents,
          productName: item.vendorProduct!.product!.name,
          vendorName: item.vendorProduct!.vendor!.name,
          productUnit: item.vendorProduct!.product!.unit,
          imageUrl: item.vendorProduct!.product!.imageUrl,
        }))
      setItems(items)
    }
    // Only run on mount to avoid re-renders when parent re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
