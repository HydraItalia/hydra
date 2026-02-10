import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  buildColumnMapping,
  applyColumnMapping,
  scoreTemplateMatch,
  suggestTemplate,
} from "../mapping";
import type { TemplateMapping } from "../mapping";

// ── normalizeHeader ──────────────────────────────────────────────────────────

describe("normalizeHeader", () => {
  it("lowercases and trims", () => {
    expect(normalizeHeader("  Price  ")).toBe("price");
  });

  it("replaces underscores, dashes, dots with spaces", () => {
    expect(normalizeHeader("price_cents")).toBe("price cents");
    expect(normalizeHeader("price-cents")).toBe("price cents");
    expect(normalizeHeader("price.cents")).toBe("price cents");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeHeader("price   cents")).toBe("price cents");
  });

  it("strips punctuation", () => {
    expect(normalizeHeader("item (name)")).toBe("item name");
    expect(normalizeHeader("price/cost")).toBe("pricecost");
  });

  it("handles empty string", () => {
    expect(normalizeHeader("")).toBe("");
  });
});

// ── buildColumnMapping ───────────────────────────────────────────────────────

describe("buildColumnMapping", () => {
  const mapping: TemplateMapping = {
    name: {
      sources: ["product_name", "item_name", "nome_prodotto"],
      required: true,
    },
    category: {
      sources: ["category", "categoria"],
      required: true,
    },
    price_cents: {
      sources: ["price", "prezzo"],
      required: true,
      transform: "toCents",
    },
    unit: {
      sources: ["unit", "unita"],
      required: false,
    },
  };

  it("maps CSV headers to canonical fields using first match", () => {
    const csvHeaders = ["product_name", "category", "price", "unit", "notes"];
    const result = buildColumnMapping(mapping, csvHeaders);

    expect(result.columnMap).toEqual({
      product_name: "name",
      category: "category",
      price: "price_cents",
      unit: "unit",
    });
    expect(result.resolvedFields).toEqual({
      name: "product_name",
      category: "category",
      price_cents: "price",
      unit: "unit",
    });
    expect(result.missingRequired).toEqual([]);
  });

  it("reports missing required fields", () => {
    const csvHeaders = ["product_name", "unit"];
    const result = buildColumnMapping(mapping, csvHeaders);

    expect(result.missingRequired).toContain("category");
    expect(result.missingRequired).toContain("price_cents");
    expect(result.missingRequired).not.toContain("unit");
  });

  it("normalizes headers for comparison (case, underscore, etc.)", () => {
    const csvHeaders = ["Product-Name", "Category", "PRICE", "Unit"];
    const result = buildColumnMapping(mapping, csvHeaders);

    expect(result.columnMap["Product-Name"]).toBe("name");
    expect(result.columnMap["Category"]).toBe("category");
    expect(result.columnMap["PRICE"]).toBe("price_cents");
  });

  it("uses first source that matches", () => {
    const csvHeaders = ["item_name", "product_name", "category", "price"];
    const result = buildColumnMapping(mapping, csvHeaders);

    // "product_name" is first in sources, but "item_name" appears in CSV and
    // "product_name" is the first source — so let's verify actual behavior.
    // Sources are checked in order: product_name, item_name, nome_prodotto
    // product_name exists in CSV → should match product_name
    expect(result.resolvedFields.name).toBe("product_name");
  });

  it("returns empty results for empty inputs", () => {
    const result = buildColumnMapping({}, []);
    expect(result.columnMap).toEqual({});
    expect(result.resolvedFields).toEqual({});
    expect(result.missingRequired).toEqual([]);
  });
});

// ── applyColumnMapping ───────────────────────────────────────────────────────

describe("applyColumnMapping", () => {
  it("maps vendor columns to canonical columns", () => {
    const rows = [
      { "Product Name": "Wine", Prezzo: "15.50", Categoria: "Beverage" },
    ];
    const columnMap = {
      "Product Name": "name",
      Prezzo: "price_cents",
      Categoria: "category",
    };

    const result = applyColumnMapping(rows, columnMap);

    expect(result[0].name).toBe("Wine");
    expect(result[0].price_cents).toBe("15.50");
    expect(result[0].category).toBe("Beverage");
    // Preserves original columns
    expect(result[0]["Product Name"]).toBe("Wine");
  });

  it("applies toCents transform", () => {
    const rows = [{ price: "15.50" }];
    const columnMap = { price: "price_cents" };
    const templateMapping: TemplateMapping = {
      price_cents: { sources: ["price"], required: true, transform: "toCents" },
    };

    const result = applyColumnMapping(rows, columnMap, templateMapping);
    expect(result[0].price_cents).toBe("1550");
  });

  it("applies toBool transform", () => {
    const rows = [
      { disponibile: "si" },
      { disponibile: "yes" },
      { disponibile: "1" },
      { disponibile: "true" },
      { disponibile: "no" },
      { disponibile: "0" },
    ];
    const columnMap = { disponibile: "in_stock" };
    const templateMapping: TemplateMapping = {
      in_stock: {
        sources: ["disponibile"],
        required: false,
        transform: "toBool",
      },
    };

    const result = applyColumnMapping(rows, columnMap, templateMapping);
    expect(result[0].in_stock).toBe("true");
    expect(result[1].in_stock).toBe("true");
    expect(result[2].in_stock).toBe("true");
    expect(result[3].in_stock).toBe("true");
    expect(result[4].in_stock).toBe("false");
    expect(result[5].in_stock).toBe("false");
  });

  it("applies normalizeUnit transform", () => {
    const rows = [{ unita: "kilogram" }];
    const columnMap = { unita: "unit" };
    const templateMapping: TemplateMapping = {
      unit: {
        sources: ["unita"],
        required: false,
        transform: "normalizeUnit",
      },
    };

    const result = applyColumnMapping(rows, columnMap, templateMapping);
    expect(result[0].unit).toBe("KG");
  });

  it("applies defaults for missing fields", () => {
    const rows = [{ name: "Wine" }];
    const columnMap = { name: "name" };
    const defaults = { category: "Food", unit: "piece" };

    const result = applyColumnMapping(rows, columnMap, undefined, defaults);
    expect(result[0].category).toBe("Food");
    expect(result[0].unit).toBe("piece");
    expect(result[0].name).toBe("Wine");
  });

  it("does not override existing values with defaults", () => {
    const rows = [{ name: "Wine", category: "Beverage" }];
    const columnMap = { name: "name", category: "category" };
    const defaults = { category: "Food" };

    const result = applyColumnMapping(rows, columnMap, undefined, defaults);
    expect(result[0].category).toBe("Beverage");
  });

  it("handles toCents with non-numeric value gracefully", () => {
    const rows = [{ price: "N/A" }];
    const columnMap = { price: "price_cents" };
    const templateMapping: TemplateMapping = {
      price_cents: { sources: ["price"], required: true, transform: "toCents" },
    };

    const result = applyColumnMapping(rows, columnMap, templateMapping);
    expect(result[0].price_cents).toBe("N/A"); // passthrough on NaN
  });
});

