import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { CsvUploadForm } from "@/components/import/csv-upload-form";

export default async function NewImportPage() {
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

  if (!user.vendorId) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="No Vendor Account"
          subtitle="No vendor is associated with this account"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New CSV Import"
        subtitle="Upload a CSV file or paste CSV data to import products"
      />
      <CsvUploadForm />
    </div>
  );
}
