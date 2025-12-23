"use client";

import Link from "next/link";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AgentSelectDropdown } from "./agent-select-dropdown";
import type { UnassignedOrder, Agent } from "@/data/orders";

type UnassignedOrdersTableProps = {
  orders: UnassignedOrder[];
  allAgents: Agent[];
};

export function UnassignedOrdersTable({
  orders,
  allAgents,
}: UnassignedOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No unassigned orders
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            All submitted orders have been assigned to agents
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
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Assign Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const suggestedAgentIds = order.client.suggestedAgents.map(
                (a) => a.id
              );
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.client.name}</TableCell>
                  <TableCell>
                    {order.client.region ? (
                      <Badge variant="outline">{order.client.region}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.totalCents)}
                  </TableCell>
                  <TableCell>
                    <AgentSelectDropdown
                      orderId={order.id}
                      allAgents={allAgents}
                      suggestedAgentIds={suggestedAgentIds}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => {
          const suggestedAgentIds = order.client.suggestedAgents.map(
            (a) => a.id
          );
          return (
            <Card key={order.id}>
              <CardContent className="p-4 space-y-3">
                {/* Order Number and Date */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <p className="text-sm font-medium">{order.client.name}</p>
                  {order.client.region && (
                    <Badge variant="outline" className="mt-1">
                      {order.client.region}
                    </Badge>
                  )}
                </div>

                {/* Order Details */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {order.itemCount} items
                  </span>
                  <span className="font-medium">
                    {formatCurrency(order.totalCents)}
                  </span>
                </div>

                {/* Agent Assignment */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Assign agent
                  </p>
                  <AgentSelectDropdown
                    orderId={order.id}
                    allAgents={allAgents}
                    suggestedAgentIds={suggestedAgentIds}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
