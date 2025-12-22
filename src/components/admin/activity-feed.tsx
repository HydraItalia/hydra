/**
 * Activity Feed Component for Admin/Agent Dashboard (Phase 9.0)
 *
 * Displays recent activity including new orders, completed deliveries, and active shifts.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistance } from "date-fns";
import {
  ShoppingCart,
  CheckCircle2,
  Truck,
  Clock,
  Package,
  ArrowRight,
} from "lucide-react";
import type {
  RecentOrder,
  RecentDelivery,
  ActiveShift,
} from "@/data/admin-dashboard";

type ActivityFeedProps = {
  recentOrders: RecentOrder[];
  recentDeliveries: RecentDelivery[];
  activeShifts: ActiveShift[];
};

export function ActivityFeed({
  recentOrders,
  recentDeliveries,
  activeShifts,
}: ActivityFeedProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* New Orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              New Orders
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders?status=SUBMITTED">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
          <CardDescription className="text-xs">
            Recent submitted orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new orders</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {order.orderNumber}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.client.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>{order.itemCount} items</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistance(new Date(order.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Deliveries */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Deliveries Today
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/deliveries?status=DELIVERED">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
          <CardDescription className="text-xs">
            Completed deliveries today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentDeliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No deliveries completed today
            </p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/deliveries/${delivery.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {delivery.order.orderNumber}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {delivery.order.client.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="h-3 w-3" />
                      <span className="truncate">{delivery.driver.name}</span>
                      {delivery.deliveredAt && (
                        <>
                          <span>•</span>
                          <span>
                            {formatDistance(
                              new Date(delivery.deliveredAt),
                              new Date(),
                              { addSuffix: true }
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Shifts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Active Drivers
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/shifts">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
          <CardDescription className="text-xs">
            Drivers currently on shift
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeShifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active shifts</p>
          ) : (
            <div className="space-y-3">
              {activeShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {shift.driver.name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {shift.vehicle.licensePlate}
                      {shift.vehicle.description &&
                        ` • ${shift.vehicle.description}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>
                        {shift.completedStops}/{shift.stopCount} stops
                      </span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistance(
                          new Date(shift.startTime),
                          new Date(),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
