"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Plus, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  recalcCartPricesForUser,
  type PriceChangeDiff,
} from "@/data/cart-recalc";
import { PriceChangeBadge } from "@/components/cart/PriceChangeBadge";

type CartPageProps = {
  cart: Awaited<ReturnType<typeof import("@/data/cart").getCart>>;
};

export function CartPage({ cart }: CartPageProps) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [priceChanges, setPriceChanges] = useState<
    Map<string, PriceChangeDiff>
  >(new Map());
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const {
    items,
    setItems,
    update,
    remove,
    clear,
    totalCents,
    itemCount,
    isLoading,
  } = useCartStore();

  // Initialize store with server data only once
  useEffect(() => {
    const cartItems = cart.items.map((item) => ({
      id: item.id,
      vendorProductId: item.vendorProductId,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      productName: item.vendorProduct.product.name,
      vendorName: item.vendorProduct.vendor.name,
      productUnit: item.vendorProduct.product.unit,
      imageUrl: item.vendorProduct.product.imageUrl,
    }));
    setItems(cartItems);
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1 || newQty > 9999) return;
    try {
      await update(itemId, newQty);
    } catch (error) {
      toast.error("Failed to update cart");
    }
  };

  const handleInputChange = (itemId: string, value: string) => {
    setInputValues({ ...inputValues, [itemId]: value });
  };

  const handleInputBlur = async (itemId: string, currentQty: number) => {
    const value = inputValues[itemId];
    if (!value) {
      setInputValues({ ...inputValues, [itemId]: "" });
      setEditingItemId(null);
      return;
    }

    const newQty = parseInt(value, 10);
    if (isNaN(newQty) || newQty < 1 || newQty > 9999) {
      toast.error("Quantity must be between 1 and 9999");
      setInputValues({ ...inputValues, [itemId]: "" });
      setEditingItemId(null);
      return;
    }

    if (newQty !== currentQty) {
      await handleQuantityChange(itemId, newQty);
    }
    setInputValues({ ...inputValues, [itemId]: "" });
    setEditingItemId(null);
  };

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    itemId: string
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setInputValues({ ...inputValues, [itemId]: "" });
      setEditingItemId(null);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await remove(itemToDelete);
      toast.success("Item removed from cart");
      setItemToDelete(null);
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleClear = async () => {
    try {
      await clear();
      setShowClearDialog(false);
      toast.success("Cart cleared");
    } catch (error) {
      toast.error("Failed to clear cart");
    }
  };

  const handleRecalculatePrices = async () => {
    setIsRecalculating(true);
    setPriceChanges(new Map());

    try {
      const diffs = await recalcCartPricesForUser();

      // Build map of changes by itemId
      const changesMap = new Map(diffs.map((diff) => [diff.itemId, diff]));
      setPriceChanges(changesMap);

      // Count how many prices actually changed
      const changedCount = diffs.filter(
        (diff) => diff.oldPriceCents !== diff.newPriceCents
      ).length;

      if (changedCount === 0) {
        toast.success("All prices are up to date");
      } else {
        toast.success(
          `${changedCount} price${changedCount === 1 ? "" : "s"} updated`
        );
        // Refresh to get updated prices from server
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to recalculate prices");
      console.error("Price recalculation error:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleCheckout = async () => {
    // Always recalculate prices before checkout
    setIsRecalculating(true);

    try {
      const diffs = await recalcCartPricesForUser();

      // Check if any prices changed
      const hasChanges = diffs.some(
        (diff) => diff.oldPriceCents !== diff.newPriceCents
      );

      if (hasChanges) {
        // Build map of changes
        const changesMap = new Map(diffs.map((diff) => [diff.itemId, diff]));
        setPriceChanges(changesMap);
        setShowCheckoutConfirm(true);

        // Refresh to get updated prices
        router.refresh();
      } else {
        // No price changes, proceed to checkout
        proceedToCheckout();
      }
    } catch (error) {
      toast.error("Failed to verify prices");
      console.error("Pre-checkout recalculation error:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const proceedToCheckout = () => {
    // TODO: Navigate to checkout page when implemented
    toast.info("Checkout flow coming in Phase 5.3");
  };

  if (!isHydrated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
          <CardDescription>Loading your cart...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const count = itemCount();
  const total = totalCents();

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
            You haven&apos;t added any items yet
          </p>
          <Button asChild>
            <Link href="/dashboard/catalog">Browse Catalog</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clear Cart Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all items from your cart. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Dialog */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item from cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>
              Remove Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Confirmation Dialog (when prices changed) */}
      <AlertDialog
        open={showCheckoutConfirm}
        onOpenChange={setShowCheckoutConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prices have been updated</AlertDialogTitle>
            <AlertDialogDescription>
              Some prices in your cart have changed since you last viewed it.
              The cart has been updated with current prices. Do you want to
              continue to checkout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Cart</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCheckoutConfirm(false);
                proceedToCheckout();
              }}
            >
              Continue to Checkout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {count} {count === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRecalculatePrices}
            disabled={isLoading || isRecalculating}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isRecalculating ? "animate-spin" : ""
              }`}
            />
            Recalculate Prices
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowClearDialog(true)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
        </div>
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
                {items.map((item) => (
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
                      <div className="flex flex-col items-end gap-1">
                        <span>{formatCurrency(item.unitPriceCents)}</span>
                        {priceChanges.has(item.id) && (
                          <PriceChangeBadge
                            oldPriceCents={
                              priceChanges.get(item.id)!.oldPriceCents
                            }
                            newPriceCents={
                              priceChanges.get(item.id)!.newPriceCents
                            }
                          />
                        )}
                      </div>
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
                        {editingItemId === item.id ? (
                          <Input
                            type="number"
                            min="1"
                            max="9999"
                            value={inputValues[item.id] ?? ""}
                            onChange={(e) =>
                              handleInputChange(item.id, e.target.value)
                            }
                            onBlur={() => handleInputBlur(item.id, item.qty)}
                            onKeyDown={(e) => handleInputKeyDown(e, item.id)}
                            className="w-16 h-8 text-center"
                            autoFocus
                            disabled={isLoading}
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setInputValues({
                                ...inputValues,
                                [item.id]: item.qty.toString(),
                              });
                              setEditingItemId(item.id);
                            }}
                            className="w-12 h-8 text-center hover:bg-muted rounded-md transition-colors"
                            disabled={isLoading}
                          >
                            {item.qty}
                          </button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(item.id, item.qty + 1)
                          }
                          disabled={isLoading || item.qty >= 9999}
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
                        onClick={() => setItemToDelete(item.id)}
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
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={isLoading || isRecalculating}
            >
              {isRecalculating ? "Verifying prices..." : "Checkout"}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/catalog">Continue Shopping</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
