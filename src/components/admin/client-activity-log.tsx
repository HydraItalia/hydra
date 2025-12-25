"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Circle } from "lucide-react";
import type { JsonValue } from "@prisma/client/runtime/library";

type AuditLog = {
  id: string;
  action: string;
  createdAt: Date | string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  diff: JsonValue;
  User?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    agentCode: string | null;
  } | null;
};

type ClientActivityLogProps = {
  logs: AuditLog[];
};

const actionLabels: Record<string, string> = {
  CLIENT_CREATED: "Client created",
  CLIENT_UPDATED: "Client updated",
  CLIENT_ARCHIVED: "Client archived",
  CLIENT_RESTORED: "Client restored",
  AGENT_ASSIGNED_TO_CLIENT: "Agent assigned",
  AGENT_UNASSIGNED_FROM_CLIENT: "Agent removed",
};

function formatAction(action: string): string {
  return actionLabels[action] || action.replace(/_/g, " ").toLowerCase();
}

function formatActorName(user: AuditLog["User"]): {
  name: string;
  badge?: string;
} {
  if (!user) {
    return { name: "System" };
  }

  const name = user.name || user.email;
  const badge = user.agentCode ?? undefined;

  return { name, badge };
}

export function ClientActivityLog({ logs }: ClientActivityLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Recent changes to this client ({logs.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

            {logs.map((log) => {
              const actor = formatActorName(log.User);
              return (
                <div key={log.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex h-5 w-5 items-center justify-center">
                    <Circle className="h-5 w-5 fill-primary text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {formatAction(log.action)}
                      </p>
                      {actor.badge && (
                        <Badge variant="outline" className="text-xs">
                          {actor.badge}
                        </Badge>
                      )}
                    </div>

                    {log.User && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {actor.name}
                      </p>
                    )}

                    {log.diff &&
                      typeof log.diff === "object" &&
                      log.diff !== null &&
                      !Array.isArray(log.diff) &&
                      Object.keys(log.diff).length > 0 && (
                        <div className="mt-2 text-xs">
                          <details className="group">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto">
                              {JSON.stringify(log.diff, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}

                    <time className="text-xs text-muted-foreground mt-2 block">
                      {formatDateTime(log.createdAt)}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
