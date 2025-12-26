"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentDetail } from "@/data/agents";
import { formatDate } from "@/lib/utils";

type AgentDetailInfoProps = {
  agent: AgentDetail;
};

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export function AgentDetailInfo({ agent }: AgentDetailInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <DetailField label="Name">{agent.name || "No name set"}</DetailField>

          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <a
              href={`mailto:${agent.email}`}
              className="font-medium text-primary hover:underline"
            >
              {agent.email}
            </a>
          </div>

          {agent.agentCode && (
            <DetailField label="Agent Code">
              <Badge variant="outline">{agent.agentCode}</Badge>
            </DetailField>
          )}
        </div>

        {/* Performance Statistics */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-sm font-semibold">Performance Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Clients</div>
              <div className="text-lg font-medium">
                {agent.stats.totalClients}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Vendors</div>
              <div className="text-lg font-medium">
                {agent.stats.totalVendors}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Orders</div>
              <div className="text-lg font-medium text-blue-600">
                {agent.stats.activeOrderCount}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Submitted</div>
              <div className="text-lg font-medium text-orange-600">
                {agent.stats.submittedOrderCount}
              </div>
            </div>
          </div>
        </div>

        {/* Join Date */}
        <div className="pt-3 border-t">
          <DetailField label="Agent Since">
            {formatDate(agent.createdAt)}
          </DetailField>
        </div>
      </CardContent>
    </Card>
  );
}
