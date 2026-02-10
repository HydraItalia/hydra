import { describe, it, expect } from "vitest";
import { getImageKeyForCategorySlug } from "../images";

describe("getImageKeyForCategorySlug", () => {
  it("bridges English DB slugs to Italian image keys", () => {
    expect(getImageKeyForCategorySlug("seafood")).toBe("pesce");
    expect(getImageKeyForCategorySlug("meat")).toBe("carne");
    expect(getImageKeyForCategorySlug("wine")).toBe("vini");
    expect(getImageKeyForCategorySlug("beer")).toBe("birre");
    expect(getImageKeyForCategorySlug("spirits")).toBe("distillati");
    expect(getImageKeyForCategorySlug("produce")).toBe("orto-frutta");
  });

  it("passes through Italian slugs that already match image keys", () => {
    expect(getImageKeyForCategorySlug("pesce")).toBe("pesce");
    expect(getImageKeyForCategorySlug("carne")).toBe("carne");
    expect(getImageKeyForCategorySlug("vini")).toBe("vini");
    expect(getImageKeyForCategorySlug("birre")).toBe("birre");
    expect(getImageKeyForCategorySlug("monouso")).toBe("monouso");
  });

  it("bridges group-level slugs", () => {
    expect(getImageKeyForCategorySlug("beverage")).toBe("beverage");
    expect(getImageKeyForCategorySlug("food")).toBe("food");
    expect(getImageKeyForCategorySlug("services")).toBe("services");
  });

  it("returns input slug for unknown categories (fallback)", () => {
    expect(getImageKeyForCategorySlug("exotic-mushrooms")).toBe(
      "exotic-mushrooms",
    );
  });

  it("bridges cleaning & disposables", () => {
    expect(getImageKeyForCategorySlug("cleaning-disposables")).toBe(
      "cleaning-disposables",
    );
  });

  it("defaults market to IT", () => {
    expect(getImageKeyForCategorySlug("seafood")).toBe("pesce");
  });
});
