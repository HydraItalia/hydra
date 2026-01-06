import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { DriverManagementDropdown } from "@/components/admin/driver-management-dropdown";
import type { AdminOrdersResult, AvailableDriver } from "@/data/orders";

type OrdersTableProps = {
  orders: AdminOrdersResult["data"];
  drivers: AvailableDriver[];
};

/**
 * Get status badge variant based on order status
 */
function getStatusVariant(status: string) {
  const variants: Record<
    string,
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
function getStatusDisplay(status: string): string {
  const displays: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    CONFIRMED: "Confirmed",
    FULFILLING: "Fulfilling",
    DELIVERED: "Delivered",
    CANCELED: "Canceled",
  };
  return displays[status] || status;
}

export function AdminOrdersTable({ orders, drivers }: OrdersTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Driver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="font-mono font-medium hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{order.clientName}</div>
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell className="text-center">{order.itemCount}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.totalCents)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusVariant(order.status)}>
                    {getStatusDisplay(order.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.assignedAgentName ? (
                    <span className="text-sm">{order.assignedAgentName}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <DriverManagementDropdown
                    subOrderId={order.id}
                    drivers={drivers}
                    currentDriver={
                      order.delivery?.driverName
                        ? {
                            id: order.delivery.id,
                            name: order.delivery.driverName,
                          }
                        : null
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-medium text-sm">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(order.status)}>
                    {getStatusDisplay(order.status)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{order.clientName}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Agent:</span>
                    <span className="font-medium">
                      {order.assignedAgentName || (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Driver:</span>
                    <span className="font-medium">
                      {order.delivery?.driverName || (
                        <span className="text-muted-foreground">
                          Not Assigned
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium">{order.itemCount}</span>
                  </div>

                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">
                      {formatCurrency(order.totalCents)}
                    </span>
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
