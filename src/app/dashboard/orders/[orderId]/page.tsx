import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import {
  fetchOrderById,
  fetchAdminOrderDetail,
  fetchAvailableDrivers,
} from "@/data/orders";
import { getVendorOrderDetail } from "@/actions/vendor-orders";
import { OrderStatusBadge } from "@/components/vendor-orders/order-status-badge";
import { OrderItemsTable } from "@/components/vendor-orders/order-items-table";
import { StatusActionButtons } from "@/components/vendor-orders/status-action-buttons";
import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import { OrderTimeline } from "@/components/admin/order-timeline";
import { OrderNotesEditor } from "@/components/admin/order-notes-editor";
import { DriverManagementDropdown } from "@/components/admin/driver-management-dropdown";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, ShoppingCart, MapPin } from "lucide-react";

type PageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

/**
 * Get status badge variant based on order status (for CLIENT view)
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
 * Get status display name (for CLIENT view)
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

export default async function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { orderId } = resolvedParams;

  // 1. Check authentication
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/orders");
  }

  // Route based on role
  if (user.role === "VENDOR") {
    return <VendorOrderDetailView orderId={orderId} />;
  } else if (user.role === "CLIENT") {
    return <ClientOrderDetailView orderId={orderId} />;
  } else if (user.role === "ADMIN" || user.role === "AGENT") {
    return <AdminOrderDetailView orderId={orderId} />;
  } else {
    redirect("/dashboard");
  }
}

// CLIENT view (existing functionality)
async function ClientOrderDetailView({ orderId }: { orderId: string }) {
  const user = await currentUser();

  if (!user?.clientId) {
    redirect("/dashboard");
  }

  // Fetch order with authorization built into data layer
  let order;
  try {
    order = await fetchOrderById(orderId);
  } catch {
    // If error is "Order not found" or authorization failure, show 404
    notFound();
  }

  // Extra safety check (should be handled by data layer)
  if (!order || order.clientId !== user.clientId) {
    notFound();
  }

  // 3. Format date
  const formattedDate = formatDateTime(order.createdAt);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {/* Order Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Order Details</CardTitle>
              <CardDescription>Placed on {formattedDate}</CardDescription>
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Order Number
                </p>
                <p className="text-lg font-mono font-semibold">
                  {order.orderNumber}
                </p>
              </div>
              <Badge variant={getStatusVariant(order.status)}>
                {getStatusDisplay(order.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Items Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.OrderItem.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.vendorName}
                    </TableCell>
                    <TableCell className="text-center">{item.qty}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPriceCents)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.lineTotalCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span>{formatCurrency(order.totalCents)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                All prices are final and locked in at time of order submission
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard/catalog">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}

// VENDOR view (new functionality)
async function VendorOrderDetailView({ orderId }: { orderId: string }) {
  const user = await currentUser();

  if (!user?.vendorId) {
    redirect("/dashboard");
  }

  // Fetch order with vendor authorization
  const orderResult = await getVendorOrderDetail(orderId);

  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  const subOrder = orderResult.data;
  const formattedDate = formatDateTime(subOrder.createdAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              SubOrder {subOrder.subOrderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Order #{subOrder.Order.orderNumber} • {formattedDate}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={subOrder.status} />
      </div>

      {/* Order Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Client Name</div>
              <div className="font-medium">{subOrder.Order.clientName}</div>
            </div>
            {subOrder.Order.deliveryAddress && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Delivery Address
                </div>
                <div className="font-medium">
                  {subOrder.Order.deliveryAddress}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SubOrder Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">
                Current Status
              </div>
              <div className="mt-1">
                <OrderStatusBadge status={subOrder.status} />
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-3">
                Update Status
              </div>
              <StatusActionButtons
                orderId={subOrder.id}
                currentStatus={subOrder.status}
              />
            </div>
            {subOrder.vendorNotes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Vendor Notes
                  </div>
                  <div className="mt-1 text-sm">{subOrder.vendorNotes}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items in This SubOrder</CardTitle>
          <CardDescription>
            Products from your inventory in this vendor-specific order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderItemsTable order={subOrder} />
        </CardContent>
      </Card>
    </div>
  );
}
// ADMIN/AGENT view (new functionality for #64)
async function AdminOrderDetailView({ orderId }: { orderId: string }) {
  const user = await currentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "AGENT")) {
    redirect("/dashboard");
  }

  // Fetch full order details and available drivers in parallel
  let order;
  let drivers: Awaited<ReturnType<typeof fetchAvailableDrivers>> = [];
  try {
    const [orderResult, driversResult] = await Promise.allSettled([
      fetchAdminOrderDetail(orderId),
      fetchAvailableDrivers(),
    ]);

    if (orderResult.status === "rejected") {
      throw orderResult.reason;
    }
    order = orderResult.value;

    if (driversResult.status === "fulfilled") {
      drivers = driversResult.value;
    }
    // If driversResult is rejected, drivers remains an empty array
  } catch {
    notFound();
  }

  if (!order) {
    notFound();
  }

  const formattedDate = formatDateTime(order.createdAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {/* Order Info Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Client Name</div>
              <Link
                href={`/dashboard/clients/${order.client.id}`}
                className="font-medium hover:underline"
              >
                {order.client.name}
              </Link>
            </div>
            {order.client.region && (
              <div>
                <div className="text-sm text-muted-foreground">Region</div>
                <div className="font-medium">{order.client.region}</div>
              </div>
            )}
            {order.deliveryAddress && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Delivery Address
                </div>
                <div className="font-medium">{order.deliveryAddress}</div>
                {order.deliveryLat && order.deliveryLng && (
                  <a
                    href={`https://www.google.com/maps?q=${order.deliveryLat},${order.deliveryLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View on map →
                  </a>
                )}
              </div>
            )}
            {order.client.fullAddress && !order.deliveryAddress && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Address
                </div>
                <div className="font-medium">{order.client.fullAddress}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Current Status
              </div>
              <Badge variant={getStatusVariant(order.status)}>
                {getStatusDisplay(order.status)}
              </Badge>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-3">
                Status Actions
              </div>
              <OrderDetailActions
                orderId={order.id}
                currentStatus={order.status}
              />
            </div>
            {order.assignedAgent && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Assigned Agent
                  </div>
                  <div className="font-medium">{order.assignedAgent.name}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SubOrders */}
      {order.subOrders && order.subOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor SubOrders</CardTitle>
            <CardDescription>
              This order has been split into {order.subOrders.length}{" "}
              vendor-specific sub-orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.subOrders.map((subOrder) => (
                <Card key={subOrder.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {subOrder.subOrderNumber}
                        </CardTitle>
                        <CardDescription>{subOrder.vendorName}</CardDescription>
                      </div>
                      <Badge>{subOrder.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-medium">{subOrder.itemCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">
                        {formatCurrency(subOrder.subTotalCents)}
                      </span>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Driver Assignment
                      </div>
                      <DriverManagementDropdown
                        subOrderId={subOrder.id}
                        drivers={drivers}
                        currentDriver={
                          subOrder.delivery?.driverName
                            ? {
                                id: subOrder.delivery.id,
                                name: subOrder.delivery.driverName,
                              }
                            : null
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>{order.orderItems.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.productName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.vendorName}
                  </TableCell>
                  <TableCell className="text-center">{item.qty}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPriceCents)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.lineTotalCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          {/* Order Total */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span>{formatCurrency(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Notes (Editable) */}
      <OrderNotesEditor orderId={order.id} initialNotes={order.notes} />

      {/* Order Timeline */}
      <OrderTimeline auditLogs={order.auditLogs} />
    </div>
  );
}
