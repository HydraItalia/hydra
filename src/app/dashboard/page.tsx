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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  ClipboardList,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import {
  getDashboardStats,
  getRecentSubmittedOrders,
  getRecentDeliveries,
  getActiveShifts,
} from "@/data/admin-dashboard";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { StartShiftDialog } from "@/components/driver/start-shift-dialog";
import { CurrentShiftCard } from "@/components/driver/current-shift-card";
import {
  getCurrentDriverShiftForToday,
  getTodayRouteProgressForDriver,
} from "@/actions/driver-shift";
import { RouteProgressWidget } from "@/components/driver-route";
import { fetchDriverDashboardProfile } from "@/data/driver-dashboard";
import { Badge } from "@/components/ui/badge";

type DashboardPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin");
  }

  const params = searchParams ? await searchParams : {};
  const errorMessage =
    params.error === "unauthorized"
      ? "You don't have permission to access that page."
      : null;

  // Route to role-specific dashboard
  switch (user.role) {
    case "ADMIN":
    case "AGENT":
      return <AdminAgentDashboard user={user} errorMessage={errorMessage} />;
    case "VENDOR":
      return <VendorDashboard user={user} errorMessage={errorMessage} />;
    case "CLIENT":
      return <ClientDashboard user={user} errorMessage={errorMessage} />;
    case "DRIVER":
      return <DriverDashboard user={user} errorMessage={errorMessage} />;
    default:
      return <div>Unauthorized</div>;
  }
}

