import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { ImportBatchesTable } from "@/components/import/import-batches-table";
import { getImportBatches } from "@/actions/vendor-import";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function VendorImportPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const user = await currentUser();

  if (!user) redirect("/signin");
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

  const pageParam = parseInt(searchParams.page ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const result = await getImportBatches(page);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <PageHeader title="Error" subtitle={result.error} />
      </div>
    );
  }

  const { data: batches, total, currentPage, totalPages } = result.data;

  const buildUrl = (p: number) => {
    const u = new URLSearchParams();
    if (p > 1) u.set("page", p.toString());
    const qs = u.toString();
    return `/dashboard/vendor/import${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CSV Import"
        subtitle={`${total} import${total !== 1 ? "s" : ""}`}
        action={
          <Button asChild>
            <Link href="/dashboard/vendor/import/new">
              <Plus className="mr-2 h-4 w-4" />
              New Import
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportBatchesTable
            batches={batches}
            linkBase="/dashboard/vendor/import"
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  asChild={currentPage > 1}
                >
                  {currentPage > 1 ? (
                    <Link href={buildUrl(currentPage - 1)}>
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
                  disabled={currentPage >= totalPages}
                  asChild={currentPage < totalPages}
                >
                  {currentPage < totalPages ? (
                    <Link href={buildUrl(currentPage + 1)}>
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
