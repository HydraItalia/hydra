"use client";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminDeliveryResult } from "@/data/deliveries";
import type { DeliveryStatus } from "@prisma/client";

type DeliveriesTableProps = {
  deliveries: AdminDeliveryResult[];
};

/**
 * Get status badge variant based on delivery status
 */
function getStatusVariant(status: DeliveryStatus) {
  const variants: Record<
    DeliveryStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ASSIGNED: "outline",
    PICKED_UP: "default",
    IN_TRANSIT: "secondary",
    DELIVERED: "secondary",
    EXCEPTION: "destructive",
  };
  return variants[status] || "outline";
}

/**
 * Get status display name
 */
function getStatusDisplay(status: DeliveryStatus): string {
  const displays: Record<DeliveryStatus, string> = {
    ASSIGNED: "Assigned",
    PICKED_UP: "Picked Up",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    EXCEPTION: "Exception",
  };
  return displays[status] || status;
}

export function AdminDeliveriesTable({ deliveries }: DeliveriesTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Assigned Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((delivery) => (
              <TableRow
                key={delivery.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  window.location.href = `/dashboard/deliveries/${delivery.id}`;
                }}
              >
                <TableCell>
                  <Link
                    href={`/dashboard/orders/${delivery.orderId}`}
                    className="font-mono font-medium hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {delivery.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{delivery.clientName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{delivery.driverName}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusVariant(delivery.status)}>
                    {getStatusDisplay(delivery.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(delivery.assignedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {deliveries.map((delivery) => (
          <Link
            key={delivery.id}
            href={`/dashboard/deliveries/${delivery.id}`}
          >
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-medium text-sm">
                      {delivery.orderNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(delivery.assignedAt)}
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(delivery.status)}>
                    {getStatusDisplay(delivery.status)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{delivery.clientName}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Driver:</span>
                    <span className="font-medium">{delivery.driverName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
