import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import {
  fetchAllClientsForAdmin,
  getClientRegions,
  getAgentsForClientFilter,
} from "@/data/clients";
import { ClientsTable } from "@/components/admin/clients-table";
import { ClientsFilters } from "@/components/admin/clients-filters";
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
  hasAgreement?: string;
  agent?: string;
  search?: string;
  page?: string;
  sortBy?: "name" | "region";
  sortOrder?: "asc" | "desc";
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await currentUser();

  // Only allow ADMIN and AGENT roles
  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/clients");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(parseInt(params?.page || "1", 10) || 1, 1);
  const pageSize = 20;

  // Parse filters
  const region = params?.region || undefined;
  const hasAgreement = params?.hasAgreement
    ? params.hasAgreement === "true"
    : undefined;
  const agentUserId = params?.agent || undefined;
  const searchQuery = params?.search || undefined;
  const sortBy = params?.sortBy || "name";
  const sortOrder = params?.sortOrder || "asc";

  // Helper to build URL with clean params (filters out undefined values)
  const buildPageUrl = (pageNumber: number) => {
    const cleanParams: Record<string, string> = {};
    if (region) cleanParams.region = region;
    if (hasAgreement !== undefined)
      cleanParams.hasAgreement = String(hasAgreement);
    if (agentUserId) cleanParams.agent = agentUserId;
    if (searchQuery) cleanParams.search = searchQuery;
    if (sortBy !== "name") cleanParams.sortBy = sortBy;
    if (sortOrder !== "asc") cleanParams.sortOrder = sortOrder;
    cleanParams.page = String(pageNumber);
    return `/dashboard/clients?${new URLSearchParams(cleanParams).toString()}`;
  };

  // Fetch data in parallel
  const [clientsResult, regions, agents] = await Promise.all([
    fetchAllClientsForAdmin({
      region,
      hasAgreement,
      agentUserId,
      searchQuery,
      page,
      pageSize,
      sortBy,
      sortOrder,
    }),
    getClientRegions(),
    getAgentsForClientFilter(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Manage and view all restaurant clients"
      />

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <ClientsFilters regions={regions} agents={agents} />
        </CardContent>
      </Card>

      {/* Clients Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {clientsResult.total} client{clientsResult.total !== 1 ? "s" : ""}{" "}
            total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsTable clients={clientsResult.data} />

          {/* Pagination */}
          {clientsResult.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page {clientsResult.currentPage} of {clientsResult.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={clientsResult.currentPage === 1}
                  asChild={clientsResult.currentPage > 1}
                >
                  {clientsResult.currentPage > 1 ? (
                    <a href={buildPageUrl(clientsResult.currentPage - 1)}>
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
                    clientsResult.currentPage === clientsResult.totalPages
                  }
                  asChild={clientsResult.currentPage < clientsResult.totalPages}
                >
                  {clientsResult.currentPage < clientsResult.totalPages ? (
                    <a href={buildPageUrl(clientsResult.currentPage + 1)}>
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
