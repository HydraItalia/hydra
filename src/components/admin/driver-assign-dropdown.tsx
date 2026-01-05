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
import { createDeliveryForSubOrder } from "@/actions/admin-deliveries";
import { toast } from "sonner";
import type { AvailableDriver } from "@/data/orders";

type DriverAssignDropdownProps = {
  subOrderId: string;
  drivers: AvailableDriver[];
  disabled?: boolean;
};

export function DriverAssignDropdown({
  subOrderId,
  drivers,
  disabled = false,
}: DriverAssignDropdownProps) {
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignDriver = async (driverId: string) => {
    setIsAssigning(true);
    try {
      const result = await createDeliveryForSubOrder(subOrderId, driverId);

      if (result.success) {
        toast.success("Driver assigned successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to assign driver");
    } finally {
      setIsAssigning(false);
    }
  };

  if (drivers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No drivers available</div>
    );
  }

  return (
    <Select
      onValueChange={handleAssignDriver}
      disabled={disabled || isAssigning}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Assign driver..." />
      </SelectTrigger>
      <SelectContent>
        {drivers.map((driver) => (
          <SelectItem key={driver.id} value={driver.id}>
            <div className="flex items-center gap-2">
              <span>{driver.name}</span>
              {driver.activeDeliveryCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {driver.activeDeliveryCount} active
                </Badge>
              )}
              {driver.status === "ONLINE" && (
                <Badge variant="outline" className="text-xs text-green-600">
                  Online
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
