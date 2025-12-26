"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Archive } from "lucide-react";
import { archiveVendor } from "@/actions/admin-vendors";

type Role = "ADMIN" | "AGENT" | "VENDOR" | "CLIENT" | "DRIVER";

type VendorArchiveDialogProps = {
  vendorId: string;
  vendorName: string;
  userRole: Role;
  onSuccess?: () => void;
};

export function VendorArchiveDialog({
  vendorId,
  vendorName,
  userRole,
  onSuccess,
}: VendorArchiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isAdmin = userRole === "ADMIN";

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const result = await archiveVendor(vendorId);

      if (result.success) {
        toast.success("Vendor archived successfully");
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/vendors");
        }
      } else {
        toast.error(result.error || "Failed to archive vendor");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error archiving vendor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={!isAdmin}
          title={!isAdmin ? "Only admins can archive vendors" : undefined}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive Vendor
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Vendor</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to archive{" "}
              <strong className="text-foreground">{vendorName}</strong>?
            </p>
            <p className="text-orange-600 dark:text-orange-500 font-medium">
              This will hide the vendor from the vendor list and prevent new
              orders from being placed with them.
            </p>
            <p className="text-sm">
              Existing agreements and products will be preserved but marked as
              inactive.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Archiving..." : "Archive Vendor"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
