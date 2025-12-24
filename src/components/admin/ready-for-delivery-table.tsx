"use client";

import Link from "next/link";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MapPin, Map } from "lucide-react";
import { DriverAssignDropdown } from "./driver-assign-dropdown";
import type { OrderReadyForDelivery, AvailableDriver } from "@/data/orders";

type ReadyForDeliveryTableProps = {
  orders: OrderReadyForDelivery[];
  drivers: AvailableDriver[];
};

function getGoogleMapsUrl(
  address: string,
  lat?: number | null,
  lng?: number | null
): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;
}

export function ReadyForDeliveryTable({
  orders,
  drivers,
}: ReadyForDeliveryTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No orders ready for delivery
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            All confirmed orders have been assigned to drivers
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Delivery Address</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Confirmed</TableHead>
              <TableHead>Assign Driver</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const address =
                order.deliveryAddress ||
                order.client.shortAddress ||
                "No address";
              const hasLocation = order.deliveryLat && order.deliveryLng;

              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.client.name}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <span className="text-sm truncate">{address}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.totalCents)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DriverAssignDropdown
                      orderId={order.id}
                      drivers={drivers}
                    />
                  </TableCell>
                  <TableCell>
                    {hasLocation && (
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={getGoogleMapsUrl(
                            address,
                            order.deliveryLat,
                            order.deliveryLng
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in Google Maps"
                        >
                          <Map className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => {
          const address =
            order.deliveryAddress || order.client.shortAddress || "No address";
          const hasLocation = order.deliveryLat && order.deliveryLng;

          return (
            <Card key={order.id}>
              <CardContent className="p-4 space-y-3">
                {/* Order Number and Date */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confirmed {formatDateTime(order.updatedAt)}
                    </p>
                  </div>
                  {hasLocation && (
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={getGoogleMapsUrl(
                          address,
                          order.deliveryLat,
                          order.deliveryLng
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Google Maps"
                      >
                        <Map className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Client Info */}
                <div>
                  <p className="text-sm font-medium">{order.client.name}</p>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {address}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {order.itemCount} items
                  </span>
                  <span className="font-medium">
                    {formatCurrency(order.totalCents)}
                  </span>
                </div>

                {/* Driver Assignment */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Assign driver
                  </p>
                  <DriverAssignDropdown orderId={order.id} drivers={drivers} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
