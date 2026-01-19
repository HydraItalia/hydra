import { describe, it, expect } from "vitest";
import {
  parseHydraFeeBps,
  computeHydraFeeCents,
  bpsToPercent,
  DEFAULT_HYDRA_FEE_BPS,
  MAX_REASONABLE_FEE_BPS,
} from "../fees";

describe("Hydra Fee Helpers", () => {
  describe("parseHydraFeeBps", () => {
    it("should return default (500) when envValue is undefined", () => {
      expect(parseHydraFeeBps(undefined)).toBe(500);
    });

    it("should return default (500) when envValue is empty string", () => {
      expect(parseHydraFeeBps("")).toBe(500);
    });

    it('should parse "500" to 500', () => {
      expect(parseHydraFeeBps("500")).toBe(500);
    });

    it('should parse "250" to 250', () => {
      expect(parseHydraFeeBps("250")).toBe(250);
    });

    it('should parse "0" to 0', () => {
      expect(parseHydraFeeBps("0")).toBe(0);
    });

    it('should parse "1000" to 1000 (10%)', () => {
      expect(parseHydraFeeBps("1000")).toBe(1000);
    });

    it("should return fallback for non-numeric string", () => {
      expect(parseHydraFeeBps("abc")).toBe(500);
    });

    it("should return fallback for negative value", () => {
      expect(parseHydraFeeBps("-5")).toBe(500);
    });

    it("should return fallback for negative string value", () => {
      expect(parseHydraFeeBps("-100")).toBe(500);
    });

    it("should return custom fallback when provided", () => {
      expect(parseHydraFeeBps(undefined, 300)).toBe(300);
      expect(parseHydraFeeBps("abc", 300)).toBe(300);
      expect(parseHydraFeeBps("-5", 300)).toBe(300);
    });

    it("should handle whitespace in value", () => {
      // parseInt trims leading whitespace
      expect(parseHydraFeeBps("  500")).toBe(500);
    });

    it("should handle float strings by truncating", () => {
      // parseInt("500.5") returns 500
      expect(parseHydraFeeBps("500.5")).toBe(500);
    });

    it("should verify DEFAULT_HYDRA_FEE_BPS constant is 500", () => {
      expect(DEFAULT_HYDRA_FEE_BPS).toBe(500);
    });

    it("should verify MAX_REASONABLE_FEE_BPS constant is 10000", () => {
      expect(MAX_REASONABLE_FEE_BPS).toBe(10000);
    });

    it("should return fallback for value exceeding MAX_REASONABLE_FEE_BPS", () => {
      expect(parseHydraFeeBps("10001")).toBe(500);
      expect(parseHydraFeeBps("50000")).toBe(500);
    });

    it("should accept value at MAX_REASONABLE_FEE_BPS (100%)", () => {
      expect(parseHydraFeeBps("10000")).toBe(10000);
    });
  });

  describe("computeHydraFeeCents", () => {
    it("should compute 5% of 10000 = 500", () => {
      expect(computeHydraFeeCents(10000, 500)).toBe(500);
    });

    it("should compute 2.5% of 9999 with rounding", () => {
      // 9999 * 250 / 10000 = 249.975 -> rounds to 250
      expect(computeHydraFeeCents(9999, 250)).toBe(250);
    });

    it("should compute 2.5% of 10000 = 250", () => {
      expect(computeHydraFeeCents(10000, 250)).toBe(250);
    });

    it("should return 0 for 0 bps fee rate", () => {
      expect(computeHydraFeeCents(10000, 0)).toBe(0);
    });

    it("should return 0 for 0 gross cents", () => {
      expect(computeHydraFeeCents(0, 500)).toBe(0);
    });

    it("should compute 10% of 1000 = 100", () => {
      expect(computeHydraFeeCents(1000, 1000)).toBe(100);
    });

    it("should compute 1% of 1000 = 10", () => {
      expect(computeHydraFeeCents(1000, 100)).toBe(10);
    });

    it("should handle small amounts with rounding", () => {
      // 1 cent * 500 / 10000 = 0.05 -> rounds to 0
      expect(computeHydraFeeCents(1, 500)).toBe(0);
      // 10 cents * 500 / 10000 = 0.5 -> rounds to 1 (Math.round)
      expect(computeHydraFeeCents(10, 500)).toBe(1);
    });

    it("should throw error for negative gross cents", () => {
      expect(() => computeHydraFeeCents(-100, 500)).toThrow(
        "grossCents cannot be negative",
      );
    });

    it("should throw error for negative fee bps", () => {
      expect(() => computeHydraFeeCents(10000, -100)).toThrow(
        "feeBps cannot be negative",
      );
    });

    it("should throw error for non-integer gross cents", () => {
      expect(() => computeHydraFeeCents(99.5, 500)).toThrow(
        "grossCents must be an integer",
      );
    });

    it("should throw error for non-integer fee bps", () => {
      expect(() => computeHydraFeeCents(10000, 500.5)).toThrow(
        "feeBps must be an integer",
      );
    });

    it("should handle large amounts correctly", () => {
      // 1,000,000 cents (€10,000) at 5% = 50,000 cents (€500)
      expect(computeHydraFeeCents(1000000, 500)).toBe(50000);
    });

    it("should verify formula: Math.round(grossCents * feeBps / 10000)", () => {
      const testCases = [
        { gross: 10000, bps: 500, expected: 500 },
        { gross: 1220, bps: 500, expected: 61 }, // 1220 * 500 / 10000 = 61
        { gross: 9999, bps: 500, expected: 500 }, // 9999 * 500 / 10000 = 499.95 -> 500
        { gross: 123, bps: 250, expected: 3 }, // 123 * 250 / 10000 = 3.075 -> 3
      ];

      for (const { gross, bps, expected } of testCases) {
        expect(computeHydraFeeCents(gross, bps)).toBe(expected);
      }
    });
  });

  describe("bpsToPercent", () => {
    it("should convert 500 bps to 0.05 (5%)", () => {
      expect(bpsToPercent(500)).toBe(0.05);
    });

    it("should convert 250 bps to 0.025 (2.5%)", () => {
      expect(bpsToPercent(250)).toBe(0.025);
    });

    it("should convert 1000 bps to 0.1 (10%)", () => {
      expect(bpsToPercent(1000)).toBe(0.1);
    });

    it("should convert 0 bps to 0", () => {
      expect(bpsToPercent(0)).toBe(0);
    });

    it("should convert 100 bps to 0.01 (1%)", () => {
      expect(bpsToPercent(100)).toBe(0.01);
    });

    it("should convert 2200 bps to 0.22 (22%)", () => {
      expect(bpsToPercent(2200)).toBe(0.22);
    });

    it("should handle negative bps (returns negative decimal)", () => {
      // Note: negative bps should be prevented upstream by parseHydraFeeBps
      // This documents the mathematical behavior if negative values slip through
      expect(bpsToPercent(-500)).toBe(-0.05);
    });
  });
});
