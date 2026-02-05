import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface VendorProfileCardProps {
  vendorId: string;
}

function formatAddress(addr: unknown): string | null {
  if (!addr || typeof addr !== "object") return null;
  const a = addr as Record<string, string>;
  return [a.street, a.city, a.province, a.postalCode, a.country]
    .filter(Boolean)
    .join(", ");
}

function formatContact(contact: unknown): { name: string; detail: string } | null {
  if (!contact || typeof contact !== "object") return null;
  const c = contact as Record<string, string>;
  return {
    name: [c.fullName, c.role ? `(${c.role})` : null].filter(Boolean).join(" "),
    detail: [c.email, c.phone].filter(Boolean).join(" / "),
  };
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export async function VendorProfileCard({ vendorId }: VendorProfileCardProps) {
  const profile = await prisma.vendorProfile.findUnique({
    where: { vendorId },
    include: { Document: true },
  });

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No extended profile on file. Your onboarding data is under review.
      </p>
    );
  }

  const admin = formatContact(profile.adminContact);
  const commercial = formatContact(profile.commercialContact);
  const technical = formatContact(profile.technicalContact);

  return (
    <div className="space-y-4">
      {/* General */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <Field label="Legal Name" value={profile.legalName} />
        <Field label="Trade Name" value={profile.tradeName} />
        <Field label="Industry" value={profile.industry} />
        <Field
          label="Founded"
          value={profile.foundedAt?.toLocaleDateString("en-GB") ?? null}
        />
        <Field label="Employees" value={profile.employeeCount?.toString()} />
      </dl>
      {profile.description && (
        <p className="text-sm text-muted-foreground">{profile.description}</p>
      )}

      <Separator />

      {/* Legal & Tax */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <Field label="VAT Number" value={profile.vatNumber} />
        <Field label="Tax Code" value={profile.taxCode} />
        <Field label="PEC Email" value={profile.pecEmail} />
        <Field label="SDI Code" value={profile.sdiRecipientCode} />
        <Field label="Tax Regime" value={profile.taxRegime} />
        <Field
          label="Registered Address"
          value={formatAddress(profile.registeredOfficeAddress)}
        />
        <Field
          label="Operating Address"
          value={formatAddress(profile.operatingAddress)}
        />
      </dl>

      <Separator />

      {/* Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {admin && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Admin Contact</p>
            <p className="text-sm font-medium">{admin.name}</p>
            <p className="text-xs text-muted-foreground">{admin.detail}</p>
          </div>
        )}
        {commercial && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Commercial Contact</p>
            <p className="text-sm font-medium">{commercial.name}</p>
            <p className="text-xs text-muted-foreground">{commercial.detail}</p>
          </div>
        )}
        {technical && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Technical Contact</p>
            <p className="text-sm font-medium">{technical.name}</p>
            <p className="text-xs text-muted-foreground">{technical.detail}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Consents */}
      <div className="flex gap-3">
        <Badge variant={profile.dataProcessingConsent ? "default" : "destructive"}>
          Data Processing: {profile.dataProcessingConsent ? "Yes" : "No"}
        </Badge>
        <Badge variant={profile.marketingConsent ? "default" : "outline"}>
          Marketing: {profile.marketingConsent ? "Yes" : "No"}
        </Badge>
        <Badge variant={profile.logoUsageConsent ? "default" : "outline"}>
          Logo Usage: {profile.logoUsageConsent ? "Yes" : "No"}
        </Badge>
      </div>
    </div>
  );
}
