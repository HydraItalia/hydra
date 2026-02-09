import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ImportWizard } from "@/components/import/import-wizard";
import { getImportBatchDetail } from "@/actions/vendor-import";

interface PageProps {
  params: Promise<{ batchId: string }>;
}

export default async function VendorImportBatchPage(props: PageProps) {
  const { batchId } = await props.params;
  const user = await currentUser();

  if (!user) redirect("/signin");
  if (user.role !== "VENDOR") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Unauthorized"
          subtitle="You must be a vendor to access this page"
        />
      </div>
    );
  }

  const result = await getImportBatchDetail(batchId);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Error"
          subtitle={result.error || "Batch not found"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          result.data.originalFilename
            ? `Import: ${result.data.originalFilename}`
            : "Import Batch"
        }
        subtitle={`Batch ${result.data.id.slice(0, 8)}...`}
      />
      <ImportWizard initialBatch={result.data} />
    </div>
  );
}
