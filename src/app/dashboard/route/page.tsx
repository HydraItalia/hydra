import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOptimizedDriverRoute } from "@/lib/route-calculator";
import { PageHeader } from "@/components/shared/page-header";
import { RouteSummary } from "@/components/route/route-summary";
import { RouteStopList } from "@/components/route/route-stop-list";
import { RouteMapPlaceholder } from "@/components/route/route-map-placeholder";
import { RecalculateRouteButton } from "@/components/route/recalculate-route-button";

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
      <div className="p-8">
        <PageHeader
          title="My Route"
          subtitle="Error: User is not associated with a driver account"
        />
      </div>
    );
  }

  // Fetch the optimized route for this driver
  let route;
  let error = null;

  try {
    route = await getOptimizedDriverRoute(user.driverId);
  } catch (err) {
    console.error("Error fetching route:", err);
    error = err instanceof Error ? err.message : "Failed to load route";
  }

  if (error) {
    return (
      <div className="p-8">
        <PageHeader title="My Route" subtitle="Optimized delivery route" />
        <div className="mt-6 p-6 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-medium">Error loading route</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-8">
        <PageHeader title="My Route" subtitle="Optimized delivery route" />
        <div className="mt-6 p-6 bg-muted rounded-lg">
          <p className="text-muted-foreground">Unable to load route</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="My Route"
          subtitle="Optimized delivery route for today"
        />
        <RecalculateRouteButton />
      </div>

      {/* Route Summary Stats */}
      <RouteSummary
        totalStops={route.stops.length}
        totalDistanceKm={route.totalDistanceKm}
        totalDurationMinutes={route.totalDurationMinutes}
      />

      {/* Two-column layout: Stop list and Map */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Stop list */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Delivery Stops</h2>
          <RouteStopList stops={route.stops} />
        </div>

        {/* Right column: Map placeholder */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <RouteMapPlaceholder stops={route.stops} polyline={route.polyline} />
        </div>
      </div>
    </div>
  );
}