// Admin/Agent Dashboard - Mission Control (Phase 9.0)
async function AdminAgentDashboard({
  user,
  errorMessage,
}: {
  user: { role: string; name?: string | null; email: string };
  errorMessage?: string | null;
}) {
  // Fetch dashboard data in parallel
  let stats, recentOrders, recentDeliveries, activeShifts;
  try {
    [stats, recentOrders, recentDeliveries, activeShifts] = await Promise.all([
      getDashboardStats(),
      getRecentSubmittedOrders(5),
      getRecentDeliveries(5, true),
      getActiveShifts(10),
    ]);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return (
      <div className="space-y-6">
        <PageHeader
          title={user.role === "ADMIN" ? "Admin Dashboard" : "Agent Dashboard"}
          subtitle="Mission control for daily operations"
        />
        <div className="text-center text-muted-foreground">
          Failed to load dashboard data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.role === "ADMIN" ? "Admin Dashboard" : "Agent Dashboard"}
        subtitle="Mission control for daily operations"
      />

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Quick Links */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Button variant="outline" asChild className="h-auto py-3">
          <Link
            href="/dashboard/orders"
            className="flex flex-col items-center gap-1"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs font-medium">Orders</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-3">
          <Link
            href="/dashboard/clients"
            className="flex flex-col items-center gap-1"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Clients</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-3">
          <Link
            href="/dashboard/vendors"
            className="flex flex-col items-center gap-1"
          >
            <Store className="h-5 w-5" />
            <span className="text-xs font-medium">Vendors</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-3">
          <Link
            href="/dashboard/deliveries"
            className="flex flex-col items-center gap-1"
          >
            <Truck className="h-5 w-5" />
            <span className="text-xs font-medium">Deliveries</span>
          </Link>
        </Button>
        {user.role === "ADMIN" && (
          <Button variant="outline" asChild className="h-auto py-3">
            <Link
              href="/dashboard/agents"
              className="flex flex-col items-center gap-1"
            >
              <UserCog className="h-5 w-5" />
              <span className="text-xs font-medium">Agents</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Real-time Stats - Action Required */}
      <div className="grid gap-4 md:grid-cols-3">
        <DataCard
          title="Unassigned Orders"
          value={stats.unassignedOrders}
          icon={ClipboardList}
          description="Orders needing agent assignment"
          href="/dashboard/orders?unassigned=true"
        />
        <DataCard
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
          icon={Truck}
          description="Orders ready for delivery"
          href="/dashboard/orders?readyForDelivery=true"
        />
        <DataCard
          title="Active Shifts"
          value={stats.activeShifts}
          icon={Clock}
          description="Drivers currently on shift"
        />
      </div>

      {/* Platform Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <DataCard
          title="Total Vendors"
          value={stats.totalVendors}
          icon={Store}
        />
        <DataCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
        />
        <DataCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
        />
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <ActivityFeed
          recentOrders={recentOrders}
          recentDeliveries={recentDeliveries}
          activeShifts={activeShifts}
        />
      </div>
    </div>
  );
}

// Vendor Dashboard
async function VendorDashboard({
  user,
  errorMessage,
}: {
  user: { vendorId?: string | null; name?: string | null; email: string };
  errorMessage?: string | null;
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
        OrderItem: {
          some: {
            VendorProduct: {
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
      Product: true,
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
        <Card className="border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
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
                  <span>{vp.Product.name}</span>
                  <span className="font-medium">
                    {vp.stockQty} {vp.Product.unit}
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
  errorMessage,
}: {
  user: { clientId?: string | null; name?: string | null; email: string };
  errorMessage?: string | null;
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
        CartItem: true,
      },
    }),
  ]);

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: { clientId: user.clientId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      OrderItem: true,
      SubOrder: {
        include: {
          OrderItem: true,
        },
      },
    },
  });

  const cartItemCount = activeCart?.CartItem.length || 0;

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
                {recentOrders.slice(0, 3).map((order) => {
                  // Calculate item count from either OrderItem or SubOrders
                  const itemCount =
                    order.SubOrder && order.SubOrder.length > 0
                      ? order.SubOrder.reduce(
                          (sum, subOrder) => sum + subOrder.OrderItem.length,
                          0
                        )
                      : order.OrderItem.length;

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{order.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {itemCount} items
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                      </Button>
                    </div>
                  );
                })}
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
  errorMessage,
}: {
  user: { driverId?: string | null; name?: string | null; email: string };
  errorMessage?: string | null;
}) {
  if (!user.driverId) {
    return <div>No driver associated with this account</div>;
  }

  // Fetch driver statistics, current shift, route progress, and profile data
  const [
    assignedCount,
    pickedUpCount,
    inTransitCount,
    deliveredTodayCount,
    totalDeliveries,
    currentShiftResult,
    routeProgressResult,
    driverProfile,
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
    getCurrentDriverShiftForToday(),
    getTodayRouteProgressForDriver(),
    fetchDriverDashboardProfile(),
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
      Order: {
        include: {
          Client: true,
        },
      },
      SubOrder: {
        include: {
          Order: {
            include: {
              Client: true,
            },
          },
        },
      },
    },
  });

  const activeDeliveries = assignedCount + pickedUpCount + inTransitCount;
  const currentShift = currentShiftResult.success
    ? currentShiftResult.shift
    : null;
  const routeProgress = routeProgressResult.success
    ? routeProgressResult.progress
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Driver Dashboard"
        subtitle={`Welcome back, ${user.name || user.email}`}
        action={
          currentShift ? (
            <Button asChild>
              <Link href="/dashboard/route">View Today&apos;s Route</Link>
            </Button>
          ) : (
            <StartShiftDialog />
          )
        }
      />

      {/* Driver Profile Status Section */}
      {driverProfile && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                Account Status
                <Badge
                  variant={
                    driverProfile.onboardingStatus === "APPROVED" ||
                    driverProfile.onboardingStatus === "ACTIVE"
                      ? "default"
                      : driverProfile.onboardingStatus === "PENDING"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {driverProfile.onboardingStatus}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {driverProfile.companyLink ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <div className="flex items-center gap-2">
                    <span>{driverProfile.companyLink.vendorName}</span>
                    <Badge
                      variant={
                        driverProfile.companyLink.status === "ACTIVE"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {driverProfile.companyLink.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No company link on file
                </p>
              )}
              {driverProfile.onboardingStatus === "PENDING" && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Awaiting Review</AlertTitle>
                  <AlertDescription>
                    Your registration is being reviewed by an administrator.
                  </AlertDescription>
                </Alert>
              )}
              {driverProfile.onboardingStatus === "SUSPENDED" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Account Suspended</AlertTitle>
                  <AlertDescription>
                    Please contact support to resolve any issues.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Credential Warnings */}
          {driverProfile.expiringLicenses.length > 0 && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Expiring Credentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {driverProfile.expiringLicenses.map((lic) => (
                    <div
                      key={lic.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{lic.licenseType.replace(/_/g, " ")}</span>
                      <Badge
                        variant={
                          lic.daysUntilExpiry <= 30 ? "destructive" : "secondary"
                        }
                      >
                        {lic.daysUntilExpiry <= 0
                          ? "EXPIRED"
                          : `${lic.daysUntilExpiry} days`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Checklist */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Documents</CardTitle>
              <CardDescription>
                Required documents for activation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {driverProfile.documents.filter((doc) => doc.required).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No required documents on file
                </p>
              ) : (
                <div className="space-y-2">
                  {driverProfile.documents
                    .filter((doc) => doc.required)
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{doc.type.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-1">
                          {doc.hasFile ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {!driverProfile.activationReadiness.hasAllRequiredDocs && (
                <p className="text-xs text-destructive mt-2">
                  Some required documents are missing
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activation Readiness CTA */}
      {driverProfile &&
        driverProfile.onboardingStatus === "APPROVED" &&
        !driverProfile.activationReadiness.isReady && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Complete Your Profile</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-1">
                {driverProfile.activationReadiness.missingRequirements.map(
                  (req, i) => (
                    <li key={i}>{req}</li>
                  )
                )}
              </ul>
              {/* TODO: Link to document upload when implemented */}
            </AlertDescription>
          </Alert>
        )}

      {/* Current Shift and Route Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Shift or Start Shift Prompt */}
        {currentShift ? (
          <CurrentShiftCard shift={currentShift} />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">No Active Shift</CardTitle>
              <CardDescription>
                Start your shift to begin managing today&apos;s deliveries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StartShiftDialog />
            </CardContent>
          </Card>
        )}

        {/* Route Progress Widget */}
        <RouteProgressWidget progress={routeProgress} />
      </div>

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
                {nextDeliveries.map((delivery) => {
                  // Handle both old (Order) and new (SubOrder) deliveries
                  const order = delivery.SubOrder
                    ? delivery.SubOrder.Order
                    : delivery.Order;
                  const orderNumber = delivery.SubOrder
                    ? delivery.SubOrder.subOrderNumber
                    : order?.orderNumber;

                  if (!order) return null;

                  return (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.Client?.name} •{" "}
                          {delivery.status.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/deliveries/${delivery.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  );
                })}
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
