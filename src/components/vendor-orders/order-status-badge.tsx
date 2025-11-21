import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@prisma/client";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

/**
 * Get badge variant based on order status
 */
function getStatusVariant(
  status: OrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<
    OrderStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    DRAFT: "outline",
    SUBMITTED: "default",
    CONFIRMED: "secondary",
    FULFILLING: "secondary",
    DELIVERED: "secondary",
    CANCELED: "destructive",
  };
  return variants[status] || "outline";
}

/**
 * Get status display name
 */
function getStatusDisplay(status: OrderStatus): string {
  const displays: Record<OrderStatus, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    CONFIRMED: "Confirmed",
    FULFILLING: "Fulfilling",
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
