import { Badge } from "@/components/ui/badge";
import { OrderStatus, SubOrderStatus } from "@prisma/client";

interface OrderStatusBadgeProps {
  status: OrderStatus | SubOrderStatus;
}

/**
 * Get badge variant based on order/suborder status
 */
function getStatusVariant(
  status: OrderStatus | SubOrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    DRAFT: "outline",
    PENDING: "outline",
    SUBMITTED: "default",
    CONFIRMED: "secondary",
    FULFILLING: "secondary",
    READY: "secondary",
    DELIVERED: "secondary",
    CANCELED: "destructive",
  };
  return variants[status] || "outline";
}

/**
 * Get status display name
 */
function getStatusDisplay(status: OrderStatus | SubOrderStatus): string {
  const displays: Record<string, string> = {
    DRAFT: "Draft",
    PENDING: "Pending",
    SUBMITTED: "Submitted",
    CONFIRMED: "Confirmed",
    FULFILLING: "Fulfilling",
    READY: "Ready",
    DELIVERED: "Delivered",
    CANCELED: "Canceled",
  };
  return displays[status] || status;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)}>{getStatusDisplay(status)}</Badge>
  );
}
