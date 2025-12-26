"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VendorListResult } from "@/data/vendors";

type VendorsTableProps = {
  vendors: VendorListResult[];
};

export function VendorsTable({ vendors }: VendorsTableProps) {
  const router = useRouter();

  if (vendors.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No vendors found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead>Assigned Agents</TableHead>
              <TableHead className="text-center">Agreements</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow
                key={vendor.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  router.push(`/dashboard/vendors/${vendor.id}`);
                }}
              >
                <TableCell>
                  <Link
                    href={`/dashboard/vendors/${vendor.id}`}
                    className="font-medium hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {vendor.name}
                  </Link>
                  {vendor.address && (
                    <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {vendor.address}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1 min-w-[150px]">
                    {vendor.contactEmail && (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {vendor.contactEmail}
                      </div>
                    )}
                    {vendor.contactPhone && (
                      <div className="text-sm text-muted-foreground">
                        {vendor.contactPhone}
                      </div>
                    )}
                    {!vendor.contactEmail && !vendor.contactPhone && (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.region ? (
                    <Badge variant="outline">{vendor.region}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {vendor.productCount > 0 ? (
                    vendor.productCount
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>
                  {vendor.assignedAgents.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {vendor.assignedAgents.map((agent) => (
                        <Badge key={agent.userId} variant="secondary">
                          {agent.agentCode || agent.name || "Unknown"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No agents
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {vendor.agreementCount > 0 ? (
                    <Badge>{vendor.agreementCount}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 lg:hidden">
        {vendors.map((vendor) => (
          <Link key={vendor.id} href={`/dashboard/vendors/${vendor.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                {/* Vendor Name */}
                <div>
                  <div className="font-medium">{vendor.name}</div>
                  {vendor.address && (
                    <div className="text-sm text-muted-foreground">
                      {vendor.address}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {(vendor.contactEmail || vendor.contactPhone) && (
                  <div className="space-y-1 py-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      Contact Information
                    </div>
                    {vendor.contactEmail && (
                      <div className="text-sm text-muted-foreground break-all">
                        {vendor.contactEmail}
                      </div>
                    )}
                    {vendor.contactPhone && (
                      <div className="text-sm text-muted-foreground">
                        {vendor.contactPhone}
                      </div>
                    )}
                  </div>
                )}

                {/* Region */}
                {vendor.region && (
                  <div>
                    <Badge variant="outline">{vendor.region}</Badge>
                  </div>
                )}

                {/* Business Hours */}
                {vendor.businessHours && (
                  <div className="py-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Business Hours
                    </div>
                    <div className="text-sm">{vendor.businessHours}</div>
                  </div>
                )}

                {/* Assigned Agents */}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">
                    Assigned Agents
                  </div>
                  {vendor.assignedAgents.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {vendor.assignedAgents.map((agent) => (
                        <Badge
                          key={agent.userId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {agent.agentCode || agent.name || "Unknown"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No agents assigned
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Products
                    </div>
                    <div className="text-sm font-medium">
                      {vendor.productCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Agreements
                    </div>
                    <div className="text-sm font-medium">
                      {vendor.agreementCount}
                    </div>
                  </div>
                </div>

                {/* Joined Date */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Joined {formatDate(vendor.createdAt)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
