import { VendorSubOrderDetail } from "@/actions/vendor-orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface OrderItemsTableProps {
  order: VendorSubOrderDetail;
}

export function OrderItemsTable({ order }: OrderItemsTableProps) {
  // Calculate vendor subtotal (only items from this vendor)
  const vendorSubtotal = order.OrderItem.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.OrderItem.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.productName}</div>
                </TableCell>
                <TableCell className="text-right">{item.qty}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unitPriceCents)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.lineTotalCents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vendor Subtotal */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Your Items Subtotal:</span>
            <span className="font-semibold text-lg">
              {formatCurrency(vendorSubtotal)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            This order may contain items from other vendors not shown here.
          </p>
        </div>
      </div>
    </div>
  );
}
