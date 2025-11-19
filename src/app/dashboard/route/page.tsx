import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentDriverShiftWithStops } from "@/actions/driver-shift";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShiftSummaryCard, ShiftStopList } from "@/components/driver-route";
import { AlertCircle, ArrowLeft } from "lucide-react";

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

  // Fetch the current shift with stops
  const result = await getCurrentDriverShiftWithStops();

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

  const shift = result.shift;

  // No active shift - show message with link to start one
  if (!shift) {
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

  // Calculate progress
  const completedStops = shift.stops.filter(
    (stop) => stop.status === "COMPLETED"
  ).length;
  const totalStops = shift.stops.length;

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

      {/* Stops List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Stops ({completedStops} of {totalStops} completed)
        </h2>
        <ShiftStopList stops={shift.stops} />
      </div>
    </div>
  );
}
