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
import type { ClientListResult } from "@/data/clients";

type ClientsTableProps = {
  clients: ClientListResult[];
};

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter();

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
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead className="text-center">Visits</TableHead>
              <TableHead>Assigned Agents</TableHead>
              <TableHead className="text-center">Agreements</TableHead>
              <TableHead className="text-center">Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  router.push(`/dashboard/clients/${client.id}`);
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
                  {(client.deliveryAddress || client.shortAddress) && (
                    <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {client.deliveryAddress || client.shortAddress}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1 min-w-[150px]">
                    {client.contactPerson && (
                      <div className="text-sm font-medium">
                        {client.contactPerson}
                      </div>
                    )}
                    {client.phone && (
                      <div className="text-sm text-muted-foreground">
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {client.email}
                      </div>
                    )}
                    {!client.contactPerson && !client.phone && !client.email && (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {client.region ? (
                    <Badge variant="outline">{client.region}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {client.lastVisitAt
                    ? formatDate(client.lastVisitAt)
                    : "—"}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {client.totalVisits > 0 ? (
                    client.totalVisits
                  ) : (
                    <span className="text-muted-foreground">0</span>
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
                  {client.orderCount > 0 ? (
                    client.orderCount
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
        {clients.map((client) => (
          <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                {/* Client Name */}
                <div>
                  <div className="font-medium">{client.name}</div>
                  {(client.deliveryAddress || client.shortAddress) && (
                    <div className="text-sm text-muted-foreground">
                      {client.deliveryAddress || client.shortAddress}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {(client.contactPerson || client.phone || client.email) && (
                  <div className="space-y-1 py-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      Contact Information
                    </div>
                    {client.contactPerson && (
                      <div className="text-sm font-medium">
                        {client.contactPerson}
                      </div>
                    )}
                    {client.phone && (
                      <div className="text-sm text-muted-foreground">
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="text-sm text-muted-foreground break-all">
                        {client.email}
                      </div>
                    )}
                  </div>
                )}

                {/* Region */}
                {client.region && (
                  <div>
                    <Badge variant="outline">{client.region}</Badge>
                  </div>
                )}

                {/* Last Visit & Total Visits */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Last Visit
                    </div>
                    <div className="text-sm font-medium">
                      {client.lastVisitAt
                        ? formatDate(client.lastVisitAt)
                        : "Never"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Visits
                    </div>
                    <div className="text-sm font-medium">
                      {client.totalVisits}
                    </div>
                  </div>
                </div>

                {/* Assigned Agents */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Assigned Agents
                  </div>
                  {client.assignedAgents.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {client.assignedAgents.map((agent) => (
                        <Badge
                          key={agent.userId}
                          variant="secondary"
                          className="text-xs"
                        >
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
                <div className="text-xs text-muted-foreground pt-2 border-t">
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
