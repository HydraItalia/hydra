import { CategoryGroupType } from "@prisma/client";
import { GroupMeta, Market } from "./types";

/**
 * Group metadata per market.
 * Defines labels, icons, and display order for each CategoryGroupType.
 */
const GROUP_META: Record<Market, GroupMeta[]> = {
  IT: [
    { key: "FOOD", label: "Food", icon: "package", order: 1 },
    { key: "BEVERAGE", label: "Beverage", icon: "coffee", order: 2 },
    { key: "SERVICES", label: "Services", icon: "wrench", order: 3 },
  ],
};

/** Get all group metadata for a market, sorted by display order. */
export function getGroups(market: Market = "IT"): GroupMeta[] {
  return [...GROUP_META[market]].sort((a, b) => a.order - b.order);
}

/** Get valid CategoryGroupType values for a market. */
export function getValidGroupKeys(market: Market = "IT"): CategoryGroupType[] {
  return GROUP_META[market].map((g) => g.key);
}

/** Check if a string is a valid CategoryGroupType for a market. */
export function isValidGroup(
  value: string,
  market: Market = "IT",
): value is CategoryGroupType {
  return getValidGroupKeys(market).includes(value as CategoryGroupType);
}

/** Get metadata for a single group. Returns undefined if unknown. */
export function getGroupMeta(
  key: CategoryGroupType,
  market: Market = "IT",
): GroupMeta | undefined {
  return GROUP_META[market].find((g) => g.key === key);
}
