import { z } from "zod";

// ── Sub-schemas ──────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  province: z.string().min(1, "Province is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().max(100).default("Italy"),
});

export const contactSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  role: z.string().min(1, "Role is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().min(1, "Phone is required").max(50),
});

export const optionalContactSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().min(1, "Phone is required").max(50),
  role: z.string().max(100).optional().or(z.literal("")),
});

// ── Document metadata schema ─────────────────────────────────────────────────

export const documentMetadataSchema = z.object({
  type: z.enum([
    "CHAMBER_OF_COMMERCE_EXTRACT",
    "LEGAL_REP_ID",
    "CERTIFICATION",
    "SIGNED_CONTRACT",
    "SIGNED_GDPR_FORM",
    "OTHER",
  ]),
  label: z.string().min(1, "Label is required").max(255),
  fileName: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// ── Main onboarding schema ───────────────────────────────────────────────────

export const vendorOnboardingSchema = z.object({
  // Section 1: General
  legalName: z.string().min(1, "Legal name is required").max(255),
  tradeName: z.string().max(255).optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  foundedAt: z.string().optional().or(z.literal("")), // ISO date string
  employeeCount: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // Section 2: Legal & Tax
  vatNumber: z.string().max(50).optional().or(z.literal("")),
  taxCode: z.string().max(50).optional().or(z.literal("")),
  chamberOfCommerceRegistration: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  registeredOfficeAddress: addressSchema.optional(),
  operatingAddress: addressSchema.optional(),
  pecEmail: z
    .string()
    .email("Invalid PEC email")
    .max(255)
    .optional()
    .or(z.literal("")),
  sdiRecipientCode: z.string().max(7).optional().or(z.literal("")),
  taxRegime: z.string().max(100).optional().or(z.literal("")),
  licenses: z.string().max(1000).optional().or(z.literal("")),

  // Section 3: Contacts
  adminContact: contactSchema,
  commercialContact: contactSchema,
  technicalContact: optionalContactSchema.optional(),

  // Section 4: Banking
  bankAccountHolder: z.string().max(255).optional().or(z.literal("")),
  iban: z
    .string()
    .max(34)
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(val),
      "Invalid IBAN format",
    ),
  bankNameAndBranch: z.string().max(255).optional().or(z.literal("")),
  preferredPaymentMethod: z
    .enum(["BANK_TRANSFER", "DIRECT_DEBIT", "CHECK", "OTHER"])
    .optional(),
  paymentTerms: z
    .enum(["NET_30", "NET_60", "NET_90", "ON_DELIVERY", "PREPAID", "OTHER"])
    .optional(),
  invoicingNotes: z.string().max(1000).optional().or(z.literal("")),

  // Section 5: Documents (metadata only)
  documents: z.array(documentMetadataSchema).optional(),

  // Section 6: Operational
  openingHours: z.string().max(255).optional().or(z.literal("")),
  closingDays: z.string().max(255).optional().or(z.literal("")),
  warehouseAccess: z.string().max(500).optional().or(z.literal("")),
  emergencyContacts: z.array(emergencyContactSchema).optional(),
  operationalNotes: z.string().max(2000).optional().or(z.literal("")),

  // Section 7: Consents
  dataProcessingConsent: z.literal(true, {
    errorMap: () => ({ message: "You must accept data processing terms" }),
  }),
  marketingConsent: z.boolean().default(false),
  logoUsageConsent: z.boolean().default(false),
});

export type VendorOnboardingInput = z.infer<typeof vendorOnboardingSchema>;

// ── Per-step field keys for wizard validation ────────────────────────────────

export const STEP_FIELDS: (keyof VendorOnboardingInput)[][] = [
  // Step 0: General
  [
    "legalName",
    "tradeName",
    "industry",
    "description",
    "foundedAt",
    "employeeCount",
  ],
  // Step 1: Legal & Tax
  [
    "vatNumber",
    "taxCode",
    "chamberOfCommerceRegistration",
    "registeredOfficeAddress",
    "operatingAddress",
    "pecEmail",
    "sdiRecipientCode",
    "taxRegime",
    "licenses",
  ],
  // Step 2: Contacts
  ["adminContact", "commercialContact", "technicalContact"],
  // Step 3: Banking
  [
    "bankAccountHolder",
    "iban",
    "bankNameAndBranch",
    "preferredPaymentMethod",
    "paymentTerms",
    "invoicingNotes",
  ],
  // Step 4: Documents
  ["documents"],
  // Step 5: Operational
  [
    "openingHours",
    "closingDays",
    "warehouseAccess",
    "emergencyContacts",
    "operationalNotes",
  ],
  // Step 6: Consents
  ["dataProcessingConsent", "marketingConsent", "logoUsageConsent"],
];

export const STEP_LABELS = [
  "General",
  "Legal & Tax",
  "Contacts",
  "Banking",
  "Documents",
  "Operational",
  "Consents",
];
