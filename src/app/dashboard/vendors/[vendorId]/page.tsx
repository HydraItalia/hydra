import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getVendorById } from "@/data/vendors";
import { getAuditLogs } from "@/lib/audit";
import { VendorDetailInfo } from "@/components/admin/vendor-detail-info";
import { VendorAgentsSection } from "@/components/admin/vendor-agents-section";
import { VendorProductsSection } from "@/components/admin/vendor-products-section";
import { VendorAgreementsSection } from "@/components/admin/vendor-agreements-section";
import { VendorActivityLog } from "@/components/admin/vendor-activity-log";
import { VendorArchiveDialog } from "@/components/admin/vendor-archive-dialog";
import { PageHeader } from "@/components/shared/page-header";

type PageProps = {
  params: Promise<{ vendorId: string }>;
};

export default async function VendorDetailPage({ params }: PageProps) {
  const { vendorId } = await params;
  const user = await currentUser();

  // Only allow ADMIN and AGENT roles
  if (!user) {
    redirect(`/signin?callbackUrl=/dashboard/vendors/${vendorId}`);
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    redirect("/dashboard?error=unauthorized");
  }

  // Fetch vendor data and audit logs in parallel
  let vendor;
  try {
    vendor = await getVendorById(vendorId);
  } catch (error) {
    console.error("Failed to fetch vendor:", error);
    notFound();
  }

  if (!vendor) {
    notFound();
  }

  // Fetch audit logs for activity timeline
  let auditLogs: Awaited<ReturnType<typeof getAuditLogs>> = [];
  try {
    auditLogs = await getAuditLogs("Vendor", vendorId, {
      limit: 20,
      includeUser: true,
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    // Continue with empty logs - page can still render
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={vendor.name}
          subtitle={vendor.region || "No region assigned"}
        />
        <VendorArchiveDialog
          vendorId={vendor.id}
          vendorName={vendor.name}
          userRole={user.role}
        />
      </div>

      {/* 2-column grid for info and agents */}
      <div className="grid gap-6 md:grid-cols-2">
        <VendorDetailInfo vendor={vendor} />
        <VendorAgentsSection
          vendorId={vendor.id}
          assignedAgents={vendor.assignedAgents}
        />
      </div>

      {/* Full width: Products section */}
      <VendorProductsSection vendor={vendor} />

      {/* 2-column grid for agreements and activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <VendorAgreementsSection agreements={vendor.agreements} />
        <VendorActivityLog logs={auditLogs} />
      </div>
    </div>
  );
}
