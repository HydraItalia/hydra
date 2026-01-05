import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import {
  fetchOrdersForClient,
  fetchAllOrdersForAdmin,
  fetchUnassignedOrders,
  fetchAllAgents,
  fetchSubOrdersReadyForDelivery,
  fetchAvailableDrivers,
} from "@/data/orders";
import { getVendorOrders } from "@/actions/vendor-orders";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/catalog/pagination";
import { OrderStatusBadge } from "@/components/vendor-orders/order-status-badge";
import { AdminOrdersFilters } from "@/components/admin/orders-filters";
import { AdminOrdersTable } from "@/components/admin/orders-table";
import { UnassignedOrdersTable } from "@/components/admin/unassigned-orders-table";
import { ReadyForDeliveryTable } from "@/components/admin/ready-for-delivery-table";
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
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@prisma/client";

type SearchParams = {
  page?: string;
  pageSize?: string;
  status?: string;
  search?: string;
  unassigned?: string;
  agent?: string;
  driver?: string;
  readyForDelivery?: string;
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

  // Route based on role
  if (user.role === "VENDOR") {
    return <VendorOrdersView searchParams={searchParams} />;
  } else if (user.role === "CLIENT") {
    return <ClientOrdersView searchParams={searchParams} />;
  } else if (user.role === "ADMIN" || user.role === "AGENT") {
    return <AdminOrdersView searchParams={searchParams} />;
  } else {
    redirect("/dashboard");
  }
}

// CLIENT view (existing functionality)
async function ClientOrdersView({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await currentUser();

  if (!user?.clientId) {
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

// VENDOR view (new functionality)
async function VendorOrdersView({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await currentUser();

  if (!user?.vendorId) {
    redirect("/dashboard");
  }

  // Parse search params
  const params = await searchParams;
  const statusValue = params.status?.toUpperCase();
  const validStatuses: OrderStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "CONFIRMED",
    "FULFILLING",
    "DELIVERED",
    "CANCELED",
  ];
  const statusFilter =
    statusValue && validStatuses.includes(statusValue as OrderStatus)
      ? (statusValue as OrderStatus)
      : undefined;

  // Fetch vendor orders
  const ordersResult = await getVendorOrders(statusFilter);

  if (!ordersResult.success) {
    return (
      <div className="space-y-6">
        <PageHeader title="Orders" subtitle="Error loading orders" />
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {ordersResult.error}
          </CardContent>
        </Card>
      </div>
    );
  }

  const subOrders = ordersResult.data || [];

  // SubOrders already have subTotalCents calculated
  const ordersWithTotals = subOrders.map((subOrder) => ({
    ...subOrder,
    vendorTotal: subOrder.subTotalCents,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage orders containing your products"
      />

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              asChild
              variant={!statusFilter ? "default" : "outline"}
              size="sm"
            >
              <Link href="/dashboard/orders">All Orders</Link>
            </Button>
            <Button
              asChild
              variant={statusFilter === "SUBMITTED" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/dashboard/orders?status=SUBMITTED">Submitted</Link>
            </Button>
            <Button
              asChild
              variant={statusFilter === "CONFIRMED" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/dashboard/orders?status=CONFIRMED">Confirmed</Link>
            </Button>
            <Button
              asChild
              variant={statusFilter === "FULFILLING" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/dashboard/orders?status=FULFILLING">Fulfilling</Link>
            </Button>
            <Button
              asChild
              variant={statusFilter === "DELIVERED" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/dashboard/orders?status=DELIVERED">Delivered</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {ordersWithTotals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
            <CardDescription>
              {ordersWithTotals.length} order
              {ordersWithTotals.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SubOrder #</TableHead>
                  <TableHead>Client & Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersWithTotals.map((subOrder) => (
                  <TableRow key={subOrder.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${subOrder.id}`}
                        className="font-mono font-medium hover:underline"
                      >
                        {subOrder.subOrderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {subOrder.Order.clientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Order #{subOrder.Order.orderNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(subOrder.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      {subOrder.itemCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(subOrder.vendorTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <OrderStatusBadge status={subOrder.status} />
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/orders/${subOrder.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {statusFilter
                ? `No orders with status "${statusFilter}" found.`
                : "No orders containing your products yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ADMIN/AGENT view (new functionality for #63)
async function AdminOrdersView({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await currentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "AGENT")) {
    redirect("/dashboard");
  }

  // Parse search params
  const params = await searchParams;

  // Check if we should show unassigned orders view
  if (params.unassigned === "true") {
    return <UnassignedOrdersView />;
  }

  // Check if we should show ready for delivery view
  if (params.readyForDelivery === "true") {
    return <ReadyForDeliveryView />;
  }

  const page = Math.max(parseInt(params.page || "1", 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(params.pageSize || "20", 10) || 20, 10),
    100
  );
  const status = params.status || undefined;
  const searchQuery = params.search || undefined;
  const agentParam = params.agent;
  const driverParam = params.driver;

  // Handle agent filter - "unassigned" is a special case
  const agentUserId =
    agentParam === "unassigned"
      ? null
      : agentParam && agentParam !== "all"
      ? agentParam
      : undefined;

  // Handle driver filter - "unassigned" is a special case
  const driverId =
    driverParam === "unassigned"
      ? null
      : driverParam && driverParam !== "all"
      ? driverParam
      : undefined;

  // Fetch orders, agents, and drivers in parallel
  const [ordersResult, agents, drivers] = await Promise.all([
    fetchAllOrdersForAdmin({
      status,
      searchQuery,
      agentUserId,
      driverId,
      page,
      pageSize,
    }),
    fetchAllAgents(),
    fetchAvailableDrivers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Orders"
        subtitle="Manage and track all orders across the platform"
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <AdminOrdersFilters agents={agents} drivers={drivers} />
        </CardContent>
      </Card>

      {/* Orders Table */}
      {ordersResult.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              {ordersResult.total} order{ordersResult.total !== 1 ? "s" : ""}{" "}
              total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminOrdersTable orders={ordersResult.data} drivers={drivers} />

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
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || status
                ? "No orders match your current filters. Try adjusting your search criteria."
                : "No orders have been created yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Unassigned Orders View (new functionality for #66)
async function UnassignedOrdersView() {
  const user = await currentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "AGENT")) {
    redirect("/dashboard");
  }

  // Fetch unassigned orders and all agents in parallel
  const [unassignedOrders, allAgents] = await Promise.all([
    fetchUnassignedOrders(),
    fetchAllAgents(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unassigned Orders"
        subtitle="Assign submitted orders to agents"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders Awaiting Assignment</CardTitle>
              <CardDescription>
                {unassignedOrders.length} unassigned order
                {unassignedOrders.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders">View All Orders</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UnassignedOrdersTable
            orders={unassignedOrders}
            allAgents={allAgents}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Ready for Delivery View (new functionality for #67)
async function ReadyForDeliveryView() {
  const user = await currentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "AGENT")) {
    redirect("/dashboard");
  }

  // Fetch ready for delivery SubOrders and available drivers in parallel
  const [readySubOrders, drivers] = await Promise.all([
    fetchSubOrdersReadyForDelivery(),
    fetchAvailableDrivers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ready for Delivery"
        subtitle="Assign ready sub-orders to drivers"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sub-orders Awaiting Driver Assignment</CardTitle>
              <CardDescription>
                {readySubOrders.length} sub-order
                {readySubOrders.length !== 1 ? "s" : ""} ready for delivery
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders">View All Orders</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ReadyForDeliveryTable subOrders={readySubOrders} drivers={drivers} />
        </CardContent>
      </Card>
    </div>
  );
}
