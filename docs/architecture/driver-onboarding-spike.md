# Driver Role: Architectural Spike

**Date:** 2025-02-05
**Status:** Draft
**Author:** Principal Architect

---

## 1. Architecture Overview

### Context

The Driver role represents individuals who perform delivery/transport operations for Vendors (or future Logistics Partners). Unlike Vendors and Clients, Drivers:

- Are **subordinate entities** linked to a parent company (Vendor)
- Have **time-sensitive credentials** (licenses, certifications) requiring expiration tracking
- Require **operational consents** (geolocation, image usage) beyond standard GDPR
- May **change companies** over time while retaining identity

### Design Principles

1. **Profile-centric**: Rich `DriverProfile` model mirrors Vendor/Client pattern
2. **License as first-class entity**: Separate `DriverLicense` model for renewal tracking
3. **Company-agnostic identity**: Driver persists across company changes via junction table
4. **Compliance-ready**: Consent timestamps, document versioning, audit trail

### High-Level Flow

```
User Created (ONBOARDING)
    → Driver fills multi-step wizard (4 sections)
    → Submit creates Driver + DriverProfile + DriverLicense + DriverDocuments
    → User status → PENDING, role → DRIVER
    → Admin reviews in /dashboard/approvals
    → Approve → status → APPROVED, Driver activated
    → Expiration cron monitors licenses/documents
```

---

## 2. Prisma Models

### 2.1 Driver (Core Entity)

```prisma
model Driver {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Unique identifier - only field duplicated from profile (for queries/constraints)
  taxCode      String   @unique  // Codice fiscale

  // Status tracking
  status          DriverStatus @default(PENDING)
  approvedAt      DateTime?    // When admin approved
  activatedAt     DateTime?    // When docs verified + company link active
  suspendedAt     DateTime?
  suspendedReason String?

  // Relations (1:1 with User)
  profile      DriverProfile?
  licenses     DriverLicense[]
  documents    DriverDocument[]
  companyLinks DriverCompanyLink[]
  user         User?              // Singular - 1:1 relationship

  @@index([status])
  @@index([taxCode])
}

enum DriverStatus {
  PENDING      // Awaiting admin approval
  APPROVED     // Admin approved, awaiting doc verification / company activation
  ACTIVE       // Docs verified + company link active - can work
  SUSPENDED    // Temporarily suspended (expired docs, compliance, etc.)
  INACTIVE     // Voluntarily inactive or GDPR withdrawal
  REJECTED     // Onboarding rejected by admin
}
```

### 2.2 DriverProfile (1:1 Detail)

```prisma
model DriverProfile {
  id        String   @id @default(cuid())
  driverId  String   @unique
  driver    Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Section 1: Dati anagrafici (Personal Data)
  fullName        String
  birthDate       DateTime
  birthPlace      String
  taxCode         String           // Codice fiscale
  nationality     String           @default("Italiana")

  // Addresses (JSON for flexibility)
  residentialAddress Json          // { street, city, province, postalCode, country }
  domicileAddress    Json?         // Optional if different from residential

  // Contact
  phone           String
  email           String
  pecEmail        String?          // Optional PEC

  // Identity Document
  idDocumentType   DriverIdDocumentType
  idDocumentNumber String
  idDocumentExpiry DateTime
  idDocumentIssuer String          // Ente rilascio

  // Section 2: Company Reference (populated after linking)
  currentCompanyId String?         // Denormalized for quick queries

  // Section 3: Consents (with timestamps for compliance)
  dataProcessingConsent     Boolean   @default(false)
  dataProcessingTimestamp   DateTime?
  operationalCommsConsent   Boolean   @default(false)
  operationalCommsTimestamp DateTime?
  geolocationConsent        Boolean   @default(false)
  geolocationTimestamp      DateTime?
  imageUsageConsent         Boolean   @default(false)
  imageUsageTimestamp       DateTime?
  consentVersion            String    @default("1.0")

  // Metadata
  notes           String?          // Internal notes
}

enum DriverIdDocumentType {
  ID_CARD           // Carta d'identità
  PASSPORT          // Passaporto
  DRIVING_LICENSE   // Patente (as ID)
}
```

### 2.3 DriverLicense (Separate for Expiration Tracking)

```prisma
model DriverLicense {
  id        String   @id @default(cuid())
  driverId  String
  driver    Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // License Details - using String for flexibility (validated by Zod on edge)
  // Common values: "B", "C", "CE", "CQC_MERCI", "ADR_BASE", etc.
  licenseType      String
  licenseNumber    String
  issueDate        DateTime
  expiryDate       DateTime
  issuingAuthority String         // Ente rilascio

  // Status
  isVerified       Boolean   @default(false)
  verifiedAt       DateTime?
  verifiedByUserId String?

  // Certification flag (ADR, NCC, CAP, CQC are certs, B/C/D are licenses)
  isCertification  Boolean   @default(false)

  // Document reference (if uploaded)
  documentId       String?   @unique
  document         DriverDocument? @relation(fields: [documentId], references: [id])

  @@index([driverId])
  @@index([expiryDate])
  @@index([licenseType])
}

// License types are NOT an enum - too rigid for Italian bureaucracy changes.
// Validation happens in Zod schema. Common types for reference:
//
// Standard licenses: B, BE, C, CE, C1, C1E, D, DE
// Professional: CQC_MERCI, CQC_PERSONE, KB
// Certifications: ADR_BASE, ADR_TANK, ADR_EXPLOSIVE, CAP, NCC
```

### 2.4 DriverDocument

