"use client";

import { useState, useEffect } from "react";
import { SubOrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { updateSubOrderStatus } from "@/actions/vendor-suborders";
import { toast } from "sonner";
import { Check, Package, Truck, X } from "lucide-react";

interface StatusActionButtonsProps {
  orderId: string; // Actually subOrderId for vendors
  currentStatus: SubOrderStatus;
}

// Define valid status transitions for SubOrders
const statusTransitions: Record<SubOrderStatus, SubOrderStatus[]> = {
  PENDING: ["SUBMITTED", "CANCELED"],
  SUBMITTED: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["FULFILLING", "CANCELED"],
  FULFILLING: ["READY", "CANCELED"],
  READY: ["CANCELED"],
  CANCELED: [],
};

// Button configurations for each status transition
// Maps the TARGET status to the button label/icon (what action takes you TO that status)
const statusButtonConfig: Record<
  SubOrderStatus,
  { label: string; icon: React.ReactNode; variant?: "default" | "destructive" }
> = {
  PENDING: {
    label: "Move to Pending",
    icon: <Check className="h-4 w-4" />,
  },
  SUBMITTED: {
    label: "Submit Order",
    icon: <Check className="h-4 w-4" />,
  },
  CONFIRMED: {
    label: "Confirm Order",
    icon: <Check className="h-4 w-4" />,
  },
  FULFILLING: {
    label: "Start Fulfilling",
    icon: <Package className="h-4 w-4" />,
  },
  READY: {
    label: "Mark Ready for Pickup",
    icon: <Truck className="h-4 w-4" />,
  },
  CANCELED: {
    label: "Cancel Order",
    icon: <X className="h-4 w-4" />,
    variant: "destructive",
  },
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

  const handleStatusUpdate = async (newStatus: SubOrderStatus) => {
    setIsPending(true);
    try {
      const result = await updateSubOrderStatus(orderId, newStatus);

      if (result.success) {
        toast.success(`SubOrder status updated to ${newStatus}`);
        window.location.reload(); // Refresh to show updated status
      } else {
        toast.error(result.error || "Failed to update SubOrder status");
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
