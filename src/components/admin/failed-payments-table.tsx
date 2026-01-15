"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  retryPayment,
  markRequiresClientUpdate,
  clearRequiresClientUpdate,
} from "@/actions/admin-payments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import {
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaymentStatus } from "@prisma/client";

type FailedPayment = {
  id: string;
  subOrderNumber: string;
  subTotalCents: number;
  paymentStatus: PaymentStatus | null;
  paymentAttemptCount: number;
  lastPaymentAttemptAt: Date | null;
  nextPaymentRetryAt: Date | null;
  paymentLastErrorCode: string | null;
  paymentLastErrorMessage: string | null;
  requiresClientUpdate: boolean;
  authorizationExpiresAt: Date | null;
  stripeChargeId: string | null;
  Order: {
    id: string;
    orderNumber: string;
    status: string;
    Client: {
      id: string;
      name: string;
    } | null;
  };
  Vendor: {
    id: string;
    name: string;
  };
};

interface FailedPaymentsTableProps {
  payments: FailedPayment[];
}

export function FailedPaymentsTable({ payments }: FailedPaymentsTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "retry" | "markRequiresUpdate" | "clearRequiresUpdate";
    subOrderId: string;
    subOrderNumber: string;
  } | null>(null);

  const handleRetry = async (subOrderId: string) => {
    setLoadingId(subOrderId);
    try {
      const result = await retryPayment(subOrderId);
      if (result.success) {
        toast.success("Payment retry initiated successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to retry payment");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoadingId(null);
      setConfirmDialog(null);
    }
  };

  const handleMarkRequiresUpdate = async (subOrderId: string) => {
    setLoadingId(subOrderId);
    try {
      const result = await markRequiresClientUpdate(subOrderId);
      if (result.success) {
        toast.success("Marked as requiring client update");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoadingId(null);
      setConfirmDialog(null);
    }
  };

  const handleClearRequiresUpdate = async (subOrderId: string) => {
    setLoadingId(subOrderId);
    try {
      const result = await clearRequiresClientUpdate(subOrderId);
      if (result.success) {
        toast.success("Cleared client update flag, retry scheduled");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoadingId(null);
      setConfirmDialog(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date() > new Date(date);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SubOrder</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Last Attempt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const isLoading = loadingId === payment.id;
            const authExpired = isExpired(payment.authorizationExpiresAt);

            return (
              <TableRow key={payment.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/orders/${payment.Order.id}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {payment.subOrderNumber}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    Order {payment.Order.orderNumber}
                  </div>
                </TableCell>
                <TableCell>
                  {payment.Order.Client ? (
                    <Link
                      href={`/dashboard/clients/${payment.Order.Client.id}`}
                      className="hover:underline"
                    >
                      {payment.Order.Client.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/vendors/${payment.Vendor.id}`}
                    className="hover:underline"
                  >
                    {payment.Vendor.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(payment.subTotalCents)}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    <div className="font-mono text-xs text-destructive">
                      {payment.paymentLastErrorCode || "unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {payment.paymentLastErrorMessage ||
                        "No details available"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{payment.paymentAttemptCount}</Badge>
                </TableCell>
                <TableCell>
                  {payment.lastPaymentAttemptAt ? (
                    <span className="text-sm">
                      {formatDate(payment.lastPaymentAttemptAt)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {payment.requiresClientUpdate ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Needs Update
                    </Badge>
                  ) : payment.nextPaymentRetryAt ? (
                    <Badge variant="secondary" className="text-xs">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Retry Scheduled
                    </Badge>
                  ) : authExpired ? (
                    <Badge variant="destructive" className="text-xs">
                      Auth Expired
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Manual
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            action: "retry",
                            subOrderId: payment.id,
                            subOrderNumber: payment.subOrderNumber,
                          })
                        }
                        disabled={authExpired && !!payment.stripeChargeId}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Now
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {payment.requiresClientUpdate ? (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              action: "clearRequiresUpdate",
                              subOrderId: payment.id,
                              subOrderNumber: payment.subOrderNumber,
                            })
                          }
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Clear Update Flag
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              action: "markRequiresUpdate",
                              subOrderId: payment.id,
                              subOrderNumber: payment.subOrderNumber,
                            })
                          }
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Mark Requires Update
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/orders/${payment.Order.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Order
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "retry" && "Retry Payment?"}
              {confirmDialog?.action === "markRequiresUpdate" &&
                "Mark as Requiring Client Update?"}
              {confirmDialog?.action === "clearRequiresUpdate" &&
                "Clear Client Update Flag?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "retry" && (
                <>
                  This will immediately attempt to process the payment for{" "}
                  <strong>{confirmDialog.subOrderNumber}</strong>. The client's
                  payment method will be charged if successful.
                </>
              )}
              {confirmDialog?.action === "markRequiresUpdate" && (
                <>
                  This will stop automatic retries for{" "}
                  <strong>{confirmDialog?.subOrderNumber}</strong> and mark it
                  as requiring the client to update their payment method.
                </>
              )}
              {confirmDialog?.action === "clearRequiresUpdate" && (
                <>
                  This will schedule an immediate retry for{" "}
                  <strong>{confirmDialog?.subOrderNumber}</strong>. Use this
                  after the client has updated their payment method.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDialog) return;
                if (confirmDialog.action === "retry") {
                  handleRetry(confirmDialog.subOrderId);
                } else if (confirmDialog.action === "markRequiresUpdate") {
                  handleMarkRequiresUpdate(confirmDialog.subOrderId);
                } else if (confirmDialog.action === "clearRequiresUpdate") {
                  handleClearRequiresUpdate(confirmDialog.subOrderId);
                }
              }}
            >
              {confirmDialog?.action === "retry" && "Retry Payment"}
              {confirmDialog?.action === "markRequiresUpdate" &&
                "Mark as Needs Update"}
              {confirmDialog?.action === "clearRequiresUpdate" &&
                "Clear Flag & Schedule Retry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
