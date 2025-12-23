"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateOrderStatus, cancelOrder } from "@/actions/admin-orders";
import { CheckCircle, Truck, Package, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";

type OrderDetailActionsProps = {
  orderId: string;
  currentStatus: OrderStatus;
};

export function OrderDetailActions({
  orderId,
  currentStatus,
}: OrderDetailActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsLoading(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus);

      if (result.success) {
        toast.success(`Order status changed to ${newStatus}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsLoading(true);
    try {
      const result = await cancelOrder(orderId);

      if (result.success) {
        toast.success("Order has been canceled");
        setShowCancelDialog(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to cancel order");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which actions are available based on current status
  const canConfirm = currentStatus === "SUBMITTED";
  const canStartFulfillment = currentStatus === "CONFIRMED";
  const canMarkDelivered = currentStatus === "FULFILLING";
  const canCancel =
    currentStatus !== "CANCELED" && currentStatus !== "DELIVERED";

  return (
    <div className="flex flex-wrap gap-2">
      {canConfirm && (
        <Button
          onClick={() => handleStatusUpdate("CONFIRMED")}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Confirm Order
        </Button>
      )}

      {canStartFulfillment && (
        <Button
          onClick={() => handleStatusUpdate("FULFILLING")}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Package className="h-4 w-4" />
          Start Fulfillment
        </Button>
      )}

      {canMarkDelivered && (
        <Button
          onClick={() => handleStatusUpdate("DELIVERED")}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Truck className="h-4 w-4" />
          Mark Delivered
        </Button>
      )}

      {canCancel && (
        <>
          <Button
            onClick={() => setShowCancelDialog(true)}
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </Button>

          <AlertDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will mark the order as canceled. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Keep Order
                </AlertDialogCancel>
                <Button
                  onClick={handleCancelOrder}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? "Canceling..." : "Cancel Order"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {!canConfirm &&
        !canStartFulfillment &&
        !canMarkDelivered &&
        !canCancel && (
          <p className="text-sm text-muted-foreground">
            No actions available for this order status
          </p>
        )}
    </div>
  );
}