```prisma
model DriverDocument {
  id              String   @id @default(cuid())
  driverId        String
  driver          Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Document metadata
  type            DriverDocumentType
  label           String             // User-provided label
  fileName        String?            // Original filename
  notes           String?

  // File storage - ready for upload implementation
  storageKey      String?            // Stable key for file retrieval (e.g., "drivers/{driverId}/docs/{id}")
  storageProvider String?            // "vercel-blob" | "s3" | etc.
  fileUrl         String?            // Public/signed URL (may expire)
  mimeType        String?            // "application/pdf", "image/jpeg", etc.
  sizeBytes       Int?               // File size for quota/validation
  uploadedAt      DateTime?

  // Validation
  required        Boolean   @default(false)
  expiryDate      DateTime?          // For docs that expire
  isVerified      Boolean   @default(false)
  verifiedAt      DateTime?
  verifiedByUserId String?

  // Back-reference for license docs
  license         DriverLicense?

  @@index([driverId])
  @@index([type])
  @@index([expiryDate])
}

enum DriverDocumentType {
  ID_DOCUMENT           // Documento d'identità
  DRIVING_LICENSE       // Patente (scan)
  SIGNED_GDPR_FORM      // Modulo privacy firmato
  ADR_CERTIFICATE       // Certificato ADR
  CQC_CERTIFICATE       // Carta qualificazione conducente
  MEDICAL_CERTIFICATE   // Certificato medico
  CRIMINAL_RECORD       // Casellario giudiziale
  OTHER
}
```

### 2.5 DriverCompanyLink (Junction for Company Association)

```prisma
model DriverCompanyLink {
  id        String   @id @default(cuid())
  driverId  String
  driver    Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)

  // Polymorphic company reference
  companyType   CompanyType
  vendorId      String?
  vendor        Vendor?  @relation(fields: [vendorId], references: [id])
  // Future: logisticsPartnerId for logistics companies

  // Invite token (for invite-first flow)
  inviteToken   String?   @unique
  invitedAt     DateTime?
  invitedByUserId String?

  // Link status
  status        DriverCompanyLinkStatus @default(PENDING)
  role          String?               // e.g., "Primary Driver", "Backup"

  // Timestamps
  linkedAt      DateTime  @default(now())
  activatedAt   DateTime?
  deactivatedAt DateTime?
  deactivatedReason String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // NOTE: Do NOT use @@unique([driverId, vendorId]) - nullable vendorId allows duplicates in Postgres
  // Constraints enforced via partial unique indexes in SQL migration (see below)
  @@index([driverId])
  @@index([vendorId])
  @@index([status])
  @@index([inviteToken])
}

// Partial unique indexes (add in SQL migration - Prisma can't express these):
//
// -- Only one ACTIVE link per driver
// CREATE UNIQUE INDEX "DriverCompanyLink_driverId_active_unique"
//   ON "DriverCompanyLink" ("driverId")
//   WHERE status = 'ACTIVE';
//
// -- Only one PENDING link per driver
// CREATE UNIQUE INDEX "DriverCompanyLink_driverId_pending_unique"
//   ON "DriverCompanyLink" ("driverId")
//   WHERE status = 'PENDING';

enum CompanyType {
  VENDOR
  LOGISTICS_PARTNER   // Future
}

enum DriverCompanyLinkStatus {
  PENDING       // Link requested, awaiting approval
  ACTIVE        // Currently active with company
  INACTIVE      // Deactivated but history preserved
  REJECTED      // Company rejected link
}
```

### 2.6 User Model Updates

```prisma
model User {
  // ... existing fields ...

  // Add Driver relation
  driverId  String?   @unique
  driver    Driver?   @relation(fields: [driverId], references: [id])
}
```

### 2.7 Indexes for Expiration Queries

```prisma
// Add to DriverLicense
@@index([expiryDate, isVerified])  // For expiring-soon queries

// Add to DriverDocument
@@index([expiryDate, type])  // For document expiration alerts
```

---

## 3. Onboarding UX Flow

### 3.1 Step Structure (4 Sections)

| Step | Section                   | Fields                                                                                                                                       | Validation                        |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 0    | Personal Data             | fullName, birthDate, birthPlace, taxCode, nationality, residentialAddress, domicileAddress (opt), phone, email, pecEmail (opt), idDocument\* | Required except noted             |
| 1    | Licenses & Certifications | Primary license (type, number, dates, issuer), Additional licenses/certs (array)                                                             | At least 1 license required       |
| 2    | Documents                 | ID document (metadata), License scan (metadata), GDPR form (metadata)                                                                        | ID + License + GDPR required      |
| 3    | Company & Consents        | companySearch/select, dataProcessing (req), operationalComms, geolocation, imageUsage                                                        | Company + dataProcessing required |

### 3.2 Form Component Structure

```
src/app/onboarding/driver/
├── page.tsx                      # Server component, auth check
├── driver-onboarding-form.tsx    # Client component, wizard container
└── steps/
    ├── personal-data-step.tsx    # Step 0
    ├── licenses-step.tsx         # Step 1 (with dynamic array)
    ├── documents-step.tsx        # Step 2
    └── company-consents-step.tsx # Step 3
```

### 3.3 Schema Definition

