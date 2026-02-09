"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportPreviewTable } from "./import-preview-table";
import { validateImportBatch } from "@/actions/vendor-import";
import type { BatchDetail } from "@/lib/import/batch-service";

interface ImportPreviewStepProps {
  batch: BatchDetail;
  onComplete: () => void;
  readOnly?: boolean;
}

export function ImportPreviewStep({
  batch,
  onComplete,
  readOnly,
}: ImportPreviewStepProps) {
  const [isPending, startTransition] = useTransition();

  const handleValidate = () => {
    startTransition(async () => {
      const result = await validateImportBatch(batch.id);
      if (result.success && result.data) {
        toast.success(
          `Validation complete: ${result.data.rowCount - result.data.errorCount} valid, ${result.data.errorCount} errors`,
        );
        onComplete();
      } else {
        toast.error(result.error || "Validation failed");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Preview Parsed Rows</CardTitle>
        {!readOnly && (
          <Button onClick={handleValidate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Validating..." : "Validate"}
          </Button>
        )}
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
  );
}
