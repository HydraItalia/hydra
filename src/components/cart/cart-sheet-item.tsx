"use client";

import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/store/cart";

type CartSheetItemProps = {
  item: CartItemType;
  onQuantityChange: (itemId: string, newQty: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  isLoading: boolean;
};

export function CartSheetItem({
  item,
  onQuantityChange,
  onRemove,
  isLoading,
}: CartSheetItemProps) {
  return (
    <div className="flex gap-4">
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
        <h4 className="text-sm font-medium leading-none">{item.productName}</h4>
        <p className="text-xs text-muted-foreground">{item.vendorName}</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onQuantityChange(item.id, item.qty - 1)}
              disabled={isLoading || item.qty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm w-8 text-center">{item.qty}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onQuantityChange(item.id, item.qty + 1)}
              disabled={isLoading || item.qty >= 9999}
              aria-label="Increase quantity"
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
          onClick={() => onRemove(item.id)}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  );
}
