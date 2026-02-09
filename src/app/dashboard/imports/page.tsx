import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ImportBatchesTable } from "@/components/import/import-batches-table";
import { fetchAllImportBatches } from "@/data/import-batches";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminImportsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  await requireRole("ADMIN");

  const page = parseInt(searchParams.page || "1", 10);
  const status = searchParams.status || undefined;

  const result = await fetchAllImportBatches({ page, status });

  const buildUrl = (p: number) => {
    const u = new URLSearchParams();
    if (searchParams.status) u.set("status", searchParams.status);
    if (p > 1) u.set("page", p.toString());
    const qs = u.toString();
    return `/dashboard/imports${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Imports"
        subtitle={`${result.total} import batch${result.total !== 1 ? "es" : ""} across all vendors`}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Import Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportBatchesTable
            batches={result.data}
            linkBase="/dashboard/imports"
            showVendor
          />

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
