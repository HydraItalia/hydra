import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getShiftDetails } from "@/actions/admin-shifts";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  Gauge,
  Fuel,
  Clock,
  Banknote,
  Receipt,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { FuelLevel, DriverStopStatus } from "@prisma/client";

const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  EMPTY: "Empty",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Full",
};

const STOP_STATUS_CONFIG: Record<
  DriverStopStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "default" },
  SKIPPED: { label: "Skipped", variant: "secondary" },
};

function formatDate(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return "—";
  }
  return dateObj.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return "—";
  }
  return dateObj.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

type PageParams = Promise<{ shiftId: string }>;

export default async function ShiftDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/shifts");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const { shiftId } = await params;
  const result = await getShiftDetails(shiftId);

  if (!result.success) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Shift Details" subtitle="View shift information" />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/shifts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shifts
          </Link>
        </Button>
      </div>
    );
  }

  const shift = result.shift;

  if (!shift) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Shift Details" subtitle="View shift information" />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Shift not found.</AlertDescription>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/shifts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shifts
          </Link>
        </Button>
      </div>
    );
  }

  const isOpen = shift.endTime === null;

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PageHeader title="Shift Details" subtitle={formatDate(shift.date)} />
          <Badge variant={isOpen ? "secondary" : "default"}>
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/shifts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shifts
          </Link>
        </Button>
      </div>

      {/* Driver & Vehicle Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Shift Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">{shift.driverName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{shift.vehicleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Start Time</p>
                <p className="font-medium">{formatTime(shift.startTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">End Time</p>
                <p className="font-medium">
                  {shift.endTime ? formatTime(shift.endTime) : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Odometer & Fuel */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Odometer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Start</span>
                <span className="font-medium">
                  {shift.startKm.toLocaleString()} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">End</span>
                <span className="font-medium">
                  {shift.endKm?.toLocaleString() || "—"} km
                </span>
              </div>
              {shift.totalKm !== null && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-primary">
                    {shift.totalKm.toLocaleString()} km
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Fuel Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Start</span>
                <span className="font-medium">
                  {FUEL_LEVEL_LABELS[shift.startFuelLevel]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">End</span>
                <span className="font-medium">
                  {shift.endFuelLevel
                    ? FUEL_LEVEL_LABELS[shift.endFuelLevel]
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Collections Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">Cash Collected</p>
              </div>
              <p className="text-xl font-bold text-green-800">
                {formatCurrency(shift.totalCashCents)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">Bon Collected</p>
              </div>
              <p className="text-xl font-bold text-blue-800">
                {formatCurrency(shift.totalBonCents)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-purple-700">Total</p>
              </div>
              <p className="text-xl font-bold text-purple-800">
                {formatCurrency(shift.totalCashCents + shift.totalBonCents)}
              </p>
            </div>
          </div>

          {/* Cash return confirmation */}
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              shift.cashReturnedConfirmed ? "bg-green-100" : "bg-yellow-100"
            }`}
          >
            {shift.cashReturnedConfirmed ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Cash and bon return confirmed by driver
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Cash return not yet confirmed
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Closing Notes */}
      {shift.closingNotes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Closing Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{shift.closingNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Stops Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Stops ({shift.stops.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shift.stops.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No stops recorded for this shift.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Address
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Bon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shift.stops.map((stop) => {
                    const statusConfig = STOP_STATUS_CONFIG[stop.status];
                    return (
                      <TableRow key={stop.id}>
                        <TableCell className="font-medium">
                          {stop.sequenceNumber}
                        </TableCell>
                        <TableCell>{stop.clientName}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {stop.clientShortAddress || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {stop.cashCollectedCents !== null
                            ? formatCurrency(stop.cashCollectedCents)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {stop.bonCollectedCents !== null
                            ? formatCurrency(stop.bonCollectedCents)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
