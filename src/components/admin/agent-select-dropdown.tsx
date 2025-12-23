"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { assignAgentToOrder } from "@/actions/admin-orders";
import { toast } from "sonner";
import type { Agent } from "@/data/orders";

type AgentSelectDropdownProps = {
  orderId: string;
  allAgents: Agent[];
  suggestedAgentIds: string[];
  disabled?: boolean;
};

export function AgentSelectDropdown({
  orderId,
  allAgents,
  suggestedAgentIds,
  disabled = false,
}: AgentSelectDropdownProps) {
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignAgent = async (agentUserId: string) => {
    setIsAssigning(true);
    try {
      const result = await assignAgentToOrder(orderId, agentUserId);

      if (result.success) {
        toast.success("Agent assigned successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to assign agent");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Select
      onValueChange={handleAssignAgent}
      disabled={disabled || isAssigning}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Assign agent..." />
      </SelectTrigger>
      <SelectContent>
        {allAgents.map((agent) => {
          const isSuggested = suggestedAgentIds.includes(agent.id);
          return (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                <span>{agent.name || agent.email}</span>
                {isSuggested && (
                  <Badge variant="secondary" className="text-xs">
                    Suggested
                  </Badge>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
