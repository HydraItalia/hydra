import { describe, it, expect } from "vitest";
import {
  getGroups,
  getValidGroupKeys,
  isValidGroup,
  getGroupMeta,
} from "../groups";

describe("getGroups", () => {
  it("returns all three groups for IT market", () => {
    const groups = getGroups("IT");
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.key)).toEqual(["FOOD", "BEVERAGE", "SERVICES"]);
  });

  it("returns groups sorted by order", () => {
    const groups = getGroups("IT");
    const orders = groups.map((g) => g.order);
    expect(orders).toEqual([1, 2, 3]);
  });

  it("each group has label and icon", () => {
    for (const g of getGroups("IT")) {
      expect(g.label).toBeTruthy();
      expect(g.icon).toBeTruthy();
    }
  });

  it("defaults market to IT", () => {
    expect(getGroups()).toEqual(getGroups("IT"));
  });
});

describe("getValidGroupKeys", () => {
  it("returns CategoryGroupType values", () => {
    expect(getValidGroupKeys()).toEqual(["FOOD", "BEVERAGE", "SERVICES"]);
  });
});

describe("isValidGroup", () => {
  it("returns true for valid groups", () => {
    expect(isValidGroup("FOOD")).toBe(true);
    expect(isValidGroup("BEVERAGE")).toBe(true);
    expect(isValidGroup("SERVICES")).toBe(true);
  });

  it("returns false for invalid groups", () => {
    expect(isValidGroup("INVALID")).toBe(false);
    expect(isValidGroup("food")).toBe(false);
    expect(isValidGroup("")).toBe(false);
  });
});

describe("getGroupMeta", () => {
  it("returns metadata for known group", () => {
    const meta = getGroupMeta("FOOD");
    expect(meta).toBeDefined();
    expect(meta!.label).toBe("Food");
    expect(meta!.icon).toBe("package");
  });

  it("returns undefined for unknown group", () => {
    expect(getGroupMeta("UNKNOWN" as any)).toBeUndefined();
  });
});
