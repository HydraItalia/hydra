import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle } from "lucide-react";
import type { AdminOrderDetail } from "@/data/orders";

type OrderTimelineProps = {
  auditLogs: AdminOrderDetail["auditLogs"];
};

/**
 * Format audit action for display
 */
function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    ORDER_CREATED: "Order created",
    ORDER_STATUS_UPDATED: "Status changed",
    ORDER_CANCELLED: "Order canceled",
    ORDER_NOTES_UPDATED: "Notes updated",
    ORDER_CONFIRMED: "Order confirmed",
    ORDER_FULFILLED: "Order fulfilled",
    ORDER_DELIVERED: "Order delivered",
  };
  return actionMap[action] || action;
}

/**
 * Format diff for display
 */
function formatDiff(diff: any): string | null {
  if (!diff) return null;

  if (diff.from && diff.to) {
    return `${diff.from} → ${diff.to}`;
  }

  if (diff.reason) {
    return `Reason: ${diff.reason}`;
  }

  return null;
}

export function OrderTimeline({ auditLogs }: OrderTimelineProps) {
  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No history available for this order
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

          {/* Timeline items */}
          {auditLogs.map((log, index) => {
            const isLast = index === auditLogs.length - 1;
            const diffText = formatDiff(log.diff);

            return (
              <div key={log.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                  <Circle
                    className={`h-3 w-3 ${
                      isLast
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                  />
                </div>

                {/* Timeline content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {formatAction(log.action)}
                      </p>
                      {diffText && (
                        <p className="text-sm text-muted-foreground">
                          {diffText}
                        </p>
                      )}
                      {log.actorName && (
                        <p className="text-xs text-muted-foreground">
                          by {log.actorName}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground shrink-0">
                      {formatDateTime(log.createdAt)}
                    </time>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
