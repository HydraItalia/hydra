import { OrdersListSkeleton } from "./orders-list-skeleton";
import { PageHeader } from "@/components/shared/page-header";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading order history">
      <PageHeader
        title="Order History"
        subtitle="View and track your past orders"
      />
      <OrdersListSkeleton />
    </div>
  );
}
