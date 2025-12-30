import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PaymentMethodManager } from "@/components/billing/payment-method-manager";

type ClientBillingInfo = {
  id: string;
  stripeCustomerId: string | null;
  defaultPaymentMethodId: string | null;
  hasPaymentMethod: boolean;
};

/**
 * Client Billing Page
 *
 * Allows clients to view and manage their payment methods.
 * Only accessible to CLIENT role and ADMIN (for support).
 */
export default async function BillingPage() {
  const user = await currentUser();

  // Require authentication
  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/billing");
  }

  // Only allow CLIENT and ADMIN roles
  if (user.role !== "CLIENT" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // For CLIENT role, fetch their client record
  // For ADMIN, this would need client selection (future enhancement)
  let client: ClientBillingInfo | null = null;

  if (user.role === "CLIENT") {
    // User.clientId references Client.id
    if (!user.clientId) {
      // CLIENT user without a clientId - shouldn't happen
      redirect("/dashboard");
    }

    try {
      client = await prisma.client.findUnique({
        where: { id: user.clientId },
        select: {
          id: true,
          stripeCustomerId: true,
          defaultPaymentMethodId: true,
          hasPaymentMethod: true,
        },
      });

      if (!client) {
        // CLIENT user without a client record - shouldn't happen
        redirect("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch client record for billing:", {
        clientId: user.clientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      redirect("/dashboard?error=billing_unavailable");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Methods"
        subtitle="Manage your payment methods for seamless ordering"
      />

      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Your Payment Methods</CardTitle>
            <CardDescription>
              Add or update your payment methods. Your card information is
              securely stored with Stripe and never saved on our servers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {client && (
              <PaymentMethodManager
                clientId={client.id}
                stripeCustomerId={client.stripeCustomerId}
                hasPaymentMethod={client.hasPaymentMethod}
                defaultPaymentMethodId={client.defaultPaymentMethodId}
              />
            )}
            {!client && user.role === "ADMIN" && (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  Admin view: Select a client to manage their payment methods
                </p>
                <p className="text-sm mt-2">
                  (Client selection UI coming soon)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
