import Link from "next/link";
import { CheckCircle2, ArrowLeft, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BatchDetail } from "@/lib/import/batch-service";

interface ImportDoneStepProps {
  batch: BatchDetail;
}

export function ImportDoneStep({ batch }: ImportDoneStepProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
        <h2 className="text-2xl font-bold">Import Complete</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {batch.summary.committed} rows were successfully committed to your
          inventory.
          {batch.summary.skipped > 0 &&
            ` ${batch.summary.skipped} rows were skipped due to errors.`}
        </p>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/vendor/import">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Imports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/inventory">
              <Warehouse className="mr-2 h-4 w-4" />
              View Inventory
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
