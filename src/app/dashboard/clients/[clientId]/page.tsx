import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getClientById } from "@/data/clients";
import { getAuditLogs } from "@/lib/audit";
import { ClientDetailInfo } from "@/components/admin/client-detail-info";
import { ClientAgentsSection } from "@/components/admin/client-agents-section";
import { ClientAgreementsSection } from "@/components/admin/client-agreements-section";
import { ClientOrdersSection } from "@/components/admin/client-orders-section";
import { ClientActivityLog } from "@/components/admin/client-activity-log";
import { ClientMapView } from "@/components/admin/client-map-view";
import { PageHeader } from "@/components/shared/page-header";

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientDetailPage({ params }: PageProps) {
  const user = await currentUser();

  // Only allow ADMIN and AGENT roles
  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/clients");
  }

  if (user.role !== "ADMIN" && user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const { clientId } = await params;

  // Fetch client data
  let client;
  try {
    client = await getClientById(clientId);
  } catch {
    notFound();
  }

  // Fetch audit logs for activity timeline
  const auditLogs = await getAuditLogs("Client", clientId, {
    limit: 20,
    includeUser: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        subtitle={client.region || "No region assigned"}
      />

      {/* 2-column grid for info and agents */}
      <div className="grid gap-6 md:grid-cols-2">
        <ClientDetailInfo client={client} />
        <ClientAgentsSection
          clientId={client.id}
          assignedAgents={client.assignedAgents}
        />
      </div>

      {/* Conditional: Map view if location exists */}
      {client.deliveryLat && client.deliveryLng && (
        <ClientMapView
          lat={client.deliveryLat}
          lng={client.deliveryLng}
          address={
            client.deliveryAddress || client.fullAddress || "Unknown location"
          }
        />
      )}

      {/* 2-column grid for agreements and activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <ClientAgreementsSection agreements={client.agreements} />
        <ClientActivityLog logs={auditLogs} />
      </div>

      {/* Full width: Orders section */}
      <ClientOrdersSection
        clientId={client.id}
        orders={client.recentOrders}
        totalOrderCount={client.stats?.orderCount || 0}
      />
    </div>
  );
}
