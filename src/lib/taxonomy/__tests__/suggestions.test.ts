import { describe, it, expect } from "vitest";
import { suggestCanonicalCategories } from "../suggestions";

describe("suggestCanonicalCategories", () => {
  it("suggests pesce for 'Fish' (alias match)", () => {
    const results = suggestCanonicalCategories("Fish", "IT");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe("pesce");
  });

  it("suggests pesce for 'Pece' (misspelling)", () => {
    const results = suggestCanonicalCategories("Pece", "IT");
    // pesce should appear in top results
    const pesceResult = results.find((r) => r.slug === "pesce");
    expect(pesceResult).toBeDefined();
    // It should be near the top (within top 3)
    const pesceIndex = results.findIndex((r) => r.slug === "pesce");
    expect(pesceIndex).toBeLessThan(3);
  });

  it("suggests vini for 'vino' (alias match)", () => {
    const results = suggestCanonicalCategories("vino", "IT");
    expect(results[0].slug).toBe("vini");
  });

  it("respects limit parameter", () => {
    const results = suggestCanonicalCategories("food", "IT", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("returns empty array for empty input", () => {
    const results = suggestCanonicalCategories("", "IT");
    expect(results).toEqual([]);
  });

  it("returns results sorted by distance", () => {
    const results = suggestCanonicalCategories("birr", "IT");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distance).toBeGreaterThanOrEqual(
        results[i - 1].distance,
      );
    }
  });

  it("includes group in results", () => {
    const results = suggestCanonicalCategories("wine", "IT");
    expect(results[0].group).toBe("BEVERAGE");
  });
});
