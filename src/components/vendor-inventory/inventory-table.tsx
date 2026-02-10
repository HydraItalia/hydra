"use client";

import { useState } from "react";
import { VendorInventoryItem } from "@/actions/vendor-inventory";
import { InventoryRow } from "./inventory-row";

interface InventoryTableProps {
  items: VendorInventoryItem[];
  onItemDeleted?: () => void;
}

export function InventoryTable({ items, onItemDeleted }: InventoryTableProps) {
  const [visibleItems, setVisibleItems] =
    useState<VendorInventoryItem[]>(items);

  const handleDeleted = (id: string) => {
    setVisibleItems((prev) => prev.filter((item) => item.id !== id));
    onItemDeleted?.();
  };

  if (visibleItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No inventory items found
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
      <div className="rounded-lg border min-w-full inline-block align-middle">
        <table className="w-full min-w-[640px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Product Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Unit
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Price
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Stock
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                onDeleted={handleDeleted}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
