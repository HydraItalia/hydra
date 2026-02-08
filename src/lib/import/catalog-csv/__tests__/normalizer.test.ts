import { describe, it, expect } from "vitest";
import {
  normalizeUnit,
  canonicalizeName,
  slugifyCategory,
  getCategoryGroup,
  normalizeRow,
} from "../normalizer";

describe("normalizeUnit", () => {
  it("maps kg variants to KG", () => {
    expect(normalizeUnit("kg")).toBe("KG");
    expect(normalizeUnit("KG")).toBe("KG");
    expect(normalizeUnit("kilogram")).toBe("KG");
  });

  it("maps liter variants to L", () => {
    expect(normalizeUnit("l")).toBe("L");
    expect(normalizeUnit("liter")).toBe("L");
    expect(normalizeUnit("litre")).toBe("L");
    expect(normalizeUnit("ml")).toBe("L");
    expect(normalizeUnit("cl")).toBe("L");
  });

  it("maps box variants to BOX", () => {
    expect(normalizeUnit("box")).toBe("BOX");
    expect(normalizeUnit("case")).toBe("BOX");
    expect(normalizeUnit("crate")).toBe("BOX");
  });

  it("maps service variants to SERVICE", () => {
    expect(normalizeUnit("service")).toBe("SERVICE");
    expect(normalizeUnit("delivery")).toBe("SERVICE");
  });

  it("defaults to PIECE for unknown units", () => {
    expect(normalizeUnit("bottle")).toBe("PIECE");
    expect(normalizeUnit("piece")).toBe("PIECE");
    expect(normalizeUnit("item")).toBe("PIECE");
    expect(normalizeUnit("")).toBe("PIECE");
  });
});

describe("canonicalizeName", () => {
  it("trims and lowercases", () => {
    expect(canonicalizeName("  Red Wine  ")).toBe("red wine");
  });

  it("collapses multiple spaces", () => {
    expect(canonicalizeName("Salmon   Fillet")).toBe("salmon fillet");
  });

  it("handles empty string", () => {
    expect(canonicalizeName("")).toBe("");
  });
});

describe("slugifyCategory", () => {
  it("creates URL-safe slug", () => {
    expect(slugifyCategory("Specialty Produce")).toBe("specialty-produce");
    expect(slugifyCategory("Cleaning & Disposables")).toBe(
      "cleaning-&-disposables",
    );
  });

  it("handles single word", () => {
    expect(slugifyCategory("Beverage")).toBe("beverage");
  });
});

describe("getCategoryGroup", () => {
  it("maps known beverage categories", () => {
    expect(getCategoryGroup("Beverage")).toBe("BEVERAGE");
    expect(getCategoryGroup("Wine")).toBe("BEVERAGE");
    expect(getCategoryGroup("Beer")).toBe("BEVERAGE");
  });

  it("maps known food categories", () => {
    expect(getCategoryGroup("Food")).toBe("FOOD");
    expect(getCategoryGroup("Seafood")).toBe("FOOD");
    expect(getCategoryGroup("Dairy")).toBe("FOOD");
  });

  it("maps known service categories", () => {
    expect(getCategoryGroup("Services")).toBe("SERVICES");
    expect(getCategoryGroup("Packaging")).toBe("SERVICES");
  });

  it("is case-insensitive", () => {
    expect(getCategoryGroup("wine")).toBe("BEVERAGE");
    expect(getCategoryGroup("WINE")).toBe("BEVERAGE");
    expect(getCategoryGroup("seafood")).toBe("FOOD");
  });

  it("defaults to FOOD for unknown categories", () => {
    expect(getCategoryGroup("Unknown Category")).toBe("FOOD");
  });
});

describe("normalizeRow", () => {
  it("normalizes a complete row", () => {
    const result = normalizeRow({
      vendor_name: "White Dog",
      category: "Beverage",
      name: "Red Wine",
      unit: "bottle",
      price_cents: "1500",
      in_stock: "true",
      product_code: "WD-001",
    });

    expect(result).toEqual({
      vendorName: "White Dog",
      category: "Beverage",
      categorySlug: "beverage",
      categoryGroup: "BEVERAGE",
      name: "Red Wine",
      canonicalName: "red wine",
      unit: "PIECE",
      priceCents: 1500,
      inStock: true,
      productCode: "WD-001",
    });
  });

  it("handles missing optional fields", () => {
    const result = normalizeRow({
      vendor_name: "Test",
      category: "Food",
      name: "Test Product",
      unit: "",
      price_cents: "",
      in_stock: "",
      product_code: "",
    });

    expect(result.unit).toBe("PIECE");
    expect(result.priceCents).toBe(0);
    expect(result.inStock).toBe(false);
    expect(result.productCode).toBe("");
  });

  it("parses in_stock as '1'", () => {
    const result = normalizeRow({
      vendor_name: "Test",
      category: "Food",
      name: "Test",
      unit: "kg",
      price_cents: "100",
      in_stock: "1",
      product_code: "",
    });

    expect(result.inStock).toBe(true);
  });
});
