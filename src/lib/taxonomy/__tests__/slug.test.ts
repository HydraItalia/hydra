import { describe, it, expect } from "vitest";
import { slugifyCategory } from "../slug";

describe("slugifyCategory", () => {
  it("lowercases and trims", () => {
    expect(slugifyCategory("  Beverage  ")).toBe("beverage");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugifyCategory("Specialty Produce")).toBe("specialty-produce");
  });

  it("collapses multiple spaces into single hyphen", () => {
    expect(slugifyCategory("Orto   Frutta")).toBe("orto-frutta");
  });

  it("strips accents (NFD decomposition)", () => {
    expect(slugifyCategory("Caffè")).toBe("caffe");
    expect(slugifyCategory("crème brûlée")).toBe("creme-brulee");
  });

  it("strips non-alphanumeric characters except hyphens", () => {
    expect(slugifyCategory("Cleaning & Disposables")).toBe(
      "cleaning-disposables",
    );
    expect(slugifyCategory("Food/Drink")).toBe("fooddrink");
  });

  it("strips leading/trailing hyphens", () => {
    expect(slugifyCategory("-test-")).toBe("test");
    expect(slugifyCategory("  - test - ")).toBe("test");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugifyCategory("a  &  b")).toBe("a-b");
  });

  it("handles empty string", () => {
    expect(slugifyCategory("")).toBe("");
  });

  it("handles already-slugified input", () => {
    expect(slugifyCategory("orto-frutta")).toBe("orto-frutta");
  });
});
