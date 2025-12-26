"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X } from "lucide-react";
import { unassignAgentFromClient } from "@/actions/admin-clients";

type AssignedClient = {
  clientId: string;
  clientName: string;
  region: string | null;
  recentOrderCount: number;
};

type AgentClientsSectionProps = {
  agentUserId: string;
  assignedClients: AssignedClient[];
};

export function AgentClientsSection({
  agentUserId,
  assignedClients,
}: AgentClientsSectionProps) {
  const router = useRouter();
  const [clientToRemove, setClientToRemove] = useState<AssignedClient | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const handleUnassignConfirm = async () => {
    if (!clientToRemove) return;

    setIsRemoving(true);
    try {
      const result = await unassignAgentFromClient(
        clientToRemove.clientId,
        agentUserId
      );

      if (result.success) {
        toast.success("Client unassigned successfully");
        setClientToRemove(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unassign client");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error unassigning client:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Assigned Clients</CardTitle>
          <CardDescription>
            Clients managed by this agent ({assignedClients.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedClients.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No clients assigned to this agent
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Recent Orders</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedClients.map((client) => (
                      <TableRow key={client.clientId}>
                        <TableCell>
                          <Link
                            href={`/dashboard/clients/${client.clientId}`}
                            className="font-medium hover:underline"
                          >
                            {client.clientName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {client.region ? (
                            <Badge variant="outline">{client.region}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {client.recentOrderCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setClientToRemove(client)}
                            disabled={isRemoving}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Unassign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {assignedClients.map((client) => (
                  <div
                    key={client.clientId}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/clients/${client.clientId}`}
                          className="font-medium hover:underline"
                        >
                          {client.clientName}
                        </Link>
                        <div className="flex gap-2 mt-1">
                          {client.region && (
                            <Badge variant="outline" className="text-xs">
                              {client.region}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {client.recentOrderCount} orders
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setClientToRemove(client)}
                        disabled={isRemoving}
                        className="h-8 w-8 p-0"
                        aria-label={`Unassign ${client.clientName}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!clientToRemove}
        onOpenChange={(open) => !open && !isRemoving && setClientToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign{" "}
              <strong>{clientToRemove?.clientName}</strong> from this agent? The
              agent will no longer manage this client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUnassignConfirm();
              }}
              disabled={isRemoving}
            >
              {isRemoving ? "Unassigning..." : "Unassign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
