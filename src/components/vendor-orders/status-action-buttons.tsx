"use client";

import { useState, useEffect } from "react";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { updateVendorOrderStatus } from "@/actions/vendor-orders";
import { toast } from "sonner";
import { Check, Package, Truck, X } from "lucide-react";

interface StatusActionButtonsProps {
  orderId: string;
  currentStatus: OrderStatus;
}

// Define valid status transitions
// Note: Vendors can only confirm orders. FULFILLING requires admin/agent to assign delivery.
const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELED"],
  SUBMITTED: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["CANCELED"], // Removed FULFILLING - requires delivery assignment
  FULFILLING: ["DELIVERED", "CANCELED"],
  DELIVERED: [],
  CANCELED: [],
};

// Button configurations for each status transition
const statusButtonConfig: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; variant?: "default" | "destructive" }
> = {
  SUBMITTED: {
    label: "Mark as Submitted",
    icon: <Check className="h-4 w-4" />,
  },
  CONFIRMED: { label: "Confirm Order", icon: <Check className="h-4 w-4" /> },
  FULFILLING: {
    label: "Start Fulfilling",
    icon: <Package className="h-4 w-4" />,
  },
  DELIVERED: {
    label: "Mark as Delivered",
    icon: <Truck className="h-4 w-4" />,
  },
  CANCELED: {
    label: "Cancel Order",
    icon: <X className="h-4 w-4" />,
    variant: "destructive",
  },
  DRAFT: { label: "Save as Draft", icon: <Check className="h-4 w-4" /> },
};

export function StatusActionButtons({
  orderId,
  currentStatus,
}: StatusActionButtonsProps) {
  const [isPending, setIsPending] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  const availableTransitions = statusTransitions[currentStatus] || [];

  // If no valid transitions, show nothing
  if (availableTransitions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No actions available for this status
      </div>
    );
  }

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsPending(true);
    try {
      const result = await updateVendorOrderStatus(orderId, newStatus);

      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error(result.error || "Failed to update order status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Status update error:", error);
    } finally {
      if (isMounted) {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {availableTransitions.map((status) => {
        const config = statusButtonConfig[status];
        return (
          <Button
            key={status}
            onClick={() => handleStatusUpdate(status)}
            disabled={isPending}
            variant={config.variant || "default"}
            size="sm"
          >
            {config.icon}
            <span className="ml-2">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
