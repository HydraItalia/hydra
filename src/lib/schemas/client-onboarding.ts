import { z } from "zod";

// ── Sub-schemas ──────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  province: z.string().min(1, "Province is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().max(100).default("Italy"),
});

export const simpleContactSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().min(1, "Phone is required").max(50),
});

export const optionalSimpleContactSchema = z.object({
  fullName: z.string().max(255).optional().or(z.literal("")),
  email: z
    .string()
    .email("Invalid email")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
});

// ── Document metadata schema ─────────────────────────────────────────────────

export const clientDocumentMetadataSchema = z.object({
  type: z.enum(["ID_DOCUMENT", "TAX_CODE", "SIGNED_GDPR_FORM", "OTHER"]),
  label: z.string().min(1, "Label is required").max(255),
  fileName: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// ── Client Type ──────────────────────────────────────────────────────────────

export const clientTypeSchema = z.enum([
  "PRIVATE",
  "COMPANY",
  "RESELLER",
  "PARTNER",
]);

export type ClientType = z.infer<typeof clientTypeSchema>;

// ── ID Document Type ─────────────────────────────────────────────────────────

export const idDocumentTypeSchema = z.enum([
  "ID_CARD",
  "PASSPORT",
  "DRIVING_LICENSE",
]);

export type IdDocumentType = z.infer<typeof idDocumentTypeSchema>;

// ── Date string validation ───────────────────────────────────────────────────

const optionalDateString = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  });

// ── Main onboarding schema (conditional based on clientType) ─────────────────

export const clientOnboardingSchema = z
  .object({
    // Section 3: Commercial (REQUIRED - determines which other fields are needed)
    clientType: clientTypeSchema,

    // Section 1: Personal Details (PRIVATE only)
    fullName: z.string().max(255).optional().or(z.literal("")),
    birthDate: optionalDateString,
    birthPlace: z.string().max(255).optional().or(z.literal("")),
    personalTaxCode: z.string().max(20).optional().or(z.literal("")),
    personalPhone: z.string().max(50).optional().or(z.literal("")),
    personalEmail: z
      .string()
      .email("Invalid email")
      .max(255)
      .optional()
      .or(z.literal("")),
    personalPecEmail: z
      .string()
      .email("Invalid PEC email")
      .max(255)
      .optional()
      .or(z.literal("")),
    residentialAddress: addressSchema.optional(),
    domicileAddress: addressSchema.optional(),
    idDocumentType: idDocumentTypeSchema.optional(),
    idDocumentNumber: z.string().max(100).optional().or(z.literal("")),
    idDocumentExpiry: optionalDateString,
    idDocumentIssuer: z.string().max(255).optional().or(z.literal("")),

    // Section 2: Company Details (COMPANY/RESELLER/PARTNER only)
    legalName: z.string().max(255).optional().or(z.literal("")),
    tradeName: z.string().max(255).optional().or(z.literal("")),
    vatNumber: z.string().max(20).optional().or(z.literal("")),
    companyTaxCode: z.string().max(20).optional().or(z.literal("")),
    sdiRecipientCode: z.string().max(7).optional().or(z.literal("")),
    companyPecEmail: z
      .string()
      .email("Invalid PEC email")
      .max(255)
      .optional()
      .or(z.literal("")),
    registeredOfficeAddress: addressSchema.optional(),
    operatingAddress: addressSchema.optional(),
    adminContact: simpleContactSchema.optional(),
    operationalContact: optionalSimpleContactSchema.optional(),

    // Section 4: Billing + Documents
    invoicingNotes: z.string().max(1000).optional().or(z.literal("")),
    documents: z.array(clientDocumentMetadataSchema).optional(),

    // Section 6: Operational
    preferredContactHours: z.string().max(255).optional().or(z.literal("")),
    specialRequirements: z.string().max(1000).optional().or(z.literal("")),
    operationalNotes: z.string().max(2000).optional().or(z.literal("")),

    // Section 7: Consents
    dataProcessingConsent: z.literal(true, {
      errorMap: () => ({ message: "You must accept data processing terms" }),
    }),
    marketingConsent: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // Conditional validation based on clientType
    if (data.clientType === "PRIVATE") {
      // PRIVATE requires personal details
      if (!data.fullName || data.fullName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Full name is required for private clients",
          path: ["fullName"],
        });
      }
      if (!data.personalTaxCode || data.personalTaxCode.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tax code is required for private clients",
          path: ["personalTaxCode"],
        });
      }
      if (!data.personalPhone || data.personalPhone.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone is required for private clients",
          path: ["personalPhone"],
        });
      }
      if (!data.personalEmail || data.personalEmail.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email is required for private clients",
          path: ["personalEmail"],
        });
      }
      if (!data.residentialAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Residential address is required for private clients",
          path: ["residentialAddress"],
        });
      }
    } else {
      // COMPANY/RESELLER/PARTNER requires company details
      if (!data.legalName || data.legalName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Legal name is required for business clients",
          path: ["legalName"],
        });
      }
      if (!data.vatNumber || data.vatNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "VAT number is required for business clients",
          path: ["vatNumber"],
        });
      }
      if (!data.registeredOfficeAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Registered office address is required for business clients",
          path: ["registeredOfficeAddress"],
        });
      }
      if (!data.adminContact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Admin contact is required for business clients",
          path: ["adminContact"],
        });
      }
    }
  });

