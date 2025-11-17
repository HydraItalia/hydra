import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { DataCard } from "@/components/shared/data-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  Package,
  ShoppingCart,
  Store,
  Users,
  TrendingUp,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/signin");
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case "ADMIN":
    case "AGENT":
      return <AdminAgentDashboard user={user} />;
    case "VENDOR":
      return <VendorDashboard user={user} />;
    case "CLIENT":
      return <ClientDashboard user={user} />;
    case "DRIVER":
      return <DriverDashboard user={user} />;
    default:
      return <div>Unauthorized</div>;
  }
}

// Admin/Agent Dashboard
async function AdminAgentDashboard({
  user,
}: {
  user: { role: string; name?: string | null; email: string };
}) {
  // Fetch statistics
  const [vendorCount, clientCount, productCount, orderCount] =
    await Promise.all([
      prisma.vendor.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.order.count(),
    ]);

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      items: true,
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={user.role === "ADMIN" ? "Admin Dashboard" : "Agent Dashboard"}
        subtitle={`Welcome back, ${user.name || user.email}`}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DataCard title="Total Vendors" value={vendorCount} icon={Store} />
        <DataCard title="Total Clients" value={clientCount} icon={Users} />
        <DataCard title="Products" value={productCount} icon={Package} />
        <DataCard title="Orders" value={orderCount} icon={ShoppingCart} />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{order.client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} items • {order.status}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Vendor Dashboard
async function VendorDashboard({
  user,
}: {
  user: { vendorId?: string | null; name?: string | null; email: string };
}) {
  if (!user.vendorId) {
    return <div>No vendor associated with this account</div>;
  }

  // Fetch vendor statistics
  const [productCount, lowStockCount, orderCount] = await Promise.all([
    prisma.vendorProduct.count({
      where: { vendorId: user.vendorId, isActive: true },
    }),
    prisma.vendorProduct.count({
      where: {
        vendorId: user.vendorId,
        isActive: true,
        stockQty: { lt: 10 },
      },
    }),
    prisma.order.count({
      where: {
        items: {
          some: {
            vendorProduct: {
              vendorId: user.vendorId,
            },
          },
        },
      },
    }),
  ]);

  // Get low stock products
  const lowStockProducts = await prisma.vendorProduct.findMany({
    where: {
      vendorId: user.vendorId,
      isActive: true,
      stockQty: { lt: 10 },
    },
    take: 5,
    include: {
      product: true,
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vendor Dashboard"
        subtitle={`Welcome back, ${user.name || user.email}`}
        action={
          <Button asChild>
            <Link href="/dashboard/inventory">Manage Inventory</Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <DataCard title="Active Products" value={productCount} icon={Package} />
        <DataCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={AlertTriangle}
        />
        <DataCard title="Total Orders" value={orderCount} icon={ShoppingCart} />
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>
              {lowStockCount} products are running low on stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((vp) => (
                <div
                  key={vp.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{vp.product.name}</span>
                  <span className="font-medium">
                    {vp.stockQty} {vp.product.unit}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/inventory">View All Inventory</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Client Dashboard
async function ClientDashboard({
  user,
}: {
  user: { clientId?: string | null; name?: string | null; email: string };
}) {
  if (!user.clientId) {
    return <div>No client associated with this account</div>;
  }

  // Fetch client statistics
  const [orderCount, agreementCount, activeCart] = await Promise.all([
    prisma.order.count({
      where: { clientId: user.clientId },
    }),
    prisma.agreement.count({
      where: { clientId: user.clientId, deletedAt: null },
    }),
    prisma.cart.findFirst({
      where: {
        clientId: user.clientId,
        status: "ACTIVE",
      },
      include: {
        items: true,
      },
    }),
  ]);

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: { clientId: user.clientId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
    },
  });

  const cartItemCount = activeCart?.items.length || 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Client Dashboard"
        subtitle={`Welcome back, ${user.name || user.email}`}
        action={
          <Button asChild>
            <Link href="/dashboard/catalog">Browse Catalog</Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <DataCard title="Total Orders" value={orderCount} icon={ShoppingCart} />
        <DataCard
          title="Active Agreements"
          value={agreementCount}
          icon={TrendingUp}
        />
        <DataCard title="Cart Items" value={cartItemCount} icon={Package} />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start your procurement workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/dashboard/catalog">Browse Products</Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/cart">
                View Cart {cartItemCount > 0 && `(${cartItemCount})`}
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/agreements">View Agreements</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest procurement activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{order.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} items
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Driver Dashboard
async function DriverDashboard({
  user,
}: {
  user: { driverId?: string | null; name?: string | null; email: string };
}) {
  if (!user.driverId) {
    return <div>No driver associated with this account</div>;
  }

  // Fetch driver statistics
  const [
    assignedCount,
    pickedUpCount,
    inTransitCount,
    deliveredTodayCount,
    totalDeliveries,
  ] = await Promise.all([
    prisma.delivery.count({
      where: { driverId: user.driverId, status: "ASSIGNED" },
    }),
    prisma.delivery.count({
      where: { driverId: user.driverId, status: "PICKED_UP" },
    }),
    prisma.delivery.count({
      where: { driverId: user.driverId, status: "IN_TRANSIT" },
    }),
    prisma.delivery.count({
      where: {
        driverId: user.driverId,
        status: "DELIVERED",
        deliveredAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
        },
      },
    }),
    prisma.delivery.count({
      where: { driverId: user.driverId },
    }),
  ]);

  // Get next deliveries (assigned or picked up)
  const nextDeliveries = await prisma.delivery.findMany({
    where: {
      driverId: user.driverId,
      status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
    },
    take: 5,
    orderBy: { assignedAt: "asc" },
    include: {
      order: {
        include: {
          client: true,
        },
      },
    },
  });

  const activeDeliveries = assignedCount + pickedUpCount + inTransitCount;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Driver Dashboard"
        subtitle={`Welcome back, ${user.name || user.email}`}
        action={
          <Button asChild>
            <Link href="/dashboard/deliveries">View All Deliveries</Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <DataCard
          title="Active Deliveries"
          value={activeDeliveries}
          icon={Truck}
        />
        <DataCard
          title="Delivered Today"
          value={deliveredTodayCount}
          icon={CheckCircle2}
        />
        <DataCard title="In Transit" value={inTransitCount} icon={Clock} />
        <DataCard
          title="Total Deliveries"
          value={totalDeliveries}
          icon={Package}
        />
      </div>

      {/* Next Deliveries */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next Deliveries</CardTitle>
            <CardDescription>
              Your upcoming deliveries in priority order
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextDeliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active deliveries
              </p>
            ) : (
              <div className="space-y-4">
                {nextDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {delivery.order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {delivery.order.client.name} •{" "}
                        {delivery.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/deliveries/${delivery.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your deliveries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/dashboard/deliveries">View All Deliveries</Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/deliveries?status=ASSIGNED">
                Pending Pickups ({assignedCount})
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/deliveries?status=IN_TRANSIT">
                In Transit ({inTransitCount})
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
