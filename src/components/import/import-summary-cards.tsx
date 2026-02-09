import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  CheckCircle2,
  XCircle,
  PackageCheck,
} from "lucide-react";
import type { BatchSummary } from "@/lib/import/batch-service";

interface ImportSummaryCardsProps {
  summary: BatchSummary;
  rowCount: number;
}

export function ImportSummaryCards({
  summary,
  rowCount,
}: ImportSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Total Rows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rowCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Valid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {summary.valid}
          </div>
        </CardContent>
      </Card>

      <Card className={summary.error > 0 ? "border-red-500" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <XCircle
              className={`h-4 w-4 ${summary.error > 0 ? "text-red-600" : ""}`}
            />
            Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${summary.error > 0 ? "text-red-600" : ""}`}
          >
            {summary.error}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            Committed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.committed}</div>
        </CardContent>
      </Card>
    </div>
  );
}
