"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { BatchStatusBadge } from "./batch-status-badge";
import { deleteImportBatch } from "@/actions/vendor-import";
import type { BatchListItem } from "@/lib/import/batch-service";

interface ImportBatchesTableProps {
  batches: BatchListItem[];
  linkBase: string; // e.g. "/dashboard/vendor/import" or "/dashboard/imports"
  showVendor?: boolean;
  /** Hide delete actions (e.g. admin read-only view) */
  readOnly?: boolean;
}

function DeleteBatchButton({ batchId }: { batchId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteImportBatch(batchId);
      if (result.success) {
        toast.success("Import batch deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete batch");
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          disabled={isPending}
          title="Delete batch"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this import?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this import batch and all its rows.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ImportBatchesTable({
  batches,
  linkBase,
  showVendor,
  readOnly,
}: ImportBatchesTableProps) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No import batches found
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
      <div className="rounded-lg border min-w-full inline-block align-middle">
        <table className="w-full min-w-[640px]">
          <thead className="bg-muted">
            <tr>
              {showVendor && (
                <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                  Vendor
                </th>
              )}
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                File
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Rows
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Errors
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm whitespace-nowrap">
                Created
              </th>
              {!readOnly && (
                <th className="py-3 px-4 w-12">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-t hover:bg-muted/50">
                {showVendor && (
                  <td className="py-2 px-4 text-sm">{batch.vendorName}</td>
                )}
                <td className="py-2 px-4 text-sm">
                  <Link
                    href={`${linkBase}/${batch.id}`}
                    className="text-primary hover:underline"
                  >
                    {batch.originalFilename ||
                      `Batch ${batch.id.slice(0, 8)}...`}
                  </Link>
                </td>
                <td className="py-2 px-4">
                  <BatchStatusBadge status={batch.status} />
                </td>
                <td className="py-2 px-4 text-sm">{batch.rowCount}</td>
                <td className="py-2 px-4 text-sm">
                  {batch.errorCount > 0 ? (
                    <span className="text-red-600">{batch.errorCount}</span>
                  ) : (
                    batch.errorCount
                  )}
                </td>
                <td className="py-2 px-4 text-sm text-muted-foreground">
                  {new Date(batch.createdAt).toLocaleDateString("en-US")}
                </td>
                {!readOnly && (
                  <td className="py-2 px-4">
                    {batch.status !== "COMMITTED" && (
                      <DeleteBatchButton batchId={batch.id} />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
