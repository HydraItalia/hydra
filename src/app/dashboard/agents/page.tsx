import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { fetchAllAgentsForAdmin } from "@/data/agents";
import { AgentsTable } from "@/components/admin/agents-table";
import { AgentsFilters } from "@/components/admin/agents-filters";
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
  search?: string;
  page?: string;
  sortBy?: "name" | "clients" | "vendors" | "workload";
  sortOrder?: "asc" | "desc";
};

export default async function AgentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await currentUser();

  // CRITICAL: Admin-only access (NOT agent!)
  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/agents");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard"); // Agents cannot access this page
  }

  const params = await searchParams;
  const page = Math.max(parseInt(params?.page || "1", 10) || 1, 1);
  const pageSize = 20;

  // Parse filters
  const searchQuery = params?.search || undefined;
  const sortBy = params?.sortBy || "name";
  const sortOrder = params?.sortOrder || "asc";

  // Helper to build URL with clean params (filters out undefined values)
  const buildPageUrl = (pageNumber: number) => {
    const cleanParams: Record<string, string> = {};
    if (searchQuery) cleanParams.search = searchQuery;
    if (sortBy !== "name") cleanParams.sortBy = sortBy;
    if (sortOrder !== "asc") cleanParams.sortOrder = sortOrder;
    cleanParams.page = String(pageNumber);
    return `/dashboard/agents?${new URLSearchParams(cleanParams).toString()}`;
  };

  // Fetch data
  const agentsResult = await fetchAllAgentsForAdmin({
    searchQuery,
    page,
    pageSize,
    sortBy,
    sortOrder,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        subtitle="View agent workloads and assignments"
      />

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <AgentsFilters />
        </CardContent>
      </Card>

      {/* Agents Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>
            {agentsResult.total} agent{agentsResult.total !== 1 ? "s" : ""}{" "}
            total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentsTable agents={agentsResult.data} />

          {/* Pagination */}
          {agentsResult.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page {agentsResult.currentPage} of {agentsResult.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={agentsResult.currentPage === 1}
                  asChild={agentsResult.currentPage > 1}
                >
                  {agentsResult.currentPage > 1 ? (
                    <a href={buildPageUrl(agentsResult.currentPage - 1)}>
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
                    agentsResult.currentPage === agentsResult.totalPages
                  }
                  asChild={agentsResult.currentPage < agentsResult.totalPages}
                >
                  {agentsResult.currentPage < agentsResult.totalPages ? (
                    <a href={buildPageUrl(agentsResult.currentPage + 1)}>
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
