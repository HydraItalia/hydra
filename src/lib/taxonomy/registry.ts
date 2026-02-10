import { CanonicalCategory, Market } from "./types";
import { IT_CATEGORIES } from "./registry.it";

/** Map of market → registry */
const registries: Record<Market, CanonicalCategory[]> = {
  IT: IT_CATEGORIES,
};

/**
 * Get all canonical categories for a market.
 * Used by UI dropdowns and ensureCanonicalCategories.
 */
export function getAllCanonicalCategories(
  market: Market = "IT",
): CanonicalCategory[] {
  return registries[market];
}
