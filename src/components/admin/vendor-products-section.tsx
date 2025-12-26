"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { VendorDetail } from "@/data/vendors";

type VendorProductsSectionProps = {
  vendor: VendorDetail;
};

export function VendorProductsSection({ vendor }: VendorProductsSectionProps) {
  const { products, stats } = vendor;
  const LOW_STOCK_THRESHOLD = 10;
  const ITEMS_PER_PAGE = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (vp) =>
        vp.product.name.toLowerCase().includes(query) ||
        vp.vendorSku.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Vendor Products</CardTitle>
            <CardDescription>Products supplied by this vendor</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
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
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No products match your search"
                : "No products from this vendor yet"}
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
                  {paginatedProducts.map((vp) => (
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
              {paginatedProducts.map((vp) => (
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                  {searchQuery && ` (filtered from ${stats.totalProducts})`}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
