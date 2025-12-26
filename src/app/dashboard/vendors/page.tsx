import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import {
  fetchAllVendorsForAdmin,
  getVendorRegions,
  getAgentsForVendorFilter,
} from "@/data/vendors";
import { VendorsTable } from "@/components/admin/vendors-table";
import { VendorsFilters } from "@/components/admin/vendors-filters";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SearchParams = {
  region?: string;
  hasProducts?: string;
  agent?: string;
  search?: string;
  page?: string;
  sortBy?: "name" | "region";
  sortOrder?: "asc" | "desc";
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await currentUser();

  // Only allow ADMIN and AGENT roles
  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/vendors");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(parseInt(params?.page || "1", 10) || 1, 1);
  const pageSize = 20;

  // Parse filters
  const region = params?.region || undefined;
  const hasProducts = params?.hasProducts
    ? params.hasProducts === "true"
    : undefined;
  const agentUserId = params?.agent || undefined;
  const searchQuery = params?.search || undefined;
  const sortBy = params?.sortBy || "name";
  const sortOrder = params?.sortOrder || "asc";

  // Helper to build URL with clean params (filters out undefined values)
  const buildPageUrl = (pageNumber: number) => {
    const cleanParams: Record<string, string> = {};
    if (region) cleanParams.region = region;
    if (hasProducts !== undefined)
      cleanParams.hasProducts = String(hasProducts);
    if (agentUserId) cleanParams.agent = agentUserId;
    if (searchQuery) cleanParams.search = searchQuery;
    if (sortBy !== "name") cleanParams.sortBy = sortBy;
    if (sortOrder !== "asc") cleanParams.sortOrder = sortOrder;
    cleanParams.page = String(pageNumber);
    return `/dashboard/vendors?${new URLSearchParams(cleanParams).toString()}`;
  };

  // Fetch data in parallel
  const [vendorsResult, regions, agents] = await Promise.all([
    fetchAllVendorsForAdmin({
      region,
      hasProducts,
      agentUserId,
      searchQuery,
      page,
      pageSize,
      sortBy,
      sortOrder,
    }),
    getVendorRegions(),
    getAgentsForVendorFilter(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        subtitle="Manage and view all supplier vendors"
      />

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <VendorsFilters regions={regions} agents={agents} />
        </CardContent>
      </Card>

      {/* Vendors Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
          <CardDescription>
            {vendorsResult.total} vendor{vendorsResult.total !== 1 ? "s" : ""}{" "}
            total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorsTable vendors={vendorsResult.data} />

          {/* Pagination */}
          {vendorsResult.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page {vendorsResult.currentPage} of {vendorsResult.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={vendorsResult.currentPage === 1}
                  asChild={vendorsResult.currentPage > 1}
                >
                  {vendorsResult.currentPage > 1 ? (
                    <a href={buildPageUrl(vendorsResult.currentPage - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </a>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    vendorsResult.currentPage === vendorsResult.totalPages
                  }
                  asChild={vendorsResult.currentPage < vendorsResult.totalPages}
                >
                  {vendorsResult.currentPage < vendorsResult.totalPages ? (
                    <a href={buildPageUrl(vendorsResult.currentPage + 1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