```typescript
// src/lib/schemas/driver-onboarding.ts

export const driverOnboardingSchema = z.object({
  // Section 1: Personal Data
  fullName: z.string().min(2).max(255),
  birthDate: z.string().refine(isValidDate, "Invalid date"),
  birthPlace: z.string().min(2).max(255),
  taxCode: z
    .string()
    .regex(
      /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i,
      "Invalid codice fiscale",
    ),
  nationality: z.string().default("Italiana"),

  residentialAddress: addressSchema,
  domicileAddress: addressSchema.optional(),

  phone: z.string().min(6).max(20),
  email: z.string().email(),
  pecEmail: z.string().email().optional().or(z.literal("")),

  idDocumentType: z.nativeEnum(DriverIdDocumentType),
  idDocumentNumber: z.string().min(5).max(50),
  idDocumentExpiry: z
    .string()
    .refine(isFutureDate, "Document must not be expired"),
  idDocumentIssuer: z.string().min(2).max(255),

  // Section 2: Licenses
  licenses: z.array(licenseSchema).min(1, "At least one license required"),

  // Section 3: Documents
  documents: z.array(documentMetadataSchema).min(1),

  // Section 4: Company & Consents
  companyId: z.string().min(1, "Company selection required"),
  companyType: z.nativeEnum(CompanyType),

  dataProcessingConsent: z.literal(true, {
    errorMap: () => ({ message: "Data processing consent is required" }),
  }),
  operationalCommsConsent: z.boolean().default(false),
  geolocationConsent: z.boolean().default(false),
  imageUsageConsent: z.boolean().default(false),
});

// License types validated by Zod (not DB enum - too rigid for Italian bureaucracy)
const VALID_LICENSE_TYPES = [
  // Standard licenses
  "B",
  "BE",
  "C",
  "CE",
  "C1",
  "C1E",
  "D",
  "DE",
  // Professional qualifications
  "CQC_MERCI",
  "CQC_PERSONE",
  "KB",
  // Special certifications
  "ADR_BASE",
  "ADR_TANK",
  "ADR_EXPLOSIVE",
  "CAP",
  "NCC",
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
    licenseType: z.enum(VALID_LICENSE_TYPES),
    licenseNumber: z.string().min(5).max(50),
    issueDate: z.string().refine(isValidDate),
    expiryDate: z.string().refine(isFutureDate, "License must not be expired"),
    issuingAuthority: z.string().min(2).max(255),
  })
  .transform((data) => ({
    ...data,
    // Auto-derive isCertification from type
    isCertification: CERTIFICATION_TYPES.includes(data.licenseType),
  }));

export const DRIVER_STEP_FIELDS: (keyof DriverOnboardingInput)[][] = [
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
  // Step 1: Licenses
  ["licenses"],
  // Step 2: Documents
  ["documents"],
  // Step 3: Company & Consents
  [
    "companyId",
    "companyType",
    "dataProcessingConsent",
    "operationalCommsConsent",
    "geolocationConsent",
    "imageUsageConsent",
  ],
];

export const REQUIRED_DRIVER_DOCUMENTS: DriverDocumentType[] = [
  "ID_DOCUMENT",
  "DRIVING_LICENSE",
  "SIGNED_GDPR_FORM",
];
```

### 3.4 Company Association UX (Invite-First)

**Primary flow: Vendor invites driver**

This is the recommended operational pattern. Reduces admin noise and matches real-world delivery ops.

1. Vendor clicks "Invite Driver" in their dashboard
2. System creates `DriverCompanyLink` with `inviteToken`, status PENDING
3. Vendor shares invite link: `/onboarding/driver?invite={token}`
4. Driver clicks link, onboarding form pre-fills company
5. Company selection step is read-only (shows linked vendor)
6. Driver cannot change company during initial onboarding

**Fallback flow: Driver self-selects company**

For cases where driver finds Hydra independently:

1. Driver lands on `/onboarding/driver` without invite token
2. Company selection shows searchable dropdown of approved Vendors
3. Driver selects company → creates PENDING link (requires admin approval)
4. Higher admin scrutiny for self-selected company links

```typescript
// Check for invite token on page load
export async function resolveDriverInvite(token: string) {
  const link = await prisma.driverCompanyLink.findUnique({
    where: { inviteToken: token, status: "PENDING" },
    include: { vendor: { select: { id: true, name: true } } },
  });

  if (!link || !link.vendor) return null;

  return {
    companyId: link.vendor.id,
    companyName: link.vendor.name,
    companyType: "VENDOR" as const,
    linkId: link.id,
  };
}

// Fetch approved vendors for self-selection (fallback)
export async function fetchApprovedVendors(search?: string) {
  return prisma.vendor.findMany({
    where: {
      users: { some: { status: "APPROVED" } },
      name: search ? { contains: search, mode: "insensitive" } : undefined,
    },
    select: {
      id: true,
      name: true,
      profile: { select: { tradeName: true, industry: true } },
    },
    take: 20,
  });
}

// Vendor creates invite
export async function createDriverInvite(
  vendorId: string,
): Promise<{ token: string; url: string }> {
  await requireVendorAccess(vendorId);

  const token = generateSecureToken(); // e.g., nanoid(32)

  await prisma.driverCompanyLink.create({
    data: {
      driverId: null, // Will be linked when driver submits
      vendorId,
      companyType: "VENDOR",
      inviteToken: token,
      invitedAt: new Date(),
      invitedByUserId: (await currentUser())?.id,
      status: "PENDING",
    },
  });

  return {
    token,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/driver?invite=${token}`,
  };
}
```

**UX for company step:**

| Scenario              | Company Field            | Behavior                                        |
| --------------------- | ------------------------ | ----------------------------------------------- |
| Has invite token      | Read-only, shows company | "You were invited by [Company]"                 |
| No invite token       | Searchable dropdown      | "Select your company"                           |
| Invalid/expired token | Searchable dropdown      | Toast: "Invite expired, please select manually" |

````

### 3.5 Draft/Resume Pattern

Following Vendor/Client pattern:

- Form state persisted in `localStorage` key: `driver-onboarding-draft-{userId}`
- On mount, check for existing draft and restore
- Auto-save on field blur (debounced)
- Clear draft on successful submission
- Show "Resume draft?" dialog if draft exists

---

## 4. Approval System

### 4.1 Submission Flow

```typescript
// src/actions/driver-onboarding.ts

