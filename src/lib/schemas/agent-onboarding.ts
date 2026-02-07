import { z } from "zod";

// ── Constants ────────────────────────────────────────────────────────────────

export const AGENT_TYPES = ["MONOMANDATARIO", "PLURIMANDATARIO"] as const;
export type AgentType = (typeof AGENT_TYPES)[number];

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  MONOMANDATARIO: "Monomandatario (esclusivo)",
  PLURIMANDATARIO: "Plurimandatario (non esclusivo)",
};

export const TAX_REGIMES = [
  "ORDINARIO",
  "FORFETTARIO",
  "SEMPLIFICATO",
] as const;
export type TaxRegime = (typeof TAX_REGIMES)[number];

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  ORDINARIO: "Regime Ordinario",
  FORFETTARIO: "Regime Forfettario",
  SEMPLIFICATO: "Regime Semplificato",
};

export const PAYMENT_METHODS = ["BANK_TRANSFER", "CHECK", "OTHER"] as const;
export type AgentPaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<AgentPaymentMethod, string> = {
  BANK_TRANSFER: "Bonifico Bancario",
  CHECK: "Assegno",
  OTHER: "Altro",
};

export const DOCUMENT_TYPES = [
  "ID_DOCUMENT",
  "TAX_CODE_CARD",
  "CHAMBER_OF_COMMERCE_EXTRACT",
  "ENASARCO_CERTIFICATE",
  "SIGNED_GDPR_FORM",
  "OTHER",
] as const;
export type AgentDocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<AgentDocumentType, string> = {
  ID_DOCUMENT: "Documento d'identità",
  TAX_CODE_CARD: "Tessera codice fiscale",
  CHAMBER_OF_COMMERCE_EXTRACT: "Visura camerale",
  ENASARCO_CERTIFICATE: "Certificato ENASARCO",
  SIGNED_GDPR_FORM: "Modulo privacy firmato",
  OTHER: "Altro",
};

export const REQUIRED_DOCUMENTS: AgentDocumentType[] = [
  "ID_DOCUMENT",
  "TAX_CODE_CARD",
  "CHAMBER_OF_COMMERCE_EXTRACT",
  "ENASARCO_CERTIFICATE",
];

// Italian regions for territory picker
export const ITALIAN_REGIONS = [
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardia",
  "Marche",
  "Molise",
  "Piemonte",
  "Puglia",
  "Sardegna",
  "Sicilia",
  "Toscana",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto",
] as const;

// Common business sectors
export const BUSINESS_SECTORS = [
  "Food & Beverage",
  "HORECA",
  "GDO",
  "Retail",
  "Farmaceutico",
  "Cosmetica",
  "Abbigliamento",
  "Elettronica",
  "Automotive",
  "Edilizia",
  "Altro",
] as const;

// ── Sub-schemas ──────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  street: z.string().min(1, "Via/indirizzo richiesto").max(500),
  city: z.string().min(1, "Città richiesta").max(100),
  province: z.string().min(1, "Provincia richiesta").max(100),
  postalCode: z.string().min(1, "CAP richiesto").max(20),
  country: z.string().max(100).default("Italia"),
});

export type AddressInput = z.infer<typeof addressSchema>;