// ── scoreTemplateMatch ───────────────────────────────────────────────────────

describe("scoreTemplateMatch", () => {
  const mapping: TemplateMapping = {
    name: { sources: ["product_name"], required: true },
    category: { sources: ["category"], required: true },
    price_cents: { sources: ["price"], required: true },
    unit: { sources: ["unit"], required: false },
    in_stock: { sources: ["available"], required: false },
  };
  // Max points: 3*2 + 2*1 = 8

  it("scores 1.0 when all fields match", () => {
    const headers = [
      "product_name",
      "category",
      "price",
      "unit",
      "available",
    ];
    const result = scoreTemplateMatch(mapping, headers);
    expect(result.score).toBe(1.0);
    expect(result.matchedFields).toHaveLength(5);
    expect(result.missingRequired).toHaveLength(0);
    expect(result.unmatchedHeaders).toHaveLength(0);
  });

  it("scores correctly with partial match", () => {
    const headers = ["product_name", "category", "extra_col"];
    const result = scoreTemplateMatch(mapping, headers);
    // Earned: 2 (name) + 2 (category) = 4 out of 8
    expect(result.score).toBe(0.5);
    expect(result.missingRequired).toContain("price_cents");
    expect(result.unmatchedHeaders).toContain("extra_col");
  });

  it("scores 0 when no fields match", () => {
    const headers = ["foo", "bar", "baz"];
    const result = scoreTemplateMatch(mapping, headers);
    expect(result.score).toBe(0);
    expect(result.missingRequired).toHaveLength(3);
  });

  it("handles empty template mapping", () => {
    const result = scoreTemplateMatch({}, ["a", "b"]);
    expect(result.score).toBe(0);
  });
});

// ── suggestTemplate ──────────────────────────────────────────────────────────

describe("suggestTemplate", () => {
  const templates = [
    {
      id: "t1",
      name: "Italian Vendor",
      mapping: {
        name: { sources: ["nome_prodotto"], required: true },
        category: { sources: ["categoria"], required: true },
        price_cents: { sources: ["prezzo"], required: true },
        unit: { sources: ["unita"], required: false },
      } as TemplateMapping,
    },
    {
      id: "t2",
      name: "English Vendor",
      mapping: {
        name: { sources: ["product_name"], required: true },
        category: { sources: ["category"], required: true },
        price_cents: { sources: ["price"], required: true },
        unit: { sources: ["unit"], required: false },
      } as TemplateMapping,
    },
  ];

  it("returns best matching template above threshold", () => {
    const headers = ["product_name", "category", "price", "unit"];
    const result = suggestTemplate(templates, headers);

    expect(result).not.toBeNull();
    expect(result!.templateId).toBe("t2");
    expect(result!.score).toBe(1.0);
    expect(result!.autoApply).toBe(true);
  });

  it("returns null when no template meets threshold", () => {
    const headers = ["totally_unknown", "headers"];
    const result = suggestTemplate(templates, headers);
    expect(result).toBeNull();
  });

  it("prefers higher scoring template", () => {
    const headers = ["nome_prodotto", "categoria", "prezzo", "unita"];
    const result = suggestTemplate(templates, headers);

    expect(result).not.toBeNull();
    expect(result!.templateId).toBe("t1");
    expect(result!.autoApply).toBe(true);
  });

  it("marks autoApply false for scores between 0.5 and 0.75", () => {
    // Only match 2 of 3 required fields (4 out of 8 points = 0.5 exactly)
    const headers = ["nome_prodotto", "categoria"];
    const result = suggestTemplate(templates, headers);

    expect(result).not.toBeNull();
    expect(result!.autoApply).toBe(false);
    expect(result!.score).toBeGreaterThanOrEqual(0.5);
    expect(result!.score).toBeLessThan(0.75);
  });

  it("handles empty templates array", () => {
    const result = suggestTemplate([], ["a", "b"]);
    expect(result).toBeNull();
  });
});