export async function submitDriverOnboarding(
  data: DriverOnboardingInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate
  const parsed = driverOnboardingSchema.safeParse(data);
  if (!parsed.ok) {
    return { success: false, error: "Validation failed" };
  }

  const now = new Date();
  const validated = parsed.data;

  // Transaction: create all related entities
  await prisma.$transaction(async (tx) => {
    // 1. Create Driver (only taxCode denormalized - profile is source of truth)
    const driver = await tx.driver.create({
      data: {
        taxCode: validated.taxCode.toUpperCase(),
        status: "PENDING",
      },
    });

    // 2. Create DriverProfile
    await tx.driverProfile.create({
      data: {
        driverId: driver.id,
        fullName: validated.fullName,
        birthDate: new Date(validated.birthDate),
        birthPlace: validated.birthPlace,
        taxCode: validated.taxCode.toUpperCase(),
        nationality: validated.nationality,
        residentialAddress: validated.residentialAddress,
        domicileAddress: validated.domicileAddress || undefined,
        phone: validated.phone,
        email: validated.email,
        pecEmail: validated.pecEmail || undefined,
        idDocumentType: validated.idDocumentType,
        idDocumentNumber: validated.idDocumentNumber,
        idDocumentExpiry: new Date(validated.idDocumentExpiry),
        idDocumentIssuer: validated.idDocumentIssuer,
        currentCompanyId: validated.companyId,
        // Consents with timestamps
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

    // 3. Create DriverLicenses
    await tx.driverLicense.createMany({
      data: validated.licenses.map((lic) => ({
        driverId: driver.id,
        licenseType: lic.licenseType,
        licenseNumber: lic.licenseNumber,
        issueDate: new Date(lic.issueDate),
        expiryDate: new Date(lic.expiryDate),
        issuingAuthority: lic.issuingAuthority,
        isCertification: lic.isCertification,
      })),
    });

    // 4. Create DriverDocuments (metadata only)
    await tx.driverDocument.createMany({
      data: validated.documents.map((doc) => ({
        driverId: driver.id,
        type: doc.type,
        label: doc.label,
        fileName: doc.fileName,
        notes: doc.notes,
        required: REQUIRED_DRIVER_DOCUMENTS.includes(doc.type),
      })),
    });

    // 5. Create DriverCompanyLink
    await tx.driverCompanyLink.create({
      data: {
        driverId: driver.id,
        companyType: validated.companyType,
        vendorId:
          validated.companyType === "VENDOR" ? validated.companyId : null,
        status: "PENDING",
      },
    });

    // 6. Update User
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

  // Audit log
  await logAction({
    action: AuditAction.ONBOARDING_SUBMITTED,
    userId: session.user.id,
    targetType: "User",
    targetId: session.user.id,
    diff: { role: "DRIVER" },
  });

  revalidatePath("/pending");
  return { success: true };
}
````

### 4.2 Admin Review Enhancement

Update `src/data/approvals.ts` to include Driver data:

```typescript
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
    issueDate: Date;
    expiryDate: Date;
    issuer: string;
    isCertification: boolean;
  }>;
  documents: Array<{
    type: string;
    label: string;
    fileName: string | null;
    required: boolean;
  }>;
  company: {
    id: string;
    name: string;
    type: string;
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
      licenses: true,
      documents: true,
      companyLinks: {
        where: { status: { in: ["PENDING", "ACTIVE"] } },
        include: { vendor: { select: { id: true, name: true } } },
      },
    },
  });

  if (!driver?.profile) return null;

  const activeLink = driver.companyLinks[0];

  return {
    id: driver.id,
    fullName: driver.profile.fullName,
    email: driver.profile.email,
    phone: driver.profile.phone,
    taxCode: driver.taxCode,
    birthDate: driver.profile.birthDate,
    birthPlace: driver.profile.birthPlace,
    nationality: driver.profile.nationality,
    residentialAddress: driver.profile.residentialAddress,
    domicileAddress: driver.profile.domicileAddress,
    idDocument: {
      type: driver.profile.idDocumentType,
      number: driver.profile.idDocumentNumber,
      expiry: driver.profile.idDocumentExpiry,
      issuer: driver.profile.idDocumentIssuer,
    },
    licenses: driver.licenses.map((l) => ({
      type: l.licenseType,
      number: l.licenseNumber,
      issueDate: l.issueDate,
      expiryDate: l.expiryDate,
      issuer: l.issuingAuthority,
      isCertification: l.isCertification,
    })),
    documents: driver.documents.map((d) => ({
      type: d.type,
      label: d.label,
      fileName: d.fileName,
      required: d.required,
    })),
    company: activeLink?.vendor
      ? {
          id: activeLink.vendor.id,
          name: activeLink.vendor.name,
          type: "VENDOR",
        }
      : null,
    consents: {
      dataProcessing: {
        given: driver.profile.dataProcessingConsent,
        timestamp: driver.profile.dataProcessingTimestamp,
      },
      operationalComms: {
        given: driver.profile.operationalCommsConsent,
        timestamp: driver.profile.operationalCommsTimestamp,
      },
      geolocation: {
        given: driver.profile.geolocationConsent,
        timestamp: driver.profile.geolocationTimestamp,
      },
      imageUsage: {
        given: driver.profile.imageUsageConsent,
        timestamp: driver.profile.imageUsageTimestamp,
      },
    },
  };
}
```

### 4.3 Approval Actions

**State Machine:**

```
PENDING → APPROVED (admin approves identity/credentials)
APPROVED → ACTIVE (required docs verified + company link active)
ACTIVE → SUSPENDED (license expired, compliance issue)
SUSPENDED → ACTIVE (issue resolved)
```

```typescript
// src/actions/driver-approvals.ts

/**
 * Admin approves driver identity and credentials.
 * Driver moves to APPROVED but NOT yet ACTIVE.
 * ACTIVE requires: all required docs uploaded + company link activated.
 */
export async function approveDriver(driverId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: true, // Singular 1:1
      companyLinks: { where: { status: "PENDING" } },
      documents: { where: { required: true } },
    },
  });

  if (!driver || driver.status !== "PENDING") {
    return { success: false, error: "Driver not found or not pending" };
  }

  const now = new Date();
  const adminId = (await auth())?.user?.id;

  // Check if we can auto-activate (all required docs + company link)
  const hasAllRequiredDocs = driver.documents.every((d) => d.fileUrl !== null);
  const hasPendingCompanyLink = driver.companyLinks.length > 0;
  const canActivate = hasAllRequiredDocs && hasPendingCompanyLink;

  await prisma.$transaction(async (tx) => {
    // Update Driver status
    await tx.driver.update({
      where: { id: driverId },
      data: {
        status: canActivate ? "ACTIVE" : "APPROVED",
        approvedAt: now,
        activatedAt: canActivate ? now : null,
      },
    });

    // Activate company link if auto-activating
    if (canActivate && driver.companyLinks[0]) {
      await tx.driverCompanyLink.update({
        where: { id: driver.companyLinks[0].id },
        data: { status: "ACTIVE", activatedAt: now },
      });
    }

    // Update User status
    if (driver.user) {
      await tx.user.update({
        where: { id: driver.user.id },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedByUserId: adminId,
        },
      });
    }
  });

  await logAction({
    action: AuditAction.USER_APPROVED,
    userId: driver.user?.id ?? driverId,
    targetType: "Driver",
    targetId: driverId,
    diff: {
      previousStatus: "PENDING",
      newStatus: canActivate ? "ACTIVE" : "APPROVED",
      autoActivated: canActivate,
    },
  });

  // TODO: Send notification email to driver

  revalidatePath("/dashboard/approvals");
  return { success: true };
}

/**
 * Called when driver uploads missing required docs.
 * Checks if driver can transition APPROVED → ACTIVE.
 */
export async function checkDriverActivation(
  driverId: string,
): Promise<ActionResult> {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      documents: { where: { required: true } },
      companyLinks: { where: { status: "ACTIVE" } },
    },
  });

  if (!driver || driver.status !== "APPROVED") {
    return { success: false, error: "Driver not in APPROVED state" };
  }

  const hasAllRequiredDocs = driver.documents.every((d) => d.fileUrl !== null);
  const hasActiveCompanyLink = driver.companyLinks.length > 0;

  if (hasAllRequiredDocs && hasActiveCompanyLink) {
    await prisma.driver.update({
      where: { id: driverId },
      data: { status: "ACTIVE", activatedAt: new Date() },
    });

    await logAction({
      action: AuditAction.DRIVER_ACTIVATED,
      targetType: "Driver",
      targetId: driverId,
      diff: { reason: "All requirements met" },
    });

    return { success: true };
  }

  return {
    success: false,
    error: "Missing requirements",
    missingDocs: !hasAllRequiredDocs,
    missingCompanyLink: !hasActiveCompanyLink,
  };
}

export async function rejectDriver(
  driverId: string,
  reason?: string,
): Promise<ActionResult> {
  // Similar pattern to approveDriver
  // Set status to REJECTED, update User, log action
}
```

---

## 5. RBAC (Role-Based Access Control)

### 5.1 Driver Permissions Matrix

| Resource               | Pre-Approval | Post-Approval | Suspended |
| ---------------------- | ------------ | ------------- | --------- |
| Own profile (view)     | ✅           | ✅            | ✅        |
| Own profile (edit)     | ❌           | ✅ (limited)  | ❌        |
| Own documents (upload) | ❌           | ✅            | ❌        |
| Own licenses (view)    | ✅           | ✅            | ✅        |
| Company info (view)    | ❌           | ✅            | ✅        |
| Assigned jobs (view)   | ❌           | ✅            | ❌        |
| Accept jobs            | ❌           | ✅            | ❌        |
| Complete jobs          | ❌           | ✅            | ❌        |
| Dashboard access       | ❌           | ✅            | Limited   |

### 5.2 Middleware Configuration

```typescript
// src/middleware.ts additions

const DRIVER_ROUTES = {
  preApproval: ["/pending", "/onboarding/driver"],
  postApproval: ["/dashboard/driver", "/jobs", "/profile"],
  always: ["/api/auth", "/sign-out"],
};

// In middleware logic:
if (user.role === "DRIVER") {
  if (user.status === "PENDING") {
    // Only allow pending page
    if (!DRIVER_ROUTES.preApproval.includes(pathname)) {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
  } else if (user.status === "APPROVED") {
    // Full driver access
    if (pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/dashboard/driver", request.url));
    }
  } else if (user.status === "SUSPENDED") {
    // Limited access - show suspension notice
    if (!pathname.startsWith("/suspended")) {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }
  }
}
```

### 5.3 API Route Guards

```typescript
// src/lib/auth.ts additions

export async function requireDriver() {
  const user = await currentUser();
  if (!user || user.role !== "DRIVER") {
    throw new Error("Driver access required");
  }
  if (user.status !== "APPROVED") {
    throw new Error("Driver not approved");
  }
  return user;
}

export async function requireActiveDriver() {
  const user = await requireDriver();
  const driver = await prisma.driver.findUnique({
    where: { id: user.driverId! },
  });
  if (driver?.status !== "ACTIVE") {
    throw new Error("Driver not active");
  }
  return { user, driver };
}
```

---

## 6. Edge Cases

### 6.1 Multiple Drivers per Company

**Scenario:** Vendor has 5 drivers, needs overview.

**Solution:**

- Vendor dashboard shows linked drivers:
  ```typescript
  // src/data/vendor-drivers.ts
  export async function fetchVendorDrivers(vendorId: string) {
    return prisma.driverCompanyLink.findMany({
      where: { vendorId, status: "ACTIVE" },
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            status: true,
            licenses: { select: { licenseType: true, expiryDate: true } },
          },
        },
      },
    });
  }
  ```
- Vendor can see driver status but NOT edit driver data
- Vendor can request driver deactivation (creates admin task)

### 6.2 Driver Changing Company

**Scenario:** Driver leaves Vendor A, joins Vendor B.

**Flow:**

1. Driver requests company change via profile
2. Creates new `DriverCompanyLink` with status PENDING
3. Old link marked INACTIVE (not deleted - audit trail)
4. Admin reviews and approves new link
5. `currentCompanyId` on profile updated

```typescript
export async function requestCompanyChange(
  driverId: string,
  newVendorId: string,
): Promise<ActionResult> {
  // Deactivate current link
  await prisma.driverCompanyLink.updateMany({
    where: { driverId, status: "ACTIVE" },
    data: { status: "INACTIVE", deactivatedAt: new Date() },
  });

  // Create new pending link
  await prisma.driverCompanyLink.create({
    data: {
      driverId,
      vendorId: newVendorId,
      companyType: "VENDOR",
      status: "PENDING",
    },
  });

  // Update profile
  await prisma.driverProfile.update({
    where: { driverId },
    data: { currentCompanyId: null }, // Cleared until approved
  });

  return { success: true };
}
```

### 6.3 Expired License

**Scenario:** Driver's license expires while active.

**Solution:**

1. Cron job checks expiring licenses daily
2. 30 days before: Warning notification
3. 7 days before: Urgent notification + admin alert
4. On expiry: Auto-suspend driver

```typescript
// src/lib/cron/license-expiry.ts

export async function checkExpiringLicenses() {
  const now = new Date();
  const thirtyDays = addDays(now, 30);
  const sevenDays = addDays(now, 7);

  // Find expiring licenses
  const expiringSoon = await prisma.driverLicense.findMany({
    where: {
      expiryDate: { lte: thirtyDays, gt: now },
      driver: { status: { in: ["APPROVED", "ACTIVE"] } },
    },
    include: { driver: { include: { users: true } } },
  });

  for (const license of expiringSoon) {
    const daysUntilExpiry = differenceInDays(license.expiryDate, now);

    if (daysUntilExpiry <= 0) {
      // Expired - suspend driver
      await suspendDriverForExpiredLicense(license.driverId, license.id);
    } else if (daysUntilExpiry <= 7) {
      // Urgent notification
      await sendUrgentExpiryNotification(license);
    } else {
      // Warning notification (once)
      await sendExpiryWarningNotification(license);
    }
  }
}

async function suspendDriverForExpiredLicense(
  driverId: string,
  licenseId: string,
) {
  await prisma.driver.update({
    where: { id: driverId },
    data: {
      status: "SUSPENDED",
      suspendedAt: new Date(),
      suspendedReason: `License ${licenseId} expired`,
    },
  });

  // Update user status
  await prisma.user.updateMany({
    where: { driverId },
    data: { status: "SUSPENDED" },
  });

  await logAction({
    action: AuditAction.USER_SUSPENDED,
    targetType: "Driver",
    targetId: driverId,
    diff: { reason: "License expired", licenseId },
  });
}
```

### 6.4 Missing Documents

**Scenario:** Driver approved but required document missing/expired.

**Solution:**

- Admin can flag documents as "required for activation"
- Driver dashboard shows document checklist
- Driver cannot be activated until all required docs uploaded
- Separate status: APPROVED (admin ok) vs ACTIVE (docs complete)

### 6.5 GDPR Withdrawal

**Scenario:** Driver withdraws data processing consent.

**Flow:**

1. Driver submits withdrawal request
2. System checks if withdrawal is valid (some consent may be mandatory for service)
3. If mandatory consent withdrawn:
   - Driver deactivated
   - Company link suspended
   - Admin notified
4. Data retention per GDPR (anonymize after retention period)

```typescript
export async function withdrawConsent(
  driverId: string,
  consentType:
    | "dataProcessing"
    | "operationalComms"
    | "geolocation"
    | "imageUsage",
): Promise<ActionResult> {
  const isMandatory = consentType === "dataProcessing";

  if (isMandatory) {
    // Cannot withdraw mandatory consent without deactivation
    return {
      success: false,
      error:
        "Withdrawing data processing consent will deactivate your account. Please confirm.",
      requiresConfirmation: true,
    };
  }

  // Update consent
  await prisma.driverProfile.update({
    where: { driverId },
    data: {
      [`${consentType}Consent`]: false,
      [`${consentType}Timestamp`]: new Date(),
    },
  });

  return { success: true };
}

export async function confirmConsentWithdrawalAndDeactivate(
  driverId: string,
): Promise<ActionResult> {
  await prisma.$transaction(async (tx) => {
    await tx.driverProfile.update({
      where: { driverId },
      data: {
        dataProcessingConsent: false,
        dataProcessingTimestamp: new Date(),
      },
    });

    await tx.driver.update({
      where: { id: driverId },
      data: {
        status: "INACTIVE",
        suspendedReason: "GDPR consent withdrawn",
      },
    });

    await tx.driverCompanyLink.updateMany({
      where: { driverId, status: "ACTIVE" },
      data: { status: "INACTIVE", deactivatedReason: "GDPR consent withdrawn" },
    });
  });

  return { success: true };
}
```

### 6.6 Re-verification

**Scenario:** Admin needs to re-verify driver after document update.

**Solution:**

- Driver can update documents anytime (if approved)
- Document update triggers re-verification flag
- Admin sees "Pending re-verification" badge
- License/document `isVerified` reset to false on update

---

## 7. UI Screens

### 7.1 Driver Onboarding Wizard

```
┌─────────────────────────────────────────────────────────────┐
│  Hydra                                          [Sign Out]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Driver Registration                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                  │
│                                                             │
│  Progress: ●───●───○───○                                    │
│            1   2   3   4                                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Step 2: Licenses & Certifications                    │  │
│  │                                                       │  │
│  │  Primary License                                      │  │
│  │  ┌─────────────┐  ┌─────────────────────┐            │  │
│  │  │ Type     ▼ │  │ License Number       │            │  │
│  │  │ Patente C  │  │ AB123456789         │            │  │
│  │  └─────────────┘  └─────────────────────┘            │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────────────┐            │  │
│  │  │ Issue Date  │  │ Expiry Date         │            │  │
│  │  │ 2020-01-15 │  │ 2030-01-15          │            │  │
│  │  └─────────────┘  └─────────────────────┘            │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────┐         │  │
│  │  │ Issuing Authority                       │         │  │
│  │  │ Motorizzazione Civile di Roma          │         │  │
│  │  └─────────────────────────────────────────┘         │  │
│  │                                                       │  │
│  │  Additional Certifications                            │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │ ☑ CQC Merci    Exp: 2027-06-01            │     │  │
│  │  │ ☑ ADR Base     Exp: 2026-03-15            │     │  │
│  │  │ + Add certification                        │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│               [ ← Back ]              [ Continue → ]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Pending Approval Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Hydra                                          [Sign Out]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ⏳                                    │
│                                                             │
│              Registration Submitted                         │
│                                                             │
│    Your driver application is being reviewed by our team.   │
│    You'll receive an email once approved.                   │
│                                                             │
│    ┌─────────────────────────────────────────────────────┐  │
│    │  Application Summary                                │  │
│    │                                                     │  │
│    │  Name:     Mario Rossi                             │  │
│    │  Company:  Trasporti Veloci SRL                    │  │
│    │  License:  Patente C + CQC Merci                   │  │
│    │  Submitted: 5 Feb 2025, 14:32                      │  │
│    └─────────────────────────────────────────────────────┘  │
│                                                             │
│    Questions? Contact support@hydra.io                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Driver Dashboard (Post-Approval)

```
┌─────────────────────────────────────────────────────────────┐
│  Hydra                    [Notifications 🔔]    [Profile ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome, Mario                              Status: Active │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Today's     │  │  Pending     │  │  Completed   │      │
│  │  Jobs        │  │  Jobs        │  │  This Week   │      │
│  │     3        │  │     5        │  │    12        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ⚠️ License Expiring Soon                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ADR Base expires in 23 days (28 Feb 2025)         │   │
│  │  [Upload Renewed Certificate]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Upcoming Jobs                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📦 Delivery #4521          Today 15:00            │   │
│  │     Milano → Torino         [View Details]          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  📦 Pickup #4522            Today 18:30            │   │
│  │     Warehouse B             [View Details]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Admin Review Panel

```
┌─────────────────────────────────────────────────────────────┐
│  Hydra Admin                               [Admin ▼]        │
├─────────────────────────────────────────────────────────────┤
│  Approvals > Driver Review                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Mario Rossi                        Applied: 5 Feb 2025 ││
│  │  Driver Application                        Status: 🟡   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ Personal Data ────────────────────────────────────────┐ │
│  │  Full Name:    Mario Rossi                             │ │
│  │  Tax Code:     RSSMRA85M01H501Z                        │ │
│  │  Birth:        1 Mar 1985, Roma                        │ │
│  │  Phone:        +39 333 1234567                         │ │
│  │  Email:        mario.rossi@email.it                    │ │
│  │  Address:      Via Roma 123, 00100 Roma RM             │ │
│  │                                                         │ │
│  │  ID Document:  Carta d'Identità                        │ │
│  │  Number:       CA12345AA    Expires: 15 Jun 2028       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Licenses ─────────────────────────────────────────────┐ │
│  │  ✓ Patente C      AB123456    Exp: 15 Jan 2030        │ │
│  │  ✓ CQC Merci      CQC789012   Exp: 1 Jun 2027         │ │
│  │  ✓ ADR Base       ADR345678   Exp: 15 Mar 2026  ⚠️    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Documents ────────────────────────────────────────────┐ │
│  │  ☐ ID Document         carta_identita.pdf    [View]    │ │
│  │  ☐ Driving License     patente.pdf           [View]    │ │
│  │  ☐ GDPR Form           gdpr_firmato.pdf      [View]    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Company Link ─────────────────────────────────────────┐ │
│  │  Trasporti Veloci SRL (Vendor)                         │ │
│  │  VAT: IT12345678901    Status: Approved Vendor ✓       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Consents ─────────────────────────────────────────────┐ │
│  │  ✓ Data Processing       5 Feb 2025 14:32:01          │ │
│  │  ✓ Operational Comms     5 Feb 2025 14:32:01          │ │
│  │  ✓ Geolocation           5 Feb 2025 14:32:01          │ │
│  │  ✗ Image Usage           Not given                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Admin Notes                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [ Reject (with reason) ]              [ ✓ Approve Driver ] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.5 Vendor's Driver List

```
┌─────────────────────────────────────────────────────────────┐
│  Hydra                                       [Vendor ▼]     │
├─────────────────────────────────────────────────────────────┤
│  My Drivers                                [+ Invite Driver]│
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Name           │ Status  │ Licenses      │ Actions    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Mario Rossi    │ Active  │ C, CQC, ADR   │ [View]     │  │
│  │ Luigi Bianchi  │ Active  │ C, CQC        │ [View]     │  │
│  │ Paolo Verdi    │ Pending │ B             │ [View]     │  │
│  │ Anna Neri      │ Expired │ C (!)         │ [View]     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ⚠️ 1 driver has expired credentials                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Phases

### Phase 1: Database & Models (1 sprint)

**Deliverables:**

1. Prisma schema updates:
   - `DriverStatus` enum
   - `DriverIdDocumentType` enum
   - `DriverLicenseType` enum
   - `DriverDocumentType` enum
   - `CompanyType` enum
   - `DriverCompanyLinkStatus` enum
   - `Driver` model
   - `DriverProfile` model
   - `DriverLicense` model
   - `DriverDocument` model
   - `DriverCompanyLink` model
   - `User` model update (driverId relation)

2. Migration script (manual SQL):

   ```sql
   -- migrations/20250205_add_driver_models.sql
   CREATE TYPE "DriverStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'REJECTED');
   CREATE TYPE "DriverIdDocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVING_LICENSE');
   -- ... (all enums)

   CREATE TABLE "Driver" (...);
   CREATE TABLE "DriverProfile" (...);
   CREATE TABLE "DriverLicense" (...);
   CREATE TABLE "DriverDocument" (...);
   CREATE TABLE "DriverCompanyLink" (...);

   ALTER TABLE "User" ADD COLUMN "driverId" TEXT UNIQUE;
   ALTER TABLE "User" ADD CONSTRAINT "User_driverId_fkey"
     FOREIGN KEY ("driverId") REFERENCES "Driver"("id");
   ```

3. Run `prisma generate` and verify types

**Tasks:**

- [ ] Write migration SQL
- [ ] Review migration with team
- [ ] Apply to dev database
- [ ] Generate Prisma client
- [ ] Write seed data for testing

### Phase 2: Onboarding Form (1 sprint)

**Deliverables:**

1. Zod schema: `src/lib/schemas/driver-onboarding.ts`
2. Form components:
   - `src/app/onboarding/driver/page.tsx`
   - `src/app/onboarding/driver/driver-onboarding-form.tsx`
   - `src/app/onboarding/driver/steps/personal-data-step.tsx`
   - `src/app/onboarding/driver/steps/licenses-step.tsx`
   - `src/app/onboarding/driver/steps/documents-step.tsx`
   - `src/app/onboarding/driver/steps/company-consents-step.tsx`
3. Company search API: `src/app/api/vendors/search/route.ts`
4. Server action: `src/actions/driver-onboarding.ts`

**Tasks:**

- [ ] Create Zod schema with validation rules
- [ ] Build wizard container component
- [ ] Build personal data step
- [ ] Build licenses step (with array field)
- [ ] Build documents step
- [ ] Build company selection + consents step
- [ ] Implement company search API
- [ ] Implement submission server action
- [ ] Add localStorage draft persistence
- [ ] Write E2E tests

### Phase 3: Admin Review (0.5 sprint)

**Deliverables:**

1. Data fetcher: `src/data/driver-approvals.ts`
2. Approval actions: `src/actions/driver-approvals.ts`
3. Review UI: Update existing approval detail page to handle DRIVER role
4. Driver profile renderer component

**Tasks:**

- [ ] Create driver profile fetcher
- [ ] Create approve/reject actions
- [ ] Add DRIVER case to approval detail page
- [ ] Add driver-specific fields to review UI
- [ ] Test approval flow end-to-end

### Phase 4: Driver Dashboard (1 sprint)

**Deliverables:**

1. Dashboard page: `src/app/dashboard/driver/page.tsx`
2. Profile page: `src/app/dashboard/driver/profile/page.tsx`
3. Documents page: `src/app/dashboard/driver/documents/page.tsx`
4. Middleware updates for driver routing
5. Navigation updates

**Tasks:**

- [ ] Create driver dashboard layout
- [ ] Build dashboard overview component
- [ ] Build profile view/edit page
- [ ] Build documents list/upload page
- [ ] Update middleware for driver routes
- [ ] Add driver nav items
- [ ] Test all driver flows

### Phase 5: Vendor Integration (0.5 sprint)

**Deliverables:**

1. Vendor drivers page: `src/app/dashboard/vendor/drivers/page.tsx`
2. Driver list component
3. Driver detail view (read-only for vendor)
4. Invite driver flow (optional)

**Tasks:**

- [ ] Create vendor drivers data fetcher
- [ ] Build drivers list page
- [ ] Build driver detail view
- [ ] Add drivers link to vendor nav
- [ ] Test vendor-driver views

### Phase 6: Expiration & Cron (0.5 sprint)

**Deliverables:**

1. Cron job: `src/lib/cron/license-expiry.ts`
2. Notification templates
3. Vercel cron configuration
4. Admin alerts for expired credentials

**Tasks:**

- [ ] Implement expiry check logic
- [ ] Create notification email templates
- [ ] Configure Vercel cron (daily)
- [ ] Add admin dashboard alerts
- [ ] Test expiry scenarios

### Phase 7: Polish & Testing (0.5 sprint)

**Deliverables:**

1. Unit tests for server actions
2. E2E tests for onboarding flow
3. E2E tests for approval flow
4. Documentation updates

**Tasks:**

- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Update API documentation
- [ ] Update user guides
- [ ] Final QA pass

---

## Summary

| Component          | Complexity | Dependencies             |
| ------------------ | ---------- | ------------------------ |
| Prisma Models      | Medium     | None                     |
| Onboarding Form    | High       | Models                   |
| Submission Action  | Medium     | Models, Form             |
| Admin Review       | Low        | Existing approval system |
| Driver Dashboard   | Medium     | Approval complete        |
| Vendor Integration | Low        | Dashboard complete       |
| Expiration Cron    | Medium     | Models, Notifications    |

**Total estimated effort:** 5 sprints

**Critical path:** Models → Form → Submission → Approval → Dashboard

**Risks:**

1. License type complexity (many Italian-specific types)
2. Company polymorphism (future Logistics Partner support)
3. File upload integration (currently metadata-only)

**Mitigations:**

1. Start with common license types, extend via enum
2. Use `companyType` discriminator now, expand later
3. Document upload is separate phase, metadata-first approach works
