"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createOrderFromCart } from "@/data/order";
import {
  validateCartForCurrentUser,
  type CartValidationIssue,
} from "@/data/cart-validation";

type CheckoutPageProps = {
  cart: Awaited<ReturnType<typeof import("@/data/cart").getCart>>;
};

export function CheckoutPage({ cart }: CheckoutPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationIssues, setValidationIssues] = useState<
    CartValidationIssue[]
  >([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // Calculate totals
  const subtotalCents = cart.CartItem.reduce((sum, item) => {
    return sum + (item.unitPriceCents ?? 0) * item.qty;
  }, 0);

  const totalCents = subtotalCents;

  // Helper function to map validation codes to user-friendly titles
  const getValidationTitle = (code: string): string => {
    const titles: Record<string, string> = {
      OUT_OF_STOCK: "Out of Stock",
      INSUFFICIENT_STOCK: "Insufficient Stock",
      UNKNOWN_PRODUCT: "Product Unavailable",
      VENDOR_MISSING: "Vendor Unavailable",
      INVALID_QUANTITY: "Invalid Quantity",
      VENDOR_INACTIVE: "Vendor Inactive",
    };
    return titles[code] || "Validation Error";
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);

    try {
      // Step 1: Validate cart before creating order
      const validation = await validateCartForCurrentUser();

      if (!validation.ok) {
        // Show validation errors in dialog
        setValidationIssues(validation.issues);
        setShowValidationDialog(true);
        setIsSubmitting(false);
        return;
      }

      // Step 2: If validation passed, create order
      const { orderId } = await createOrderFromCart();

      // Step 3: Redirect to confirmation page
      router.push(`/dashboard/orders/${orderId}/confirmation`);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Checkout error:", error);
      }

      if (error instanceof Error) {
        if (error.message === "Cart is empty") {
          toast.error(
            "Your cart is empty. Please add items before checking out."
          );
          router.push("/dashboard/cart");
        } else if (
          error.message === "Unauthorized" ||
          error.message.includes("CLIENT")
        ) {
          toast.error("You must be signed in as a client to checkout.");
          router.push("/signin?callbackUrl=/dashboard/checkout");
        } else {
          toast.error(
            "Could not complete checkout. Please refresh and try again."
          );
        }
      } else {
        toast.error(
          "Could not complete checkout. Please refresh and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Order</h1>
          <p className="text-muted-foreground">
            Please review your order before confirming
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>

      {/* Info banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-3 pt-6">
          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Prices are locked in at confirmation
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The prices shown below are the final prices based on your current
              agreements. These will be saved when you confirm your order.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              {cart.CartItem.length} {cart.CartItem.length === 1 ? "item" : "items"}{" "}
              in your order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Product</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.CartItem.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.VendorProduct.Product.imageUrl ? (
                        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={item.VendorProduct.Product.imageUrl}
                            alt={item.VendorProduct.Product.name}
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
                        <p className="font-medium">
                          {item.VendorProduct.Product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.VendorProduct.Vendor.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.VendorProduct.Product.unit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPriceCents)}
                    </TableCell>
                    <TableCell className="text-center">{item.qty}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.qty * item.unitPriceCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(subtotalCents)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(totalCents)}</span>
            </div>
            <div className="pt-4 space-y-2 text-xs text-muted-foreground">
              <p>• Prices are based on your current vendor agreements</p>
              <p>• Your cart will be cleared after order confirmation</p>
              <p>
                • You&apos;ll receive an order confirmation with your order
                number
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm Order"}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/cart">Back to Cart</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Validation Issues Dialog */}
      <Dialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cannot Complete Checkout
            </DialogTitle>
            <DialogDescription>
              Some items in your cart have issues that must be resolved before
              you can proceed with your order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {validationIssues
              .filter((issue) => issue.severity === "error")
              .map((issue, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{getValidationTitle(issue.code)}</AlertTitle>
                  <AlertDescription>
                    <p>{issue.message}</p>
                    {issue.quantityRequested && (
                      <p className="text-sm mt-1">
                        Requested: {issue.quantityRequested}
                        {issue.quantityAvailable !== undefined &&
                          issue.quantityAvailable !== null &&
                          ` • Available: ${issue.quantityAvailable}`}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}

            {validationIssues
              .filter((issue) => issue.severity === "warning")
              .map((issue, index) => (
                <Alert key={`warning-${index}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{getValidationTitle(issue.code)}</AlertTitle>
                  <AlertDescription>{issue.message}</AlertDescription>
                </Alert>
              ))}
          </div>

          <DialogFooter>
            <Button asChild>
              <Link href="/dashboard/cart">Back to Cart</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
