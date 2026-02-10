import type { TemplateMapping } from "@/lib/import/catalog-csv";

export type CanonicalFieldDef = {
  key: string;
  label: string;
  required: boolean;
  autoTransform?: "toCents" | "toBool" | "normalizeUnit";
};

export const CANONICAL_FIELDS: CanonicalFieldDef[] = [
  { key: "name", label: "Product Name", required: true },
  { key: "category", label: "Category", required: true },
  {
    key: "price_cents",
    label: "Price",
    required: true,
    autoTransform: "toCents",
  },
  {
    key: "unit",
    label: "Unit",
    required: false,
    autoTransform: "normalizeUnit",
  },
  {
    key: "in_stock",
    label: "In Stock",
    required: false,
    autoTransform: "toBool",
  },
  { key: "product_code", label: "Product Code", required: false },
];

export const REQUIRED_CANONICAL_KEYS = CANONICAL_FIELDS.filter(
  (f) => f.required,
).map((f) => f.key);

/**
 * Convert user dropdown selections (canonicalField -> csvHeader) into a
 * TemplateMapping for the backend. Each selected field gets `sources: [csvHeader]`
 * (always an array for future synonym support), `required` from field def,
 * and `autoTransform` if defined.
 */
export function buildTemplateMappingFromSelections(
  selections: Record<string, string>,
): TemplateMapping {
  const mapping: TemplateMapping = {};

  for (const field of CANONICAL_FIELDS) {
    const csvHeader = selections[field.key];
    if (!csvHeader) continue;

    mapping[field.key] = {
      sources: [csvHeader],
      required: field.required,
      ...(field.autoTransform ? { transform: field.autoTransform } : {}),
    };
  }

  return mapping;
}
