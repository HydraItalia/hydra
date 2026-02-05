# Driver Onboarding PR Plan

**Matches patterns from:** Vendor PR (#185), Client PR (#186)
**Status:** Ready for implementation

---

## 1. Proposed File List

```
prisma/
├── migrations/
│   └── 20250205_add_driver_onboarding/
│       └── migration.sql              # Additive only

src/
├── lib/
│   └── schemas/
│       └── driver-onboarding.ts       # Shared Zod schema
│
├── actions/
│   └── driver-onboarding.ts           # submitDriverOnboarding()
│
├── data/
│   └── driver-approvals.ts            # fetchDriverProfileForApproval()
│
├── app/
│   └── onboarding/
│       └── driver/
│           ├── page.tsx               # Server component
│           ├── driver-onboarding-form.tsx
│           └── steps/
│               ├── personal-data-step.tsx
│               ├── licenses-step.tsx
│               ├── documents-step.tsx
│               ├── company-step.tsx
│               └── consents-step.tsx
│
└── app/
    └── dashboard/
        └── approvals/
            └── [id]/
                └── driver-profile-detail.tsx  # Renderer component
```

---

## 2. Prisma Models + Enums

### Enums (New)

```prisma
enum DriverDocumentType {
  ID_DOCUMENT
  DRIVING_LICENSE
  SIGNED_GDPR_FORM
  ADR_CERTIFICATE
  CQC_CERTIFICATE
  MEDICAL_CERTIFICATE
  OTHER
}
```

No `DriverLicenseType` enum. License types stored as `String` and validated by Zod (Italian bureaucracy changes frequently).

### Driver (Update existing)

```prisma
model Driver {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Legacy fields (populated for backward compat, source of truth is profile)
  name      String
  phone     String

  // Relations
  profile   DriverProfile?
  documents DriverDocument[]
  users     User[]
  vendorLinks DriverVendorLink[]
}
```

### DriverProfile (New - 1:1 with Driver)

```prisma
model DriverProfile {
  id        String   @id @default(cuid())
  driverId  String   @unique
  driver    Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Section 1: Personal Data
  fullName          String
  birthDate         DateTime
  birthPlace        String
  taxCode           String           // Codice fiscale (unique enforced at app level)
  nationality       String           @default("Italiana")
  residentialAddress Json            // { street, city, province, postalCode, country }
  domicileAddress   Json?
  phone             String
  email             String
  pecEmail          String?

  // Section 1b: Identity Document
  idDocumentType    String           // ID_CARD | PASSPORT | DRIVING_LICENSE
  idDocumentNumber  String
  idDocumentExpiry  DateTime
  idDocumentIssuer  String

  // Section 2: Licenses & Certifications (stored as JSON array)
  // Each: { type, number, issueDate, expiryDate, issuingAuthority, isCertification }
  licenses          Json             // Array of license objects

  // Section 4: Company (denormalized for quick queries)
  currentVendorId   String?

  // Section 5: Consents
  dataProcessingConsent     Boolean   @default(false)
  dataProcessingTimestamp   DateTime?
  operationalCommsConsent   Boolean   @default(false)
  operationalCommsTimestamp DateTime?
  geolocationConsent        Boolean   @default(false)
  geolocationTimestamp      DateTime?
  imageUsageConsent         Boolean   @default(false)
  imageUsageTimestamp       DateTime?
  consentVersion            String    @default("1.0")

  @@index([taxCode])
}
```

### DriverDocument (New)

```prisma
model DriverDocument {
  id        String   @id @default(cuid())
  driverId  String
  driver    Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  type      DriverDocumentType
  label     String
  fileName  String?
  notes     String?
  required  Boolean  @default(false)

  // File storage (nullable until upload implemented)
  fileUrl   String?
  uploadedAt DateTime?

  @@index([driverId])
}
```

### DriverVendorLink (New - Company Association)

```prisma
model DriverVendorLink {
  id        String   @id @default(cuid())
  driverId  String
  driver    Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  vendorId  String
  vendor    Vendor   @relation(fields: [vendorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  status    String   @default("PENDING")  // PENDING | ACTIVE | INACTIVE
  linkedAt  DateTime @default(now())
  activatedAt DateTime?

  @@index([driverId])
  @@index([vendorId])
}

// Partial unique index in SQL migration:
// CREATE UNIQUE INDEX "DriverVendorLink_driverId_active"
//   ON "DriverVendorLink" ("driverId") WHERE status = 'ACTIVE';
```

### User Model Update

```prisma
model User {
  // ... existing fields ...
  driverId  String?   @unique
  driver    Driver?   @relation(fields: [driverId], references: [id])
}
```

### Vendor Model Update

```prisma
model Vendor {
  // ... existing fields ...
  driverLinks DriverVendorLink[]
}
```

---

## 3. Zod Schema + Step Fields

```typescript
// src/lib/schemas/driver-onboarding.ts

import { z } from "zod";

// ============ Sub-schemas ============

const addressSchema = z.object({
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  province: z.string().min(2).max(2), // Italian province code
  postalCode: z.string().regex(/^\d{5}$/),
  country: z.string().default("Italia"),
});

const ID_DOCUMENT_TYPES = ["ID_CARD", "PASSPORT", "DRIVING_LICENSE"] as const;

// License types - validated here, not in DB enum
const LICENSE_TYPES = [
  "B",
  "BE",
  "C",
  "CE",
  "C1",
  "C1E",
  "D",
  "DE", // Standard
  "CQC_MERCI",
  "CQC_PERSONE",
  "KB", // Professional
  "ADR_BASE",
  "ADR_TANK",
  "ADR_EXPLOSIVE",
  "CAP",
  "NCC", // Certifications
] as const;

const CERTIFICATION_TYPES = [
  "CQC_MERCI",
  "CQC_PERSONE",
  "ADR_BASE",
  "ADR_TANK",
  "ADR_EXPLOSIVE",
  "CAP",
  "NCC",
];

const licenseSchema = z
  .object({
    type: z.enum(LICENSE_TYPES),
    number: z.string().min(5).max(50),
    issueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
    expiryDate: z
      .string()
      .refine((d) => new Date(d) > new Date(), "Must be future date"),
    issuingAuthority: z.string().min(2).max(255),
  })
  .transform((data) => ({
    ...data,
    isCertification: CERTIFICATION_TYPES.includes(data.type),
  }));

const DOCUMENT_TYPES = [
  "ID_DOCUMENT",
  "DRIVING_LICENSE",
  "SIGNED_GDPR_FORM",
  "ADR_CERTIFICATE",
  "CQC_CERTIFICATE",
  "MEDICAL_CERTIFICATE",
  "OTHER",
] as const;

const documentMetadataSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  label: z.string().min(1).max(255),
  fileName: z.string().optional(),
  notes: z.string().optional(),
});

// ============ Main Schema ============

export const driverOnboardingSchema = z.object({
  // Step 0: Personal Data
  fullName: z.string().min(2).max(255),
  birthDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  birthPlace: z.string().min(2).max(255),
  taxCode: z
    .string()
    .transform((v) => v.toUpperCase().replace(/\s/g, ""))
    .refine(
      (v) => /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(v),
      "Invalid codice fiscale",
    ),
  nationality: z.string().default("Italiana"),
  residentialAddress: addressSchema,
  domicileAddress: addressSchema.optional(),
  phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\+?\d{6,15}$/.test(v), "Invalid phone number"),
  email: z.string().email(),
  pecEmail: z.string().email().optional().or(z.literal("")),

  // Step 1: Identity Document
  idDocumentType: z.enum(ID_DOCUMENT_TYPES),
  idDocumentNumber: z.string().min(5).max(50),
  idDocumentExpiry: z
    .string()
    .refine((d) => new Date(d) > new Date(), "Document expired"),
  idDocumentIssuer: z.string().min(2).max(255),

  // Step 2: Licenses & Certifications
  licenses: z.array(licenseSchema).min(1, "At least one license required"),

  // Step 3: Documents
  documents: z.array(documentMetadataSchema).min(1),

  // Step 4: Company Selection
  vendorId: z.string().min(1, "Company selection required"),

  // Step 5: Consents
  dataProcessingConsent: z.literal(true, {
    errorMap: () => ({ message: "Data processing consent is required" }),
  }),
  operationalCommsConsent: z.boolean().default(false),
  geolocationConsent: z.boolean().default(false),
  imageUsageConsent: z.boolean().default(false),
});

export type DriverOnboardingInput = z.infer<typeof driverOnboardingSchema>;

// ============ Step Configuration ============

export const STEP_FIELDS: (keyof DriverOnboardingInput)[][] = [
  // Step 0: Personal Data
  [
    "fullName",
    "birthDate",
    "birthPlace",
    "taxCode",
    "nationality",
    "residentialAddress",
    "domicileAddress",
    "phone",
    "email",
    "pecEmail",
    "idDocumentType",
    "idDocumentNumber",
    "idDocumentExpiry",
    "idDocumentIssuer",
  ],
  // Step 1: Licenses & Certifications
  ["licenses"],
  // Step 2: Documents
  ["documents"],
  // Step 3: Company
  ["vendorId"],
  // Step 4: Consents
  [
    "dataProcessingConsent",
    "operationalCommsConsent",
    "geolocationConsent",
    "imageUsageConsent",
  ],
];

export const STEP_LABELS = [
  "Personal Data",
  "Licenses & Certifications",
  "Documents",
  "Company",
  "Consents",
];

export const TOTAL_STEPS = STEP_FIELDS.length;

export const REQUIRED_DOCUMENTS: (typeof DOCUMENT_TYPES)[number][] = [
  "ID_DOCUMENT",
  "DRIVING_LICENSE",
  "SIGNED_GDPR_FORM",
];
```

---

## 4. Server Action

```typescript
// src/actions/driver-onboarding.ts

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, AuditAction } from "@/lib/audit";
import {
  driverOnboardingSchema,
  REQUIRED_DOCUMENTS,
} from "@/lib/schemas/driver-onboarding";
import { revalidatePath } from "next/cache";

export async function submitDriverOnboarding(
  data: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Idempotency: check user hasn't already submitted
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingData: true, driverId: true },
  });

  if (existingUser?.onboardingData || existingUser?.driverId) {
    return { success: false, error: "Onboarding already submitted" };
  }

  // Validate
  const parsed = driverOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed" };
  }

  const validated = parsed.data;
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Driver (legacy fields for backward compat)
      const driver = await tx.driver.create({
        data: {
          name: validated.fullName,
          phone: validated.phone,
        },
      });

      // 2. Create DriverProfile (source of truth)
      await tx.driverProfile.create({
        data: {
          driverId: driver.id,
          fullName: validated.fullName,
          birthDate: new Date(validated.birthDate),
          birthPlace: validated.birthPlace,
          taxCode: validated.taxCode,
          nationality: validated.nationality,
          residentialAddress: validated.residentialAddress,
          domicileAddress: validated.domicileAddress ?? undefined,
          phone: validated.phone,
          email: validated.email,
          pecEmail: validated.pecEmail || undefined,
          idDocumentType: validated.idDocumentType,
          idDocumentNumber: validated.idDocumentNumber,
          idDocumentExpiry: new Date(validated.idDocumentExpiry),
          idDocumentIssuer: validated.idDocumentIssuer,
          licenses: validated.licenses,
          currentVendorId: validated.vendorId,
          // Consents with timestamps (server-side)
          dataProcessingConsent: validated.dataProcessingConsent,
          dataProcessingTimestamp: now,
          operationalCommsConsent: validated.operationalCommsConsent,
          operationalCommsTimestamp: validated.operationalCommsConsent
            ? now
            : null,
          geolocationConsent: validated.geolocationConsent,
          geolocationTimestamp: validated.geolocationConsent ? now : null,
          imageUsageConsent: validated.imageUsageConsent,
          imageUsageTimestamp: validated.imageUsageConsent ? now : null,
        },
      });

      // 3. Create DriverDocuments (metadata only)
      await tx.driverDocument.createMany({
        data: validated.documents.map((doc) => ({
          driverId: driver.id,
          type: doc.type,
          label: doc.label,
          fileName: doc.fileName,
          notes: doc.notes,
          required: REQUIRED_DOCUMENTS.includes(doc.type),
        })),
      });

      // 4. Create DriverVendorLink
      await tx.driverVendorLink.create({
        data: {
          driverId: driver.id,
          vendorId: validated.vendorId,
          status: "PENDING",
        },
      });

      // 5. Update User
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          role: "DRIVER",
          status: "PENDING",
          driverId: driver.id,
          onboardingData: validated as unknown as Prisma.JsonObject,
        },
      });
    });

    // Audit log (no PII in diff)
    await logAction({
      action: AuditAction.ONBOARDING_SUBMITTED,
      userId: session.user.id,
      targetType: "User",
      targetId: session.user.id,
      diff: { role: "DRIVER" },
    });

    revalidatePath("/pending");
    return { success: true };
  } catch (error) {
    console.error("Driver onboarding error:", error);
    return { success: false, error: "Submission failed" };
  }
}
```

---

## 5. Admin Approval Data + Renderer

### Data Fetcher

```typescript
// src/data/driver-approvals.ts

import { prisma } from "@/lib/prisma";
import type { JsonValue } from "@prisma/client/runtime/library";

export type DriverProfileDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  taxCode: string;
  birthDate: Date;
  birthPlace: string;
  nationality: string;
  residentialAddress: JsonValue;
  domicileAddress: JsonValue | null;
  idDocument: {
    type: string;
    number: string;
    expiry: Date;
    issuer: string;
  };
  licenses: Array<{
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
    isCertification: boolean;
  }>;
  documents: Array<{
    type: string;
    label: string;
    fileName: string | null;
    required: boolean;
  }>;
  vendor: {
    id: string;
    name: string;
  } | null;
  consents: {
    dataProcessing: { given: boolean; timestamp: Date | null };
    operationalComms: { given: boolean; timestamp: Date | null };
    geolocation: { given: boolean; timestamp: Date | null };
    imageUsage: { given: boolean; timestamp: Date | null };
  };
};

export async function fetchDriverProfileForApproval(
  driverId: string,
): Promise<DriverProfileDetail | null> {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      profile: true,
      documents: true,
      vendorLinks: {
        where: { status: { in: ["PENDING", "ACTIVE"] } },
        include: { vendor: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });

  if (!driver?.profile) return null;

  const profile = driver.profile;
  const activeLink = driver.vendorLinks[0];

  return {
    id: driver.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    taxCode: profile.taxCode,
    birthDate: profile.birthDate,
    birthPlace: profile.birthPlace,
    nationality: profile.nationality,
    residentialAddress: profile.residentialAddress,
    domicileAddress: profile.domicileAddress,
    idDocument: {
      type: profile.idDocumentType,
      number: profile.idDocumentNumber,
      expiry: profile.idDocumentExpiry,
      issuer: profile.idDocumentIssuer,
    },
    licenses: profile.licenses as DriverProfileDetail["licenses"],
    documents: driver.documents.map((d) => ({
      type: d.type,
      label: d.label,
      fileName: d.fileName,
      required: d.required,
    })),
    vendor: activeLink?.vendor ?? null,
    consents: {
      dataProcessing: {
        given: profile.dataProcessingConsent,
        timestamp: profile.dataProcessingTimestamp,
      },
      operationalComms: {
        given: profile.operationalCommsConsent,
        timestamp: profile.operationalCommsTimestamp,
      },
      geolocation: {
        given: profile.geolocationConsent,
        timestamp: profile.geolocationTimestamp,
      },
      imageUsage: {
        given: profile.imageUsageConsent,
        timestamp: profile.imageUsageTimestamp,
      },
    },
  };
}
```

### Renderer Component

```tsx
// src/app/dashboard/approvals/[id]/driver-profile-detail.tsx

import { formatDate, formatAddress } from "@/lib/format";
import type { DriverProfileDetail } from "@/data/driver-approvals";

export function renderDriverProfile(profile: DriverProfileDetail) {
  return (
    <div className="space-y-6">
      {/* Section: Personal Data */}
      <section aria-labelledby="personal-data-heading">
        <h3 id="personal-data-heading" className="text-lg font-semibold">
          Personal Data
        </h3>
        <dl className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <dt className="text-muted-foreground">Full Name</dt>
            <dd>{profile.fullName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tax Code</dt>
            <dd>{profile.taxCode}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Birth Date</dt>
            <dd>{formatDate(profile.birthDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Birth Place</dt>
            <dd>{profile.birthPlace}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{profile.phone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Address</dt>
            <dd>{formatAddress(profile.residentialAddress)}</dd>
          </div>
        </dl>
      </section>

      {/* Section: Identity Document */}
      <section aria-labelledby="id-document-heading">
        <h3 id="id-document-heading" className="text-lg font-semibold">
          Identity Document
        </h3>
        <dl className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd>{profile.idDocument.type}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Number</dt>
            <dd>{profile.idDocument.number}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Expiry</dt>
            <dd>{formatDate(profile.idDocument.expiry)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Issuer</dt>
            <dd>{profile.idDocument.issuer}</dd>
          </div>
        </dl>
      </section>

      {/* Section: Licenses */}
      <section aria-labelledby="licenses-heading">
        <h3 id="licenses-heading" className="text-lg font-semibold">
          Licenses & Certifications
        </h3>
        <ul className="mt-2 space-y-2">
          {profile.licenses.map((lic, i) => (
            <li key={i} className="border rounded p-2">
              <span className="font-medium">{lic.type}</span>
              {lic.isCertification && (
                <span className="ml-2 text-xs bg-blue-100 px-1 rounded">
                  Certification
                </span>
              )}
              <div className="text-sm text-muted-foreground">
                #{lic.number} | Expires: {formatDate(lic.expiryDate)}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Section: Documents */}
      <section aria-labelledby="documents-heading">
        <h3 id="documents-heading" className="text-lg font-semibold">
          Documents
        </h3>
        <ul className="mt-2 space-y-1">
          {profile.documents.map((doc, i) => (
            <li key={i} className="flex items-center gap-2">
              <span>{doc.required ? "●" : "○"}</span>
              <span>{doc.type}</span>
              <span className="text-muted-foreground">— {doc.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Section: Company */}
      <section aria-labelledby="company-heading">
        <h3 id="company-heading" className="text-lg font-semibold">
          Company
        </h3>
        <p className="mt-2">{profile.vendor?.name ?? "No company linked"}</p>
      </section>

      {/* Section: Consents */}
      <section aria-labelledby="consents-heading">
        <h3 id="consents-heading" className="text-lg font-semibold">
          Consents
        </h3>
        <ul className="mt-2 space-y-1">
          <li>
            {profile.consents.dataProcessing.given ? "✓" : "✗"} Data Processing{" "}
            {profile.consents.dataProcessing.timestamp &&
              `(${formatDate(profile.consents.dataProcessing.timestamp)})`}
          </li>
          <li>
            {profile.consents.operationalComms.given ? "✓" : "✗"} Operational
            Communications
          </li>
          <li>{profile.consents.geolocation.given ? "✓" : "✗"} Geolocation</li>
          <li>{profile.consents.imageUsage.given ? "✓" : "✗"} Image Usage</li>
        </ul>
      </section>
    </div>
  );
}
```

---

## 6. MVP Implementation Phases

### Phase 1: Database (0.5 day)

- [ ] Add `DriverDocumentType` enum to schema
- [ ] Add `DriverProfile` model
- [ ] Add `DriverDocument` model
- [ ] Add `DriverVendorLink` model
- [ ] Add `driverId` to User model
- [ ] Add `driverLinks` to Vendor model
- [ ] Write migration SQL (additive only)
- [ ] Add partial unique index for active vendor link
- [ ] Run `prisma generate`

### Phase 2: Schema + Server Action (0.5 day)

- [ ] Create `src/lib/schemas/driver-onboarding.ts`
- [ ] Create `src/actions/driver-onboarding.ts`
- [ ] Test server action with mock data

### Phase 3: Onboarding Form (1 day)

- [ ] Create `page.tsx` (server component with auth check)
- [ ] Create `driver-onboarding-form.tsx` (5-step wizard)
- [ ] Create `personal-data-step.tsx`
- [ ] Create `licenses-step.tsx` (with useFieldArray)
- [ ] Create `documents-step.tsx`
- [ ] Create `company-step.tsx` (vendor dropdown)
- [ ] Create `consents-step.tsx`
- [ ] Add session refresh + redirect after submit

### Phase 4: Admin Approval (0.5 day)

- [ ] Create `src/data/driver-approvals.ts`
- [ ] Create `driver-profile-detail.tsx` renderer
- [ ] Add DRIVER case to approval detail page
- [ ] Test approval flow

### Phase 5: Driver Dashboard MVP (0.5 day)

- [ ] Create `/dashboard/driver/page.tsx`
- [ ] Add read-only profile card
- [ ] Show onboarding completion status
- [ ] Update middleware for driver routes

### Phase 6: CodeRabbit Fixes (0.25 day)

- [ ] Add aria-labels to all sections
- [ ] Add null guards where needed
- [ ] Verify no redundant indexes
- [ ] Use locale-safe date formatting
- [ ] Test with screen reader

---

## Summary

| Item               | Pattern Source           | Notes                                |
| ------------------ | ------------------------ | ------------------------------------ |
| 5-step wizard      | Client #186              | Same step structure                  |
| Profile 1:1        | Vendor #185, Client #186 | DriverProfile mirrors pattern        |
| Documents metadata | Vendor #185              | Same structure                       |
| License types      | String + Zod             | Not enum (too rigid)                 |
| Company link       | New pattern              | DriverVendorLink with partial unique |
| Consent timestamps | Vendor #185              | Server-side only                     |
| Server action      | Both PRs                 | Transaction + audit log              |
| Admin renderer     | Both PRs                 | Section-based layout                 |

**Total effort:** ~3 days
