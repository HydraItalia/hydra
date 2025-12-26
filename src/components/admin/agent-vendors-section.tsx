"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, ExternalLink } from "lucide-react";
import { unassignAgentFromVendor } from "@/actions/admin-vendors";

type AssignedVendor = {
  vendorId: string;
  vendorName: string;
  region: string | null;
  activeProductCount: number;
};

type AgentVendorsSectionProps = {
  agentUserId: string;
  assignedVendors: AssignedVendor[];
};

export function AgentVendorsSection({
  agentUserId,
  assignedVendors,
}: AgentVendorsSectionProps) {
  const router = useRouter();
  const [vendorToRemove, setVendorToRemove] = useState<AssignedVendor | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const handleUnassignConfirm = async () => {
    if (!vendorToRemove) return;

    setIsRemoving(true);
    try {
      const result = await unassignAgentFromVendor(
        vendorToRemove.vendorId,
        agentUserId
      );

      if (result.success) {
        toast.success("Vendor unassigned successfully");
        setVendorToRemove(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unassign vendor");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error unassigning vendor:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Assigned Vendors</CardTitle>
          <CardDescription>
            Vendors managed by this agent ({assignedVendors.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedVendors.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No vendors assigned to this agent
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Active Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedVendors.map((vendor) => (
                      <TableRow key={vendor.vendorId}>
                        <TableCell>
                          <Link
                            href={`/dashboard/vendors/${vendor.vendorId}`}
                            className="font-medium hover:underline flex items-center gap-1"
                          >
                            {vendor.vendorName}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          {vendor.region ? (
                            <Badge variant="outline">{vendor.region}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {vendor.activeProductCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setVendorToRemove(vendor)}
                            disabled={isRemoving}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Unassign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {assignedVendors.map((vendor) => (
                  <div
                    key={vendor.vendorId}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/vendors/${vendor.vendorId}`}
                          className="font-medium hover:underline"
                        >
                          {vendor.vendorName}
                        </Link>
                        <div className="flex gap-2 mt-1">
                          {vendor.region && (
                            <Badge variant="outline" className="text-xs">
                              {vendor.region}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {vendor.activeProductCount} products
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setVendorToRemove(vendor)}
                        disabled={isRemoving}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!vendorToRemove}
        onOpenChange={(open) => !open && setVendorToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign{" "}
              <strong>{vendorToRemove?.vendorName}</strong> from this agent? The
              agent will no longer manage this vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassignConfirm}
              disabled={isRemoving}
            >
              {isRemoving ? "Unassigning..." : "Unassign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
