import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getClosedShiftSummary } from "@/actions/driver-shift";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  Gauge,
  Clock,
  MapPin,
  Banknote,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { FuelLevel } from "@prisma/client";

const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  EMPTY: "Empty",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Full",
};

function formatTime(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export default async function ShiftSummaryPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/shift/summary");
  }

  if (user.role !== "DRIVER") {
    redirect("/dashboard");
  }

  if (!user.driverId) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title="Shift Summary"
          subtitle="Error: User is not associated with a driver account"
        />
      </div>
    );
  }

  // Fetch closed shift summary
  const result = await getClosedShiftSummary();

  if (!result.success) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title="Shift Summary"
          subtitle="Summary of your completed shift"
        />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const summary = result.summary;

  // No closed shift
  if (!summary) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title="Shift Summary"
          subtitle="Summary of your completed shift"
        />
        <div className="mt-6 p-6 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            No completed shift found for today. Close your shift first to see
            the summary.
          </p>
          <Button asChild>
            <Link href="/dashboard/route">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Route
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const {
    shift,
    totalStops,
    completedStops,
    skippedStops,
    distanceKm,
    totalCashCollectedCents,
    totalBonCollectedCents,
  } = summary;

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Shift Summary"
          subtitle="Summary of your completed shift"
        />
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Success Message */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-800">Shift Completed!</p>
          <p className="text-sm text-green-700">
            Your shift has been successfully closed and recorded.
          </p>
        </div>
      </div>

      {/* Vehicle & Time Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Shift Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{shift.vehicle.licensePlate}</p>
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
                  {shift.endTime ? formatTime(shift.endTime) : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-medium">
                  {distanceKm !== null ? `${distanceKm} km` : "-"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KM & Fuel */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Odometer</CardTitle>
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
                  {shift.endKm?.toLocaleString() || "-"} km
                </span>
              </div>
              {distanceKm !== null && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-primary">
                    {distanceKm} km
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fuel Level</CardTitle>
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
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stops Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Stops Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{totalStops}</p>
              <p className="text-sm text-muted-foreground">Total Stops</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {completedStops}
              </p>
              <p className="text-sm text-green-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{skippedStops}</p>
              <p className="text-sm text-gray-500">Skipped</p>
            </div>
          </div>

          {/* Progress bar */}
          {totalStops > 0 && (
            <div className="mt-4">
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(completedStops / totalStops) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-gray-400"
                  style={{
                    width: `${(skippedStops / totalStops) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round((completedStops / totalStops) * 100)}% completion
                rate
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
                {formatCurrency(totalCashCollectedCents)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">Bon Collected</p>
              </div>
              <p className="text-xl font-bold text-blue-800">
                {formatCurrency(totalBonCollectedCents)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-purple-700">Total</p>
              </div>
              <p className="text-xl font-bold text-purple-800">
                {formatCurrency(
                  totalCashCollectedCents + totalBonCollectedCents
                )}
              </p>
            </div>
          </div>

          {/* Cash returned confirmation */}
          <div className="mt-4 p-3 bg-green-100 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              Cash and bon return confirmed by driver
            </p>
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

      {/* Action */}
      <div className="flex justify-center pt-4">
        <Button size="lg" asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
