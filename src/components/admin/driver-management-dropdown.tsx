"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createDeliveryForOrder,
  unassignDriverFromOrder,
  reassignDriverToOrder,
} from "@/actions/admin-deliveries";
import { toast } from "sonner";
import { ChevronDown, Truck, UserX } from "lucide-react";
import type { AvailableDriver } from "@/data/orders";

type DriverManagementDropdownProps = {
  orderId: string;
  drivers: AvailableDriver[];
  currentDriver?: {
    id: string;
    name: string;
  } | null;
  disabled?: boolean;
};

export function DriverManagementDropdown({
  orderId,
  drivers,
  currentDriver,
  disabled = false,
}: DriverManagementDropdownProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAssignDriver = async (driverId: string) => {
    setIsProcessing(true);
    try {
      const result = await createDeliveryForOrder(orderId, driverId);

      if (result.success) {
        toast.success("Driver assigned successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to assign driver");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReassignDriver = async (newDriverId: string) => {
    if (currentDriver?.id === newDriverId) {
      toast.error("Driver is already assigned to this order");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await reassignDriverToOrder(orderId, newDriverId);

      if (result.success) {
        toast.success("Driver reassigned successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to reassign driver");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnassignDriver = async () => {
    setIsProcessing(true);
    try {
      const result = await unassignDriverFromOrder(orderId);

      if (result.success) {
        toast.success("Driver unassigned successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to unassign driver");
    } finally {
      setIsProcessing(false);
    }
  };

  if (drivers.length === 0 && !currentDriver) {
    return (
      <div className="text-sm text-muted-foreground">No drivers available</div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={currentDriver ? "outline" : "default"}
          size="sm"
          disabled={disabled || isProcessing}
          className="gap-2"
        >
          <Truck className="h-4 w-4" />
          {currentDriver ? currentDriver.name : "Assign Driver"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {currentDriver ? (
          <>
            <DropdownMenuLabel>Manage Driver</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Truck className="mr-2 h-4 w-4" />
                Reassign to...
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                {drivers
                  .filter((driver) => driver.id !== currentDriver.id)
                  .map((driver) => (
                    <DropdownMenuItem
                      key={driver.id}
                      onClick={() => handleReassignDriver(driver.id)}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{driver.name}</span>
                          {driver.status === "ONLINE" && (
                            <Badge
                              variant="outline"
                              className="text-xs text-green-600"
                            >
                              Online
                            </Badge>
                          )}
                        </div>
                        {driver.activeDeliveryCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {driver.activeDeliveryCount} active deliveries
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                {drivers.filter((d) => d.id !== currentDriver.id).length ===
                  0 && (
                  <DropdownMenuItem disabled>
                    No other drivers available
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleUnassignDriver}
              className="text-red-600 focus:text-red-600"
            >
              <UserX className="mr-2 h-4 w-4" />
              Unassign Driver
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Assign Driver</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {drivers.map((driver) => (
              <DropdownMenuItem
                key={driver.id}
                onClick={() => handleAssignDriver(driver.id)}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{driver.name}</span>
                    {driver.status === "ONLINE" && (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600"
                      >
                        Online
                      </Badge>
                    )}
                  </div>
                  {driver.activeDeliveryCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {driver.activeDeliveryCount} active deliveries
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
