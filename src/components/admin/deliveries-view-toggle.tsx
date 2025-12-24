"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table2, Map } from "lucide-react";
import { AdminDeliveriesTable } from "./deliveries-table";
import { AdminDeliveriesMap } from "./deliveries-map";
import type { AdminDeliveryResult } from "@/data/deliveries";

type DeliveriesViewToggleProps = {
  deliveries: AdminDeliveryResult[];
};

export function DeliveriesViewToggle({
  deliveries,
}: DeliveriesViewToggleProps) {
  const [activeView, setActiveView] = useState<"table" | "map">("table");

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant={activeView === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("table")}
          className="gap-2"
        >
          <Table2 className="h-4 w-4" />
          Table
        </Button>
        <Button
          variant={activeView === "map" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("map")}
          className="gap-2"
        >
          <Map className="h-4 w-4" />
          Map
        </Button>
      </div>

      {activeView === "table" ? (
        <AdminDeliveriesTable deliveries={deliveries} />
      ) : (
        <AdminDeliveriesMap deliveries={deliveries} />
      )}
    </div>
  );
}
