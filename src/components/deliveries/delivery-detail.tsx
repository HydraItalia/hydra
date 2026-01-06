"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  markAsPickedUp,
  markAsInTransit,
  markAsDelivered,
  markAsException,
} from "@/data/deliveries";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

type DeliveryStatus =
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "EXCEPTION";

interface DeliveryDetailProps {
  delivery: {
    id: string;
    status: DeliveryStatus;
    notes: string | null;
    exceptionReason: string | null;
    assignedAt: Date;
    pickedUpAt: Date | null;
    inTransitAt: Date | null;
    deliveredAt: Date | null;
    exceptionAt: Date | null;
    Order?: {
      id: string;
      orderNumber: string;
      totalCents: number;
      notes: string | null;
      Client: {
        name: string;
        region: string | null;
      };
      OrderItem: Array<{
        id: string;
        qty: number;
        productName: string;
        vendorName: string;
        unitPriceCents: number;
        lineTotalCents: number;
        VendorProduct: {
          Product: {
            name: string;
            unit: string;
          };
        };
      }>;
    } | null;
    SubOrder?: {
      subOrderNumber: string;
      subTotalCents: number;
      Order: {
        id: string;
        notes: string | null;
        Client: {
          name: string;
          region: string | null;
        };
      };
      OrderItem: Array<{
        id: string;
        qty: number;
        productName: string;
        vendorName: string;
        unitPriceCents: number;
        lineTotalCents: number;
        VendorProduct: {
          Product: {
            name: string;
            unit: string;
          };
        };
      }>;
    } | null;
  };
}

const statusColors: Record<DeliveryStatus, string> = {
  ASSIGNED: "bg-blue-500",
  PICKED_UP: "bg-yellow-500",
  IN_TRANSIT: "bg-orange-500",
  DELIVERED: "bg-green-500",
  EXCEPTION: "bg-red-500",
};

export function DeliveryDetail({ delivery }: DeliveryDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Handle both Order and SubOrder deliveries
  const order = delivery.SubOrder ? delivery.SubOrder.Order : delivery.Order;
  const orderNumber = delivery.SubOrder
    ? delivery.SubOrder.subOrderNumber
    : delivery.Order?.orderNumber || "N/A";
  const orderItems = delivery.SubOrder
    ? delivery.SubOrder.OrderItem
    : delivery.Order?.OrderItem || [];
  const totalCents = delivery.SubOrder
    ? delivery.SubOrder.subTotalCents
    : delivery.Order?.totalCents || 0;
  const orderNotes = order?.notes;
  const client = order?.Client;

  const handleStatusUpdate = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: () => Promise<any>,
    successMessage: string
  ) => {
    setIsUpdating(true);
    try {
      await action();
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const canPickUp = delivery.status === "ASSIGNED";
  const canMarkInTransit = delivery.status === "PICKED_UP";
  const canDeliver = delivery.status === "IN_TRANSIT";
  const canMarkException = !["DELIVERED", "EXCEPTION"].includes(
    delivery.status
  );

  return (
    <div className="space-y-6">
      {/* Order Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>{orderNumber}</CardDescription>
            </div>
            <Badge
              className={`${statusColors[delivery.status]} text-white`}
              variant="default"
            >
              {delivery.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {client && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">{client.name}</p>
                {client.region && (
                  <p className="text-sm text-muted-foreground">
                    {client.region}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">
              {orderItems.length} item(s) •{" "}
              <span className="font-medium">
                €{(totalCents / 100).toFixed(2)}
              </span>
            </p>
          </div>

          {orderNotes && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Order Notes:</p>
              <p className="text-sm text-muted-foreground">{orderNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimelineItem
            icon={Clock}
            label="Assigned"
            timestamp={delivery.assignedAt}
            active
          />
          {delivery.pickedUpAt && (
            <TimelineItem
              icon={Package}
              label="Picked Up"
              timestamp={delivery.pickedUpAt}
              active
            />
          )}
          {delivery.inTransitAt && (
            <TimelineItem
              icon={Truck}
              label="In Transit"
              timestamp={delivery.inTransitAt}
              active
            />
          )}
          {delivery.deliveredAt && (
            <TimelineItem
              icon={CheckCircle2}
              label="Delivered"
              timestamp={delivery.deliveredAt}
              active
            />
          )}
          {delivery.exceptionAt && (
            <TimelineItem
              icon={AlertCircle}
              label="Exception"
              timestamp={delivery.exceptionAt}
              active
              alert
            />
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.vendorName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {item.qty} {item.VendorProduct.Product.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    €{(item.lineTotalCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exception Reason */}
      {delivery.exceptionReason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Exception Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">{delivery.exceptionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
          <CardDescription>
            Update the delivery status as you progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canPickUp && (
            <Button
              className="w-full"
              size="lg"
              disabled={isUpdating}
              onClick={() =>
                handleStatusUpdate(
                  () => markAsPickedUp(delivery.id),
                  "Marked as picked up"
                )
              }
            >
              <Package className="mr-2 h-4 w-4" />
              Mark as Picked Up
            </Button>
          )}

          {canMarkInTransit && (
            <Button
              className="w-full"
              size="lg"
              disabled={isUpdating}
              onClick={() =>
                handleStatusUpdate(
                  () => markAsInTransit(delivery.id),
                  "Marked as in transit"
                )
              }
            >
              <Truck className="mr-2 h-4 w-4" />
              Mark as In Transit
            </Button>
          )}

          {canDeliver && (
            <div className="space-y-2">
              <Textarea
                placeholder="Delivery notes (optional)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
              />
              <Button
                className="w-full"
                size="lg"
                disabled={isUpdating}
                onClick={() =>
                  handleStatusUpdate(
                    () =>
                      markAsDelivered(delivery.id, deliveryNotes || undefined),
                    "Marked as delivered"
                  )
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Delivered
              </Button>
            </div>
          )}

          {canMarkException && (
            <div className="space-y-2 pt-4 border-t">
              <Textarea
                placeholder="Describe the issue (required)"
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                rows={3}
                className="border-red-300"
              />
              <Button
                variant="destructive"
                className="w-full"
                size="lg"
                disabled={isUpdating || !exceptionReason.trim()}
                onClick={() =>
                  handleStatusUpdate(
                    () => markAsException(delivery.id, exceptionReason),
                    "Marked as exception"
                  )
                }
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Report Exception
              </Button>
            </div>
          )}

          {delivery.status === "DELIVERED" && (
            <div className="text-center p-4 bg-green-50 rounded-md">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-700">Delivery Completed</p>
              <p className="text-sm text-green-600">
                Delivered on{" "}
                {delivery.deliveredAt
                  ? format(new Date(delivery.deliveredAt), "PPP p")
                  : (() => {
                      console.warn(
                        `Delivery ${delivery.id} is DELIVERED but deliveredAt is missing`
                      );
                      return "Delivered date unavailable";
                    })()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  timestamp,
  active,
  alert,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  timestamp: Date;
  active?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 rounded-full p-2 ${
          alert
            ? "bg-red-100 text-red-600"
            : active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className={`font-medium ${alert ? "text-red-700" : ""}`}>{label}</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(timestamp), "PPP p")}
        </p>
      </div>
    </div>
  );
}
