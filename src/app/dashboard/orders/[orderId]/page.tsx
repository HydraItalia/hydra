import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { fetchOrderById } from "@/data/orders";
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
import { ArrowLeft, ShoppingCart } from "lucide-react";

type PageProps = {
  params: Promise<{
    orderId: string;
  }>;
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

export default async function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { orderId } = resolvedParams;

  // 1. Check authentication
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/orders");
  }

  // Only CLIENT role can access orders
  if (user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  if (!user.clientId) {
    redirect("/dashboard");
  }

  // 2. Fetch order with authorization built into data layer
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
