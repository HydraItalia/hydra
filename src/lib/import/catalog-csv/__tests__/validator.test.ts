import { describe, it, expect } from "vitest";
import { validateRow } from "../validator";
import { NormalizedRow } from "../types";

function makeRow(overrides: Partial<NormalizedRow> = {}): NormalizedRow {
  return {
    vendorName: "Test Vendor",
    category: "Beverage",
    categorySlug: "beverage",
    categoryGroup: "BEVERAGE",
    name: "Test Product",
    canonicalName: "test product",
    unit: "PIECE",
    priceCents: 1000,
    inStock: true,
    productCode: "TP-001",
    canonicalCategoryName: "Beverage",
    didFallback: false,
    ...overrides,
  };
}

describe("validateRow", () => {
  it("returns valid for a complete row", () => {
    const result = validateRow(0, makeRow());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.normalizedData).toEqual(makeRow());
  });

  it("returns error when vendor_name is missing", () => {
    const result = validateRow(0, makeRow({ vendorName: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("vendor_name is required");
    expect(result.normalizedData).toBeNull();
  });

  it("returns error when name is missing", () => {
    const result = validateRow(0, makeRow({ name: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("name is required");
  });

  it("returns error when category is missing", () => {
    const result = validateRow(0, makeRow({ category: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("category is required");
  });

  it("returns error when priceCents is negative", () => {
    const result = validateRow(0, makeRow({ priceCents: -100 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("price_cents must be non-negative");
  });

  it("returns error when in-stock product has zero price", () => {
    const result = validateRow(0, makeRow({ priceCents: 0, inStock: true }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("in-stock product must have a price > 0");
  });

  it("allows zero price for out-of-stock products", () => {
    const result = validateRow(0, makeRow({ priceCents: 0, inStock: false }));
    expect(result.valid).toBe(true);
  });

  it("accumulates multiple errors", () => {
    const result = validateRow(
      0,
      makeRow({ vendorName: "", name: "", category: "" }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it("preserves rowIndex", () => {
    const result = validateRow(42, makeRow());
    expect(result.rowIndex).toBe(42);
  });

  // ── UNMAPPED_CATEGORY tests ────────────────────────────────────

  it("returns UNMAPPED_CATEGORY error when didFallback is true", () => {
    const result = validateRow(
      0,
      makeRow({
        category: "Exotic Mushrooms",
        didFallback: true,
      }),
    );
    expect(result.valid).toBe(false);
    const unmappedError = result.errors.find((e) =>
      e.startsWith("UNMAPPED_CATEGORY:"),
    );
    expect(unmappedError).toBeDefined();
    expect(unmappedError).toContain("Exotic Mushrooms");
    expect(unmappedError).toContain("Did you mean:");
  });

  it("passes validation when didFallback is false", () => {
    const result = validateRow(0, makeRow({ didFallback: false }));
    expect(result.valid).toBe(true);
    expect(
      result.errors.find((e) => e.startsWith("UNMAPPED_CATEGORY:")),
    ).toBeUndefined();
  });

  it("treats missing didFallback (undefined) as false for backward compat", () => {
    const row = makeRow();
    // Simulate old rows that don't have didFallback
    delete (row as any).didFallback;
    const result = validateRow(0, row);
    expect(result.valid).toBe(true);
    expect(
      result.errors.find((e) => e.startsWith("UNMAPPED_CATEGORY:")),
    ).toBeUndefined();
  });
});
