"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserStatus } from "@prisma/client";
import {
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
} from "@/actions/admin-approvals";
import { toast } from "sonner";
import { CheckCircle, XCircle, ShieldBan, RotateCcw } from "lucide-react";

export function StatusActions({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: UserStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(successMessage);
      } else {
        toast.error("error" in result ? result.error : "Action failed");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus !== "APPROVED" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            handleAction(
              () => approveUser(userId),
              "User approved successfully",
            )
          }
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve
        </Button>
      )}

      {currentStatus !== "REJECTED" && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() =>
            handleAction(() => rejectUser(userId), "User rejected")
          }
        >
          <XCircle className="h-4 w-4 mr-1" />
          Reject
        </Button>
      )}

      {currentStatus === "APPROVED" && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() =>
            handleAction(() => suspendUser(userId), "User suspended")
          }
        >
          <ShieldBan className="h-4 w-4 mr-1" />
          Suspend
        </Button>
      )}

      {(currentStatus === "SUSPENDED" || currentStatus === "REJECTED") && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            handleAction(() => reactivateUser(userId), "User reactivated")
          }
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reactivate
        </Button>
      )}
    </div>
  );
}
