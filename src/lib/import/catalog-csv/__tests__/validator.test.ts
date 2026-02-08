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
    const result = validateRow(
      0,
      makeRow({ priceCents: 0, inStock: true }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("in-stock product must have a price > 0");
  });

  it("allows zero price for out-of-stock products", () => {
    const result = validateRow(
      0,
      makeRow({ priceCents: 0, inStock: false }),
    );
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
});