const documentMetadataSchema = z.object({
  type: z.enum(DOCUMENT_TYPES, {
    errorMap: () => ({ message: "Seleziona un tipo di documento" }),
  }),
  label: z.string().min(1, "Etichetta richiesta").max(255),
  fileName: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type DocumentMetadataInput = z.infer<typeof documentMetadataSchema>;

// ── Main Schema ──────────────────────────────────────────────────────────────

export const agentOnboardingSchema = z.object({
  // ── Step 0: Dati Anagrafici ─────────────────────────────────────────────────
  fullName: z.string().min(2, "Nome completo richiesto").max(255),
  birthDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), "Data non valida"),
  birthPlace: z.string().min(2, "Luogo di nascita richiesto").max(255),
  taxCode: z
    .string()
    .transform((v) => v.toUpperCase().replace(/\s/g, ""))
    .refine(
      (v) => /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(v),
      "Codice fiscale non valido"
    ),
  nationality: z.string().max(100).default("Italiana"),
  residentialAddress: addressSchema,
  domicileAddress: addressSchema.optional(),
  phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\+?\d{6,15}$/.test(v), "Numero di telefono non valido"),
  email: z.string().email("Email non valida").max(255),
  pecEmail: z
    .string()
    .email("PEC non valida")
    .max(255)
    .optional()
    .or(z.literal("")),

  // ── Step 1: Dati Professionali ──────────────────────────────────────────────
  agentType: z.enum(AGENT_TYPES, {
    errorMap: () => ({ message: "Seleziona il tipo di agente" }),
  }),
  chamberRegistrationNumber: z
    .string()
    .min(1, "Numero iscrizione richiesto")
    .max(50),
  chamberRegistrationDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), "Data non valida"),
  chamberName: z.string().min(2, "Nome CCIAA richiesto").max(255),
  professionalAssociations: z.string().max(500).optional().or(z.literal("")),
  coveredTerritories: z
    .array(
      z.enum(ITALIAN_REGIONS, {
        errorMap: () => ({ message: "Regione non valida" }),
      })
    )
    .min(1, "Seleziona almeno un territorio"),
  sectors: z
    .array(
      z.enum(BUSINESS_SECTORS, {
        errorMap: () => ({ message: "Settore non valido" }),
      })
    )
    .min(1, "Seleziona almeno un settore"),

  // ── Step 2: Dati Fiscali ────────────────────────────────────────────────────
  vatNumber: z
    .string()
    .transform((v) => v.toUpperCase().replace(/\s/g, ""))
    .refine(
      (v) => /^(IT)?\d{11}$/.test(v),
      "Partita IVA non valida (11 cifre, opzionalmente con prefisso IT)"
    )
    .transform((v) => (v.startsWith("IT") ? v : `IT${v}`)), // Normalize to IT prefix
  taxRegime: z.enum(TAX_REGIMES, {
    errorMap: () => ({ message: "Regime fiscale richiesto" }),
  }),
  atecoCode: z
    .string()
    .refine(
      (v) => /^\d{2}\.\d{2}(\.\d{1,2})?$/.test(v),
      "Codice ATECO non valido (es. 46.19.01)"
    ),
  sdiRecipientCode: z
    .string()
    .transform((v) => v.toUpperCase().replace(/\s/g, ""))
    .refine(
      (v) => /^[A-Z0-9]{7}$/.test(v) || v === "0000000",
      "Codice SDI deve essere 7 caratteri alfanumerici"
    ),
  invoicingPecEmail: z.string().email("PEC fatturazione non valida").max(255),
  enasarcoNumber: z.string().min(1, "Numero ENASARCO richiesto").max(50),
  enasarcoRegistrationDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), "Data non valida"),

  // ── Step 3: Dati Bancari ────────────────────────────────────────────────────
  bankAccountHolder: z
    .string()
    .min(2, "Intestatario conto richiesto")
    .max(255),
  iban: z
    .string()
    .transform((v) => v.toUpperCase().replace(/\s/g, ""))
    .refine(
      (v) => /^IT\d{2}[A-Z]\d{22}$/.test(v),
      "IBAN italiano non valido"
    ),
  bankNameBranch: z.string().min(2, "Banca e filiale richiesti").max(255),
  preferredPaymentMethod: z.enum(PAYMENT_METHODS).default("BANK_TRANSFER"),
  commissionNotes: z.string().max(1000).optional().or(z.literal("")),

  // ── Step 4: Documenti ───────────────────────────────────────────────────────
  documents: z
    .array(documentMetadataSchema)
    .min(1, "Aggiungi almeno un documento"),

  // ── Step 5: Privacy e Consensi ──────────────────────────────────────────────
  dataProcessingConsent: z.literal(true, {
    errorMap: () => ({
      message: "Il consenso al trattamento dati è obbligatorio",
    }),
  }),
  operationalCommsConsent: z.boolean().default(false),
  commercialImageConsent: z.boolean().default(false),
});

export type AgentOnboardingInput = z.infer<typeof agentOnboardingSchema>;

// ── Step Configuration ───────────────────────────────────────────────────────

export const STEP_FIELDS: (keyof AgentOnboardingInput)[][] = [
  // Step 0: Dati Anagrafici
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
  // Step 1: Dati Professionali
  [
    "agentType",
    "chamberRegistrationNumber",
    "chamberRegistrationDate",
    "chamberName",
    "professionalAssociations",
    "coveredTerritories",
    "sectors",
  ],
  // Step 2: Dati Fiscali
  [
    "vatNumber",
    "taxRegime",
    "atecoCode",
    "sdiRecipientCode",
    "invoicingPecEmail",
    "enasarcoNumber",
    "enasarcoRegistrationDate",
  ],
  // Step 3: Dati Bancari
  [
    "bankAccountHolder",
    "iban",
    "bankNameBranch",
    "preferredPaymentMethod",
    "commissionNotes",
  ],
  // Step 4: Documenti
  ["documents"],
  // Step 5: Privacy e Consensi
  [
    "dataProcessingConsent",
    "operationalCommsConsent",
    "commercialImageConsent",
  ],
];

export const STEP_LABELS = [
  "Dati Anagrafici",
  "Dati Professionali",
  "Dati Fiscali",
  "Dati Bancari",
  "Documenti",
  "Privacy e Consensi",
];

export const TOTAL_STEPS = STEP_FIELDS.length;
