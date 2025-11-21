import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import {
  getVendorInventory,
  getVendorInventoryStats,
  InventoryFilter,
} from "@/actions/vendor-inventory";
import { FilterTabs } from "@/components/vendor-inventory/filter-tabs";
import { InventoryTable } from "@/components/vendor-inventory/inventory-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Package, PackageCheck, PackageX } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

export default async function InventoryPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const user = await currentUser();

  // Auth check - must be logged in
  if (!user) {
    redirect("/signin");
  }

  // Role check - must be a vendor
  if (user.role !== "VENDOR") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Unauthorized"
          subtitle="You must be a vendor to access this page"
        />
      </div>
    );
  }

  // Vendor check - must have a vendorId
  if (!user.vendorId) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="No Vendor Account"
          subtitle="No vendor is associated with this account"
        />
      </div>
    );
  }

  // Parse filter from search params
  const filterParam = searchParams.filter?.toUpperCase();
  const validFilters: InventoryFilter[] = [
    "ALL",
    "ACTIVE",
    "INACTIVE",
    "LOW_STOCK",
  ];
  const currentFilter: InventoryFilter = validFilters.includes(
    filterParam as InventoryFilter
  )
    ? (filterParam as InventoryFilter)
    : "ALL";

  // Fetch inventory data
  const [inventoryResult, statsResult] = await Promise.all([
    getVendorInventory(currentFilter),
    getVendorInventoryStats(),
  ]);

  if (!inventoryResult.success) {
    return (
      <div className="space-y-8">
        <PageHeader title="Error" subtitle={inventoryResult.error} />
      </div>
    );
  }

  const inventory = inventoryResult.data || [];
  const stats = statsResult.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Inventory"
        subtitle="Manage your product inventory, pricing, and stock levels"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PackageCheck className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PackageX className="h-4 w-4" />
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactiveCount}</div>
            </CardContent>
          </Card>

          <Card className={stats.lowStockCount > 0 ? "border-yellow-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 ${
                    stats.lowStockCount > 0 ? "text-yellow-600" : ""
                  }`}
                />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.lowStockCount > 0 ? "text-yellow-600" : ""
                }`}
              >
                {stats.lowStockCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Filters</CardTitle>
          <CardDescription>
            Filter your inventory by product status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilterTabs
            currentFilter={currentFilter}
            counts={
              stats
                ? {
                    all: stats.totalCount,
                    active: stats.activeCount,
                    inactive: stats.inactiveCount,
                    lowStock: stats.lowStockCount,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentFilter === "ALL" && "All Products"}
            {currentFilter === "ACTIVE" && "Active Products"}
            {currentFilter === "INACTIVE" && "Inactive Products"}
            {currentFilter === "LOW_STOCK" && "Low Stock Products"}
          </CardTitle>
          <CardDescription>
            Click the edit icon to modify pricing, stock, or status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable items={inventory} />
        </CardContent>
      </Card>
    </div>
  );
}
