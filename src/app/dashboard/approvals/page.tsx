import { requireRole } from "@/lib/auth";
import { fetchPendingUsers } from "@/data/approvals";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ApprovalsTable } from "./approvals-table";
import { ApprovalsFilters } from "./approvals-filters";
import { UserStatus, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SearchParams = {
  status?: string;
  role?: string;
  search?: string;
  page?: string;
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("ADMIN");

  const params = await searchParams;

  const status = (params.status as UserStatus) || "PENDING";
  const role = params.role ? (params.role as Role) : undefined;
  const search = params.search || undefined;
  const page = parseInt(params.page || "1", 10);

  const result = await fetchPendingUsers({
    status: params.status === "ALL" ? undefined : status,
    role,
    search,
    page,
    pageSize: 20,
  });

  // Build pagination URLs
  const buildUrl = (p: number) => {
    const u = new URLSearchParams();
    if (params.status) u.set("status", params.status);
    if (params.role) u.set("role", params.role);
    if (params.search) u.set("search", params.search);
    if (p > 1) u.set("page", p.toString());
    const qs = u.toString();
    return `/dashboard/approvals${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Approvals"
        subtitle={`${result.total} user${result.total !== 1 ? "s" : ""} found`}
      />

      <Card>
        <CardHeader>
          <ApprovalsFilters />
        </CardHeader>
        <CardContent>
          <ApprovalsTable users={result.data} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {result.currentPage} of {result.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.currentPage <= 1}
                  asChild={result.currentPage > 1}
                >
                  {result.currentPage > 1 ? (
                    <Link href={buildUrl(result.currentPage - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.currentPage >= result.totalPages}
                  asChild={result.currentPage < result.totalPages}
                >
                  {result.currentPage < result.totalPages ? (
                    <Link href={buildUrl(result.currentPage + 1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
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
