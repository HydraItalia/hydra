import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, ShoppingCart, Package } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import { VatBreakdown } from "@/components/checkout/vat-breakdown";

type PageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { orderId } = resolvedParams;

  // 1. Check authentication
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/orders");
  }

  // 2. Load order with items and SubOrders (for VAT breakdown)
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      OrderItem: {
        include: {
          VendorProduct: {
            include: {
              Product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
              Vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      SubOrder: {
        select: {
          id: true,
          vendorId: true,
          netTotalCents: true,
          vatTotalCents: true,
          grossTotalCents: true,
          Vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              OrderItem: true,
            },
          },
        },
      },
    },
  });

  // 3. Verify order exists and user is authorized
  if (!order) {
    notFound();
  }

  // Only the owner can view this order confirmation
  if (order.submitterUserId !== user.id) {
    notFound();
  }

  // Format date
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.createdAt);

  // Get status color
  const statusColor =
    {
      DRAFT: "bg-gray-500",
      SUBMITTED: "bg-blue-500",
      CONFIRMED: "bg-green-500",
      FULFILLING: "bg-yellow-500",
      DELIVERED: "bg-purple-500",
      CANCELED: "bg-red-500",
    }[order.status] || "bg-gray-500";

  // Compute VAT breakdown from SubOrders
  // Only show VAT breakdown if ALL SubOrders have complete VAT data
  const hasVatData =
    order.SubOrder.length > 0 &&
    order.SubOrder.every(
      (so) =>
        so.netTotalCents !== null &&
        so.vatTotalCents !== null &&
        so.grossTotalCents !== null
    );

  const vatVendors = hasVatData
    ? order.SubOrder.filter(
        (so) =>
          so.netTotalCents !== null &&
          so.vatTotalCents !== null &&
          so.grossTotalCents !== null
      ).map((so) => ({
        vendorId: so.vendorId,
        vendorName: so.Vendor.name,
        itemCount: so._count.OrderItem,
        netTotalCents: so.netTotalCents!,
        vatTotalCents: so.vatTotalCents!,
        grossTotalCents: so.grossTotalCents!,
      }))
    : [];

  const vatTotals = hasVatData
    ? {
        netTotalCents: vatVendors.reduce((sum, v) => sum + v.netTotalCents, 0),
        vatTotalCents: vatVendors.reduce((sum, v) => sum + v.vatTotalCents, 0),
        grossTotalCents: vatVendors.reduce(
          (sum, v) => sum + v.grossTotalCents,
          0
        ),
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-1 flex-1">
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
              Order Confirmed!
            </h2>
            <p className="text-green-700 dark:text-green-300">
              Your order has been placed successfully. We&apos;ve saved your
              order details and you can track its progress from your orders
              page.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Order Details</CardTitle>
              <CardDescription>Order placed on {formattedDate}</CardDescription>
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
              <Badge className={statusColor}>{order.status}</Badge>
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
                  <TableHead className="w-[80px]">Product</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.OrderItem.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.VendorProduct.Product.imageUrl ? (
                        <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={item.VendorProduct.Product.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">
                          {item.productName || item.VendorProduct.Product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.vendorName || item.VendorProduct.Vendor.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPriceCents)}
                    </TableCell>
                    <TableCell className="text-center">{item.qty}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.lineTotalCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Order Summary with VAT Breakdown */}
          {hasVatData && vatTotals ? (
            <div className="flex justify-end">
              <div className="w-full max-w-md">
                <VatBreakdown
                  vendors={vatVendors}
                  totals={vatTotals}
                  isFinalized
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Order Total</span>
                  <span>{formatCurrency(order.totalCents)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  Prices locked in at time of order confirmation
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard/catalog">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Back to Catalog
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard/orders">
            <Package className="mr-2 h-5 w-5" />
            View All Orders
          </Link>
        </Button>
      </div>

      {/* Next Steps Info */}
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-medium">Order Processing</p>
              <p className="text-sm text-muted-foreground">
                Your order will be reviewed and confirmed by our team
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-medium">Fulfillment</p>
              <p className="text-sm text-muted-foreground">
                Vendors will prepare your items for delivery
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-medium">Delivery</p>
              <p className="text-sm text-muted-foreground">
                Your order will be delivered according to vendor schedules
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
