"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Truck, MapPin, Package, ChevronRight } from "lucide-react";

type DeliveryStatus =
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "EXCEPTION";

interface DeliveryListProps {
  deliveries: {
    data: Array<{
      id: string;
      status: DeliveryStatus;
      assignedAt: string | Date;
      order: {
        id: string;
        orderNumber: string;
        totalCents: number;
        client: {
          name: string;
          region: string | null;
        };
        items: Array<{
          id: string;
        }>;
      };
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentPage: number;
}

const statusColors: Record<DeliveryStatus, string> = {
  ASSIGNED: "bg-blue-500",
  PICKED_UP: "bg-yellow-500",
  IN_TRANSIT: "bg-orange-500",
  DELIVERED: "bg-green-500",
  EXCEPTION: "bg-red-500",
};

const statusLabels: Record<DeliveryStatus, string> = {
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
};

export function DeliveryList({ deliveries, currentPage }: DeliveryListProps) {
  if (deliveries.data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No deliveries found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.data.map((delivery) => (
        <Card
          key={delivery.id}
          className="hover:bg-accent/50 transition-colors"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {delivery.order.orderNumber}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {delivery.order.client.name}
                  {delivery.order.client.region && (
                    <span className="text-xs">
                      • {delivery.order.client.region}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge
                className={`${statusColors[delivery.status]} text-white`}
                variant="default"
              >
                {statusLabels[delivery.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2">
                  <Truck className="h-3 w-3" />
                  {delivery.order.items.length} item(s) • €
                  {(delivery.order.totalCents / 100).toFixed(2)}
                </p>
                <p>
                  Assigned{" "}
                  {formatDistanceToNow(new Date(delivery.assignedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/deliveries/${delivery.id}`}>
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {deliveries.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <Link href={`/dashboard/deliveries?page=${currentPage - 1}`}>
                Previous
              </Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {deliveries.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === deliveries.totalPages}
            asChild={currentPage < deliveries.totalPages}
          >
            {currentPage < deliveries.totalPages ? (
              <Link href={`/dashboard/deliveries?page=${currentPage + 1}`}>
                Next
              </Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
