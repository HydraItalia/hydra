import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { fetchOrdersForClient } from "@/data/orders";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/catalog/pagination";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchParams = {
  page?: string;
  pageSize?: string;
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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

  // 2. Parse search params
  const params = await searchParams;
  const page = Math.max(parseInt(params.page || "1", 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(params.pageSize || "20", 10) || 20, 10),
    100
  );

  // 3. Fetch orders using data layer
  const ordersResult = await fetchOrdersForClient({ page, pageSize });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order History"
        subtitle="View and track your past orders"
      />

      {ordersResult.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
            <CardDescription>
              {ordersResult.total} order{ordersResult.total !== 1 ? "s" : ""}{" "}
              total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersResult.data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-mono font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.totalCents)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusDisplay(order.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {ordersResult.total > ordersResult.pageSize && (
              <div className="mt-4">
                <Pagination
                  page={ordersResult.currentPage}
                  pageSize={ordersResult.pageSize}
                  total={ordersResult.total}
                  totalPages={ordersResult.totalPages}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              You haven&apos;t placed any orders yet. Browse our catalog and
              start ordering!
            </p>
            <Button asChild>
              <Link href="/dashboard/catalog">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Catalog
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
