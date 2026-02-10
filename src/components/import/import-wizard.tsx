"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ImportWizardProgress } from "./import-wizard-progress";
import { ImportSummaryCards } from "./import-summary-cards";
import { ImportPreviewStep } from "./import-preview-step";
import { ImportCommitStep } from "./import-commit-step";
import { ImportDoneStep } from "./import-done-step";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getImportBatchDetail,
  deleteImportBatch,
} from "@/actions/vendor-import";
import type { BatchDetail } from "@/lib/import/batch-service";

function getStepFromStatus(status: string): number {
  switch (status) {
    case "DRAFT":
    case "PARSING":
      return 0; // Upload
    case "PARSED":
      return 1; // Preview
    case "VALIDATING":
    case "VALIDATED":
      return 2; // Validate
    case "COMMITTING":
      return 3; // Commit
    case "COMMITTED":
      return 4; // Done
    case "FAILED":
      return 1; // Show preview with error info
    default:
      return 1;
  }
}

interface ImportWizardProps {
  initialBatch: BatchDetail;
  readOnly?: boolean;
}

export function ImportWizard({ initialBatch, readOnly }: ImportWizardProps) {
  const [batch, setBatch] = useState(initialBatch);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [, startTransition] = useTransition();
  const router = useRouter();

  const refreshBatch = useCallback(() => {
    startTransition(async () => {
      const result = await getImportBatchDetail(batch.id);
      if (result.success && result.data) {
        setBatch(result.data);
      }
    });
  }, [batch.id]);

  const handleDelete = () => {
    if (!confirm("Delete this import batch? This cannot be undone.")) return;
    startDeleteTransition(async () => {
      const result = await deleteImportBatch(batch.id);
      if (result.success) {
        toast.success("Import batch deleted");
        router.push("/dashboard/vendor/import");
      } else {
        toast.error(result.error || "Failed to delete batch");
      }
    });
  };

  const currentStep = getStepFromStatus(batch.status);
  const canDelete = !readOnly && batch.status !== "COMMITTED";

  return (
    <div className="space-y-6">
      <ImportWizardProgress currentStep={currentStep} />

      <ImportSummaryCards summary={batch.summary} rowCount={batch.rowCount} />

      {/* Step content */}
      {(batch.status === "PARSED" || batch.status === "FAILED") && (
        <ImportPreviewStep
          batch={batch}
          onComplete={refreshBatch}
          readOnly={readOnly}
        />
      )}

      {(batch.status === "VALIDATED" || batch.status === "VALIDATING") && (
        <ImportCommitStep
          batch={batch}
          onComplete={refreshBatch}
          readOnly={readOnly}
        />
      )}

      {batch.status === "COMMITTED" && <ImportDoneStep batch={batch} />}

      {/* Cancel / Delete */}
      {canDelete && (
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete this import"}
          </Button>
        </div>
      )}
    </div>
  );
}
