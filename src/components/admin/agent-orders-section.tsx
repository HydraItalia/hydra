"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalCents: number;
  status: OrderStatus;
  clientName: string;
};

type AgentOrdersSectionProps = {
  orders: Order[];
  totalOrderCount: number;
};

const statusVariants: Partial<
  Record<OrderStatus, "default" | "secondary" | "outline" | "destructive">
> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  CONFIRMED: "default",
  FULFILLING: "default",
  DELIVERED: "default",
};

const statusLabels: Partial<Record<OrderStatus, string>> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  CONFIRMED: "Confirmed",
  FULFILLING: "In Progress",
  DELIVERED: "Delivered",
};

export function AgentOrdersSection({
  orders,
  totalOrderCount,
}: AgentOrdersSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Orders</CardTitle>
        <CardDescription>
          <CardDescription>
            Orders currently assigned to this agent
            {orders.length < totalOrderCount
              ? ` (${orders.length} of ${totalOrderCount} shown)`
              : ` (${totalOrderCount})`}
          </CardDescription>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No active orders assigned to this agent
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.clientName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.totalCents)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariants[order.status] || "secondary"}
                        >
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="block p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {order.clientName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(order.totalCents)}
                      </div>
                      <Badge
                        variant={statusVariants[order.status] || "secondary"}
                        className="mt-1"
                      >
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
