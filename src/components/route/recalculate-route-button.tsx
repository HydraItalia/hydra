"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { recalculateDriverRoute } from "@/actions/route";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RecalculateRouteButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleRecalculate() {
    setIsLoading(true);

    try {
      const result = await recalculateDriverRoute();

      if (result.success) {
        toast.success("Route recalculated successfully");
        router.refresh(); // Refresh server components
      } else {
        toast.error(result.error || "Failed to recalculate route");
      }
    } catch (error) {
      console.error("Error recalculating route:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleRecalculate}
      disabled={isLoading}
      variant="default"
      size="default"
    >
      <RefreshCw
        className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
      />
      {isLoading ? "Recalculating..." : "Recalculate Route"}
    </Button>
  );
}
