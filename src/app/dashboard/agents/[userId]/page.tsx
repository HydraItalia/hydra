import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getAgentById } from "@/data/agents";
import { AgentDetailInfo } from "@/components/admin/agent-detail-info";
import { AgentClientsSection } from "@/components/admin/agent-clients-section";
import { AgentVendorsSection } from "@/components/admin/agent-vendors-section";
import { AgentOrdersSection } from "@/components/admin/agent-orders-section";
import { PageHeader } from "@/components/shared/page-header";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AgentDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = await currentUser();

  // CRITICAL: Admin-only access (NOT agent - agents can't see other agents)
  if (!user) {
    redirect(`/signin?callbackUrl=/dashboard/agents/${userId}`);
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  // Fetch agent data - using try/catch for error handling
  let agent;
  try {
    agent = await getAgentById(userId);
  } catch (error) {
    console.error("Failed to fetch agent:", error);
    notFound();
  }

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={agent.name || agent.email}
        subtitle={agent.agentCode || "Agent"}
      />

      {/* 2-column grid for info and clients */}
      <div className="grid gap-6 md:grid-cols-2">
        <AgentDetailInfo agent={agent} />
        <AgentClientsSection
          agentUserId={agent.id}
          assignedClients={agent.assignedClients}
        />
      </div>

      {/* Vendors section - Full width */}
      <AgentVendorsSection
        agentUserId={agent.id}
        assignedVendors={agent.assignedVendors}
      />

      {/* Active Orders - Full width */}
      <AgentOrdersSection
        orders={agent.activeOrders}
        totalOrderCount={agent.stats.activeOrderCount}
      />
    </div>
  );
}
