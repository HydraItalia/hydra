import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listShiftsPage } from "@/actions/admin-shifts";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, ChevronLeft, ChevronRight, Eye } from "lucide-react";

function formatDate(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return "—";
  }
  return dateObj.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

type SearchParams = Promise<{ page?: string }>;

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/shifts");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const result = await listShiftsPage({ page, pageSize: 20 });

  if (!result.success) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title="Driver Shifts"
          subtitle="View and reconcile driver shifts"
        />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { items, totalCount, totalPages } = result.result;

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-8">
      {/* Header */}
      <PageHeader
        title="Driver Shifts"
        subtitle={`${totalCount} total shifts`}
      />

      {/* Table */}
      {items.length === 0 ? (
        <div className="p-6 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground">No shifts found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                <TableHead className="text-right">Total km</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Bon
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    {formatDate(shift.date)}
                  </TableCell>
                  <TableCell>{shift.driverName}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {shift.vehicleLabel}
                  </TableCell>
                  <TableCell className="text-right">
                    {shift.totalKm != null ? `${shift.totalKm} km` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(shift.totalCashCents)}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {formatCurrency(shift.totalBonCents)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        shift.status === "CLOSED" ? "default" : "secondary"
                      }
                    >
                      {shift.status === "CLOSED" ? "Closed" : "Open"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/shifts/${shift.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View shift</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/dashboard/shifts?page=${page - 1}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
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
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/dashboard/shifts?page=${page + 1}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
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
    </div>
  );
}
