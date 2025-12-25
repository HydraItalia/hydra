"use client";

import Link from "next/link";
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
import type { ClientListResult } from "@/data/clients";

type ClientsTableProps = {
  clients: ClientListResult[];
};

export function ClientsTable({ clients }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No clients found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Assigned Agents</TableHead>
              <TableHead className="text-center">Active Agreements</TableHead>
              <TableHead className="text-center">Total Orders</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  window.location.href = `/dashboard/clients/${client.id}`;
                }}
              >
                <TableCell>
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="font-medium hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {client.name}
                  </Link>
                  {client.shortAddress && (
                    <div className="text-sm text-muted-foreground">
                      {client.shortAddress}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {client.region ? (
                    <Badge variant="outline">{client.region}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {client.assignedAgents.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {client.assignedAgents.map((agent) => (
                        <Badge key={agent.userId} variant="secondary">
                          {agent.agentCode || agent.name || "Unknown"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No agents
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {client.agreementCount > 0 ? (
                    <Badge>{client.agreementCount}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {client.orderCount}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(client.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {clients.map((client) => (
          <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                {/* Client Name */}
                <div>
                  <div className="font-medium">{client.name}</div>
                  {client.shortAddress && (
                    <div className="text-sm text-muted-foreground">
                      {client.shortAddress}
                    </div>
                  )}
                </div>

                {/* Region */}
                {client.region && (
                  <div>
                    <Badge variant="outline">{client.region}</Badge>
                  </div>
                )}

                {/* Assigned Agents */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Assigned Agents
                  </div>
                  {client.assignedAgents.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {client.assignedAgents.map((agent) => (
                        <Badge key={agent.userId} variant="secondary" className="text-xs">
                          {agent.agentCode || agent.name || "Unknown"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No agents assigned
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Agreements
                    </div>
                    <div className="text-sm font-medium">
                      {client.agreementCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Orders</div>
                    <div className="text-sm font-medium">
                      {client.orderCount}
                    </div>
                  </div>
                </div>

                {/* Joined Date */}
                <div className="text-xs text-muted-foreground">
                  Joined {formatDate(client.createdAt)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
