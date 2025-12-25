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
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalCents: number;
  status: string;
};

type ClientOrdersSectionProps = {
  clientId: string;
  orders: Order[];
  totalOrderCount: number;
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  CONFIRMED: "default",
  FULFILLING: "default",
  DELIVERED: "default",
  CANCELED: "outline",
};

export function ClientOrdersSection({
  clientId,
  orders,
  totalOrderCount,
}: ClientOrdersSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Last {orders.length} of {totalOrderCount} total orders
            </CardDescription>
          </div>
          {totalOrderCount > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/orders?client=${clientId}`}>
                View All Orders
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No orders found for this client
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
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.totalCents)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariants[order.status] || "secondary"}
                        >
                          {order.status}
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
                        {order.status}
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
