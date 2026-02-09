import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ImportWizard } from "@/components/import/import-wizard";
import { fetchImportBatchDetail } from "@/data/import-batches";

interface PageProps {
  params: Promise<{ batchId: string }>;
}

export default async function AdminImportBatchPage(props: PageProps) {
  const { batchId } = await props.params;
  await requireRole("ADMIN");

  try {
    const batch = await fetchImportBatchDetail(batchId);

    return (
      <div className="space-y-6">
        <PageHeader
          title={
            batch.originalFilename
              ? `Import: ${batch.originalFilename}`
              : "Import Batch"
          }
          subtitle={`Batch ${batch.id.slice(0, 8)}... (Vendor: ${batch.vendorId.slice(0, 8)}...)`}
        />
        <ImportWizard initialBatch={batch} readOnly />
      </div>
    );
  } catch {
    return (
      <div className="space-y-8">
        <PageHeader title="Error" subtitle="Batch not found" />
      </div>
    );
  }
}
