"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgentListResult } from "@/data/agents";

type AgentsTableProps = {
  agents: AgentListResult[];
};

export function AgentsTable({ agents }: AgentsTableProps) {
  const router = useRouter();

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No agents found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Assigned Clients</TableHead>
              <TableHead className="text-center">Assigned Vendors</TableHead>
              <TableHead className="text-center">Active Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow
                key={agent.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  router.push(`/dashboard/agents/${agent.id}`);
                }}
              >
                <TableCell>
                  {agent.agentCode ? (
                    <Badge variant="outline">{agent.agentCode}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="font-medium hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {agent.name || "Unnamed Agent"}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {agent.email}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {agent.clientCount > 0 ? (
                    <Badge>{agent.clientCount}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {agent.vendorCount > 0 ? (
                    <Badge>{agent.vendorCount}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {agent.activeOrderCount > 0 ? (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {agent.activeOrderCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agent.submittedOrderCount} submitted,{" "}
                        {agent.confirmedOrderCount} confirmed
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 lg:hidden">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                {/* Agent Code & Name */}
                <div>
                  {agent.agentCode && (
                    <Badge variant="outline" className="mb-2">
                      {agent.agentCode}
                    </Badge>
                  )}
                  <div className="font-medium">
                    {agent.name || "Unnamed Agent"}
                  </div>
                  <div className="text-sm text-muted-foreground break-all">
                    {agent.email}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Clients</div>
                    <div className="text-sm font-medium">
                      {agent.clientCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Vendors</div>
                    <div className="text-sm font-medium">
                      {agent.vendorCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Orders</div>
                    <div className="text-sm font-medium">
                      {agent.activeOrderCount}
                    </div>
                  </div>
                </div>

                {/* Order Breakdown (if has active orders) */}
                {agent.activeOrderCount > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {agent.submittedOrderCount} submitted,{" "}
                    {agent.confirmedOrderCount} confirmed
                  </div>
                )}

                {/* Joined Date */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Joined {formatDate(agent.createdAt)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
