"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { UserPlus, X } from "lucide-react";
import {
  assignAgentToClient,
  unassignAgentFromClient,
} from "@/actions/admin-clients";
import { getAgentsForClientFilter } from "@/data/clients";

type Agent = {
  userId: string;
  name: string | null;
  agentCode: string | null;
};

type ClientAgentsSectionProps = {
  clientId: string;
  assignedAgents: Agent[];
};

export function ClientAgentsSection({
  clientId,
  assignedAgents: initialAgents,
}: ClientAgentsSectionProps) {
  const router = useRouter();
  const [allAgents, setAllAgents] = useState<
    Array<{ id: string; name: string | null; agentCode: string | null }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agentToRemove, setAgentToRemove] = useState<Agent | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch all agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agents = await getAgentsForClientFilter();
        setAllAgents(agents);
      } catch (error) {
        console.error("Error fetching agents:", error);
        toast.error("Failed to load agents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [clientId]);

  const handleAssign = async (agentId: string) => {
    setIsAssigning(true);
    try {
      const result = await assignAgentToClient(clientId, agentId);

      if (result.success) {
        toast.success("Agent assigned successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to assign agent");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error assigning agent:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignConfirm = async () => {
    if (!agentToRemove) return;

    setIsRemoving(true);
    try {
      const result = await unassignAgentFromClient(
        clientId,
        agentToRemove.userId
      );

      if (result.success) {
        toast.success("Agent removed successfully");
        setAgentToRemove(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove agent");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error removing agent:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Filter out already assigned agents
  const availableAgents = allAgents.filter(
    (agent) => !initialAgents.some((assigned) => assigned.userId === agent.id)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assigned Agents</CardTitle>
              <CardDescription>
                Agents responsible for this client
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={
                    isLoading || isAssigning || availableAgents.length === 0
                  }
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Agent
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {availableAgents.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    All agents assigned
                  </div>
                ) : (
                  availableAgents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => handleAssign(agent.id)}
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">
                          {agent.name || "Unknown"}
                        </div>
                        {agent.agentCode && (
                          <div className="text-xs text-muted-foreground">
                            {agent.agentCode}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {initialAgents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No agents assigned to this client
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {initialAgents.map((agent) => (
                <div
                  key={agent.userId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {agent.agentCode || agent.name || "Unknown"}
                    </Badge>
                    {agent.name && agent.agentCode && (
                      <span className="text-sm text-muted-foreground">
                        {agent.name}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAgentToRemove(agent)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!agentToRemove}
        onOpenChange={(open) => !open && setAgentToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {agentToRemove?.agentCode ||
                  agentToRemove?.name ||
                  "this agent"}
              </strong>{" "}
              from this client? This action can be undone by re-assigning the
              agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassignConfirm}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
