import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import {
  getFailedPayments,
  getPaymentStatusSummary,
} from "@/actions/admin-payments";
import { PageHeader } from "@/components/shared/page-header";
import { FailedPaymentsTable } from "@/components/admin/failed-payments-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Clock, CreditCard, RefreshCw } from "lucide-react";

export default async function FailedPaymentsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/payments/failed");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    redirect("/dashboard");
  }

  // Fetch data in parallel
  const [paymentsResult, summaryResult] = await Promise.all([
    getFailedPayments(),
    getPaymentStatusSummary(),
  ]);

  if (!paymentsResult.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Failed Payments"
          subtitle="Error loading failed payments"
        />
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {paymentsResult.error}
          </CardContent>
        </Card>
      </div>
    );
  }

  const failedPayments = paymentsResult.data;
  const summary = summaryResult.success ? summaryResult.data : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Failed Payments"
        subtitle="Monitor and manage payment failures across all orders"
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Failed
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.failed}</div>
              <p className="text-xs text-muted-foreground">
                Payments requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Retry
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingRetry}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for automatic retry
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Requires Client Update
              </CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.requiresUpdate}</div>
              <p className="text-xs text-muted-foreground">
                Client needs to update payment method
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.processing}</div>
              <p className="text-xs text-muted-foreground">
                Authorized, awaiting capture
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Failed Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Payments</CardTitle>
          <CardDescription>
            {failedPayments.length} payment
            {failedPayments.length !== 1 ? "s" : ""} with issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failedPayments.length > 0 ? (
            <FailedPaymentsTable payments={failedPayments} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-green-100 p-6 mb-4">
                <CreditCard className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No failed payments</h3>
              <p className="text-muted-foreground text-center max-w-md">
                All payments are processing normally. Great job!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
