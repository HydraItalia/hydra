import { VendorInventoryItem } from "@/actions/vendor-inventory";
import { InventoryRow } from "./inventory-row";

interface InventoryTableProps {
  items: VendorInventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No inventory items found
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-sm">
              Product Name
            </th>
            <th className="text-left py-3 px-4 font-medium text-sm">Unit</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Price</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Stock</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
