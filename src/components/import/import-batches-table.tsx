import Link from "next/link";
import { BatchStatusBadge } from "./batch-status-badge";
import type { BatchListItem } from "@/lib/import/batch-service";

interface ImportBatchesTableProps {
  batches: BatchListItem[];
  linkBase: string; // e.g. "/dashboard/vendor/import" or "/dashboard/imports"
  showVendor?: boolean;
}

export function ImportBatchesTable({
  batches,
  linkBase,
  showVendor,
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
                    {batch.originalFilename || `Batch ${batch.id.slice(0, 8)}...`}
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
                  {new Date(batch.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
