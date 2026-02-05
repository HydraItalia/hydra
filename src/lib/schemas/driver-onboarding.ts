import { z } from "zod";

// ── Constants ────────────────────────────────────────────────────────────────

export const ID_DOCUMENT_TYPES = [
  "ID_CARD",
  "PASSPORT",
  "DRIVING_LICENSE",
] as const;

// License types - validated here, NOT as DB enum (Italian bureaucracy changes frequently)
export const LICENSE_TYPES = [
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
  // Certifications
  "ADR_BASE",
  "ADR_TANK",
  "ADR_EXPLOSIVE",
  "CAP",
  "NCC",
] as const;

export type LicenseType = (typeof LICENSE_TYPES)[number];

const CERTIFICATION_TYPES: string[] = [
  "CQC_MERCI",
  "CQC_PERSONE",
  "ADR_BASE",
  "ADR_TANK",
  "ADR_EXPLOSIVE",
  "CAP",
  "NCC",
];

export const DOCUMENT_TYPES = [
  "ID_DOCUMENT",
  "DRIVING_LICENSE",
  "SIGNED_GDPR_FORM",
  "ADR_CERTIFICATE",
  "CQC_CERTIFICATE",
  "MEDICAL_CERTIFICATE",
  "CRIMINAL_RECORD",
  "OTHER",
] as const;

export type DriverDocumentType = (typeof DOCUMENT_TYPES)[number];

export const REQUIRED_DOCUMENTS: DriverDocumentType[] = [
  "ID_DOCUMENT",
  "DRIVING_LICENSE",
  "SIGNED_GDPR_FORM",
];

// ── Sub-schemas ──────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  province: z.string().min(1, "Province is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().max(100).default("Italia"),
});

export type AddressInput = z.infer<typeof addressSchema>;

const licenseSchema = z
  .object({
    type: z.enum(LICENSE_TYPES, {
      errorMap: () => ({ message: "Please select a valid license type" }),
    }),
    number: z.string().min(5, "License number too short").max(50),
    issueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
    expiryDate: z.string().refine((d) => {
      const date = new Date(d);
      return !isNaN(date.getTime()) && date > new Date();
    }, "License must not be expired"),
    issuingAuthority: z
      .string()
      .min(2, "Issuing authority is required")
      .max(255),
  })
  .transform((data) => ({
    ...data,
    isCertification: CERTIFICATION_TYPES.includes(data.type),
  }));

export type LicenseInput = z.infer<typeof licenseSchema>;

const documentMetadataSchema = z.object({
  type: z.enum(DOCUMENT_TYPES, {
    errorMap: () => ({ message: "Please select a document type" }),
  }),
  label: z.string().min(1, "Label is required").max(255),
  fileName: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type DocumentMetadataInput = z.infer<typeof documentMetadataSchema>;

// ── Main Schema ──────────────────────────────────────────────────────────────

export const driverOnboardingSchema = z.object({
  // Step 0: Personal Data + Contact + Addresses
  fullName: z.string().min(2, "Full name is required").max(255),
  birthDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  birthPlace: z.string().min(2, "Birth place is required").max(255),
  taxCode: z
    .string()
    .transform((v) => v.toUpperCase().replace(/\s/g, ""))
    .refine(
      (v) => /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(v),
      "Invalid codice fiscale format",
    ),
  nationality: z.string().max(100).default("Italiana"),
  residentialAddress: addressSchema,
  domicileAddress: addressSchema.optional(),
  phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\+?\d{6,15}$/.test(v), "Invalid phone number"),
  email: z.string().email("Invalid email address").max(255),
  pecEmail: z
    .string()
    .email("Invalid PEC email")
    .max(255)
    .optional()
    .or(z.literal("")),

  // Step 1: Identity Document
  idDocumentType: z.enum(ID_DOCUMENT_TYPES, {
    errorMap: () => ({ message: "Please select a document type" }),
  }),
  idDocumentNumber: z.string().min(5, "Document number too short").max(50),
  idDocumentExpiry: z.string().refine((d) => {
    const date = new Date(d);
    return !isNaN(date.getTime()) && date > new Date();
  }, "Document must not be expired"),
  idDocumentIssuer: z.string().min(2, "Issuing authority is required").max(255),

  // Step 2: Licenses & Certifications (useFieldArray)
  licenses: z.array(licenseSchema).min(1, "At least one license is required"),

  // Step 3: Documents
  documents: z
    .array(documentMetadataSchema)
    .min(1, "At least one document is required"),

  // Step 4: Company + Consents
  vendorId: z.string().min(1, "Company selection is required"),
  inviteToken: z.string().optional(), // If coming from invite link
  dataProcessingConsent: z.literal(true, {
    errorMap: () => ({ message: "Data processing consent is required" }),
  }),
  operationalCommsConsent: z.boolean().default(false),
  geolocationConsent: z.boolean().default(false),
  imageUsageConsent: z.boolean().default(false),
});

export type DriverOnboardingInput = z.infer<typeof driverOnboardingSchema>;

// ── Step Configuration ───────────────────────────────────────────────────────

export const STEP_FIELDS: (keyof DriverOnboardingInput)[][] = [
  // Step 0: Personal Data + Contact + Addresses
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
  ],
  // Step 1: Identity Document
  [
    "idDocumentType",
    "idDocumentNumber",
    "idDocumentExpiry",
    "idDocumentIssuer",
  ],
  // Step 2: Licenses & Certifications
  ["licenses"],
  // Step 3: Documents
  ["documents"],
  // Step 4: Company + Consents
  [
    "vendorId",
    "inviteToken",
    "dataProcessingConsent",
    "operationalCommsConsent",
    "geolocationConsent",
    "imageUsageConsent",
  ],
];

export const STEP_LABELS = [
  "Personal Information",
  "Identity Document",
  "Licenses & Certifications",
  "Documents",
  "Company & Consents",
];

export const TOTAL_STEPS = STEP_FIELDS.length;

// ── License Type Labels (for UI) ─────────────────────────────────────────────

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  B: "Patente B",
  BE: "Patente BE",
  C: "Patente C",
  CE: "Patente CE",
  C1: "Patente C1",
  C1E: "Patente C1E",
  D: "Patente D",
  DE: "Patente DE",
  CQC_MERCI: "CQC Merci",
  CQC_PERSONE: "CQC Persone",
  KB: "KB",
  ADR_BASE: "ADR Base",
  ADR_TANK: "ADR Cisterne",
  ADR_EXPLOSIVE: "ADR Esplosivi",
  CAP: "CAP",
  NCC: "NCC",
};

// ── Document Type Labels (for UI) ────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<DriverDocumentType, string> = {
  ID_DOCUMENT: "Documento d'identita",
  DRIVING_LICENSE: "Patente di guida",
  SIGNED_GDPR_FORM: "Modulo privacy firmato",
  ADR_CERTIFICATE: "Certificato ADR",
  CQC_CERTIFICATE: "Carta qualificazione conducente",
  MEDICAL_CERTIFICATE: "Certificato medico",
  CRIMINAL_RECORD: "Casellario giudiziale",
  OTHER: "Altro",
};
