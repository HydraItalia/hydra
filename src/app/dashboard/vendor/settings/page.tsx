import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getVendorSettings } from "@/actions/vendor-settings";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VendorSettingsForm } from "@/components/vendor-settings/vendor-settings-form";
import { StripeConnectOnboarding } from "@/components/vendor-settings/stripe-connect-onboarding";

export default async function VendorSettingsPage() {
  // Check authentication and role
  const user = await currentUser();

  if (!user) {
    redirect("/signin?callbackUrl=/dashboard/vendor/settings");
  }

  if (user.role !== "VENDOR") {
    redirect("/dashboard");
  }

  if (!user.vendorId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vendor Settings"
          subtitle="No vendor associated with this account"
        />
      </div>
    );
  }

  // Fetch current vendor settings
  const settingsResult = await getVendorSettings();

  if (!settingsResult.success || !settingsResult.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Vendor Settings" subtitle="Error loading settings" />
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {settingsResult.error || "Failed to load vendor settings"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Settings"
        subtitle="Update your business information and contact details"
      />

      {/* Stripe Connect Onboarding (Phase 11) */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments from clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StripeConnectOnboarding
            stripeAccountId={settingsResult.data.stripeAccountId || null}
            chargesEnabled={settingsResult.data.chargesEnabled || false}
            payoutsEnabled={settingsResult.data.payoutsEnabled || false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            Manage your business information shown to clients and the Hydra team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorSettingsForm initialData={settingsResult.data} />
        </CardContent>
      </Card>
    </div>
  );
}
