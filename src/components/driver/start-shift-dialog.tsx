"use client";

/**
 * Phase 7.2 - Start Shift Dialog
 *
 * A dialog wizard for drivers to start their shift by selecting a vehicle
 * and entering starting information (km, fuel level).
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PlayCircle } from "lucide-react";
import {
  getAvailableVehiclesForDriver,
  startDriverShift,
  StartShiftInput,
} from "@/actions/driver-shift";
import { FuelLevel } from "@prisma/client";

type Vehicle = {
  id: string;
  licensePlate: string;
  description: string;
};

const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  EMPTY: "Empty",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Full",
};

interface StartShiftDialogProps {
  onShiftStarted?: () => void;
}

export function StartShiftDialog({ onShiftStarted }: StartShiftDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  // Form state
  const [vehicleId, setVehicleId] = useState<string>("");
  const [startKm, setStartKm] = useState<string>("");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("HALF");

  // Load vehicles when dialog opens
  useEffect(() => {
    if (open) {
      loadVehicles();
    }
  }, [open]);

  async function loadVehicles() {
    setVehiclesLoading(true);
    setError(null);

    const result = await getAvailableVehiclesForDriver();

    if (result.success) {
      setVehicles(result.vehicles);
      // Pre-select if only one vehicle
      if (result.vehicles.length === 1) {
        setVehicleId(result.vehicles[0].id);
      }
    } else {
      setError(result.error);
    }

    setVehiclesLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    if (!vehicleId) {
      setError("Please select a vehicle");
      setLoading(false);
      return;
    }

    const kmValue = parseInt(startKm, 10);
    if (isNaN(kmValue) || kmValue < 0) {
      setError("Please enter a valid starting km (non-negative number)");
      setLoading(false);
      return;
    }

    const input: StartShiftInput = {
      vehicleId,
      startKm: kmValue,
      startFuelLevel: fuelLevel,
    };

    const result = await startDriverShift(input);

    if (result.success) {
      setOpen(false);
      onShiftStarted?.();
      // Redirect to route page (Phase 7.3)
      router.push("/dashboard/route");
    } else {
      setError(result.error);
    }

    setLoading(false);
  }

  function resetForm() {
    setVehicleId("");
    setStartKm("");
    setFuelLevel("HALF");
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <PlayCircle className="h-5 w-5" />
          Start Shift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start Your Shift</DialogTitle>
            <DialogDescription>
              Select your vehicle and enter the starting information for
              today&apos;s shift.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Vehicle Selection */}
            <div className="grid gap-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              {vehiclesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading vehicles...
                </div>
              ) : vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No vehicles available. Please contact your administrator.
                </p>
              ) : (
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Starting KM */}
            <div className="grid gap-2">
              <Label htmlFor="startKm">Starting KM</Label>
              <Input
                id="startKm"
                type="number"
                min="0"
                step="1"
                placeholder="Enter odometer reading"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
              />
            </div>

            {/* Fuel Level */}
            <div className="grid gap-2">
              <Label htmlFor="fuelLevel">Fuel Level</Label>
              <Select
                value={fuelLevel}
                onValueChange={(value) => setFuelLevel(value as FuelLevel)}
              >
                <SelectTrigger id="fuelLevel">
                  <SelectValue placeholder="Select fuel level" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FUEL_LEVEL_LABELS) as FuelLevel[]).map(
                    (level) => (
                      <SelectItem key={level} value={level}>
                        {FUEL_LEVEL_LABELS[level]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || vehiclesLoading || vehicles.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Shift"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
