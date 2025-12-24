import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getMyDeliveries,
  getDeliveryStats,
  fetchAllDeliveriesForAdmin,
  getDeliveryStatsForAdmin,
} from "@/data/deliveries";
import { fetchAvailableDrivers } from "@/data/orders";
import { DeliveryList } from "@/components/deliveries/delivery-list";
import { DeliveryStats } from "@/components/deliveries/delivery-stats";
import { AdminDeliveriesTable } from "@/components/admin/deliveries-table";
import { AdminDeliveriesFilters } from "@/components/admin/deliveries-filters";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/catalog/pagination";
import { DataCard } from "@/components/shared/data-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeliveryStatus } from "@prisma/client";
import { Truck, PackageCheck, AlertCircle, CheckCircle2 } from "lucide-react";

type SearchParams = {
  page?: string;
  status?: string;
  driver?: string;
};

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/deliveries");
  }

  // Route based on role
  if (user.role === "ADMIN" || user.role === "AGENT") {
    return <AdminDeliveriesView searchParams={searchParams} />;
  } else if (user.role === "DRIVER") {
    return <DriverDeliveriesView searchParams={searchParams} />;
  } else {
    redirect("/dashboard");
  }
}

// DRIVER view (existing functionality)
async function DriverDeliveriesView({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await currentUser();

  if (!user || user.role !== "DRIVER") {
    redirect("/dashboard");
  }

  if (!user.driverId) {
    return (
      <div className="p-8">
        <PageHeader
          title="My Deliveries"
          subtitle="Error: User is not associated with a driver account"
        />
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);

  // Validate and cast status to DeliveryStatus enum
  const validStatuses: DeliveryStatus[] = [
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "EXCEPTION",
  ];
  const status =
    params?.status && validStatuses.includes(params.status as DeliveryStatus)
      ? (params.status as DeliveryStatus)
      : undefined;

  const [deliveries, stats] = await Promise.all([
    getMyDeliveries({ page, pageSize: 20, status }),
    getDeliveryStats(),
  ]);

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="My Deliveries"
        subtitle="Manage your assigned deliveries and update their status"
      />

      <DeliveryStats stats={stats} />

      <DeliveryList deliveries={deliveries} currentPage={page} />
    </div>
  );
}

// ADMIN/AGENT view (new functionality for #68)
async function AdminDeliveriesView({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await currentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "AGENT")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(parseInt(params?.page || "1", 10) || 1, 1);
  const pageSize = 20;

  // Validate and cast status
  const validStatuses: DeliveryStatus[] = [
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "EXCEPTION",
  ];
  const status =
    params?.status && validStatuses.includes(params.status as DeliveryStatus)
      ? (params.status as DeliveryStatus)
      : undefined;

  const driverId = params?.driver || undefined;

  // Fetch deliveries, stats, and drivers in parallel
  const [deliveriesResult, stats, drivers] = await Promise.all([
    fetchAllDeliveriesForAdmin({ status, driverId, page, pageSize }),
    getDeliveryStatsForAdmin(),
    fetchAvailableDrivers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Deliveries"
        subtitle="Manage and track all deliveries across all drivers"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <DataCard
          title="Assigned"
          value={stats.assigned}
          icon={Truck}
          description="Awaiting pickup"
        />
        <DataCard
          title="Picked Up"
          value={stats.pickedUp}
          icon={PackageCheck}
          description="Ready for transit"
        />
        <DataCard
          title="In Transit"
          value={stats.inTransit}
          icon={Truck}
          description="On the way"
        />
        <DataCard
          title="Delivered Today"
          value={stats.deliveredToday}
          icon={CheckCircle2}
          description="Completed today"
        />
        <DataCard
          title="Exceptions"
          value={stats.exception}
          icon={AlertCircle}
          description="Needs attention"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <AdminDeliveriesFilters drivers={drivers} />
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      {deliveriesResult.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deliveries</CardTitle>
            <CardDescription>
              {deliveriesResult.total} deliver
              {deliveriesResult.total !== 1 ? "ies" : "y"} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDeliveriesTable deliveries={deliveriesResult.data} />

            {/* Pagination */}
            {deliveriesResult.total > deliveriesResult.pageSize && (
              <div className="mt-4">
                <Pagination
                  page={deliveriesResult.currentPage}
                  pageSize={deliveriesResult.pageSize}
                  total={deliveriesResult.total}
                  totalPages={deliveriesResult.totalPages}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No deliveries found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {status || driverId
                ? "Try adjusting your filters"
                : "Deliveries will appear here once orders are assigned to drivers"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
