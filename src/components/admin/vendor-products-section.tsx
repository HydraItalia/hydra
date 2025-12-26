"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VendorDetail } from "@/data/vendors";

type VendorProductsSectionProps = {
  vendor: VendorDetail;
};

export function VendorProductsSection({ vendor }: VendorProductsSectionProps) {
  const { products, stats } = vendor;
  const LOW_STOCK_THRESHOLD = 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vendor Products</CardTitle>
            <CardDescription>Products supplied by this vendor</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
          <div>
            <div className="text-sm text-muted-foreground">Total Products</div>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeProducts}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Low Stock</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.lowStockProducts}
            </div>
          </div>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No products from this vendor yet
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Vendor SKU</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((vp) => (
                    <TableRow key={vp.id}>
                      <TableCell className="font-medium">
                        {vp.product.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {vp.vendorSku}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            vp.isActive && vp.stockQty <= LOW_STOCK_THRESHOLD
                              ? "font-medium text-orange-600"
                              : ""
                          }
                        >
                          {vp.stockQty}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {vp.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {products.map((vp) => (
                <div
                  key={vp.id}
                  className="p-3 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-medium">{vp.product.name}</div>
                    {vp.isActive ? (
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor SKU:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {vp.vendorSku}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <span
                        className={
                          vp.isActive && vp.stockQty <= LOW_STOCK_THRESHOLD
                            ? "font-medium text-orange-600"
                            : ""
                        }
                      >
                        {vp.stockQty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Showing limited results note */}
            {stats.totalProducts > products.length && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {products.length} of {stats.totalProducts} products
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
