import { requireRole } from "@/lib/auth";
import { fetchApprovalDetail } from "@/data/approvals";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { UserStatus } from "@prisma/client";
import { StatusActions } from "./status-actions";
import { VendorUserLinks } from "./vendor-user-links";

type PageProps = {
  params: Promise<{ userId: string }>;
};

function statusBadgeVariant(
  status: UserStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default";
    case "PENDING":
      return "secondary";
    case "REJECTED":
      return "destructive";
    case "SUSPENDED":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

import type {
  VendorProfileDetail,
  ClientProfileDetail,
} from "@/data/approvals";

function renderOnboardingData(data: any) {
  if (!data || typeof data !== "object") {
    return (
      <p className="text-sm text-muted-foreground">
        No onboarding data submitted.
      </p>
    );
  }

  const fields: Array<{ label: string; value: string }> = [];

  // Common fields across roles
  if (data.businessName)
    fields.push({ label: "Business Name", value: data.businessName });
  if (data.legalName)
    fields.push({ label: "Legal Name", value: data.legalName });
  if (data.fullName) fields.push({ label: "Full Name", value: data.fullName });
  if (data.contactPerson)
    fields.push({ label: "Contact Person", value: data.contactPerson });
  if (data.email || data.contactEmail)
    fields.push({ label: "Email", value: data.email || data.contactEmail });
  if (data.phone || data.contactPhone)
    fields.push({ label: "Phone", value: data.phone || data.contactPhone });
  if (data.address) fields.push({ label: "Address", value: data.address });
  if (data.region) fields.push({ label: "Region", value: data.region });
  if (data.vehicleInfo)
    fields.push({ label: "Vehicle Info", value: data.vehicleInfo });
  if (data.businessHours)
    fields.push({ label: "Business Hours", value: data.businessHours });
  if (data.vendorName)
    fields.push({ label: "Preferred Vendor", value: data.vendorName });
  if (data.notes) fields.push({ label: "Notes", value: data.notes });

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No onboarding data submitted.
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {fields.map((f) => (
        <div key={f.label}>
          <dt className="text-sm font-medium text-muted-foreground">
            {f.label}
          </dt>
          <dd className="text-sm mt-0.5">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatAddress(addr: any): string | null {
  if (!addr || typeof addr !== "object") return null;
  return [addr.street, addr.city, addr.province, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(", ");
}

function formatContact(contact: any): string | null {
  if (!contact || typeof contact !== "object") return null;
  const parts = [contact.fullName];
  if (contact.role) parts.push(`(${contact.role})`);
  if (contact.email) parts.push(`- ${contact.email}`);
  if (contact.phone) parts.push(`- ${contact.phone}`);
  return parts.join(" ");
}

function formatSimpleContact(contact: any): string | null {
  if (!contact || typeof contact !== "object") return null;
  const parts = [contact.fullName];
  if (contact.email) parts.push(`- ${contact.email}`);
  if (contact.phone) parts.push(`- ${contact.phone}`);
  return parts.join(" ");
}

function renderVendorProfile(profile: VendorProfileDetail) {
  const section = (
    title: string,
    items: Array<{ label: string; value: string | null }>,
  ) => {
    const visible = items.filter((i) => i.value);
    if (visible.length === 0) return null;
    return (
      <div>
        <p className="text-sm font-semibold mb-2">{title}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {visible.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium text-muted-foreground">
                {f.label}
              </dt>
              <dd className="text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {section("General", [
        { label: "Legal Name", value: profile.legalName },
        { label: "Trade Name", value: profile.tradeName },
        { label: "Industry", value: profile.industry },
        { label: "Description", value: profile.description },
        {
          label: "Founded",
          value: profile.foundedAt
            ? new Date(profile.foundedAt).toLocaleDateString()
            : null,
        },
        {
          label: "Employees",
          value: profile.employeeCount?.toString() ?? null,
        },
      ])}
      {section("Legal & Tax", [
        { label: "VAT Number", value: profile.vatNumber },
        { label: "Tax Code", value: profile.taxCode },
        {
          label: "Chamber of Commerce",
          value: profile.chamberOfCommerceRegistration,
        },
        {
          label: "Registered Address",
          value: formatAddress(profile.registeredOfficeAddress),
        },
        {
          label: "Operating Address",
          value: formatAddress(profile.operatingAddress),
        },
        { label: "PEC Email", value: profile.pecEmail },
        { label: "SDI Code", value: profile.sdiRecipientCode },
        { label: "Tax Regime", value: profile.taxRegime },
        { label: "Licenses", value: profile.licenses },
      ])}
      {section("Contacts", [
        { label: "Admin Contact", value: formatContact(profile.adminContact) },
        {
          label: "Commercial Contact",
          value: formatContact(profile.commercialContact),
        },
        {
          label: "Technical Contact",
          value: formatContact(profile.technicalContact),
        },
      ])}
      {section("Banking", [
        { label: "Account Holder", value: profile.bankAccountHolder },
        { label: "IBAN", value: profile.iban },
        { label: "Bank", value: profile.bankNameAndBranch },
        {
          label: "Payment Method",
          value: profile.preferredPaymentMethod?.replace(/_/g, " ") ?? null,
        },
        {
          label: "Payment Terms",
          value: profile.paymentTerms?.replace(/_/g, " ") ?? null,
        },
        { label: "Invoicing Notes", value: profile.invoicingNotes },
      ])}
      {(profile.Document?.length ?? 0) > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Documents</p>
          <div className="space-y-1">
            {profile.Document.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm">
                <Badge
                  variant={doc.required ? "default" : "outline"}
                  className="text-xs"
                >
                  {doc.type.replace(/_/g, " ")}
                </Badge>
                <span>{doc.label}</span>
                {doc.fileName && (
                  <span className="text-muted-foreground">
                    ({doc.fileName})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {section("Operational", [
        { label: "Opening Hours", value: profile.openingHours },
        { label: "Closing Days", value: profile.closingDays },
        { label: "Warehouse Access", value: profile.warehouseAccess },
        { label: "Operational Notes", value: profile.operationalNotes },
      ])}
      <div>
        <p className="text-sm font-semibold mb-2">Consents</p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Data Processing
            </dt>
            <dd className="text-sm">
              <Badge
                variant={
                  profile.dataProcessingConsent ? "default" : "destructive"
                }
              >
                {profile.dataProcessingConsent ? "Accepted" : "Not accepted"}
              </Badge>
              {profile.dataProcessingTimestamp && (
                <span className="text-xs text-muted-foreground ml-1">
                  {new Date(
                    profile.dataProcessingTimestamp,
                  ).toLocaleDateString()}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Marketing
            </dt>
            <dd className="text-sm">
              <Badge variant={profile.marketingConsent ? "default" : "outline"}>
                {profile.marketingConsent ? "Accepted" : "Declined"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Logo Usage
            </dt>
            <dd className="text-sm">
              <Badge variant={profile.logoUsageConsent ? "default" : "outline"}>
                {profile.logoUsageConsent ? "Accepted" : "Declined"}
              </Badge>
            </dd>
          </div>
        </dl>
        {profile.consentVersion && (
          <p className="text-xs text-muted-foreground mt-1">
            Version: {profile.consentVersion}
          </p>
        )}
      </div>
    </div>
  );
}

function renderClientProfile(profile: ClientProfileDetail) {
  const section = (
    title: string,
    items: Array<{ label: string; value: string | null }>,
  ) => {
    const visible = items.filter((i) => i.value);
    if (visible.length === 0) return null;
    return (
      <div>
        <p className="text-sm font-semibold mb-2">{title}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {visible.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium text-muted-foreground">
                {f.label}
              </dt>
              <dd className="text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  const isPrivate = profile.clientType === "PRIVATE";

  return (
    <div className="space-y-5">
      {/* Client Type Badge */}
      <div>
        <Badge variant="outline" className="text-sm">
          {profile.clientType}
        </Badge>
      </div>

      {/* Personal Details (PRIVATE) */}
      {isPrivate &&
        section("Personal Details", [
          { label: "Full Name", value: profile.fullName },
          {
            label: "Birth Date",
            value: profile.birthDate
              ? new Date(profile.birthDate).toLocaleDateString()
              : null,
          },
          { label: "Birth Place", value: profile.birthPlace },
          { label: "Tax Code", value: profile.personalTaxCode },
          { label: "Phone", value: profile.personalPhone },
          { label: "Email", value: profile.personalEmail },
          { label: "PEC Email", value: profile.personalPecEmail },
          {
            label: "Residential Address",
            value: formatAddress(profile.residentialAddress),
          },
          {
            label: "Domicile Address",
            value: formatAddress(profile.domicileAddress),
          },
        ])}

      {/* ID Document (PRIVATE) */}
      {isPrivate &&
        section("ID Document", [
          { label: "Type", value: profile.idDocumentType },
          { label: "Number", value: profile.idDocumentNumber },
          {
            label: "Expiry",
            value: profile.idDocumentExpiry
              ? new Date(profile.idDocumentExpiry).toLocaleDateString()
              : null,
          },
          { label: "Issuing Authority", value: profile.idDocumentIssuer },
        ])}

      {/* Company Details (BUSINESS) */}
      {!isPrivate &&
        section("Company Details", [
          { label: "Legal Name", value: profile.legalName },
          { label: "Trade Name", value: profile.tradeName },
          { label: "VAT Number", value: profile.vatNumber },
          { label: "Tax Code", value: profile.companyTaxCode },
          { label: "SDI Code", value: profile.sdiRecipientCode },
          { label: "PEC Email", value: profile.companyPecEmail },
          {
            label: "Registered Address",
            value: formatAddress(profile.registeredOfficeAddress),
          },
          {
            label: "Operating Address",
            value: formatAddress(profile.operatingAddress),
          },
        ])}

      {/* Contacts (BUSINESS) */}
      {!isPrivate &&
        section("Contacts", [
          {
            label: "Admin Contact",
            value: formatSimpleContact(profile.adminContact),
          },
          {
            label: "Operational Contact",
            value: formatSimpleContact(profile.operationalContact),
          },
        ])}

      {/* Billing */}
      {section("Billing", [
        { label: "Invoicing Notes", value: profile.invoicingNotes },
      ])}

      {/* Documents */}
      {(profile.Document?.length ?? 0) > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Documents</p>
          <div className="space-y-1">
            {profile.Document.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm">
                <Badge
                  variant={doc.required ? "default" : "outline"}
                  className="text-xs"
                >
                  {doc.type.replace(/_/g, " ")}
                </Badge>
                <span>{doc.label}</span>
                {doc.fileName && (
                  <span className="text-muted-foreground">
                    ({doc.fileName})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational */}
      {section("Operational", [
        {
          label: "Preferred Contact Hours",
          value: profile.preferredContactHours,
        },
        { label: "Special Requirements", value: profile.specialRequirements },
        { label: "Operational Notes", value: profile.operationalNotes },
      ])}

      {/* Consents */}
      <div>
        <p className="text-sm font-semibold mb-2">Consents</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Data Processing
            </dt>
            <dd className="text-sm">
              <Badge
                variant={
                  profile.dataProcessingConsent ? "default" : "destructive"
                }
              >
                {profile.dataProcessingConsent ? "Accepted" : "Not accepted"}
              </Badge>
              {profile.dataProcessingTimestamp && (
                <span className="text-xs text-muted-foreground ml-1">
                  {new Date(
                    profile.dataProcessingTimestamp,
                  ).toLocaleDateString()}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Marketing
            </dt>
            <dd className="text-sm">
              <Badge variant={profile.marketingConsent ? "default" : "outline"}>
                {profile.marketingConsent ? "Accepted" : "Declined"}
              </Badge>
            </dd>
          </div>
        </dl>
        {profile.consentVersion && (
          <p className="text-xs text-muted-foreground mt-1">
            Version: {profile.consentVersion}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function ApprovalDetailPage({ params }: PageProps) {
  await requireRole("ADMIN");

  const { userId } = await params;
  const user = await fetchApprovalDetail(userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name || user.email}
        subtitle={user.name ? user.email : undefined}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/approvals">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Approvals
            </Link>
          </Button>
        }
      />

      {/* User Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant="outline" className="mt-1">
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge variant={statusBadgeVariant(user.status)} className="mt-1">
                {user.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Submitted
              </p>
              <p className="text-sm mt-1">{formatDate(user.createdAt)}</p>
            </div>
            {user.approvedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Status Change
                </p>
                <p className="text-sm mt-1">{formatDate(user.approvedAt)}</p>
              </div>
            )}
          </div>

          {/* Linked entities */}
          {(user.agentCode || user.Vendor || user.Client || user.Driver) && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.agentCode && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Agent Code
                    </p>
                    <p className="text-sm mt-1 font-mono">{user.agentCode}</p>
                  </div>
                )}
                {user.Vendor && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Vendor
                    </p>
                    <p className="text-sm mt-1">{user.Vendor.name}</p>
                  </div>
                )}
                {user.Client && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Client
                    </p>
                    <p className="text-sm mt-1">{user.Client.name}</p>
                  </div>
                )}
                {user.Driver && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Driver
                    </p>
                    <p className="text-sm mt-1">{user.Driver.name}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Controls</CardTitle>
          <CardDescription>
            Approve, reject, suspend, or reactivate this user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusActions userId={user.id} currentStatus={user.status} />
        </CardContent>
      </Card>

      {/* Vendor Profile (structured data from new onboarding) */}
      {user.VendorProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Profile</CardTitle>
            <CardDescription>
              Detailed vendor information submitted during onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderVendorProfile(user.VendorProfile)}</CardContent>
        </Card>
      )}

      {/* Client Profile (structured data from new onboarding) */}
      {user.ClientProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Profile</CardTitle>
            <CardDescription>
              Detailed client information submitted during onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderClientProfile(user.ClientProfile)}</CardContent>
        </Card>
      )}

      {/* Legacy Onboarding Data (non-vendor/client roles or legacy without profile) */}
      {(!user.VendorProfile || user.role !== "VENDOR") &&
        (!user.ClientProfile || user.role !== "CLIENT") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Onboarding Data</CardTitle>
              <CardDescription>
                Information submitted during the onboarding process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderOnboardingData(user.onboardingData)}
            </CardContent>
          </Card>
        )}

      {/* VendorUser Links (only for VENDOR role) */}
      {user.role === "VENDOR" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Memberships</CardTitle>
            <CardDescription>
              Vendor organizations this user belongs to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VendorUserLinks userId={user.id} links={user.VendorUser} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