export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;

// ── Per-step field keys for wizard validation (conditional) ──────────────────

// Fields for PRIVATE clients
export const PRIVATE_STEP_FIELDS: (keyof ClientOnboardingInput)[][] = [
  // Step 0: Client Type Selection
  ["clientType"],
  // Step 1: Personal Details
  [
    "fullName",
    "birthDate",
    "birthPlace",
    "personalTaxCode",
    "personalPhone",
    "personalEmail",
    "personalPecEmail",
    "residentialAddress",
    "domicileAddress",
    "idDocumentType",
    "idDocumentNumber",
    "idDocumentExpiry",
    "idDocumentIssuer",
  ],
  // Step 2: Billing + Documents
  ["invoicingNotes", "documents"],
  // Step 3: Operational
  ["preferredContactHours", "specialRequirements", "operationalNotes"],
  // Step 4: Consents
  ["dataProcessingConsent", "marketingConsent"],
];

export const PRIVATE_STEP_LABELS = [
  "Client Type",
  "Personal Details",
  "Billing & Documents",
  "Operational",
  "Consents",
];

// Fields for COMPANY/RESELLER/PARTNER clients
export const BUSINESS_STEP_FIELDS: (keyof ClientOnboardingInput)[][] = [
  // Step 0: Client Type Selection
  ["clientType"],
  // Step 1: Company Details
  [
    "legalName",
    "tradeName",
    "vatNumber",
    "companyTaxCode",
    "sdiRecipientCode",
    "companyPecEmail",
    "registeredOfficeAddress",
    "operatingAddress",
    "adminContact",
    "operationalContact",
  ],
  // Step 2: Billing + Documents
  ["invoicingNotes", "documents"],
  // Step 3: Operational
  ["preferredContactHours", "specialRequirements", "operationalNotes"],
  // Step 4: Consents
  ["dataProcessingConsent", "marketingConsent"],
];

export const BUSINESS_STEP_LABELS = [
  "Client Type",
  "Company Details",
  "Billing & Documents",
  "Operational",
  "Consents",
];

// Helper to get correct step config based on clientType
export function getStepConfig(clientType: ClientType | undefined) {
  if (clientType === "PRIVATE") {
    return { fields: PRIVATE_STEP_FIELDS, labels: PRIVATE_STEP_LABELS };
  }
  return { fields: BUSINESS_STEP_FIELDS, labels: BUSINESS_STEP_LABELS };
}

export const TOTAL_STEPS = 5;
