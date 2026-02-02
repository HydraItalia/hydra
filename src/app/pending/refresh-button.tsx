"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  const router = useRouter();

  return (
    <Button className="w-full" onClick={() => router.refresh()}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Check Status
    </Button>
  );
}
