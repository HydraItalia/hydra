"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  unlinkVendorUser,
  updateVendorUserRole,
} from "@/actions/admin-linking";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type VendorUserLink = {
  vendorId: string;
  role: string;
  Vendor: { id: string; name: string };
};

export function VendorUserLinks({
  userId,
  links,
}: {
  userId: string;
  links: VendorUserLink[];
}) {
  const [isPending, startTransition] = useTransition();

  if (links.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No vendor memberships found.
      </p>
    );
  }

  const handleUnlink = (vendorId: string, vendorName: string) => {
    startTransition(async () => {
      const result = await unlinkVendorUser({ userId, vendorId });
      if (result.success) {
        toast.success(`Removed from ${vendorName}`);
      } else {
        toast.error("error" in result ? result.error : "Failed to unlink");
      }
    });
  };

  const handleRoleChange = (
    vendorId: string,
    newRole: "OWNER" | "STAFF" | "AGENT",
  ) => {
    startTransition(async () => {
      const result = await updateVendorUserRole({
        userId,
        vendorId,
        role: newRole,
      });
      if (result.success) {
        toast.success(`Role updated to ${newRole}`);
      } else {
        toast.error("error" in result ? result.error : "Failed to update role");
      }
    });
  };

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div
          key={link.vendorId}
          className="flex items-center justify-between rounded-md border p-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{link.Vendor.name}</span>
            <Badge variant="outline">{link.role}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <select
              disabled={isPending}
              value={link.role}
              onChange={(e) =>
                handleRoleChange(
                  link.vendorId,
                  e.target.value as "OWNER" | "STAFF" | "AGENT",
                )
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="OWNER">OWNER</option>
              <option value="STAFF">STAFF</option>
              <option value="AGENT">AGENT</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => handleUnlink(link.vendorId, link.Vendor.name)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
