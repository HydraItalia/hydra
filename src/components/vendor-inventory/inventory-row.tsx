"use client";

import { VendorInventoryItem } from "@/actions/vendor-inventory";
import {
  updateVendorInventoryItem,
  deleteVendorInventoryItem,
} from "@/actions/vendor-inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InventoryRowProps {
  item: VendorInventoryItem;
  onDeleted?: (id: string) => void;
}

export function InventoryRow({ item, onDeleted }: InventoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable fields
  const [priceEuros, setPriceEuros] = useState(
    (item.basePriceCents / 100).toFixed(2),
  );
  const [isActive, setIsActive] = useState(item.isActive);
  const [stockQty, setStockQty] = useState(item.stockQty.toString());

  // Check if item is low stock (hardcoded threshold of 10)
  const isLowStock = item.isActive && item.stockQty < 10;

  const handleSave = async () => {
    const priceCents = Math.round(parseFloat(priceEuros) * 100);
    const qty = parseInt(stockQty);

    if (isNaN(priceCents) || priceCents < 0) {
      toast.error("Invalid price value");
      return;
    }

    if (isNaN(qty) || qty < 0) {
      toast.error("Invalid stock quantity");
      return;
    }

    setIsPending(true);
    const result = await updateVendorInventoryItem({
      vendorProductId: item.id,
      basePriceCents: priceCents,
      isActive,
      stockQty: qty,
    });
    setIsPending(false);

    if (result.success) {
      toast.success("Inventory updated successfully");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Failed to update inventory");
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setPriceEuros((item.basePriceCents / 100).toFixed(2));
    setIsActive(item.isActive);
    setStockQty(item.stockQty.toString());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteVendorInventoryItem(item.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success(`${item.Product?.name} removed from inventory`);
      onDeleted?.(item.id);
    } else {
      toast.error(result.error || "Failed to remove product");
    }
  };

  return (
    <tr className="border-b hover:bg-muted/50">
      {/* Product Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.Product?.name}</span>
          {isLowStock && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
        </div>
        {item.Product?.description && (
          <p className="text-xs text-muted-foreground">
            {item.Product?.description}
          </p>
        )}
      </td>

      {/* Unit */}
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {item.Product?.unit}
      </td>

      {/* Price */}
      <td className="py-3 px-4">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span className="text-sm">€</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              className="w-24 h-8"
              disabled={isPending}
            />
          </div>
        ) : (
          <span className="font-medium">
            €{(item.basePriceCents / 100).toFixed(2)}
          </span>
        )}
      </td>

      {/* Stock Quantity */}
      <td className="py-3 px-4">
        {isEditing ? (
          <Input
            type="number"
            min="0"
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            className="w-20 h-8"
            disabled={isPending}
          />
        ) : (
          <span className={isLowStock ? "font-medium text-yellow-600" : ""}>
            {item.stockQty}
          </span>
        )}
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        {isEditing ? (
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={isPending}
          />
        ) : (
          <Badge variant={item.isActive ? "default" : "secondary"}>
            {item.isActive ? "Active" : "Inactive"}
          </Badge>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              variant="default"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Remove {item.Product?.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the product from your inventory. Existing
                    orders are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </td>
    </tr>
  );
}
