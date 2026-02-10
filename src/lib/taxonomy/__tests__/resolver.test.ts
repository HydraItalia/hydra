import { describe, it, expect } from "vitest";
import { resolveCategory, getCategoryGroupByNameOrSlug } from "../resolver";

describe("resolveCategory", () => {
  it("resolves English aliases to Italian canonical categories", () => {
    const seafood = resolveCategory("Seafood", "IT");
    expect(seafood.canonicalSlug).toBe("pesce");
    expect(seafood.canonicalName).toBe("Pesce");
    expect(seafood.group).toBe("FOOD");
    expect(seafood.didFallback).toBe(false);

    const wine = resolveCategory("Wine", "IT");
    expect(wine.canonicalSlug).toBe("vini");
    expect(wine.group).toBe("BEVERAGE");
    expect(wine.didFallback).toBe(false);

    const beer = resolveCategory("Beer", "IT");
    expect(beer.canonicalSlug).toBe("birre");
    expect(beer.group).toBe("BEVERAGE");
    expect(beer.didFallback).toBe(false);

    const meat = resolveCategory("Meat", "IT");
    expect(meat.canonicalSlug).toBe("carne");
    expect(meat.group).toBe("FOOD");
    expect(meat.didFallback).toBe(false);
  });

  it("resolves Italian names directly", () => {
    const pesce = resolveCategory("pesce", "IT");
    expect(pesce.canonicalSlug).toBe("pesce");
    expect(pesce.didFallback).toBe(false);

    const vini = resolveCategory("vini", "IT");
    expect(vini.canonicalSlug).toBe("vini");
    expect(vini.didFallback).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(resolveCategory("SEAFOOD", "IT").canonicalSlug).toBe("pesce");
    expect(resolveCategory("wine", "IT").canonicalSlug).toBe("vini");
    expect(resolveCategory("WINE", "IT").canonicalSlug).toBe("vini");
  });

  it("resolves group-level category names", () => {
    const beverage = resolveCategory("Beverage", "IT");
    expect(beverage.canonicalSlug).toBe("beverage");
    expect(beverage.group).toBe("BEVERAGE");
    expect(beverage.didFallback).toBe(false);

    const food = resolveCategory("Food", "IT");
    expect(food.canonicalSlug).toBe("food");
    expect(food.group).toBe("FOOD");
    expect(food.didFallback).toBe(false);
  });

  it("resolves service categories", () => {
    const cleaning = resolveCategory("Cleaning & Disposables", "IT");
    expect(cleaning.canonicalSlug).toBe("cleaning-disposables");
    expect(cleaning.group).toBe("SERVICES");
    expect(cleaning.didFallback).toBe(false);

    const services = resolveCategory("Services", "IT");
    expect(services.canonicalSlug).toBe("services");
    expect(services.group).toBe("SERVICES");
    expect(services.didFallback).toBe(false);
  });

  it("falls back for unknown categories", () => {
    const unknown = resolveCategory("Exotic Mushrooms", "IT");
    expect(unknown.canonicalSlug).toBe("exotic-mushrooms");
    expect(unknown.group).toBe("FOOD");
    expect(unknown.didFallback).toBe(true);
  });

  it("defaults market to IT", () => {
    const result = resolveCategory("Seafood");
    expect(result.canonicalSlug).toBe("pesce");
  });

  it("resolves produce to orto-frutta", () => {
    const result = resolveCategory("Produce", "IT");
    expect(result.canonicalSlug).toBe("orto-frutta");
    expect(result.group).toBe("FOOD");
  });

  it("resolves spirits to distillati", () => {
    const result = resolveCategory("Spirits", "IT");
    expect(result.canonicalSlug).toBe("distillati");
    expect(result.group).toBe("BEVERAGE");
  });

  it("resolves dairy to latticini", () => {
    const result = resolveCategory("Dairy", "IT");
    expect(result.canonicalSlug).toBe("latticini");
    expect(result.group).toBe("FOOD");
  });
});

describe("getCategoryGroupByNameOrSlug", () => {
  it("returns group for known names", () => {
    expect(getCategoryGroupByNameOrSlug("Wine")).toBe("BEVERAGE");
    expect(getCategoryGroupByNameOrSlug("Seafood")).toBe("FOOD");
    expect(getCategoryGroupByNameOrSlug("Services")).toBe("SERVICES");
  });

  it("returns group for slugs", () => {
    expect(getCategoryGroupByNameOrSlug("pesce")).toBe("FOOD");
    expect(getCategoryGroupByNameOrSlug("vini")).toBe("BEVERAGE");
  });

  it("defaults to FOOD for unknown", () => {
    expect(getCategoryGroupByNameOrSlug("whatisthis")).toBe("FOOD");
  });
});
