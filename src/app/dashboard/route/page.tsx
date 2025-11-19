import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getTodayRouteProgressForDriver,
  getClosedShiftSummary,
} from "@/actions/driver-shift";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShiftSummaryCard,
  ShiftStopList,
  NextStopCard,
} from "@/components/driver-route";
import { AlertCircle, ArrowLeft, PartyPopper, LogOut } from "lucide-react";

export default async function RoutePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/route");
  }

  if (user.role !== "DRIVER") {
    redirect("/dashboard");
  }

  if (!user.driverId) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title="My Route"
          subtitle="Error: User is not associated with a driver account"
        />
      </div>
    );
  }

  // Check if shift is already closed
  const closedResult = await getClosedShiftSummary();
  if (closedResult.success && closedResult.summary) {
    // Redirect to summary page if shift is already closed
    redirect("/dashboard/shift/summary");
  }

  // Fetch route progress
  const result = await getTodayRouteProgressForDriver();

  if (!result.success) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="My Route" subtitle="Today's delivery stops" />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const progress = result.progress;

  // No active shift - show message with link to start one
  if (!progress) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="My Route" subtitle="Today's delivery stops" />
        <div className="mt-6 p-6 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            You don&apos;t have an active shift. Start a shift from the
            dashboard first.
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { shift, totalStops, completedStops, currentStop } = progress;

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="My Route" subtitle="Today's delivery stops" />
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Shift Summary Card */}
      <ShiftSummaryCard
        vehicle={shift.vehicle}
        startKm={shift.startKm}
        startFuelLevel={shift.startFuelLevel}
        startTime={shift.startTime}
        completedStops={completedStops}
        totalStops={totalStops}
      />

      {/* Next Stop Card or Completion Message */}
      {currentStop ? (
        <NextStopCard
          stop={currentStop}
          sequenceNumber={currentStop.sequenceNumber}
          totalStops={totalStops}
        />
      ) : totalStops > 0 ? (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <PartyPopper className="h-8 w-8 mx-auto text-green-600 mb-2" />
          <p className="text-green-700 font-medium text-lg">
            All stops completed for today!
          </p>
          <p className="text-green-600 text-sm mt-1 mb-4">
            You can now close your shift and view the summary.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/shift/close">
                <LogOut className="h-4 w-4 mr-2" />
                Close Shift
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Stops List */}
      {totalStops > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            All Stops ({completedStops} of {totalStops} completed)
          </h2>
          <ShiftStopList stops={shift.stops} currentStopId={currentStop?.id} />
        </div>
      )}
    </div>
  );
}
