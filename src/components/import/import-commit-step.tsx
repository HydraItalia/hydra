"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Download, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportPreviewTable } from "./import-preview-table";
import {
  commitImportBatch,
  downloadImportErrors,
} from "@/actions/vendor-import";
import type { BatchDetail } from "@/lib/import/batch-service";

interface ImportCommitStepProps {
  batch: BatchDetail;
  onComplete: () => void;
  readOnly?: boolean;
}

export function ImportCommitStep({
  batch,
  onComplete,
  readOnly,
}: ImportCommitStepProps) {
  const [isPending, startTransition] = useTransition();
  const [isDownloading, startDownload] = useTransition();

  const hasErrors = batch.summary.error > 0;
  const hasValid = batch.summary.valid > 0;

  const handleCommit = (mode: "all" | "valid_only") => {
    startTransition(async () => {
      const result = await commitImportBatch(batch.id, mode);
      if (result.success && result.data) {
        toast.success(
          `Committed ${result.data.committedRows} rows (${result.data.newProducts} new, ${result.data.updatedProducts} updated)`,
        );
        onComplete();
      } else {
        toast.error(result.error || "Commit failed");
      }
    });
  };

  const handleDownloadErrors = () => {
    startDownload(async () => {
      const result = await downloadImportErrors(batch.id);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `import-errors-${batch.id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        toast.error(result.error || "Failed to download errors");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {!readOnly && hasValid && !hasErrors && (
              <Button onClick={() => handleCommit("all")} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="mr-2 h-4 w-4" />
                )}
                {isPending ? "Committing..." : "Commit All"}
              </Button>
            )}
            {!readOnly && hasValid && hasErrors && (
              <Button
                onClick={() => handleCommit("valid_only")}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="mr-2 h-4 w-4" />
                )}
                {isPending
                  ? "Committing..."
                  : `Commit Valid Only (${batch.summary.valid})`}
              </Button>
            )}
            {hasErrors && (
              <Button
                variant="outline"
                onClick={handleDownloadErrors}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Errors CSV
              </Button>
            )}
          </div>

          {!hasValid && hasErrors && !readOnly && (
            <p className="text-sm text-red-600">
              All rows have errors. Fix them and re-import.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Row Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportPreviewTable
            batchId={batch.id}
            initialRows={batch.rows}
            initialPage={batch.page}
            initialTotalPages={Math.ceil(batch.totalRows / batch.pageSize)}
            initialTotal={batch.totalRows}
          />
        </CardContent>
      </Card>
    </div>
  );
}
