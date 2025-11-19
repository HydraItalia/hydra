"use client";

/**
 * Phase 7.5 - Close Shift Page
 *
 * Form page for drivers to close their shift by entering final km, fuel level,
 * notes, and confirming cash return.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import {
  Loader2,
  ArrowLeft,
  Car,
  Gauge,
  Fuel,
  CheckCircle2,
} from "lucide-react";
import {
  getCurrentDriverShiftForToday,
  closeShift,
  CloseShiftInput,
  ShiftWithVehicle,
} from "@/actions/driver-shift";
import { FuelLevel } from "@prisma/client";

const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  EMPTY: "Empty",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Full",
};

export default function CloseShiftPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shift, setShift] = useState<ShiftWithVehicle | null>(null);

  // Form state
  const [endKm, setEndKm] = useState<string>("");
  const [endFuelLevel, setEndFuelLevel] = useState<FuelLevel>("HALF");
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [cashReturnedConfirmed, setCashReturnedConfirmed] =
    useState<boolean>(false);

  // Load current shift on mount
  useEffect(() => {
    loadShift();
  }, []);

  async function loadShift() {
    setShiftLoading(true);
    setError(null);

    const result = await getCurrentDriverShiftForToday();

    if (result.success) {
      if (result.shift) {
        setShift(result.shift);
        // Pre-fill endKm with startKm as minimum
        setEndKm(result.shift.startKm.toString());
        // Pre-fill fuel level with starting level
        setEndFuelLevel(result.shift.startFuelLevel);
      } else {
        setError("No active shift found for today");
      }
    } else {
      setError(result.error);
    }

    setShiftLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    const kmValue = parseInt(endKm, 10);
    if (isNaN(kmValue) || kmValue < 0) {
      setError("Please enter a valid final km (non-negative number)");
      setLoading(false);
      return;
    }

    if (shift && kmValue < shift.startKm) {
      setError(
        `Final km (${kmValue}) must be greater than or equal to starting km (${shift.startKm})`
      );
      setLoading(false);
      return;
    }

    if (!cashReturnedConfirmed) {
      setError("Please confirm that cash and bon have been returned");
      setLoading(false);
      return;
    }

    const input: CloseShiftInput = {
      endKm: kmValue,
      endFuelLevel,
      closingNotes: closingNotes.trim() || undefined,
      cashReturnedConfirmed,
    };

    const result = await closeShift(input);

    if (result.success) {
      // Redirect to summary page
      router.push("/dashboard/shift/summary");
    } else {
      setError(result.error);
    }

    setLoading(false);
  }

  // Loading state
  if (shiftLoading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Close Shift" subtitle="End your shift for today" />
        <div className="mt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // No shift state
  if (!shift) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Close Shift" subtitle="End your shift for today" />
        <div className="mt-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "No active shift found. Start a shift first."}
            </AlertDescription>
          </Alert>
          <Button className="mt-4" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Close Shift" subtitle="End your shift for today" />
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/route">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Route
          </Link>
        </Button>
      </div>

      {/* Current Shift Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Current Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{shift.vehicle.licensePlate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Starting KM</p>
                <p className="font-medium">
                  {shift.startKm.toLocaleString()} km
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Starting Fuel</p>
                <p className="font-medium">
                  {FUEL_LEVEL_LABELS[shift.startFuelLevel]}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Close Shift Form */}
      <Card>
        <CardHeader>
          <CardTitle>End of Shift Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Final KM */}
            <div className="grid gap-2">
              <Label htmlFor="endKm">Final KM</Label>
              <Input
                id="endKm"
                type="number"
                min={shift.startKm}
                step="1"
                placeholder="Enter final odometer reading"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least {shift.startKm.toLocaleString()} km
              </p>
            </div>

            {/* Final Fuel Level */}
            <div className="grid gap-2">
              <Label htmlFor="endFuelLevel">Final Fuel Level</Label>
              <Select
                value={endFuelLevel}
                onValueChange={(value) => setEndFuelLevel(value as FuelLevel)}
              >
                <SelectTrigger id="endFuelLevel">
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

            {/* Closing Notes */}
            <div className="grid gap-2">
              <Label htmlFor="closingNotes">Notes (Optional)</Label>
              <Textarea
                id="closingNotes"
                placeholder="Any issues, observations, or notes about today's shift..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Cash Return Confirmation */}
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="cashReturnedConfirmed"
                checked={cashReturnedConfirmed}
                onCheckedChange={(checked) =>
                  setCashReturnedConfirmed(checked === true)
                }
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="cashReturnedConfirmed"
                  className="font-medium cursor-pointer"
                >
                  I confirm that all cash and bon have been returned
                </Label>
                <p className="text-sm text-muted-foreground">
                  By checking this box, you confirm that all collected payments
                  have been properly accounted for and returned.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={loading}
              >
                <Link href="/dashboard/route">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing Shift...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Close Shift
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
